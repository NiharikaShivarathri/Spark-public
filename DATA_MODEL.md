# DATA_MODEL.md — Spark Homes Repair Cost Estimator

Two things to review here:

1. **The full 108-item → 19-group mapping** (with every judgment call flagged).
2. **The room-instance model** (how Bathroom 1/2, Bedroom 1/2, Kitchen,
   Living/Common, and the house-wide scopes are represented in state).

> ⚠️ **Read the flags before approving.** The 19 named groups do **not** absorb
> all 108 CSV items cleanly. I've placed every orphan and surfaced it as a
> `⚑ DECISION` so you can rule before any code is written. The CSV (`id`) is the
> only price source; nothing here invents prices or fields.

---

## Part 1 — Section / group structure (the canonical 19)

| Section | Prefix | Groups | # items |
|---|---|---|---:|
| Interior / General | `ig-` | Flooring · Paint & Wall Repair · Doors · Pest Control | 28 |
| Kitchen | `kt-` | Cabinets · Countertops & Tile · Appliances | 17 |
| Bathrooms | `ba-` | Vanity & Countertop · Tub & Shower · Tile | 16 |
| Systems & Structure | `as-` | HVAC · Electrical · Structural · Insulation & Drywall | 24 |
| Exterior | `ex-` | Fence · Siding · Windows · Garage · Trees | 23 |
| | | **19 groups** | **108** |

---

## Part 2 — Full item → group mapping

Legend: ✅ clean fit · ⚑ judgment call (your decision). Prices/units shown
exactly as in `Pricing List.csv` for cross-check; they are not redefined here.

### Section 1 — Interior / General (`ig-`, 28 items)

**Flooring** (6)
| id | name | cost | unit |
|---|---|---:|---|
| ig-01 | Refinish Hardwood Floor | 2.35 | sqft |
| ig-02 | New Hardwoods 1.5" | 10.00 | sqft |
| ig-03 | New Hardwoods 2" | 4.75 | sqft |
| ig-04 | Hardwood Splicing | 8.40 | sqft |
| ig-05 | Vinyl Plank | 2.50 | sqft |
| ig-06 | Carpet | 1.90 | sqft |

**Paint & Wall Repair** (4)
| id | name | cost | unit | |
|---|---|---:|---|---|
| ig-07 | Interior Paint — 2 Tone | 2.95 | sqft | ✅ |
| ig-08 | Drywall Repair | 900.00 | 1,000 sqft | ✅ |
| ig-09 | Wallpaper Removal | 250.00 | room | ✅ |
| ig-19 | Trim Out (Casing, Crown, Baseboard) | 3.75 | LF | ⚑ trim/carpentry — placed in Paint & Wall Repair; could be its own/Doors |

**Doors** (9) ✅
| id | name | cost | unit |
|---|---|---:|---|
| ig-10 | Interior Door — Hollow Slab | 125.00 | ea. |
| ig-11 | Interior Door Hardware (Knob + Hinges + Labor) | 25.00 | ea. |
| ig-12 | Bifold Door with Framing | 400.00 | ea. |
| ig-13 | Interior Door — Pre-hung | 200.00 | ea. |
| ig-14 | Front Entry Door | 475.00 | ea. |
| ig-15 | Front Entry Door Hardware | 80.00 | ea. |
| ig-16 | Exterior Door Hardware | 75.00 | handle |
| ig-17 | Exterior Insulated Side Door (Installed) | 500.00 | ea. |
| ig-18 | Sliding Glass Door | 1025.00 | ea. |

**Pest Control** (2) ✅
| id | name | cost | unit |
|---|---|---:|---|
| ig-23 | Bedbug Spray / Heat Treat | 475.00 | ea. |
| ig-24 | Termite Treatment | 650.00 | ea. |

**⚑ ORPHANS — 7 items with no home in Flooring/Paint/Doors/Pest** *(biggest decision)*
| id | name | cost | unit |
|---|---|---:|---|
| ig-20 | MISC / Punch List | 2650.00 | flat |
| ig-21 | Finish Out Labor | 1350.00 | flat |
| ig-22 | Light Fixtures | 70.00 | 100 sqft |
| ig-25 | Demo | 1375.00 | variable |
| ig-26 | Haul Off | 725.00 | load |
| ig-27 | Final Cleaning | 325.00 | flat |
| ig-28 | Staging | 0.90 | sqft |

> **⚑ DECISION 1 (most important).** These 7 are house-wide labor/finishing items.
> Options:
> - **(A) Recommended:** add **one** non-brief house-wide group **"General &
>   Labor"** under Interior/General (→ 20 groups total). The 19 brief groups all
>   still exist and are populated, so "all 19 groups" (R2) is satisfied; this is
>   purely additive and keeps the checklist honest. Holds ig-20,21,25,26,27,28.
> - **(B)** Distribute into existing groups (e.g., all into Paint & Wall Repair).
>   Keeps exactly 19 but mislabels items.
> - **ig-22 Light Fixtures** is special: it maps cleanly to the **Lighting** group
>   used by Living/Common (and optionally Bedroom). Recommend ig-22 → **Lighting**
>   (see Part 3), *not* the General bucket. This also resolves "Lighting has no
>   items."

### Section 2 — Kitchen (`kt-`, 17 items) — fits cleanly

**Cabinets** (6)
| id | name | cost | unit | |
|---|---|---:|---|---|
| kt-01 | Hinges and Pulls | 275.00 | kitchen | ✅ |
| kt-02 | Cabinets Uppers | 125.00 | LF | ✅ |
| kt-03 | Cabinets Lowers | 150.00 | LF | ✅ |
| kt-04 | Cabinet Door Faces Only | 80.00 | door | ✅ |
| kt-05 | Cabinets (Labor & Paint) | 1100.00 | kitchen | ✅ |
| kt-08 | Misc Woodwork | 500.00 | variable | ⚑ woodwork → Cabinets (carpentry); could be General |

**Countertops & Tile** (5)
| id | name | cost | unit | |
|---|---|---:|---|---|
| kt-06 | Granite + 4" Splash Guard | 40.00 | LF | ✅ |
| kt-07 | Backsplash | 725.00 | house | ✅ |
| kt-09 | Tile — Large Areas | 6.45 | sqft | ✅ |
| kt-10 | Tile — Small Areas | 10.00 | sqft | ✅ |
| kt-11 | Undermount Kitchen Sink | 325.00 | ea. | ⚑ sink → Countertops&Tile (set in counter); could be Appliances |

**Appliances** (6) ✅
| id | name | cost | unit |
|---|---|---:|---|
| kt-12 | Microwave / Hood | 500.00 | ea. |
| kt-13 | Range | 725.00 | ea. |
| kt-14 | Wall Oven | 1075.00 | ea. |
| kt-15 | Cooktop | 550.00 | ea. |
| kt-16 | Dishwasher | 575.00 | ea. |
| kt-17 | Fridge | 1175.00 | ea. |

### Section 3 — Bathrooms (`ba-`, 16 items) — per bathroom instance

**Vanity & Countertop** (7)
| id | name | cost | unit | |
|---|---|---:|---|---|
| ba-01 | Granite ($/LF) | 35.00 | LF | ✅ |
| ba-02 | New Bottom Vanity | 125.00 | LF | ✅ |
| ba-03 | Home Depot Vanity w/ Sink (18") | 225.00 | ea. | ✅ |
| ba-14 | Undermount Sink | 150.00 | ea. | ✅ |
| ba-15 | Mirror | 200.00 | ea. | ✅ |
| ba-04 | Toilet | 150.00 | ea. | ⚑ no plumbing-fixtures group → placed in Vanity & Countertop |
| ba-16 | HVL (needed if no window) | 275.00 | ea. | ⚑ exhaust fan/vent → Vanity & Countertop; could be Tub & Shower |

**Tub & Shower** (7) ✅
| id | name | cost | unit |
|---|---|---:|---|
| ba-07 | Reglaze Tub or Chemical Clean | 350.00 | ea. |
| ba-08 | Reglaze Tub + Surround | 750.00 | ea. |
| ba-09 | Reglaze Shower | 1325.00 | ea. |
| ba-10 | Tiled Shower Tear Out + Tile Install | 3100.00 | ea. |
| ba-11 | Tub Tile Surround Tear Out + Tile Install (incl. tub) | 2250.00 | ea. |
| ba-12 | Shower Plastic Insert Tear Out + New Insert | 825.00 | ea. |
| ba-13 | Tub Tear Out + New Insert & Tub | 1575.00 | ea. |

**Tile** (2) ✅
| id | name | cost | unit |
|---|---|---:|---|
| ba-05 | Tile — Large Areas | 5.80 | sqft |
| ba-06 | Tile — Small Areas | 10.00 | sqft |

### Section 4 — Systems & Structure (`as-`, 24 items)

**HVAC** (9)
| id | name | cost | unit | |
|---|---|---:|---|---|
| as-01 | Furnace | 3350.00 | ea. | ✅ |
| as-02 | Condensing Unit | 3300.00 | ea. | ✅ |
| as-03 | Package Unit | 4700.00 | ea. | ✅ |
| as-04 | A-Coil (if no condensing unit) | 1625.00 | ea. | ✅ |
| as-05 | Ducting (if NO HVAC) | 3200.00 | ea. | ✅ |
| as-06 | Duct Cleaning — Floor Vents | 550.00 | ea. | ✅ |
| as-07 | Window Unit Replacement 220 | 575.00 | ea. | ✅ |
| as-08 | Hot Water Heater w/ Expansion Tank | 1425.00 | ea. | ⚑ plumbing/mechanical, no plumbing group → HVAC (mechanical) |
| as-09 | Hot Water Heater Expansion Tank Only | 200.00 | ea. | ⚑ same as above → HVAC |

**Electrical** (6) ✅
| id | name | cost | unit |
|---|---|---:|---|
| as-10 | Switches / Outlets | 1400.00 | house |
| as-11 | Standard Electrical | 1650.00 | house |
| as-18 | Electrical Panel Swap to 200A | 2350.00 | ea. |
| as-19 | Full Electrical Rewire (to Studs) | 5.65 | sqft |
| as-20 | Full Electrical Rewire (leaving Drywall) | 9.15 | sqft |
| as-24 | Aluminum Wiring | 2450.00 | variable |

**Structural** (6)
| id | name | cost | unit | |
|---|---|---:|---|---|
| as-12 | Subfloor | 8.20 | sqft | ✅ |
| as-13 | Framing | 950.00 | variable | ✅ |
| as-14 | Structural (Pier) | 375.00 | pier | ✅ |
| as-15 | Structural Foam Injection | 5.85 | sqft of affected area | ✅ |
| as-16 | Roof | 1100.00 | 225 sqft L&M | ⚑ roof ≠ structural strictly; no Roof group → Structural (envelope) |
| as-17 | Plumbing | 1000.00 | variable | ⚑ no plumbing group → Structural (systems); could be HVAC |

**Insulation & Drywall** (3) ✅
| id | name | cost | unit |
|---|---|---:|---|
| as-21 | Wall Insulation (to Studs) | 1.20 | sqft |
| as-22 | Attic Insulation | 1225.00 | 1,600 sqft house |
| as-23 | New Drywall to Studs (L&M) | 5.20 | sqft |

> **⚑ DECISION 2.** Systems has no **Plumbing** group, yet ships water heaters
> (as-08/09) and a Plumbing line (as-17). Recommend leaving them as flagged
> (heaters→HVAC, plumbing→Structural) **or** renaming a group to
> "Plumbing & Water Heaters." Your call before build.

### Section 5 — Exterior (`ex-`, 23 items)

**Fence** (3) ✅
| id | name | cost | unit |
|---|---|---:|---|
| ex-01 | Fence Repair — Chain Link / Wood Gate | 225.00 | variable |
| ex-02 | Fence Repair — Chain Link | 275.00 | LF |
| ex-03 | Fence Repair — Privacy 6ft | 30.00 | LF |

**Siding** (6)
| id | name | cost | unit | |
|---|---|---:|---|---|
| ex-05 | Vinyl Siding (10'x10') | 300.00 | square | ✅ |
| ex-06 | Tuck Pointing | 225.00 | variable | ✅ (masonry envelope) |
| ex-07 | Exterior Paint | 2.60 | sqft | ✅ |
| ex-08 | Exterior Wood Repair | 525.00 | variable | ✅ |
| ex-09 | Siding Repair (10'x10') | 975.00 | section | ✅ |
| ex-18 | Guttering | 4.15 | LF | ⚑ roofline/envelope, no Roof group on Exterior → Siding |

**Windows** (5) ✅
| id | name | cost | unit |
|---|---|---:|---|
| ex-13 | Aluminum Window Paint (Int/Ext) | 700.00 | house |
| ex-14 | Windows (3x5 sash) | 425.00 | ea. |
| ex-15 | Window Repair — Non-Insulated (6x6+) | 35.00 | sf |
| ex-16 | Window Repair — Insulated (6x6+) | 40.00 | sf |
| ex-17 | Aluminum Framed Window Pane | 100.00 | pane |

**Garage** (3) ✅
| id | name | cost | unit |
|---|---|---:|---|
| ex-21 | Garage Door — 1 Car | 975.00 | ea. |
| ex-22 | Garage Door — 2 Car (Installed) | 1225.00 | ea. |
| ex-23 | Garage Conversion | 8850.00 | ea. |

**Trees** (6) — *reads more like "Grounds / Site"*
| id | name | cost | unit | |
|---|---|---:|---|---|
| ex-10 | Tree Trimming | 450.00 | variable | ✅ |
| ex-11 | Tree Removal (w/o stump) | 1450.00 | tree | ✅ |
| ex-12 | Stump Grinding | 250.00 | stump | ✅ |
| ex-04 | Landscaping | 450.00 | variable | ⚑ grounds → Trees; fits a "Grounds" rename |
| ex-20 | Mowing (summer, every 2 weeks) | 45.00 | mowing | ⚑ grounds → Trees |
| ex-19 | Concrete w/ Demo | 200.00 | sqft | ⚑ hardscape/site → Trees; could be its own |

> **⚑ DECISION 3.** Consider renaming **Trees → "Trees & Grounds"** (label only;
> the brief's group count stays 5 for Exterior) so landscaping/mowing/concrete
> read naturally. No code impact — purely the display name.

### Mapping completeness check
28 + 17 + 16 + 24 + 23 = **108 items, all assigned.** No item left unmapped; no
price invented. Every non-✅ item carries a ⚑ flag above.

---

## Part 3 — Room-instance model

### Concept
The 108 items are a **static catalog**, each tagged with `section` + `group`.
The checklist the agent fills out is composed of **room instances**, each of
which renders the catalog items for *its* groups but stores its **own**
selection/quantity/override state. The same catalog item (e.g. `ig-05 Vinyl
Plank`) can be checked in `Bedroom 1` and `Bedroom 2` with different quantities —
they never share state. This decoupling (brief: Bedroom/Living "decoupled and
separated") is the core of the model.

### Room types and the groups they expose

| Room type | Removable? | Cardinality | Groups exposed | Item source |
|---|---|---|---|---|
| **Interior / General** | no | 1 (singleton) | Flooring, Paint & Wall Repair, Doors, Pest Control (+General&Labor*) | `ig-` catalog |
| **Systems & Structure** | no | 1 (singleton) | HVAC, Electrical, Structural, Insulation & Drywall | `as-` catalog |
| **Exterior** | no | 1 (singleton) | Fence, Siding, Windows, Garage, Trees | `ex-` catalog |
| **Kitchen** | yes | 0..n (usually 1) | Cabinets, Countertops & Tile, Appliances | `kt-` catalog |
| **Bathroom** | yes | 0..n (1–3 typical) | Vanity & Countertop, Tub & Shower, Tile | `ba-` catalog |
| **Bedroom** | yes | 0..n | Flooring, Paint, Doors, **Closet** | shared `ig-` Flooring/Paint/Doors |
| **Living / Common** | yes | 0..n | Flooring, Paint, Doors, **Lighting** | shared `ig-` Flooring/Paint/Doors + `ig-22` |

\* *General & Labor* is the proposed catch-all from DECISION 1.

> **⚑ DECISION 4 — Closet & Lighting have no dedicated CSV items.**
> - **Lighting** ← recommend `ig-22 Light Fixtures` lives here (resolves
>   DECISION 1's ig-22). Living/Common Lighting is then populated; Bedroom could
>   optionally show Lighting too.
> - **Closet** ← no natural CSV item. Options: (A) draw from Doors items
>   (`ig-12 Bifold`, `ig-11 hardware`) so a closet can still be checked off, or
>   (B) make Closet a **notes + No-Action-only** group (no priced items), or
>   (C) allow custom user-added items (feature B7) to fill it. Recommend **(A)**:
>   Closet exposes bifold + door hardware, which is exactly what closets cost.

### Decoupling rule (Bedroom/Living vs Interior/General)
Flooring/Paint/Doors items appear in three places — the house-wide Interior/General
singleton **and** each Bedroom/Living instance. They reference the same catalog
`id`s but are **independent line instances**. A flooring quantity entered in
`Bedroom 2` does not change `Interior/General` flooring or any other bedroom.
This is the brief's explicit requirement and a deliberate model choice (call it
out in `DECISIONS.md`).

### State shape (localStorage; photos excluded — those go to IndexedDB)

```
projects: {
  [projectId]: {
    id, name, createdAt, updatedAt,
    globalPricesVersion,                 // to detect global override changes
    priceOverrides: { [itemId]: cost },  // per-PROJECT override (B4)
    customItems:    { [itemId]: {name,cost,unit,section,group} }, // B7 adds
    deletedItems:   [itemId],            // B7 per-project removals
    rooms: [
      {
        instanceId,                      // uuid
        type,                            // 'bathroom' | 'bedroom' | 'kitchen' | 'living' | 'interior' | 'systems' | 'exterior'
        label,                           // "Bathroom 1", "Bedroom 2", "Interior / General"
        order,
        groups: {
          [groupId]: {
            noAction: false,             // B2
            lines: {
              [itemId]: { checked, qty } // selection state; cost resolved at render
            }
          }
        }
      }
    ],
    notes,                               // free text per project (brief: notes)
    photoMeta: [ { photoId, label, roomInstanceId?, createdAt, serial? } ] // E2; blob lives in IndexedDB
  }
},
globalPriceOverrides: { [itemId]: cost },   // global default change, all projects (B5)
activeProjectId,
settings: { maoRulePct: 0.70 }              // Deal Analyzer default (G2)
```

**IndexedDB** (separate store, DB e.g. `spark-photos`): `{ photoId → Blob }`.
localStorage holds only `photoMeta`. (CLAUDE.md: never store blobs in localStorage.)

### Cost resolution order (single function, used everywhere)
`resolvedCost(itemId, projectId)` =
1. project `priceOverrides[itemId]` if set (B4), else
2. `globalPriceOverrides[itemId]` if set (B5), else
3. CSV default `cost` (source of truth).

`lineTotal = resolvedCost × qty`. Grand total = Σ over all room instances of all
checked lines. The export sheet (F2) and on-screen total (B6) call the *same*
function so they can never disagree.

### Progress model (D1–D3)
- Unit of progress = **one group instance** (a group within a specific room
  instance), e.g. `Bathroom 2 / Tile`.
- A group instance is **complete** iff `noAction === true` OR ≥1 line `checked`.
- `progress = completeGroupInstances / totalGroupInstances`, where the
  denominator includes every group of every room instance + the three
  house-wide singletons. Adding/removing a room instance changes the denominator
  live.

---

## Summary of decisions awaiting your sign-off (before any code)

| # | Decision | Recommended |
|---|---|---|
| 1 | Home for 7 Interior labor/finish orphans | Add additive "General & Labor" group; route `ig-22`→Lighting |
| 2 | Plumbing / water heaters with no Plumbing group | heaters→HVAC, `as-17`→Structural (or rename a group) |
| 3 | Trees group also holds landscaping/mowing/concrete | rename label "Trees & Grounds" (display only) |
| 4 | Closet & Lighting groups have no CSV items | Lighting←`ig-22`; Closet←bifold + door hardware |
| 5 | Per-project price override scope | keyed by `itemId` per project (applies to all instances of that item in the project) |
| 6 | Bonus serial parsing (E5) | defer to a later, optional pass — never block core photo flow |
