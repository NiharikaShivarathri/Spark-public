# Spark Homes — Repair Cost Estimator

A mobile-first **Progressive Web App** for a house-flipping acquisition team to
estimate repair costs during a property walkthrough — on a phone, in an empty
house, often with no signal. Agents walk room by room, check off repairs, enter
quantities, snap photos, watch a running total, and export a ZIP (Excel + photos).

## Approach

- **Single self-contained `index.html`** + tiny static files (`manifest.json`,
  `sw.js`, `icon-192.png`, `icon-512.png`, logo). No build step, no framework.
- **Vanilla JS / HTML / CSS**, organized into clear modules in one file:
  `DATA · PERSISTENCE · PHOTOS · MODEL · COMPUTE · RENDER · HANDLERS · SHEETS ·
  PHOTOS-UI · DEAL · EXPORT · BOOT`.
- **Single canonical price catalog** (108 items) embedded verbatim in `index.html`
  and parsed at runtime — one source of truth, so the app works as one offline
  file with no network fetch for pricing. Prices are never hand-keyed into JS.
- **Reliable storage:** structured data (projects, selections, quantities, notes,
  price overrides) in `localStorage`, guarded with try/catch; **photo blobs in
  IndexedDB** (only metadata in localStorage) so a few photos can't blow the
  localStorage quota and corrupt saved state.
- **Offline-first:** a service worker precaches the app shell *and* the CDN
  libraries, so installation, use, and **export all work in airplane mode**.

## Features

- Multiple projects: create, name, switch, rename, delete — no data loss.
- 108 line items across 5 sections / 19 brief groups (+1 additive "General &
  Labor" group), collapsible, each with a **No Action Needed** option.
- Each line: name, unit, quantity, unit cost, live line total.
- **Adjustable rooms:** add/remove Bathroom, Bedroom, Kitchen, Living/Common
  instances; Bedroom/Living are decoupled from house-wide Interior for per-room
  accuracy.
- **Price overrides:** per item per project, plus a global Price Schedule that
  rolls changes across all projects. Precedence: project → global → CSV.
- Add / remove line items per item (custom items + restore removed).
- **Running grand total pinned at all times**; progress bar across all groups and
  all room instances.
- **Photos:** camera capture, thumbnails, individual delete (blobs in IndexedDB).
- **Export:** one ZIP = styled Excel breakdown + all photos, auto-downloads.
- **Deal Analyzer (creative addition):** `MAO = ARV × rule% − repairs` with
  projected margin and a go/no-go verdict — the number offers are actually made on.

## Libraries (all via CDN, cached for offline)

- [Tailwind CSS](https://tailwindcss.com) (Play CDN) — styling.
- [xlsx-js-style](https://github.com/gitbrent/xlsx-js-style) — styled Excel export.
- [JSZip](https://stuk.github.io/jszip/) — ZIP bundling.

## Run locally

A service worker only registers over `http(s)`, **not** `file://`, so serve the
folder:

```bash
# from this directory
python3 -m http.server 8080
# then open http://localhost:8080 on your machine,
# or http://<your-computer-ip>:8080 on a phone on the same network
```

The app also runs by opening `index.html` directly, but offline/PWA features need
to be served over http(s) (e.g. GitHub Pages) to install and cache.

## Deploy (GitHub Pages)

Push these files to a repo and enable **Settings → Pages → Deploy from branch
→ main / root**. Open the Pages URL on a phone, then **Add to Home Screen** to
install. Test in airplane mode after the first online load.

## Testing checklist (on a real phone via the hosted URL)

1. Large tap targets; collapse/expand and project switch feel instant.
2. Refresh mid-walkthrough → all data persists.
3. Airplane mode → app loads and works fully (including export).
4. Add to Home Screen → launches standalone; camera capture works there.
5. Add several photos → no quota errors; exported ZIP opens with correct Excel +
   photos.

## Notes / limitations

- Photo blobs live in IndexedDB (only metadata in localStorage) to avoid the
  localStorage quota corrupting saved state.
- Pricing, the section/group mapping, and adjustable room templates are all
  defined in `index.html`; editing the embedded catalog updates the whole app.
