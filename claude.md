# CLAUDE.md — Spark Homes Repair Cost Estimator

## What we're building
A mobile-first **repair cost estimator PWA** for a house-flipping acquisition team to use on a phone, inside an empty house, often with no signal. Agents walk a property room by room, check off repairs, enter quantities, snap photos, and read a running cost total. They export the estimate as a ZIP (Excel breakdown + photos).

**The one principle that overrides everything:** optimize for a *real walkthrough on a phone*, not a screenshot. Fast, no jank, survives a refresh, works in airplane mode. If a feature is impressive but makes the app feel slow or fragile on a phone, it's the wrong call.

## Non-negotiable constraints (from the brief)
- **Single self-contained `index.html`** plus only small static files (`manifest.json`, `sw.js`, icons). No build step, no bundler, no Node server, no framework runtime.
- **Vanilla JS, HTML, CSS.** CDN libraries are allowed (Tailwind, `xlsx-js-style`, JSZip). Nothing that requires compilation.
- **Must work fully offline** via a service worker + web app manifest. A backend is optional and the app must work completely without it.
- **Installable PWA** on Chrome/Android and Safari/iOS: home-screen icon, standalone display mode.
- Target browsers: **Chrome for Android, Safari for iOS.** Test against these, not desktop Chrome.

## Source-of-truth rules (do not violate)
- **`Pricing_List.csv` (108 items: `id,name,cost,unit`) is the ONLY pricing source.** Load items from it. Do **not** hardcode prices or invent fields. `id` anchors each item in the data model.
- **`Example_App.html` is reference for SCOPE ONLY. Never copy its code, structure, class names, or data array.** Reviewers diff against it; a derivative submission is disqualified. When in doubt, solve it differently.
- The brief (`Contest_Briefing.docx`) is the spec. If something here conflicts with the brief, the brief wins — flag it, don't silently diverge.

## Architecture & persistence
- **Structured data → `localStorage`** (projects, selections, quantities, notes, per-project price overrides, global price overrides).
- **Photo blobs → IndexedDB.** Do NOT put base64 photos in localStorage — its ~5MB cap throws `QuotaExceededError` and corrupts saved state. localStorage holds only photo *metadata*; the blobs live in IndexedDB. This is a deliberate reliability decision and a key talking point.
- All persistence must be resilient: a refresh or an app restart never loses data. Wrap storage in try/catch and degrade gracefully.
- Keep JS modular within the file: separate concerns for **data/model**, **persistence**, **render**, and **export**. Readable and maintainable beats clever — code quality is 20% of the score.

## Data model (5 sections, 19 groups)
| Section | Groups |
|---|---|
| Interior / General / Common Areas | Flooring, Paint & Wall Repair, Doors, Pest Control |
| Kitchen | Cabinets, Countertops & Tile, Appliances |
| Bathrooms | Vanity & Countertop, Tub & Shower, Tile *(per bathroom instance)* |
| Systems & Structure | HVAC, Electrical, Structural, Insulation & Drywall |
| Exterior | Fence, Siding, Windows, Garage, Trees |

CSV id prefixes → sections: `ig-` Interior/General · `kt-` Kitchen · `ba-` Bathroom · `as-` Systems & Structure · `ex-` Exterior. Mapping each item to its *group* within a section is a judgment call — propose the full mapping in `SPEC.md` for human review before building on it; don't guess silently.

**Adjustable rooms (one of the most important features):** rooms are addable/removable instances during a walkthrough. Each instance carries its own copy of its relevant groups, labeled by instance — e.g. `Bathroom 1: Tub & Shower`, `Bedroom 2: Flooring`. Room types and their groups:
- **Bathroom** — Vanity & Countertop, Tub & Shower, Tile
- **Kitchen** — Cabinets, Countertops & Tile, Appliances
- **Bedroom** — Flooring, Paint, Doors, Closet
- **Living / Common** — Flooring, Paint, Doors, Lighting
- **Interior / General** (whole house) and **Systems & Structure** and **Exterior** apply house-wide.

Bedroom and Living share categories with Interior/General but are **decoupled into their own room instances** — the brief explicitly wants these separated for per-room accuracy.

## Required feature invariants (must always hold)
- Multiple projects: create, name, save, switch with **zero data loss**.
- Each line item shows: name, unit type, quantity input, unit cost, computed line total.
- **Running grand total is pinned and visible at all times.**
- **Price override:** unit cost editable per item *per project*, plus a way to update standard pricing *globally* across all projects.
- **Add / remove line items** on a per-item basis; **add / remove room instances** freely.
- Every group has a **"No Action Needed"** option (explicitly marks a group reviewed with no work).
- **Progress tracking:** per-group — checking any item in a group marks it complete; total progress spans all groups across all sections and all room instances.
- **Photos:** capture from device camera (`<input type="file" accept="image/*" capture="environment">`), thumbnails, individual delete. Verify camera capture works **in standalone/installed mode on iOS**, not just in a browser tab.
- **Export:** one ZIP = an `.xlsx` (all checked items: qty, unit cost, line total, grand total) + all project photos; downloads automatically.

## Creative addition (required, self-designed)
Build a **Deal Analyzer / Max Allowable Offer (MAO) tool.** The repair total already exists; let the agent enter ARV (After Repair Value) and see projected margin and `MAO = ARV × rule% − repairs` (rule% configurable, default 70%). This is the go/no-go number the team actually makes offers on — maximally on-brief and defensible. Keep it offline and instant. Document it in the PDF writeup.

## Testing & verification (run after every phase)
Before calling any phase done, verify on a **real phone** via the hosted GitHub Pages URL (a service worker won't register from `file://`):
1. Tap targets are large; collapse/expand and project switch feel instant.
2. Refresh mid-walkthrough → all data persists.
3. **Airplane mode** → app loads and works fully.
4. Add to home screen → launches standalone; camera capture works there.
5. Add several photos → no quota errors; export ZIP opens with correct Excel + photos.

## Build in phases — never one-shot
Order: data/model → core checklist + running total → room instances → photos (IndexedDB) → PWA/offline → export ZIP → Deal Analyzer. Each phase independently testable. Stop after each phase for review.

## Keep a decisions log
Append every non-obvious decision (and its tradeoff) to `DECISIONS.md` as you go: it becomes the one-page PDF writeup (best UX decision, what's fragile, the creative addition, what ships next with two more days) and the script for the live interview walkthrough.

## Never do
- Never copy from `Example_App.html`.
- Never hardcode prices or use any pricing source other than the CSV.
- Never store photo blobs in localStorage.
- Never add a feature that degrades phone responsiveness for the sake of a demo.
- Never leave storage writes unguarded — assume quota and parse errors will happen.

## Deliverables (for reference)
1. The app as a single HTML file (+ small static files), runnable with no server/deps.
2. A GitHub repo with a README (approach, libraries, how to run locally).
3. A one-page PDF writeup, including the role AI played in development.