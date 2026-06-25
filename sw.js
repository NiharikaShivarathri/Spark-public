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

  // Network-first for the HTML shell so a new deploy shows on the next online
  // load without bumping CACHE. Everything else (CDN libs, icons, logo) stays
  // cache-first so offline use and export keep working.
  const url = new URL(req.url);
  const isShell = req.mode === "navigate" ||
    (url.origin === self.location.origin && /\/(index\.html)?$/.test(url.pathname));

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);

    if (isShell) {
      try {
        const res = await fetch(req);
        if (res && (res.ok || res.type === "opaque")) {
          try { await cache.put(req, res.clone()); } catch (e) {}
        }
        return res;
      } catch (e) {
        // Offline: fall back to the cached shell.
        const fallback = await cache.match(req) || await cache.match("./index.html");
        if (fallback) return fallback;
        throw e;
      }
    }

    // Cache-first for static/CDN assets.
    const cached = await cache.match(req, { ignoreSearch: false });
    if (cached) return cached;
    const res = await fetch(req);
    // Stash a copy for next time (same-origin and CDN alike).
    if (res && (res.ok || res.type === "opaque")) {
      try { await cache.put(req, res.clone()); } catch (e) {}
    }
    return res;
  })());
});
