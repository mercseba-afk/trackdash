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
| Proto Emperor ZX | 18038 | Super II | 2016 | VERIFIED/CORRECTED | tamiya.com/japan/products/18038 |
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
| Proto Emperor ZX | Proto Emperor ZX | 18038 | VERIFIED |
| Proto Emperor ZX | Proto Emperor ZX Premium (Black Special) | 95450 | VERIFIED |
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
   audit — worth a dedicated look given how often this catalog's
   carried-over values turned out wrong elsewhere.
4. Seek verified real MSRP/JAN figures where Tamiya (or another
   authoritative, non-marketplace source) publishes them — none exist
   in this catalog as of this pass.
