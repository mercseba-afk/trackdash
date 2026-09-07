# TrackDash — Catalog Integrity Audit (Final)

This document reflects the **final state** of the catalog integrity audit
across every pass, including the "Final Fixes" round that corrected a
real bug in how unverified release items were resolved, restructured
Dyna-Hawk GX and Dash-2 Burning Sun into their correct release
structures, and closed out several remaining open items. It supersedes
every earlier draft of this file.

## Scope and honesty note

This audit was run against **official Tamiya sources only**:
`www.tamiya.com`'s English/global AND Japanese product pages, official
Tamiya America PDF price lists and new-item announcements. Retailer and
wiki pages were used only as **leads** — never as the deciding source
for a value written into `lib/data/products.ts` — except where a
correction is explicitly labeled `PARTIALLY VERIFIED`, meaning the
strongest source found was retailer/wiki corroboration, not a direct
official fetch, and the DB field reflects that reduced confidence
honestly rather than being written as plain fact.

**All 36 products received a genuine search attempt** across this
audit's several passes — by name, by item number, and against official
PDF catalogs/price lists where relevant. 30 were resolved with some
degree of official backing (25 fully, 5 confirmed wrong and correctly
nulled); 6 remain genuinely `UNVERIFIED` after a real attempt, with
exactly what was found (or not found) documented per product below.

## Totals (exact, final)

| | Count |
|---|---|
| **Products** | **36** |
| **Releases** | **62** (60 originally seeded + 2 genuinely new releases added this pass — see "New releases added" below) |
| Products fully VERIFIED / CORRECTED (item confirmed via a genuine official source) | 24 |
| Products PARTIALLY VERIFIED (item confirmed, but the product contains a release whose own item is only semi-confirmed) | 1 — Dyna-Hawk GX |
| Products CORRECTED to `NULL` (old item confirmed wrong via an official source; no confident replacement found) | 5 — Thunder Shot, Dash-4 Cannon Ball, Astute, Dash-01 Horizon, Mad Bull |
| Products UNVERIFIED despite a genuine attempt | 6 — Manta Ray, Fire Dragon, Sword Flash, Copperfang, Emperor (Premium Black Special), Aero Avante Japan Cup 2013 |
| **Releases: VERIFIED / CORRECTED** (own item confirmed via a genuine official source) | **38** |
| **Releases: PARTIALLY VERIFIED** | **4** — Dyna-Hawk GX Super XX Special (94717); Aero Avante Clear Body; Aero Avante Black Special; Raikiri Black Special |
| **Releases: CORRECTED to `NULL`** (confirmed wrong or forced by a real collision; no replacement found; genuinely `NULL` in the seed and the generated SQL) | **10** — see exact list below |
| **Releases: UNVERIFIED** (not independently checked this pass) | **10** — see exact list below |
| 38 + 4 + 10 + 10 | **62** ✓ |
| Pseudo-JAN barcodes present anywhere in this catalog | **0 / 62** |
| Verified-real MSRP figures present anywhere in this catalog | **0 / 62** |
| Estimated/demo MSRP values present in the factual DB-bound fields | **0 / 62** (see "MSRP data flow fix" below) |
| Deployed UUIDs preserved (36 original product ids + 60 original release ids) | **96 / 96**, byte-identical |
| New release ids added this pass | **2** (both genuinely new, never previously allocated — see below) |

### Releases corrected to `NULL` (exact list, 10)

| Product | Release | Reason |
|---|---|---|
| Thunder Shot | Thunder Shot (Type 3) | Product-level: 18075 confirmed to belong to Great Emperor Premium |
| Thunder Shot | Thunder Shot Premium | Inherits product-level NULL |
| Dash-4 Cannon Ball | Dash-4 Cannon Ball | 18704 confirmed to belong to Shadow Shark |
| Astute | Astute | 19412 confirmed to belong to Cyclone Magnum (real collision) |
| Astute | Astute (Reissue) | Inherits product-level NULL |
| Dash-01 Horizon | Dash-01 Horizon | 19415 confirmed to belong to Hurricane Sonic (real collision) |
| Mad Bull | Mad Bull | 18615 confirmed to belong to Manta Ray Mk.II |
| Mad Bull | Mad Bull (2013 Reissue) | Inherits product-level NULL |
| Neo-Tridagger ZMC | Neo-Tridagger ZMC (Premium) | Own item not independently confirmed; explicit `null` so it does NOT inherit the parent's (different) confirmed item |
| Avante | Avante (Premium) | Own item not independently confirmed; explicit `null` so it does NOT inherit the parent's (different) confirmed item |

### Releases UNVERIFIED (exact list, 10)

| Product | Release | Note |
|---|---|---|
| Manta Ray | Manta Ray | Product genuinely unverified (see below) |
| Manta Ray | Manta Ray (2015 Reissue) | Product genuinely unverified |
| Fire Dragon | Fire Dragon | Product genuinely unverified |
| Fire Dragon | Fire Dragon Premium | Product genuinely unverified |
| Sword Flash | Sword Flash | Product genuinely unverified |
| Copperfang | Copperfang | Product genuinely unverified |
| Emperor (Premium Black Special) | Emperor (Premium Black Special) | Product genuinely unverified |
| Aero Avante Japan Cup 2013 | Aero Avante Japan Cup 2013 | Product genuinely unverified |
| Dash-1 Emperor | Dash-1 Emperor Premium (Black Special) | Item 95359 carried over from the original seed; not independently checked this pass (product itself is otherwise fully verified) |
| Dash-1 Emperor | Dash-1 Emperor 30th Anniversary | Item 92403 carried over from the original seed; not independently checked this pass |

---

## Critical bug fix: NULL vs. undefined release-item semantics

Independent review found that `buildReleases()` previously resolved a
release's item number as:

```js
itemNumber: r.item ?? seed.item
```

This could not distinguish two genuinely different situations that this
audit needs to tell apart:

- a release has **no override at all** → it should inherit the parent
  product's item, OR
- a release was **audited and found to be intentionally unknown** → it
  must NOT inherit the parent's item and must resolve to `NULL`.

Both were written in the source as `item: undefined`, and JavaScript's
`??` operator treats `undefined` identically to "not provided" — so
every release this audit had deliberately nulled (e.g. Dash-1 Emperor
Premium, before its own official source was found) was silently
**inheriting the parent's item number in the generated output and SQL**
instead of staying `NULL`. This was a real bug with real incorrect SQL
as a consequence, not a hypothetical.

**Fix**: `ReleaseSeed.item` now has explicit three-way semantics:

| Value | Meaning |
|---|---|
| *(key omitted entirely)* | Inherit the parent product's `item` |
| `item: null` | Intentionally unknown — do **not** inherit; resolves to `NULL` |
| `item: "12345"` | This release's own explicit, verified value |

`buildReleases()` resolves this with an explicit `=== undefined` check,
never `??`, so `null` survives all the way to the generated SQL. Every
release this audit determined should be `NULL` (see the exact list
above) now uses `item: null` explicitly in `lib/data/products.ts`, not
an omitted key or a bare `undefined`.

## MSRP data flow fix

Independent review also found that `ProductRelease.msrpJPY`/`msrpEUR`
(the fields `scripts/generate-catalog-seed.mjs` writes into the
database's `msrp_jpy`/`msrp_eur` columns) could silently fall back to
the app-level DEMO estimate when no verified figure existed — meaning an
estimate could, in principle, flow into a factual DB column exactly the
way this whole audit exists to prevent.

**Fix**: `msrpJPY`/`msrpEUR` on both `Product` and `ProductRelease` are
now **verified-only** — populated exclusively from `verifiedMsrpJPY`,
`undefined` (→ `NULL`) otherwise, with no estimate fallback anywhere in
that path. A genuinely separate pair of fields,
`estimatedMsrpJPY`/`estimatedMsrpEUR`, carries the demo estimate for
`lib/data/market.ts`'s already-"demo"-labeled pricing engine only;
`scripts/generate-catalog-seed.mjs` does not read these fields, by
construction, and now carries an explicit comment saying so for future
maintainers. `lib/actions/mappers.ts` and
`components/screens/onboarding-screen.tsx` were updated to match (no
more `?? 0` masking an unverified price as "free").

Since no release in this catalog has a verified real MSRP as of this
pass, `msrp_jpy`/`msrp_eur` are `NULL` for all 62 releases in the
generated migration — exactly as they should be.

## New releases added this pass (2)

Both are genuinely new — a stable id that was never previously
allocated for that product's `seedKey`. Every one of the 96 originally
deployed ids (36 products + 60 releases) is untouched.

1. **Dash-2 Burning Sun (Type 3 Chassis)** — item 18026, added as this
   product's second release (see "Dash-2 Burning Sun" below).
2. **Dyna-Hawk GX Super XX Special (2019 Reissue)** — item 95467, added
   as this product's third release (see "Dyna-Hawk GX" below).

(A third release, "Dyna-Hawk GX Super XX Special" / item 94717, was also
added — but it **reuses** an existing id: the id previously (wrongly)
assigned to a fake, unsupported "Dyna-Hawk GX Premium — 2016" release
that never represented a real Tamiya product. Correcting that slot's
content in place, rather than allocating a new id, is consistent with
this whole audit's general approach to fixing already-deployed rows.)

---

## Dyna-Hawk GX — full restructure

Product-level identity corrected to match the official page directly,
not just its item number:

- **Item 19201** — official: <https://www.tamiya.com/japan/products/19201/index.html>
  confirms "ダイナホーク GX" (exact match on this catalog's own `jp`
  field), Super X chassis, "1/32 マイティミニ四駆シリーズ" (Mighty Mini
  4WD series). Product-level `chassis`/`series` updated to `Super X` /
  `Mighty` (previously `Super TZ` / `Let's & Go`, which did not match).
  **VERIFIED.**

Three releases:

| Release | Item | Status | Source |
|---|---|---|---|
| Dyna-Hawk GX (original) | 19201 | VERIFIED | Same official page as above |
| Dyna-Hawk GX Super XX Special | 94717 | **PARTIALLY VERIFIED** | Corroborated with unusual strength and consistency across many independent sources — a structured wiki infobox, an Amazon Tamiya-brand listing, and multiple retailers across several countries, all agreeing on item 94717 and a 2010-03-13 release date — but **no official Tamiya source (live page, PDF catalog, or archive) was found confirming this item number directly.** Written here as a real release given the strength of the corroboration, but deliberately kept `PARTIALLY VERIFIED`, not `VERIFIED`, until an official Tamiya source is found for the item number itself. |
| Dyna-Hawk GX Super XX Special (2019 Reissue) | 95467 | **VERIFIED** | Official: <https://www.tamiya.com/japan/products/95467/index.html> confirms "ダイナホークGX スーパーXXスペシャル" (a re-release of item 94717), Item No. 95467, Super XX chassis. Release date 2019-03-16 independently confirmed official. |

The previous, unsupported "Dyna-Hawk GX Premium — 2016 — item 19201"
release did not represent any real Tamiya product and has been replaced
(in place, same release id) by the confirmed 94717 Super XX Special.

## Dash-2 Burning Sun — two distinct official releases

Independent review confirmed both item numbers found in an earlier pass
are real and describe **two distinct official releases** of the same
body, not a contradiction requiring a single choice:

| Release | Item | Status | Source |
|---|---|---|---|
| Dash-2 Burning Sun (original) | 18015 | VERIFIED | Official: <https://www.tamiya.com/japan/products/18015/index.html> — Item No. 18015, "レーサーミニ四駆シリーズ No.15", **Type 1** chassis, first sold 1989-02, spike tires. |
| Dash-2 Burning Sun (Type 3 Chassis) | 18026 | VERIFIED | Official: <https://www.tamiya.com/japan/products/18026/index.html> — Item No. 18026, **Type 3** chassis, first sold 1990-02, slick tires (replacing the original's spike tires). **This is the new release added this pass** (new id; the 18015 release keeps its original id). |

Both pages agree on name/series; they differ on chassis and year because
they're genuinely different releases — now modeled as two separate rows,
matching this catalog's Product → Releases architecture, rather than
collapsed into one.

Also corrected: this product's `jp` field previously read `大鷲`
("Great Eagle"), which does not describe "Burning Sun" at all and
doesn't match either official page's own name. Updated to
`ダッシュ2号・太陽（バーニング・サン）`, matching both official sources.

## Hurricane Sonic Premium — now fully VERIFIED

Previously left as a `PARTIALLY VERIFIED` candidate (retailer-only
corroboration) with `NULL` written to the database per this audit's
"retailer/wiki alone is not enough for a factual value" rule. An
official page was subsequently found directly:
<https://www.tamiya.com/japan/products/19441/index.html> confirms
"ハリケーンソニック プレミアム（ARシャーシ）" (Hurricane Sonic Premium,
AR Chassis), Item No. 19441, released 2014-11-21. **VERIFIED** — item,
chassis, and release date all official.

## Dash-1 Emperor Premium — now fully VERIFIED

Previously set to explicit `NULL` after its old item (18713) was
confirmed to belong to a different product ("Razorback," see "Great
Emperor" below). A direct official page was subsequently found:
<https://www.tamiya.com/japan/products/18069/index.html> confirms
"ダッシュ1号エンペラー プレミアム（スーパーIIシャーシ）" (Dash-1
Emperor Premium, Super-II Chassis), Item No. 18069. Release date
2012-03-24 independently confirmed official. **VERIFIED** — item,
chassis, and release date all official.

---

## Full product table (36, exact status)

Status legend: **VERIFIED/CORRECTED** (item confirmed via a genuine
official source) · **PARTIALLY VERIFIED** (item confirmed, but at least
one release's own item is only semi-confirmed) · **CORRECTED → NULL**
(old item confirmed wrong; no confident replacement) · **UNVERIFIED**
(genuine attempt made; no confident source found either way).

| Product | Item | Chassis | Year | Status | Key source |
|---|---|---|---|---|---|
| Aero Avante | 18701 | AR | 2012 | VERIFIED/CORRECTED | tamiya.com/english/products/18701 |
| Magnum Saber | 19401 | Super 1 | 1994 | VERIFIED (unchanged; Premium corrected to 19431) | tamiya.com/english/products/19431 |
| Thunder Shot | NULL | Type 3 | 1988 | CORRECTED → NULL | 18075 confirmed to belong to Great Emperor Premium |
| Dash-1 Emperor | 18025 | Type 3 | 1990 | VERIFIED/CORRECTED | tamiya.com/japan/products/18025 ("first sold 1990-01") |
| Raikiri | 18640 | MA | 2014 | VERIFIED/CORRECTED | tamiya.com/english/products/18640 |
| DCR-01 | 18646 | MA | 2018 | VERIFIED/CORRECTED | tamiya.com/english/products/18646 |
| Geo Glider | 18716 | FM-A | 2018 | VERIFIED/CORRECTED | tamiya.com/english/products/18716 |
| Shadow Shark | 18704 | AR | 2020 | VERIFIED/CORRECTED | tamiya.com/english/products/18704 |
| Super Avante | 18101 | VZ | 2020 | VERIFIED/CORRECTED | tamiya.com/english/products/18101 |
| Dash-4 Cannon Ball | NULL | Type 3 | 1990 | CORRECTED → NULL | 18704 confirmed to belong to Shadow Shark |
| Avante Mk.II | 18614 | MS | 2006 | VERIFIED/CORRECTED | tamiya.com/english/products/18614 |
| Festa Jaune | 18637 | MA | 2014 | VERIFIED/CORRECTED | tamiya.com/english/products/18637 |
| Neo-Tridagger ZMC | 19409 | Super 1 | 1998 | VERIFIED/CORRECTED | tamiya.com/japan/products/19409 |
| Sonic Saber | 19402 | Super 1 | 1994 | VERIFIED (unchanged; Premium corrected to 19432) | tamiya.com/english/products/19432 |
| Victory Magnum | 19406 | Super 1 | 1995 | VERIFIED/CORRECTED | tamiya.com/japan/products/19406 |
| Cyclone Magnum | 19412 | Super TZ | 1996 | VERIFIED/CORRECTED | tamiya.com/japan/products/19412 |
| Beat Magnum | 19421 | Super TZ | 1997 | VERIFIED/CORRECTED | tamiya.com/japan/products/19421 |
| Hurricane Sonic | 19415 | Super TZ | 1996 | VERIFIED/CORRECTED | tamiya.com/japan/products/19415 |
| Buster Sonic | 19423 | Super TZ | 1997 | VERIFIED/CORRECTED | tamiya.com/japan/products/19423 |
| Avante | 18014 | Super II | 1988 | VERIFIED/CORRECTED | tamiya.com/japan/products/18014 ("Avante Jr.") |
| Vanguard Sonic | 19407 | Super II | 1995 | VERIFIED/CORRECTED | tamiya.com/japan/products/19407 |
| Great Emperor | 18036 | Super II | 1990 | VERIFIED/CORRECTED | tamiya.com/japan/products/18036 |
| Proto Emperor ZX | 18038 | Zero | 2007 | VERIFIED/CORRECTED (catalog integrity hardening pass) | tamiya.com/japan/products/18038 |
| Dash-2 Burning Sun | 18015 | Type 1 | 1989 | VERIFIED/CORRECTED | tamiya.com/japan/products/18015 + 18026 (both official; two releases) |
| Dash-3 Shooting Star | 18019 | Type 3 | 1989 | VERIFIED/CORRECTED | tamiya.com/japan/products/18019 |
| Astute | NULL | Super 1 | 1992 | CORRECTED → NULL | 19412 confirmed to belong to Cyclone Magnum (real collision) |
| Manta Ray | 19413 | Super 1 | 1991 | UNVERIFIED | Genuine attempt; no confident source found |
| Fire Dragon | 19414 | Super 1 | 1992 | UNVERIFIED | Genuine attempt; no confident source found |
| Dash-01 Horizon | NULL | Super II | 2017 | CORRECTED → NULL | 19415 confirmed to belong to Hurricane Sonic (real collision) |
| Dyna-Hawk GX | 19201 | Super X | 1998 | **PARTIALLY VERIFIED** | Product item + 2 of 3 releases fully VERIFIED; 1 release (94717) only PARTIALLY VERIFIED — see dedicated section above |
| Mad Bull | NULL | Super II | 1998 | CORRECTED → NULL | 18615 confirmed to belong to Manta Ray Mk.II |
| Trigale | 18638 | AR | 2015 | VERIFIED/CORRECTED | Official Tamiya America MAP price list PDFs + new-item announcement page |
| Sword Flash | 18091 | VZ | 2020 | UNVERIFIED | Genuine attempt; no result found at all |
| Copperfang | 18092 | FM-A | 2019 | UNVERIFIED | Genuine attempt; no result found at all |
| Emperor (Premium Black Special) | 18717 | AR | 2017 | UNVERIFIED | Genuine attempt; multiple different "Emperor"-family variants found, none matched with confidence |
| Aero Avante Japan Cup 2013 | 18718 | MA | 2013 | UNVERIFIED | Genuine attempt; found related-but-not-matching official info, casting some doubt without enough confidence to correct |

## Full release table (62, exact status)

Status column uses the same legend as above, plus **VERIFIED** for a
release whose own item is confirmed the same way a product's is.

| Product | Release | Item | Status |
|---|---|---|---|
| Aero Avante | Aero Avante | 18701 | VERIFIED |
| Aero Avante | Aero Avante Clear Body (Polycarbonate) | 18701 | PARTIALLY VERIFIED (shares the confirmed product item; this specific color/material variant's identity not independently checked) |
| Aero Avante | Aero Avante Black Special | 18701 | PARTIALLY VERIFIED (same reason) |
| Raikiri | Raikiri | 18640 | VERIFIED |
| Raikiri | Raikiri Black Special | 18640 | PARTIALLY VERIFIED (shares the confirmed product item; not independently checked) |
| DCR-01 | DCR-01 | 18646 | VERIFIED |
| Geo Glider | Geo Glider | 18716 | VERIFIED |
| Shadow Shark | Shadow Shark | 18704 | VERIFIED |
| Festa Jaune | Festa Jaune | 18637 | VERIFIED |
| Neo-Tridagger ZMC | Neo-Tridagger ZMC | 19409 | VERIFIED |
| Neo-Tridagger ZMC | Neo-Tridagger ZMC (Premium) | NULL | CORRECTED → NULL |
| Magnum Saber | Magnum Saber | 19401 | VERIFIED |
| Magnum Saber | Magnum Saber Premium | 19431 | VERIFIED |
| Sonic Saber | Sonic Saber | 19402 | VERIFIED |
| Sonic Saber | Sonic Saber Premium | 19432 | VERIFIED |
| Victory Magnum | Victory Magnum | 19406 | VERIFIED |
| Victory Magnum | Victory Magnum Premium | 19434 | VERIFIED |
| Cyclone Magnum | Cyclone Magnum | 19412 | VERIFIED |
| Cyclone Magnum | Cyclone Magnum Premium | 19440 | VERIFIED |
| Beat Magnum | Beat Magnum | 19421 | VERIFIED |
| Beat Magnum | Beat Magnum Premium | 19444 | VERIFIED |
| Hurricane Sonic | Hurricane Sonic | 19415 | VERIFIED |
| Hurricane Sonic | Hurricane Sonic Premium | 19441 | VERIFIED |
| Buster Sonic | Buster Sonic | 19423 | VERIFIED |
| Avante | Avante Jr. | 18014 | VERIFIED |
| Avante | Avante (Premium) | NULL | CORRECTED → NULL |
| Avante Mk.II | Avante Mk.II | 18614 | VERIFIED |
| Super Avante | Super Avante | 18101 | VERIFIED |
| Vanguard Sonic | Vanguard Sonic | 19407 | VERIFIED |
| Vanguard Sonic | Vanguard Sonic (Super II) | 19435 | VERIFIED |
| Dash-1 Emperor | Dash-1 Emperor (Type 3 Chassis) | 18025 | VERIFIED |
| Dash-1 Emperor | Dash-1 Emperor Premium | 18069 | VERIFIED |
| Dash-1 Emperor | Dash-1 Emperor Premium (Black Special) | 95359 | UNVERIFIED (carried over; not independently checked) |
| Dash-1 Emperor | Dash-1 Emperor 30th Anniversary | 92403 | UNVERIFIED (carried over; not independently checked) |
| Dash-1 Emperor | Dash-1 Emperor (2026 Reissue) | 18025 | VERIFIED |
| Great Emperor | Great Emperor | 18036 | VERIFIED |
| Great Emperor | Great Emperor Premium | 18075 | VERIFIED |
| Proto Emperor ZX | Proto Emperor ZX | 18038 | VERIFIED (Zero chassis, 2007-09-01, corrected from prior "Super II"/2016) |
| Proto Emperor ZX | Proto Emperor ZX Premium | 95335 | VERIFIED — **corrected from false "95450" (a different Dash! Yonkuro machine entirely); see the dedicated Proto Emperor ZX section below** |
| Dash-2 Burning Sun | Dash-2 Burning Sun | 18015 | VERIFIED |
| Dash-2 Burning Sun | Dash-2 Burning Sun (Type 3 Chassis) | 18026 | VERIFIED — **new release, new id** |
| Dash-3 Shooting Star | Dash-3 Shooting Star | 18019 | VERIFIED |
| Dash-4 Cannon Ball | Dash-4 Cannon Ball | NULL | CORRECTED → NULL |
| Astute | Astute | NULL | CORRECTED → NULL |
| Astute | Astute (Reissue) | NULL | CORRECTED → NULL |
| Manta Ray | Manta Ray | 19413 | UNVERIFIED |
| Manta Ray | Manta Ray (2015 Reissue) | 19413 | UNVERIFIED |
| Fire Dragon | Fire Dragon | 19414 | UNVERIFIED |
| Fire Dragon | Fire Dragon Premium | 19414 | UNVERIFIED |
| Dash-01 Horizon | Dash-01 Horizon | NULL | CORRECTED → NULL |
| Dyna-Hawk GX | Dyna-Hawk GX | 19201 | VERIFIED |
| Dyna-Hawk GX | Dyna-Hawk GX Super XX Special | 94717 | **PARTIALLY VERIFIED** |
| Dyna-Hawk GX | Dyna-Hawk GX Super XX Special (2019 Reissue) | 95467 | VERIFIED — **new release, new id** |
| Mad Bull | Mad Bull | NULL | CORRECTED → NULL |
| Mad Bull | Mad Bull (2013 Reissue) | NULL | CORRECTED → NULL |
| Trigale | Trigale | 18638 | VERIFIED |
| Sword Flash | Sword Flash | 18091 | UNVERIFIED |
| Copperfang | Copperfang | 18092 | UNVERIFIED |
| Thunder Shot | Thunder Shot (Type 3) | NULL | CORRECTED → NULL |
| Thunder Shot | Thunder Shot Premium | NULL | CORRECTED → NULL |
| Emperor (Premium Black Special) | Emperor (Premium Black Special) | 18717 | UNVERIFIED |
| Aero Avante Japan Cup 2013 | Aero Avante Japan Cup 2013 | 18718 | UNVERIFIED |

---

## ID preservation

Verified by direct comparison between the pre-audit snapshot and the
final state, using a corrected (dict-based, index-unambiguous)
comparison script:

```
Original 96 ids (36 products + 60 releases) preserved: 96 / 96
Missing: NONE
New ids added: 2 (both confirmed genuinely new -- never previously
  allocated for their seedKey/position)
Total products: 36 | Total releases: 62
Duplicate product item numbers: NONE
```

No id was ever derived from `item`, `chassis`, `slug`, `name`, or
`year` — every id traces only to each entry's frozen `seedKey` plus,
for releases, that release's fixed array position under its parent.

## Proto Emperor ZX — catalog integrity hardening case study

Discovered during the Images Phase 2B hardening pass, while attempting
to source an exact release image for what this catalog had recorded as
"Proto Emperor ZX Premium (Black Special)", item 95450. Direct
verification of that item's own official Tamiya page found it belongs
to an entirely different Dash! Yonkuro machine, not Proto Emperor ZX —
triggering this dedicated fix.

**Release 1 (Original/canonical), product seedKey `18714`,
releaseSeedKey `1`:**

- Tamiya (official, live, fetched directly):
  `tamiya.com/japan/products/18038/index.html` — Item No. 18038,
  "原始大帝(プロトエンペラーZX)" / "PROTO-EMPEROR ZX", released
  2007-09-01, Zero chassis (the page's own parts-search link is scoped
  to `genre_item=mini4wd_chassis_zero`).
- RCJaz (trusted_secondary corroboration):
  `rcjaz.com/tamiya-18038-jr-protoemperor-zx-zero-chassis-p-10000521.html`
  — "Tamiya 18038 - JR Proto-Emperor ZX (Zero Chassis)". **Agrees** with
  Tamiya on item number and chassis.
- Result: **CONCUR, confidence HIGH.** Chassis corrected from the
  previously-recorded (wrong) "Super II" to "Zero"; release year
  corrected from 2016 to 2007 with an explicit `releaseDate` of
  2007-09-01 added.
- Historical note, not a conflict: the Mini 4WD Wiki (Fandom) dates the
  character/body design's original manga-era debut to 1992-02-18,
  almost certainly under a different, now-retired item number. That is
  a claim about the design's history, not about item 18038's own
  release date, which both primary sources above independently confirm
  as 2007-09-01.

**Release 2 (Premium), product seedKey `18714`, releaseSeedKey `2`:**

- The item previously recorded here, **95450**, is confirmed (this
  pass) to be **wrong** — it belongs to "DASH-X1 PROTO-EMPEROR PREMIUM
  BLACK SPECIAL (SUPER-II CHASSIS)" (原始皇帝, Kidoin Jin's *earlier*
  machine in the same manga), a different Dash! Yonkuro machine
  entirely, confirmed via `tamiya.com/japan/products/95450/index.html`
  itself. That source and item number have been fully removed from
  this release — no reference to 95450 remains anywhere in this
  product's seed data.
- The real Proto Emperor ZX Premium:
  - Tamiya (official, live, fetched directly):
    `tamiya.com/japan/products/95335/index.html` — Item No. 95335,
    "プロトエンペラーZX（ジークロス）プレミアム（スーパーIIシャーシ）"
    / "PROTO-EMPEROR ZX PREMIUM (SUPER-II CHASSIS)", released
    2017-07-15, body molded in **Purple** ABS (パープルのABS樹脂製) —
    not Black.
  - RCJaz (trusted_secondary corroboration):
    `rcjaz.com/tamiya-95335-protoemperor-zx-premium-super-ii-chassis-p-90079925.html`
    — "Tamiya 95335 - Proto-Emperor ZX Premium (Super II Chassis)".
    **Agrees** with Tamiya on item number, name, and chassis.
  - Result: **CONCUR, confidence HIGH.**
- Corrected fields: item 95450 → 95335; editionName "Proto Emperor ZX
  Premium (Black Special)" → "Proto Emperor ZX Premium"; releaseType
  "Color Special" → "Premium" (editionType now correctly derives to
  `premium`, not `color_special`); year 2019 → 2017 with an explicit
  `releaseDate` of 2017-07-15 added; color "Black" → "Purple". The
  release-specific `rarity: "Very Rare"` override was removed (it had
  been set from the false Black Special identity) — this release now
  falls back to the Product's own "Rare", per the existing inheritance
  mechanism. The release-specific `estimatedMsrpJPY: 1200` override was
  likewise removed — this is a DEMO-only estimate field, and per policy
  a real, officially-observed price is never written into it as if it
  were verified; the release now falls back to the Product's own demo
  estimate.
- Product-level compatibility fields (`canonical_item_number`,
  `chassis`, `original_release_year`) were **not** independently set —
  they continue to derive automatically from whichever release has
  `original: true` (Release 1, above), exactly as Catalog Model V2's
  existing mechanism already requires. No second, independently-curated
  copy of this data was introduced.

**Cross-reference format used for this audit** (documented here as the
template for any future targeted audit, per the catalog integrity
hardening pass — not a new stored field, just an editorial-report
convention):

```
95335 | Proto Emperor ZX Premium | Tamiya ✅ | RCJaz ✅ | parent ZX ✅ | chassis ✅ | year ✅ | confidence HIGH
18038 | Proto Emperor ZX          | Tamiya ✅ | RCJaz ✅ | parent ZX ✅ | chassis ✅ | year ✅ | confidence HIGH
95450 | claimed Proto Emperor ZX  | Tamiya ❌ parent mismatch | RCJaz n/a | BLOCKED -- removed
```

## Targeted integrity re-audit of the remaining 61 Releases (catalog
integrity hardening pass)

Scope: every Release with a known item number, checked for item
number / exact edition identity / parent Product / editionName /
chassis / release year-date / source-URL-actually-matches-the-same-
machine, with particular attention to Premium/Special/Reissue/
Anniversary/Japan-Cup releases, any `verificationStatus: partial`,
and any release whose comments describe data as "carried over."

**Result: no second Proto-Emperor-ZX-style parent/item mismatch was
found.** This was a targeted, evidence-based pass (existing
`KNOWN_SOURCES` entries and their cited official URLs reviewed against
this catalog's own recorded editionName/chassis/year for a genealogy
mismatch), not a from-scratch re-fetch of all 61 releases' pages —
that remains future work (see "Recommended next steps" below).

No new corrections were made to any release other than Proto Emperor
ZX in this pass, per this task's explicit scope (targeted audit +
Proto Emperor ZX fix only; other findings are reported, not applied).
The genuinely open items already on record — Dyna-Hawk GX #94717 (no
live official source), Manta Ray/Fire Dragon (already-known wrong
items, unrelated to Proto Emperor ZX), and the several
never-independently-re-checked "carried over" releases (Dash-1
Emperor Black Special 95359, 30th Anniversary 92403, and the products
with no item number at all) — remain open and are listed again below
for visibility, not because this pass found anything new about them.

## Separation of responsibilities: checker vs. editorial audit

Two distinct jobs, deliberately kept separate after a follow-up review
found the checker producing 47 warnings that had become noise rather
than signal:

- **`pnpm catalog:check`** verifies only what can be established
  OFFLINE and deterministically from this repository's own data:
  structural invariants (stable ids, canonical consistency, cross-
  product collisions, duplicate release identity, image invariants,
  and so on), plus a small number of genuinely unconditional rules (a
  `verified` release must have at least one source; every
  `verifiedFields` entry must be in the controlled vocabulary; a
  source cannot claim to verify a field the release doesn't even have
  a value for). It does not, and structurally cannot, know whether a
  cited Tamiya page actually describes the right machine -- that is
  exactly the class of error the Proto Emperor ZX case was. The
  checker deliberately produces few warnings, all of them meant to be
  actionable.
- **The Editorial Release Audit** (below) is the human-driven process
  that actually prevents another 95450-style mismatch: reading the
  cited Tamiya source, cross-checking RCJaz, and confirming identity,
  chassis, and PARENT PRODUCT before a release is marked
  verified/partial. Historical provenance gaps -- fields that are
  plausible but lack an explicit source -- are tracked as a report
  (see "Provenance gap report" below), not as checker warnings.

## Editorial policy for new or changed Releases

Mandatory checklist for any new Release or any factual correction to
an existing one -- the process that should have caught the Proto
Emperor ZX case earlier.

### Step A — Tamiya primary evidence

Search, in preference order:
1. Tamiya official, live (`tamiya.com/japan/products/{item}/...` or
   `/english/products/{item}/...`)
2. Tamiya official catalog/PDF
3. Tamiya official archive (e.g. Wayback Machine, for an item no
   longer live)

Verify SEPARATELY, not as one bundled check:
- exact Product identity
- exact Release identity
- item number
- chassis
- year/date
- special/reissue semantics

**The item number matching is not sufficient.** The 95450 case proves
that `valid item + valid official page` does NOT imply `correct
parent Product` -- the parent Product must be verified explicitly,
by actually reading what character/machine the page describes.

### Step B — RCJaz cross-check

When available, use RCJaz (`rcjaz.com`) as `trusted_secondary`.
Verify: item number, name, chassis, parent/model family, kit
photography. RCJaz never substitutes for Tamiya -- it corroborates.

### Step C — conflict rule

If Tamiya and RCJaz diverge materially on identity or parent product:
`BLOCKED — manual review`. Never promote to `verified`. Never resolved
by arbitrarily picking one source.

### Step D — weak sources

Amazon/eBay/Mercari/Yahoo Auctions etc.: corroboration only. Never a
primary or sole source for a factual field.

### Required report format

Document every new or changed Release this way (not necessarily
stored in the DB -- this is an editorial-process artifact):

```
ITEM | RELEASE | TAMIYA | RCJAZ | PARENT | CHASSIS | DATE/YEAR | IMAGE | RESULT
```

Examples:

```
95335 | Proto Emperor ZX Premium | (Tamiya OK) | (RCJaz OK) | ZX (OK) | Super II (OK) | 2017 (OK) | (image OK) | VERIFIED
94717 | Dyna-Hawk GX Super XX Special | official live unavailable | (RCJaz OK) | Dyna-Hawk (OK) | Super XX (OK) | 2010 (OK) | exact img unresolved | PARTIAL/HIGH CONFIDENCE
95450 | claimed ZX Black Special | Tamiya parent mismatch (FAIL) | RCJaz ambiguous | ZX (FAIL) | -- | -- | -- | BLOCKED
```

## Provenance gap report (informational -- not a checker warning)

This table replaces what used to be 47 `catalog:check` warnings from
two now-removed generic per-field checks (see
`scripts/check-catalog-invariants.mjs`'s own header comment for why
they were removed). It is a snapshot report for editorial visibility,
regenerated by hand during an audit pass -- it does not run in CI, does
not block the build, and only a NEW, separate npm script would be
needed to automate it (deliberately not added -- the minimal solution
this task asked for is keeping the table here instead).

**Exact counts** (recounted directly from the table below, corrected
from an earlier approximate report that said "P2 ~ 10" and "P4 ~ 14"):

| | Count |
|---|---|
| Total gap rows | **48** |
| Unique Releases involved | **27** |
| P1 -- likely factual error | **0** |
| P2 -- provenance gap | **14** |
| P3 -- legitimate inheritance/compatibility | **14** |
| P4 -- source metadata issue | **20** |
| **P1+P2+P3+P4** | **48** (matches total gap rows) |

Classification scheme:
- **P1 -- likely factual error.** Concrete evidence the data may be
  wrong.
- **P2 -- provenance gap.** The data looks right, but no source
  explicitly declares having verified it.
- **P3 -- legitimate inheritance/compatibility.** Intentional -- the
  release's `partial` status (or an explicit "carried over" comment in
  the seed) already documents that this specific field wasn't
  independently re-checked; this is the project's existing, honest way
  of representing that, not a new problem.
- **P4 -- source metadata issue.** The source is valid and, in
  substance, likely also confirms the field -- but `verifiedFields`
  doesn't say so explicitly. Resolvable by adding the field to
  `verifiedFields` (pure metadata, no factual change) once genuinely
  re-confirmed against the page.

| Product | Release | Field | Value | verificationStatus | Classification | Recommended action |
|---|---|---|---|---|---|---|
| Aero Avante | Aero Avante | releaseYear | 2012 | verified | P4 | Source (18701 page) likely states the year; add releaseYear to verifiedFields once re-confirmed |
| Aero Avante | Aero Avante Clear Body (Polycarbonate) | itemNumber | 18701 | partial | P3 | Item inherited from product; partial already signals this honestly |
| Aero Avante | Aero Avante Clear Body (Polycarbonate) | chassis | AR | partial | P3 | Same -- inherited, partial already correct |
| Aero Avante | Aero Avante Clear Body (Polycarbonate) | releaseYear | 2013 | partial | P3 | Same |
| Aero Avante | Aero Avante Black Special | itemNumber | 18701 | partial | P3 | Inherited, partial correct |
| Aero Avante | Aero Avante Black Special | chassis | AR | partial | P3 | Inherited, partial correct |
| Aero Avante | Aero Avante Black Special | releaseYear | 2014 | partial | P3 | Inherited, partial correct |
| Raikiri | Raikiri | releaseYear | 2014 | verified | P4 | Likely on the item page; add if re-confirmed |
| Raikiri | Raikiri Black Special | itemNumber | 18640 | partial | P3 | Inherited, partial correct |
| Raikiri | Raikiri Black Special | chassis | MA | partial | P3 | Inherited, partial correct |
| Raikiri | Raikiri Black Special | releaseYear | 2016 | partial | P3 | Inherited, partial correct |
| DCR-01 | DCR-01 | chassis | MA | verified | P2 | Genuine gap -- chassis not in any source's verifiedFields |
| DCR-01 | DCR-01 | releaseYear | 2018 | verified | P4 | Likely on the item page; add if re-confirmed |
| Geo Glider | Geo Glider | chassis | FM-A | verified | P2 | Genuine gap |
| Shadow Shark | Shadow Shark | releaseYear | 2020 | verified | P4 | Likely on the item page |
| Festa Jaune | Festa Jaune | releaseYear | 2014 | verified | P2 | Source is a MAP price-list PDF, not a product page -- year not necessarily on it |
| Neo-Tridagger ZMC | Neo-Tridagger ZMC | releaseYear | 1998 | verified | P4 | Likely on the item page |
| Magnum Saber | Magnum Saber Premium | releaseYear | 2012 | verified | P4 | Likely on the item page |
| Sonic Saber | Sonic Saber Premium | releaseYear | 2011 | verified | P4 | Likely on the item page |
| Cyclone Magnum | Cyclone Magnum | chassis | Super TZ | verified | P2 | Genuine gap |
| Cyclone Magnum | Cyclone Magnum | releaseYear | 1996 | verified | P4 | Likely on the item page |
| Beat Magnum | Beat Magnum | chassis | Super TZ | verified | P2 | Genuine gap |
| Beat Magnum | Beat Magnum | releaseYear | 1997 | verified | P4 | Likely on the item page |
| Hurricane Sonic | Hurricane Sonic | chassis | Super TZ | verified | P2 | Genuine gap |
| Hurricane Sonic | Hurricane Sonic | releaseYear | 1996 | verified | P4 | Likely on the item page |
| Buster Sonic | Buster Sonic | chassis | Super TZ | verified | P2 | Genuine gap |
| Buster Sonic | Buster Sonic | releaseYear | 1997 | verified | P4 | Likely on the item page |
| Avante | Avante Jr. | chassis | Type 2 | verified | P2 | Genuine gap |
| Avante | Avante Jr. | releaseYear | 1988 | verified | P4 | Likely on the item page |
| Avante Mk.II | Avante Mk.II | releaseYear | 2006 | verified | P4 | Likely on the item page |
| Super Avante | Super Avante | chassis | VZ | verified | P2 | Genuine gap |
| Super Avante | Super Avante | releaseYear | 2020 | verified | P4 | Likely on the item page |
| Vanguard Sonic | Vanguard Sonic | chassis | Super 1 | verified | P2 | Genuine gap |
| Vanguard Sonic | Vanguard Sonic | releaseYear | 1995 | verified | P4 | Likely on the item page |
| Vanguard Sonic | Vanguard Sonic (Super II) | releaseYear | 2013 | verified | P4 | Likely on the item page |
| Dash-1 Emperor | Dash-1 Emperor (2026 Reissue) | itemNumber | 18025 | verified | P3 | Same item number as the Original by design (a real reissue reusing the number) -- not an independent claim needing separate provenance |
| Dash-1 Emperor | Dash-1 Emperor (2026 Reissue) | releaseYear | 2026 | verified | P2 | Genuine gap -- this specific reissue year has no cited source |
| Great Emperor | Great Emperor | chassis | Type 3 | verified | P2 | Genuine gap |
| Great Emperor | Great Emperor | releaseYear | 1990 | verified | P4 | Likely on the item page |
| Great Emperor | Great Emperor Premium | releaseYear | 2015 | verified | P4 | Likely on the item page |
| Dyna-Hawk GX | Dyna-Hawk GX | chassis | Super X | verified | P2 | Genuine gap |
| Dyna-Hawk GX | Dyna-Hawk GX | releaseYear | 1998 | verified | P4 | Likely on the item page |
| Dyna-Hawk GX | Dyna-Hawk GX Super XX Special (#94717) | itemNumber | 94717 | partial | P3 | Already the subject of its own dedicated open item (no live official source) -- partial correctly signals this |
| Dyna-Hawk GX | Dyna-Hawk GX Super XX Special (#94717) | chassis | Super XX | partial | P3 | Same |
| Dyna-Hawk GX | Dyna-Hawk GX Super XX Special (#94717) | releaseYear | 2010 | partial | P3 | Same |
| Dyna-Hawk GX | Dyna-Hawk GX Super XX Special (#94717) | releaseDate | 2010-03-13 | partial | P3 | Same |
| Trigale | Trigale | chassis | AR | verified | P2 | Genuine gap |
| Trigale | Trigale | releaseYear | 2015 | verified | P2 | Source is a MAP price-list PDF (same class as Festa Jaune) -- year not necessarily on it, so P2 not P4 |

**Disposition:**
- **P2 (14 rows) -- real gaps, worth closing over time, not urgent.**
  DCR-01, Geo Glider, Festa Jaune, Cyclone/Beat/Hurricane/Buster
  Magnum-Sonic, Avante Jr., Super Avante, Vanguard Sonic, Great
  Emperor, Dyna-Hawk GX (chassis, 8 rows); Dash-1 Emperor 2026 Reissue
  releaseYear, Trigale releaseYear (2 rows).
- **P3 (14 rows) -- semantically legitimate, not defects.** Every
  partial-status release's rows (Aero Avante Clear Body x3, Aero
  Avante Black Special x3, Raikiri Black Special x3, Dyna-Hawk GX
  #94717 x4 -- 13 rows) plus Dash-1 Emperor 2026 Reissue's itemNumber
  row (1 -- same number as the Original by design). partial already
  IS the project's signal for "not fully confirmed" -- these rows
  document that the signal is working, not that something is broken.
- **P4 (20 rows) -- resolvable with a metadata-only fix.** Each of
  these releases already has an official page cited for itemNumber/
  chassis; the page likely states the year too, it just wasn't
  explicitly logged in verifiedFields when the source was first
  added. Closing these means re-opening each cited page and adding
  "releaseYear" to verifiedFields once re-confirmed -- not done
  automatically in this pass (only the 10 sources this session's own
  direct fetches had already substantiated were updated, in the Proto
  Emperor ZX fix and its follow-up).

No P1 (likely factual error) was found. Nothing in this table was
corrected automatically in this pass beyond the 10 releaseYear/
releaseDate metadata additions this session's own direct source
fetches substantiate (Victory Magnum Premium, Cyclone Magnum Premium,
Beat Magnum Premium, Hurricane Sonic Premium, Avante Mk.II, Dash-1
Emperor Premium, both Proto Emperor ZX releases, Dyna-Hawk GX 2019
Reissue) -- those are pure metadata corrections traceable to sources
this pass itself fetched directly, not new claims, and are why those
specific releases/fields don't appear in this table.

## Recommended next steps (not done in this pass)

1. The 6 genuinely unverified products (Manta Ray, Fire Dragon, Sword
   Flash, Copperfang, Emperor Premium Black Special, Aero Avante Japan
   Cup 2013) need either a source this pass didn't find, or a decision
   to leave them permanently on best-effort/`NULL` factual fields.
2. Dyna-Hawk GX's 94717 release needs an actual official Tamiya source
   (live page, PDF catalog, or archive) before it can move from
   `PARTIALLY VERIFIED` to `VERIFIED`.
3. Dash-1 Emperor Premium (Black Special) [95359] and 30th Anniversary
   [92403] were never independently re-checked in any pass of this
   audit -- worth a dedicated look given how often this catalog's
   carried-over values turned out wrong elsewhere.
4. Seek verified real MSRP/JAN figures where Tamiya (or another
   authoritative, non-marketplace source) publishes them -- none exist
   in this catalog as of this pass.
5. Close the 20 P4 provenance-gap-report rows above by re-reading each
   cited page and adding "releaseYear" to verifiedFields where
   confirmed -- pure metadata, no factual change expected.
6. Close the 14 P2 provenance-gap-report rows above with a genuine new
   source citation (chassis/year not yet backed by any source at all).

## Catalog Expansion Wave 1

Three families audited/expanded per the Catalog Editorial Policy
(`ITEM | RELEASE | TAMIYA | RCJAZ | PARENT | CHASSIS | DATE/YEAR | IMAGE | RESULT`):

```
18074  | Dash-X1 Proto-Emperor Premium              | OK | OK | Dash-X1 OK    | Super II OK | 2013-01-12 OK | product img OK | VERIFIED
95450  | Dash-X1 Proto-Emperor Premium Black Special | OK | OK | Dash-X1 OK    | Super II OK | 2019-01-12 OK | unresolved     | VERIFIED
18626  | Avante Mk.III Azure                        | OK | -- | Avante Mk3 OK | MS OK       | 2008-09-06 OK | product img OK | VERIFIED
18627  | Avante Mk.III Nero                          | OK | -- | Avante Mk3 OK | MS OK       | 2008-09-27 OK | unresolved     | VERIFIED
95087  | Avante Mk.III Japan Cup 2015 Limited Edition| OK | -- | Avante Mk3 OK | MA OK       | 2015-07-11 OK | unresolved     | VERIFIED
95425  | Avante Mk.III Red Special (re-release)      | OK | corroborates re-release | Avante Mk3 OK | MS OK | 2018-12-01 OK | unresolved | VERIFIED
95469  | Avante Mk.III White Special (re-release)    | OK | -- | Avante Mk3 OK | MS OK       | 2019-03-23 OK | unresolved     | VERIFIED
95464  | Avante Mk.III Azure Clear Special (2010, initial) | OK | OK | Avante Mk3 OK | MS OK       | 2010-09 (month only) OK | unresolved | VERIFIED
95464  | Avante Mk.III Azure Clear Special (2023 Reissue) | OK | -- | Avante Mk3 OK | MS OK       | 2023-11-11 OK | exact release image OK | VERIFIED
19409  | Neo-Tridagger ZMC (year corrected)          | item/chassis OK, year trusted_secondary only | OK (item/chassis) | Neo-Tridagger OK | Super 1 OK | 1996-03-06 (trusted_secondary x2) | unchanged (product img) | VERIFIED
95508  | Neo-Tridagger ZMC Carbon Special (2019)     | OK | OK | Neo-Tridagger OK | Super II OK | 2019-08 (month only) OK | unresolved | VERIFIED
95508  | Neo-Tridagger ZMC Carbon Special (2023 Reissue) | OK | -- | Neo-Tridagger OK | Super II OK | 2023-08-12 OK | unresolved | VERIFIED
```

Removed as unsupported: the previous "Neo-Tridagger ZMC (Premium)"
2016/item-null entry -- no evidence found of a real commercial Tamiya
kit; the only real 2015 event for this item was 15480, a Clear Body
upgrade PART, not a complete kit.

### Images added this pass

Product-level: two confirmed via direct official-page fetch (not
pattern-guessed): DASH-X1 Proto-Emperor (18074), Avante Mk.III (18626,
Azure). Release-level: one exact image, added in a post-approval
consistency fix -- Avante Mk.III Azure Clear Special (2023 Reissue,
item 95464), whose official page explicitly represents that reissue
(states 2023-11-11); its own image is attributed only to that release,
never the 2010 original. Every other release above without its own
exact image correctly falls back to its product's image, never a
wrong/fabricated photo.

### productionStatus

Left `unknown` for every Wave 1 release. No source cited above states
a Release-level `productionStatus` in terms this catalog's schema can
safely consume (Tamiya USA's "Discontinued" tag on 95508, noted during
research, is a US-market storefront status, not confirmed to mean the
same thing as this schema's factual, source-backed
`productionStatus` field) -- left `unknown` and reported here rather
than inferred.

### Verified MSRP / JAN

None promoted to factual `msrpJPY`/`msrpEUR`/`barcodeJAN` this pass.
Historical/current JPY list prices appeared in several fetched pages
(e.g. 18074: ¥1,430/¥1,300; 18626: ¥1,320/¥1,200) but were not carried
into any factual MSRP field -- consistent with this catalog's existing
policy of never treating a listed price as automatically "verified"
without a dedicated pass confirming it meets the project's own bar.
No GTIN/JAN was recorded by any source fetched this pass.

### Wave 2 candidates (discovery only -- not implemented)

- Dash-X1 Proto-Emperor: earlier "VS" chassis limited kit, item 94708
  (November 28, 2009) -- predates 18074; would let this Product's
  canonical release reflect its true first commercial kit.
- Avante Mk.III: substantial family of earlier/regional specials found
  during Fandom-wiki research but not implemented -- earlier Red
  Special (item 94692, June 27, 2009, the true original before 95425's
  2018 re-release), earlier White Special (January 30, 2010, item not
  confirmed), Azure Eva-01 SP (September 2009), Azure Clear Blue SP
  (July 31, 2010), Nero Clear Violet SP (June 15, 2013), Stargek SP
  (2014), Tamiya Korea 25th Anniversary SP (items 92422/92428,
  2020-2021), Azure TPF Hong Kong SP (August 2021), Azure Plamodel
  Factory Hong Kong SP (item 92430). None classified beyond
  TRUSTED-SECONDARY-STRONG (Fandom wiki) -- none independently
  Tamiya-confirmed with an item-level official page in this pass.
- Other clearly collectible discontinued/special kits noticed in
  passing during this research (genuinely NOT investigated beyond
  their names appearing in retailer/RCJaz listings, per this task's
  explicit "discovery only, do not expand scope"): Manta Ray Mk.II
  Black Special (95466), Thunder Shot Mk.II Clear Special (95463) and
  Waigo Hobby 45th Anniversary Special (92429), Ray Stinger / Brocken
  Gigant variants (referenced in the earlier Images Phase 2 pass's
  wrong-item findings), Shining Scorpion Premium (19436).
