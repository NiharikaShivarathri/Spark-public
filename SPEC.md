# SPEC.md — Spark Homes Repair Cost Estimator

Feature spec derived from `Contest Briefing.docx` + `CLAUDE.md`. Every required
feature is mapped to the rubric criterion (and its weight) it primarily serves.
The CSV is the only price source; `Example App.html` was read for scope only.

## Rubric (Stage 2 scoring) — what we are optimizing against

| # | Criterion | Weight | One-line bar |
|---|-----------|:---:|---|
| R1 | Mobile UX & Polish | **30%** | Intuitive on a phone, fast, no jank, looks professional |
| R2 | Feature Completeness | **25%** | All 19 groups, rooms, photos, export, price overrides |
| R3 | Code Quality | **20%** | Clean, readable, maintainable — *not* a copy of the reference |
| R4 | PWA & Offline | **15%** | Installs to home screen, works offline, saves state |
| R5 | Creative Addition | **10%** | Originality, usefulness, execution of self-designed feature |

Stage 1 (Triage) is pass/fail: reviewer spends 5 min on a phone; missing photo
capture, export, room support, or progress bar = cut. So those four are **gates**,
not just rubric points — they must work before anything else is polished.

---

## Feature inventory

Each row: the required behavior, the invariant that must always hold, and the
rubric criterion/weight it primarily serves (secondary criteria in parens).

### A. Project Management

| ID | Feature | Invariant | Rubric |
|----|---------|-----------|--------|
| A1 | Create, name, save multiple projects | A new project never mutates another | R2 (25%) |
| A2 | Switch projects with **zero data loss** | Switch + refresh + restart all preserve every project | R2 (25%), R4 (15%) |
| A3 | Each project stores its own selections, quantities, notes, photos | Per-project isolation in storage keys | R2 (25%), R3 (20%) |

### B. Repair Line Items & Pricing

| ID | Feature | Invariant | Rubric |
|----|---------|-----------|--------|
| B1 | 108 items in 5 sections / 19 groups, collapsible | All 19 groups present and reachable | R2 (25%) |
| B2 | Every group has a **"No Action Needed"** toggle | Toggling it marks the group reviewed/complete with $0 | R2 (25%), R1 (30%) |
| B3 | Each line item shows name, unit, qty input, unit cost, line total | line total = qty × resolved unit cost, recomputed live | R2 (25%), R1 (30%) |
| B4 | **Price override per item, per project** | Project override beats global beats CSV default | R2 (25%) |
| B5 | **Global price update** rolls out across all projects | Editing global default changes every project that hasn't overridden | R2 (25%) |
| B6 | **Running grand total pinned & visible at all times** | Always on screen (sticky), always current | R1 (30%), R2 (25%) |
| B7 | Add / remove line items per-item | Custom items persist per project; deletes don't corrupt totals | R2 (25%) |

### C. Adjustable Room Support  *(flagged hardest — see below)*

| ID | Feature | Invariant | Rubric |
|----|---------|-----------|--------|
| C1 | Add / remove room instances freely (Bathroom 1/2, Bedroom 1/2, …) | Each instance independent; removing one never touches another | R2 (25%), R1 (30%) |
| C2 | Each room type carries its own relevant groups, labeled by instance | Labels like `Bathroom 2: Tub & Shower` | R2 (25%) |
| C3 | Bedroom & Living/Common **decoupled** from Interior/General | A bedroom's flooring qty is separate from house-wide flooring | R2 (25%), R3 (20%) |
| C4 | House-wide scopes (Interior/General, Systems, Exterior) apply once | Singleton instances, not duplicated per room | R2 (25%) |

### D. Progress Tracking

| ID | Feature | Invariant | Rubric |
|----|---------|-----------|--------|
| D1 | Progress bar / % indicator | Visible, updates instantly on any check | R1 (30%), R2 (25%) |
| D2 | Per-group completion: any checked item **or** No Action = complete | A group is complete iff ≥1 item checked OR No Action set | R2 (25%) |
| D3 | Total progress spans all groups across **all sections + all room instances** | Denominator grows/shrinks as rooms are added/removed | R2 (25%) |

### E. Photo Capture  *(flagged hardest — see below)*

| ID | Feature | Invariant | Rubric |
|----|---------|-----------|--------|
| E1 | Capture from device camera (`<input type=file accept=image/* capture=environment>`) | Works in **iOS standalone (installed) mode**, not just a tab | R2 (25%), R4 (15%) |
| E2 | **Blobs in IndexedDB**, metadata only in localStorage | No base64 in localStorage; no `QuotaExceededError` | R4 (15%), R3 (20%) |
| E3 | Thumbnails within the project | Render from IndexedDB blob via object URL; revoke to avoid leaks | R1 (30%) |
| E4 | Individual photo delete | Deletes blob + metadata atomically | R2 (25%) |
| E5 | *Bonus:* serial-number parsing from photos (HVAC/water heater/appliance) | Optional; "significant plus" per brief — never blocks core flow | R5 (10%) |

### F. Export  *(triage gate)*

| ID | Feature | Invariant | Rubric |
|----|---------|-----------|--------|
| F1 | One **ZIP** = `.xlsx` + all project photos, auto-downloads | One tap → file lands on device | R2 (25%) |
| F2 | `.xlsx` lists every checked item: qty, unit cost, line total, grand total | Totals in sheet match the on-screen running total exactly | R2 (25%) |
| F3 | Items grouped/labeled by section + room instance in the sheet | Reviewer can read it like the walkthrough | R2 (25%), R1 (30%) |

### G. Creative Addition — Deal Analyzer / MAO  *(required, self-designed)*

| ID | Feature | Invariant | Rubric |
|----|---------|-----------|--------|
| G1 | Enter ARV; show projected margin | Uses live repair total | R5 (10%) |
| G2 | `MAO = ARV × rule% − repairs`, rule% configurable (default 70%) | Recomputes instantly, fully offline | R5 (10%), R1 (30%) |
| G3 | Documented in the PDF writeup | Explains why it's on-brief (the go/no-go number) | R5 (10%) |

### H. PWA / Offline / Persistence (cross-cutting)  *(flagged hardest — see below)*

| ID | Feature | Invariant | Rubric |
|----|---------|-----------|--------|
| H1 | Single self-contained `index.html` + `manifest.json`, `sw.js`, icons | No build step, no framework runtime | R3 (20%), R4 (15%) |
| H2 | Service worker caches app + CDN libs (Tailwind, xlsx-js-style, JSZip) | **Airplane mode**: full app loads and works | R4 (15%) |
| H3 | Installable: home-screen icon, standalone display, both iOS & Android | Add to Home Screen launches standalone | R4 (15%) |
| H4 | Refresh / restart never loses data | All structured data in localStorage, guarded with try/catch | R4 (15%), R3 (20%) |
| H5 | Modular code: data/model · persistence · render · export | Separated concerns; readable over clever | R3 (20%) |

---

## The 3 hardest features (flagged)

1. **Adjustable room instances with decoupled per-instance state (C1–C4).**
   This is the spine of the data model and it bleeds into *everything*: progress
   denominator (D3), export aggregation (F3), price-override resolution (B4),
   and persistence (A2/H4). Bedroom/Living reuse the same catalog groups
   (Flooring/Paint/Doors) but must store *independent* selections per instance —
   one wrong shared reference and every bedroom edits the same numbers. The brief
   calls this "one of the most important features," and the rubric (R2, 25%)
   weights it heavily. **Build it first and test it hardest.**

2. **Photos in IndexedDB with reliable capture in iOS standalone PWA (E1–E4).**
   Async blob storage is harder than localStorage; thumbnails need object URLs
   that must be revoked; the ZIP export (F1) has to pull blobs back out async and
   in order. The real trap is E1: camera capture behaves differently inside an
   installed iOS PWA than in a Safari tab — CLAUDE.md explicitly says verify it
   *installed*, not in a tab. Storing blobs wrong (base64 in localStorage) throws
   `QuotaExceededError` and corrupts saved state — the exact failure CLAUDE.md
   forbids.

3. **PWA offline incl. cross-origin CDN libraries (H2–H3).**
   Airplane mode is a hard triage check. The export libs (xlsx-js-style, JSZip)
   and Tailwind load from CDNs; the service worker must cache those cross-origin
   responses so export works with no signal. iOS standalone PWA support is
   finicky (SW registration only over https — won't register from `file://`, so
   must test on the hosted GitHub Pages URL). Installability + offline together
   are the whole of R4 (15%) and a triage gate.

*Honorable mention (near-hard):* global-vs-per-project price override
propagation (B4/B5) without losing data across project switches — easy to get
subtly wrong, but contained to the pricing layer.

---

## Notes / brief-vs-CLAUDE reconciliation

- **108 items, not "75+".** Brief says "75+"; the CSV ships 108. The CSV is the
  source of truth, so we build all 108. (No conflict — 108 satisfies "75+".)
- **Serial-number parsing (E5)** is in the brief as a "significant plus" but is
  *not* in CLAUDE.md's required invariants. Treated as optional/bonus under R5;
  it must never block or slow the core photo flow.
- **19 groups vs. the data.** The 19 named groups do not cleanly absorb all 108
  items (labor/demo/cleaning/staging, toilet, water heaters, plumbing, guttering,
  concrete have no natural home). See `DATA_MODEL.md` — every such item is mapped
  with a flagged judgment call awaiting your review **before** any code is written.
- **Closet & Lighting** appear as room-type groups but are not among the 19 and
  have no dedicated CSV items. Resolution proposed in `DATA_MODEL.md`.
