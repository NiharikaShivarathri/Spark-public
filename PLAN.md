# PLAN.md — Phased Build Plan

Build order is fixed by CLAUDE.md and the brief:
**data/model → core checklist + running total → room instances → photos
(IndexedDB) → PWA/offline → export ZIP → Deal Analyzer.**

Rules for every phase:
- **Each phase ends at a STOP point for your review.** No phase starts until the
  previous is signed off.
- **Each phase is independently testable on a phone** via the hosted GitHub Pages
  URL (a service worker won't register from `file://`, so we host from Phase 0).
- CSV is the only price source. Never copy `Example App.html`. Photos → IndexedDB.
- Append every non-obvious decision to `DECISIONS.md` as we go (it becomes the PDF).
- Keep code modular in one file: **data/model · persistence · render · export**.

> **Gate before Phase 1:** the 6 decisions at the end of `DATA_MODEL.md` must be
> resolved. The group mapping is the foundation; coding it before sign-off risks
> a rebuild.

---

## Phase 0 — Skeleton + hosting (prep, tiny)
**Goal:** a deployable shell so every later phase is phone-testable over https.
- `index.html` with a mobile viewport, Tailwind via CDN, a title bar with the
  Spark logo, and an empty app container.
- Push to a public GitHub repo; enable GitHub Pages. Confirm the URL loads on a
  phone.
- Stub the module boundaries (commented sections: DATA, STORE, RENDER, EXPORT).

**Phone test:** URL opens on Chrome/Android and Safari/iOS; logo renders; no
console errors.
**STOP** — confirm the hosted URL works on your phone before building features.

---

## Phase 1 — Data / model layer
**Goal:** the 108-item catalog and project state model in memory + persisted.
- Embed `Pricing List.csv` contents and parse to the catalog (id, name, cost,
  unit) — **the only price source**. Tag each item with its `section` + `group`
  per the approved `DATA_MODEL.md` mapping.
- Implement the state shape from `DATA_MODEL.md` Part 3: projects, room
  instances, override maps, settings.
- Persistence module: load/save to localStorage, every read/write wrapped in
  try/catch, graceful degrade on parse/quota errors.
- `resolvedCost(itemId, projectId)` with the project → global → CSV precedence.
- Create/rename/switch/delete projects (A1–A3) with zero data loss.

**Phone test:** create two projects, name them, switch between them, refresh →
both persist; inspect that all 108 items + 19/20 groups are present in state.
**STOP.**

---

## Phase 2 — Core checklist + running total
**Goal:** a working single-scope checklist with a live, pinned total.
- Render the house-wide **Interior/General** singleton: collapsible groups, each
  line item showing name · unit · qty input · unit cost · line total (B3).
- **"No Action Needed"** toggle per group (B2).
- **Pinned running grand total**, always visible (sticky), recomputes instantly
  (B6).
- **Price override per item, per project** (B4) + **global price update** that
  rolls across projects (B5).
- **Add / remove line items** per item (B7).
- Large tap targets; instant collapse/expand (R1).

**Phone test:** check items, type quantities → line + grand totals correct;
override a unit cost (project-scoped) and confirm it sticks per project; change a
global price and confirm it moves in another project; refresh → all persists.
**STOP.**

---

## Phase 3 — Room instances
**Goal:** the full adjustable-room model — the hardest, highest-value feature.
- Add/remove room instances (Bathroom, Bedroom, Kitchen, Living/Common) with
  auto labels `Bathroom 1`, `Bedroom 2`, … (C1–C2).
- Each instance renders its own groups with **independent** state; Bedroom/Living
  **decoupled** from Interior/General (C3). Verify two bedrooms hold different
  flooring quantities.
- House-wide singletons (Interior/General, Systems & Structure, Exterior) render
  alongside removable rooms (C4).
- **Progress tracking** spanning all group instances across all rooms + sections
  (D1–D3); denominator updates as rooms are added/removed.
- Grand total now aggregates across all instances.

**Phone test:** add Bathroom 1 & 2 and Bedroom 1 & 2; enter different quantities
per instance; remove Bathroom 2 → its data gone, others intact, total + progress
update; refresh → everything persists.
**STOP.**

---

## Phase 4 — Photos (IndexedDB)
**Goal:** reliable camera capture and thumbnails, blobs in IndexedDB.
- IndexedDB store for blobs; localStorage holds only `photoMeta` (E2). Never
  base64 in localStorage.
- Capture via `<input type="file" accept="image/*" capture="environment">` (E1).
- Thumbnails from object URLs, revoked after use (E3); individual delete removes
  blob + metadata atomically (E4).
- *(Bonus, optional, only if it doesn't slow the flow:* serial-number parse E5 —
  defer unless time allows.)

**Phone test (must be the INSTALLED app, not a tab):** add to home screen; in
standalone mode, capture several photos → thumbnails show, no `QuotaExceededError`;
delete one; refresh → photos persist. Verify camera works **installed on iOS**.
**STOP.**

---

## Phase 5 — PWA / offline
**Goal:** installable, fully offline, state-safe.
- `manifest.json` (name, icons, `display: standalone`, theme) + icons (H3).
- `sw.js` caching the app shell **and CDN libs** (Tailwind, xlsx-js-style, JSZip)
  so export works offline (H2). Cache-first for assets, with versioned cache.
- Confirm refresh/restart never loses data (H4) — already true from earlier
  phases, re-verify under SW.

**Phone test:** install on iOS and Android (home-screen icon, standalone). Turn
on **airplane mode** → app loads and fully works; refresh mid-walkthrough →
data intact.
**STOP.**

---

## Phase 6 — Export ZIP
**Goal:** one-tap ZIP = styled `.xlsx` + all photos, auto-download.
- JSZip + xlsx-js-style (cached by SW from Phase 5, so offline-capable).
- `.xlsx` lists every checked line item with qty, unit cost, line total, and a
  grand total; grouped/labeled by section + room instance (F2–F3). Totals come
  from the **same `resolvedCost`** as the screen — must match exactly.
- Pull photo blobs from IndexedDB into the ZIP; auto-download (F1).

**Phone test:** with a multi-room project + several photos, in airplane mode tap
Export → ZIP downloads; open it → Excel totals equal the on-screen grand total,
all photos present.
**STOP.**

---

## Phase 7 — Deal Analyzer / MAO (creative addition)
**Goal:** the go/no-go number, offline and instant.
- Inputs: ARV, rule% (default 70%, configurable, persisted in settings).
- Outputs: `MAO = ARV × rule% − repairs` and projected margin, using the live
  repair total (G1–G2).
- Instant recompute; works fully offline.
- Write it up in `DECISIONS.md` / the PDF (G3).

**Phone test:** enter ARV, adjust rule% → MAO and margin update instantly; change
a repair quantity → MAO reflects it; works in airplane mode; persists on refresh.
**STOP — feature-complete.**

---

## Final pass (after Phase 7) — verification checklist (CLAUDE.md §Testing)
Run on a **real phone** via the hosted URL:
1. Tap targets large; collapse/expand + project switch feel instant.
2. Refresh mid-walkthrough → all data persists.
3. Airplane mode → app loads and works fully.
4. Add to home screen → launches standalone; camera capture works there.
5. Several photos → no quota errors; export ZIP opens with correct Excel + photos.

Then assemble deliverables: single-file app (+ static files), GitHub README
(approach, libraries, run-locally), one-page PDF (best UX decision, what's
fragile, the creative addition, what ships next with two more days, role of AI).

---

## Risk notes (carried from SPEC's 3 hardest)
- **Phase 3 (rooms)** is the spine — budget the most time; its bugs surface in
  progress, export, and persistence.
- **Phase 4 (iOS standalone camera)** — verify *installed*, not in a tab; this is
  the classic late surprise.
- **Phase 5 (offline CDN caching)** — airplane mode is a triage gate; the export
  libs must be cached before Phase 6 relies on them offline.
