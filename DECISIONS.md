# DECISIONS.md — Spark Homes Repair Estimator

Running log of non-obvious decisions and their tradeoffs. Source for the
one-page PDF writeup (best UX decision, what's fragile, the creative addition,
what ships next) and the live-interview walkthrough.

---

## Data & model

- **CSV embedded verbatim, parsed at runtime — not hand-keyed.**
  `Pricing_List.csv` is pasted into `index.html` as an exact string and parsed by
  a small RFC-4180 CSV parser at boot. *Why:* the brief demands a self-contained,
  fully-offline single file, but also that the CSV is the only price source and
  prices are never hardcoded. Embedding the raw CSV text (vs. typing 108 price
  fields into JS objects) keeps the CSV the single source of truth while staying
  offline-first. *Tradeoff:* updating prices means replacing the CSV block;
  acceptable since global/per-project overrides cover field edits.

- **20th additive group "General & Labor" (DECISION 1).** The 7 Interior
  labor/finishing orphans (MISC/Punch List, Finish-Out Labor, Demo, Haul-Off,
  Final Cleaning, Staging — `ig-20,21,25,26,27,28`) have no home among Flooring/
  Paint/Doors/Pest. They live in an additive "General & Labor" group under
  Interior/General. All 19 brief-named groups still exist and are individually
  identifiable; this is purely additive. *Tradeoff:* the app technically shows 20
  group templates, not 19 — documented and intentional.

- **`ig-22 Light Fixtures` → Lighting; Closet → bifold + door hardware
  (DECISION 4).** "Lighting" and "Closet" are room-instance groups (Living/Common,
  Bedroom) that the CSV never populated. Lighting is fed by `ig-22`; Closet reuses
  `ig-12 Bifold` + `ig-11 Interior Door Hardware`. *Why:* lets those room groups
  be checked off with real priced items. A catalog item appearing in two group
  templates is safe because selection state is keyed per room-instance + group.

- **Systems orphans (DECISION 2):** water heaters (`as-08/09`) → HVAC; Plumbing
  (`as-17`) → Structural. **Exterior (DECISION 3):** Trees group relabeled
  "Trees & Grounds" to naturally hold landscaping/mowing/concrete; it remains the
  brief's Trees group.

- **Room instances = independent state buckets.** Selection state is keyed
  `instanceId | groupId | itemId`. Bedroom/Living reuse the shared Flooring/Paint/
  Doors *templates* but each instance stores its own quantities — so Bedroom 1 and
  Bedroom 2 flooring are fully decoupled, and decoupled from house-wide Interior.
  *This is the core model decision and the highest-value feature.*

- **House-wide scopes are non-removable singletons** (Interior/General, Systems &
  Structure, Exterior); Bathroom/Bedroom/Kitchen/Living are addable/removable.

- **Seed a new project with the 3 singletons + Kitchen 1 + Bathroom 1.** *Why:*
  most flips have at least one of each; an empty project feels broken. Agents add
  more rooms as needed.

## Pricing & overrides

- **Precedence: per-project override → global override → CSV default
  (DECISION 5).** One `resolvedCost()` function is the single authority and is
  used by the screen, the totals, the Deal Analyzer, and the Excel export, so they
  can never disagree. Per-project override is keyed by `itemId` (applies to every
  instance of that item in the project).

- **Two override entry points:** tap any unit cost for a quick per-project/global
  override + reset; or open the Global Price Schedule to edit standard pricing for
  all items at once.

## Persistence & reliability

- **Structured data → localStorage (one guarded JSON blob); photo blobs →
  IndexedDB.** localStorage stores only photo *metadata*. *Why:* base64 photos in
  localStorage blow the ~5MB cap and throw `QuotaExceededError`, corrupting saved
  state. All `localStorage` writes are wrapped in try/catch and degrade with a
  toast rather than throwing.

- **Value edits patch the DOM; only structural changes re-render.** Typing a
  quantity or ticking a box recomputes totals and patches just the affected
  numbers (line total, room subtotal, group badge, grand total, progress) — no
  re-render, so inputs never lose focus and there's no jank. Adding/removing
  rooms/items, switching projects, and overrides trigger a full render.

- **All groups/rooms render up front and collapse via CSS** (hidden, not
  unmounted). Keeps toggle instant and lets value-patches target elements by id
  even while collapsed. Acceptable DOM size for a phone (~100–200 rows).

## Progress

- **A group instance is complete iff it has ≥1 checked item OR "No Action
  Needed".** Turning on No Action clears that group's selections (it means "no
  work"), so a group can't be both billed and marked no-action. Progress =
  complete group-instances ÷ total group-instances across every room + section;
  the denominator moves as rooms are added/removed.

## Photos

- **Capture via `<input type="file" accept="image/*" capture="environment" multiple>`.**
  Most reliable cross-platform path on Android + iOS, including installed PWAs.
  Thumbnails are object URLs revoked on each re-render to avoid leaks.
- **Serial-number parsing (E5) deliberately NOT built** (per instruction). The
  UI nudges agents to photograph serial plates, leaving an obvious place to add
  OCR later without touching the photo pipeline.

## PWA / offline

- **SW precaches the app shell AND the CDN libs** (Tailwind, xlsx-js-style,
  JSZip), individually and best-effort, and caches opaque cross-origin responses,
  so Export works in airplane mode. Cache-first at runtime; navigations fall back
  to `index.html` offline. Relative URLs throughout so it works under a GitHub
  Pages subpath.
- **Tailwind Play CDN** used for speed of build; it prints a console "not for
  production" note. Acceptable for the contest and allowed by the brief; could be
  swapped for a prebuilt CSS file to remove the warning.

## Creative addition — Deal Analyzer (MAO)

- **`MAO = ARV × rule% − repairs`**, rule% configurable (default 70%), plus an
  optional purchase-price input that yields projected margin and a go/no-go
  verdict against MAO. Uses the live repair total, fully offline, instant.
  *Why:* the repair estimate only matters in service of the offer; MAO is the
  number the team actually acts on — maximally on-brief.

## Export

- **One ZIP = styled `.xlsx` + `/photos`.** Sheet lists every checked item
  (section/room, group, item, unit, qty, unit cost, line total) with a styled
  header and a highlighted GRAND TOTAL; cost columns use a `$#,##0.00` number
  format. Totals come from the same `resolvedCost()` as the screen. A bad photo
  blob is skipped rather than aborting the export.

## Post-launch fixes (phone testing)

- **Pricing model is fully live-resolved; no snapshots.** Confirmed
  `resolvedCost(itemId, project) = project override → shared global override →
  CSV default`, computed at calc/render time. Projects store ONLY sparse
  per-item overrides; the global store (`STATE.global.overrides`) is shared by
  all projects, so a global edit changes every non-overriding project — including
  ones created *before* the edit. The earlier symptom (old projects not updating)
  came from a previously-deployed build that snapshotted the full price table into
  each project at creation. Added a `migrate()` step on load that: drops legacy
  snapshot fields; strips any per-project override equal to the CSV default
  (not a real override); and clears a project's overrides entirely if it still
  holds a near-catalog-sized map (≥30 — a snapshot, not hand edits). Safe because
  stripping default-equal entries doesn't change resolution; it just restores live
  global tracking.
- **Line-item row layout.** Name+unit live in a `min-w-0 flex-1` left column that
  wraps within itself; qty / unit cost / line total / Remove sit in a fixed-width
  `shrink-0` cluster, so columns stay aligned at ~360px and long names can never
  slide under the quantity field.
- **Text labels over icons** for room Edit/Remove and the per-line Remove control
  (clearer tap affordance). Photo delete keeps its compact ✕.
- **Added room rename** ("Edit") so instances can be named (e.g. "Master Bath").
- **Background scroll lock** for all sheets (incl. Deal Analyzer) via
  `position:fixed` on `body` + scroll restore — the iOS-Safari-proof technique,
  since `body{overflow:hidden}` alone is ignored there.
- **Slightly larger tap targets** on the primary header/footer action buttons.
