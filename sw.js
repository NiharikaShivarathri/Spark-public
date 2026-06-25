/* Spark Homes Repair Estimator — service worker.
   Strategy:
   - Precache the local app shell + icons + logo on install (best-effort per file).
   - Also best-effort precache the CDN libraries (Tailwind, xlsx-js-style, JSZip)
     so EXPORT and styling work in airplane mode.
   - Runtime: cache-first for GET; on a miss, fetch + cache; navigations fall
     back to the cached index.html when offline.
   Bump CACHE to invalidate old assets on deploy. */

const CACHE = "spark-est-v10";

const SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./logo-mark.png",
  "./Spark Group - Logo.png",
];

const CDN = [
  "https://cdn.tailwindcss.com",
  "https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js",
  "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js",
];

// Cache items individually so one failure (e.g. a CDN hiccup) doesn't abort install.
async function cacheAllSafe(cache, urls) {
  await Promise.all(urls.map(async (u) => {
    try {
      const res = await fetch(new Request(u, { cache: "reload" }));
      // Cache opaque (cross-origin, no-CORS) responses too — they still replay offline.
      if (res && (res.ok || res.type === "opaque")) await cache.put(u, res.clone());
    } catch (e) { /* best effort */ }
  }));
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cacheAllSafe(cache, SHELL);
    await cacheAllSafe(cache, CDN);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: false });
    if (cached) return cached;
    try {
      const res = await fetch(req);
      // Stash a copy for next time (same-origin and CDN alike).
      if (res && (res.ok || res.type === "opaque")) {
        try { await cache.put(req, res.clone()); } catch (e) {}
      }
      return res;
    } catch (e) {
      // Offline and not cached: for navigations, serve the app shell.
      if (req.mode === "navigate") {
        const fallback = await cache.match("./index.html");
        if (fallback) return fallback;
      }
      throw e;
    }
  })());
});
