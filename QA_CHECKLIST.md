# QA_CHECKLIST.md — Spark Homes Repair Cost Estimator

**Test on your actual phone via the hosted GitHub Pages URL — not the desktop preview.**
The worst failures (PWA install, offline, iOS camera) only appear there. Run the four
triage gates first: if any fail, the submission is cut at Stage 1 no matter how good
the rest is.

When a step fails, give Claude Code the *specific* failing step, not "rooms are broken"
— e.g. "Bedroom 2 flooring qty overwrites Bedroom 1; they should be independent per
instance." Tighter bug reports get tighter fixes.

---

## Triage gates (pass/fail — do these first)
- [ ] Photo capture opens the camera; photo saves and shows as a thumbnail
- [ ] Export produces a ZIP that actually downloads to the device
- [ ] Room instances can be added and removed (rooms are not fixed)
- [ ] A progress bar / indicator is visible and moves when items are checked

## Pricing & totals correctness
- [ ] Spot-check 5–6 line items against `Pricing_List.csv` — unit cost and unit match exactly
- [ ] All 5 sections and all 19 groups present and reachable (plus the "General & Labor" group)
- [ ] Line total = qty × unit cost, updates the instant you type
- [ ] Grand total is pinned/sticky and visible at all times while scrolling
- [ ] Override a unit cost in Project A → sticks in A, does NOT change Project B
- [ ] Change a global price → moves in every project that hasn't overridden that item
- [ ] Add a custom line item and delete an existing one → totals stay correct, no corruption

## Room instances (the spine — most likely to be subtly wrong)
- [ ] Add Bathroom 1 + 2 and Bedroom 1 + 2 → labels are correct
- [ ] Enter different flooring quantities in Bedroom 1 vs Bedroom 2 → they stay independent
      (the classic shared-reference bug)
- [ ] Delete Bathroom 2 → its data gone, Bathroom 1 and everything else untouched
- [ ] Grand total and progress denominator both update as rooms are added/removed

## Photos & storage
- [ ] Add 6–8 photos → no `QuotaExceededError`, no silent state loss
- [ ] Delete one photo → removed cleanly, others remain
- [ ] Add to home screen, open the INSTALLED app → camera capture still works in standalone
      mode (especially on iOS — behaves differently from a Safari tab)

## PWA & offline
- [ ] Installs to home screen on both Android and iOS; launches standalone (no browser chrome)
- [ ] Airplane mode → app fully loads and works
- [ ] Refresh mid-walkthrough → every project, selection, quantity, and photo persists
- [ ] Force-quit and reopen → state still intact

## Export integrity
- [ ] In airplane mode, export a multi-room project with photos → ZIP downloads
- [ ] Open the `.xlsx` → grand total EXACTLY equals the on-screen total
      (if they differ, there are two cost paths — fix it)
- [ ] Every checked item appears with qty, unit cost, line total
- [ ] Items grouped/labeled by section and room instance
- [ ] All photos taken are inside the ZIP

## Mobile feel (the 30% — don't skip)
- [ ] Tap targets big enough for a thumb; nothing requires precision tapping
- [ ] Collapse/expand and project switching feel instant — no lag, no layout jump
- [ ] No horizontal scroll; no content hidden under the notch / home bar (safe-area insets)
- [ ] Number inputs bring up the numeric keypad, not the full keyboard

## Deal Analyzer
- [ ] Enter ARV, adjust rule% → MAO and margin recompute instantly
- [ ] Change a repair quantity → MAO reflects the new repair total
- [ ] Works in airplane mode and persists on refresh

---

## Before you submit
- [ ] App runs from the single HTML file (+ static files) with no server or install step
- [ ] GitHub repo is shared/accessible, README explains approach, libraries, run-locally
- [ ] One-page PDF written: best UX decision · what's fragile · the creative addition ·
      what ships next with two more days · the role AI played
- [ ] Reference app is not copied — code and structure are your own
- [ ] Submitted via a single email to the contest address before the 7/14 deadline
