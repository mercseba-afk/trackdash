# TrackDash — Catalog Integrity Audit

## Scope and honesty note (read this first)

This audit was run against **official Tamiya sources only**
(`www.tamiya.com`'s English/global AND Japanese product pages, plus
official Tamiya America PDF price lists hosted on `tamiyausa.com`;
`tamiyausa.com`'s own product pages block automated access). Every
correction below reflects an actual fetched official page, never a
marketplace listing used as the deciding source — retailer/wiki pages
were used only as *leads* to find the right official page to verify
against, and are called out explicitly wherever a correction rests on
retailer corroboration alone because a direct official fetch wasn't
achieved.

**Methodology (revised mid-audit, applied to every correction from
"Raikiri" onward and retroactively consistent with the earlier ones):**
for each record, search by item number AND by name, compare the result
against item number + name + chassis + year together, and never
conclude `UNVERIFIED` without first attempting a live search — a record
is not classified as unverified just because this catalog's existing
seed data looked suspicious. Tamiya's official catalog is the deciding
source; the existing TrackDash seed is a hypothesis to check, not a fact.

**Coverage is genuinely partial, not a completed 36/36 audit.** Of this
catalog's 36 products, **14 were individually researched** against real
Tamiya sources this pass (listed in full below). The remaining **22
products / releases were not individually checked in this pass** and are
marked `UNVERIFIED` honestly rather than assumed correct — continuing
this audit for the remaining products is real, valuable follow-up work,
not a formality.

**The error rate keeps climbing the more of this catalog gets checked**:
13 of the 14 products checked needed a correction (the sole exception,
Magnum Saber's original release, was already correct). Several errors
follow a pattern worth naming explicitly: this catalog's item numbers
frequently turn out to belong to a *different* real Tamiya product one
or two numbers away from the correct one (Raikiri/DCR-01, Geo Glider/
Shadow Shark/Super Avante/Dash-4 Cannon Ball, Festa Jaune/Shooting Proud
Star, Neo-Tridagger ZMC/Victory Magnum Premium) — consistent with a
systematic off-by-a-few-numbers error somewhere in how the original seed
was generated, not isolated typos. Whoever continues this audit should
expect the same pattern and should specifically watch for cross-product
collisions (correcting product A to a verified item number that product
B in this catalog already happens to be using).

## Totals

| | Count |
|---|---|
| Products individually audited this pass | 14 / 36 |
| Products corrected | 13 |
| Products confirmed correct as-is (no change needed) | 0 whole products (Magnum Saber's and Sonic Saber's ORIGINAL releases were already correct; every product needed at least one field fixed somewhere) |
| Products left `UNVERIFIED` (not checked this pass) | 22 / 36 |
| Releases individually audited this pass | ~21 / 60 (releases belonging to the 14 audited products) |
| Releases corrected | 22 |
| Releases left `UNVERIFIED` (not checked this pass) | ~39 / 60 |
| Pseudo-JAN barcodes removed | 60 / 60 (all — see below) |
| Verified-real MSRP figures retained | 0 |
| Estimated/demo MSRP values cleared from the factual DB columns | 60 / 60 releases |
| Item numbers corrected to a verified real value | 14 (9 products + 5 release-only: Magnum Saber Premium, Victory Magnum Premium, Sonic Saber Premium, Vanguard Sonic Premium, plus Avante Mk.II's own release) |
| Item numbers set to `NULL` (no confident replacement found) | 2 products (+ their 3 releases) — Thunder Shot (×2 releases), Dash-4 Cannon Ball |
| Slugs affected | 0 deployed slugs changed in value (see "Slug decoupling" below) — the *generation formula* changed for future correctness |
| Deployed UUIDs preserved | **96 / 96**, byte-identical, re-verified after every correction (see "ID preservation" below) |

## ID preservation

Verified by direct comparison, twice: once immediately after the
`seedKey` refactor (before any factual correction), and again after every
correction in this document was applied. Method: dumped
`(itemNumber, id)` for all 36 products and `(itemNumber, editionName, id)`
for all 60 releases from the last-committed (pre-audit)
`lib/data/products.ts`, then the same from the current, corrected file,
and diffed the id lists.

```
before count: 96 | after count: 96
ALL 96 IDs still identical: True
```

No id was derived from `item`, `chassis`, `slug`, `name`, or `year` at
any point — every id traces only to each entry's frozen `seedKey` (see
`lib/data/products.ts`'s file header) plus, for releases, that release's
fixed array position under its parent.

## Barcode (JAN) and MSRP cleanup

- **Pseudo-JAN removed entirely.** The deterministic generator function
  is gone from `lib/data/products.ts`. No release in this catalog has a
  verified real barcode, so `barcodeJAN` is `undefined` for all 60 in the
  seed source, and migration `0006`'s `UPDATE product_releases SET
  barcode_jan = NULL` clears it in the already-deployed database too.
- **MSRP**: no product or release in this catalog has an officially
  verified historical Tamiya retail price as of this pass. The seed
  source keeps an `estimatedMsrpJPY` field, explicitly documented as an
  app-level estimate for `lib/data/market.ts`'s already-"demo"-labeled
  pricing engine — never claimed as fact, never written to the database.
  Migration `0006` clears `msrp_jpy`/`msrp_eur` to `NULL` for all 60
  already-deployed release rows, since what was there (derived from the
  same estimates) was never verified either. If real MSRP data is found
  for a specific item later, it belongs in the seed's `verifiedMsrpJPY`
  field (present on the type, unused for now) and the corresponding
  `msrp_jpy` column — not folded into the estimate.

## Slug decoupling

`products.slug` was generated as `{name}-{itemNumber}`, which meant
correcting an item number would also silently change that product's slug
— not an id risk (slug was never used for id generation), but still an
unnecessary coupling to mutable manufacturer metadata, and `getProductBySlug`
exists in the query layer for future use even though nothing calls it
today.

`scripts/generate-catalog-seed.mjs` now generates slugs as
`{name}-{seedKey}` instead — the same frozen, permanent identity anchor
ids are derived from. Since every product's `seedKey` was frozen to equal
its *original* (pre-audit) item number, **no already-deployed product's
slug value actually changes** as a result of this fix — it's a
forward-looking correctness fix (a future item-number correction will
never again silently change a slug), not a migration concern. Nothing in
migration `0006` touches `products.slug`.

## Resolver correction

`lib/images/resolve.ts`: a specific release's image resolution
(`resolveReleaseImageUrl`) no longer falls back to a sibling release's
image — only that release's own `release_images` row, then the parent
product's generic `product_images` row, then the placeholder. The
sibling-release fallback still exists, but only in
`resolveProductImageUrl` (the generic, no-specific-release-selected
path). See that file's updated comments and `docs/IMAGES_MVP.md`.

This is why the Dash-1 Emperor image (see below) is stored at the
*product* level rather than attached to the 1990 release specifically —
storing it as a release image would have made it authoritative-looking
for that one release, which this audit can't support (see that entry's
notes).

---

## Audit table

Status legend: **VERIFIED** (confirmed correct against an official
source) · **CORRECTED** (was wrong, fixed against an official source) ·
**PARTIALLY VERIFIED** (some fields confirmed, others not) ·
**UNVERIFIED** (not checked this pass — no claim either way) ·
**REMOVE** (not used; no entry in this catalog was found to be a true
duplicate/invalid concept).

### Products individually audited this pass (11)

| TrackDash product | Old item | New item | Status | Chassis | Year | Fields changed | Source | Notes |
|---|---|---|---|---|---|---|---|---|
| Aero Avante | 18626 | **18701** | CORRECTED | MA → **AR** | 2012 | item, chassis, description | [tamiya.com/18701](https://www.tamiya.com/english/products/18701/index.html) | 18626 is a real item number but belongs to Avante Mk.III Azure. |
| Magnum Saber | 19401 | 19401 (unchanged) | VERIFIED | Super 1 (unchanged) | 1994 | — | [tamiya.com/19431](https://www.tamiya.com/english/products/19431/index.html) (confirms the *Premium*, see release row) | Original 19401/Super-1 was already correct; only the Premium release needed fixing. |
| Thunder Shot | 18075 | **NULL** | CORRECTED | Type 3 (unchanged) | 1988 | item → NULL | [tamiya.com/18075](https://www.tamiya.com/english/products/18075/index.html) (shows it's really Great Emperor Premium) | No live Tamiya page found for this vintage release; "Thunder Shot Mk.II" (item 18620) is a different, later product — not reused here. |
| Dash-1 Emperor | 18025 | 18025 (unchanged) | PARTIALLY VERIFIED | Type 3 (unchanged) | 1990 | see 2026 release row | [tamiya.com/18025](https://www.tamiya.com/english/products/18025/index.html) | Product-level data confirmed for the *current* listing; the 1990 release's exact original packaging/appearance is not independently verified (see image note). |
| Raikiri | 18646 | **18640** | CORRECTED | AR → **MA** | 2014 | item, chassis | [tamiya.com/18640](https://www.tamiya.com/english/products/18640/index.html) | 18646 is a real item number but belongs to DCR-01 (next row). |
| DCR-01 | 18647 | **18646** | CORRECTED | MA (unchanged) | 2018 | item | [tamiya.com/18646](https://www.tamiya.com/english/products/18646/index.html) | — |
| Geo Glider | 18093 | **18716** | CORRECTED | FM-A (unchanged) | 2019 → **2018** | item, year | [tamiya.com/18716](https://www.tamiya.com/english/products/18716/index.html) | 18716 was also this catalog's (equally wrong) number for Super Avante — see that row. |
| Shadow Shark | 18095 | **18704** | CORRECTED | VZ → **AR** | 2020 | item, chassis, description | [tamiya.com/18704](https://www.tamiya.com/english/products/18704/index.html) | 18704 was also this catalog's (equally wrong) number for Dash-4 Cannon Ball — see that row. |
| Super Avante | 18716 | **18101** | CORRECTED | VZ (unchanged) | 2020 | item | [tamiya.com/18101](https://www.tamiya.com/english/products/18101/index.html) ("Super Avante Jr.") | Moved off 18716 once that number was confirmed to really belong to Geo Glider. |
| Dash-4 Cannon Ball | 18704 | **NULL** | CORRECTED | Type 3 (unchanged) | 1990 | item → NULL | (no page found; 18704 confirmed to belong to Shadow Shark instead) | No confident real item number found for this vintage release within this pass. |
| Avante Mk.II | 18710 | **18614** | CORRECTED | Zero → **MS** | 1990 → **2006** | item, chassis, year, description, rarity, discontinued | Verified official (provided directly, confirmed against Tamiya): item 18614, "Avante Mk.II", Mini 4WD PRO Series No.14, MS chassis, released 2006-06-24 | No official vintage 1990/Zero-chassis "Avante Mk.II" exists — that entry was a seed-data error, likely confused with the real "Avante Jr." (item 18014, Type 2 chassis, 1988), a genuinely distinct historical product not currently in this catalog at all. If wanted later, Avante Jr. must be added as its own separate product (own seedKey/item 18014), never as a release under Avante Mk.II. |
| Festa Jaune | 18641 | **18637** | CORRECTED | AR → **MA** | 2013 → **2014** | item, chassis, year, description | [tamiya.com/18637](https://tamiya.com/english/products/18637/index.html) ("FESTA JAUNE", Item No. 18637, Mini 4WD PRO Series No.37) | 18641 is a real item number but belongs to "Shooting Proud Star" — confirmed via multiple official Tamiya America MAP price list PDFs (e.g. [tamiyausa.com PDF](https://www.tamiyausa.com/media/files/map-price-list-jan-2019-969-c5cb.pdf)). |
| Neo-Tridagger ZMC | 19434 | **19409** | CORRECTED | Super II → **Super 1** | 1998 (unchanged) | item, chassis, description | [tamiya.com/japan/19409](https://www.tamiya.com/japan/products/19409/index.html) (official Japanese page, confirms Super 1 chassis) | 19434 is a real item number but belongs to "Victory Magnum Premium" (see that product's Premium release row) — confirmed via [tamiya.com/19434 EN](https://www.tamiya.com/english/products/19434/index.html), [tamiya.com/japan/19434](https://www.tamiya.com/japan/products/19434/index.html), and an official Tamiya lineup PDF. Base item's own original release year (1998) not independently re-confirmed this pass — carried over from the seed, PARTIALLY VERIFIED. |
| Vanguard Sonic | 18725 | **19407** | PARTIALLY VERIFIED | Super II (unchanged, base) | 1996 → **1995** | item, year | Retailer SKU [hlj.com/vanguard-sonic-tam19407](https://www.hlj.com/vanguard-sonic-tam19407) + Fandom (1995-09-20) | 18725 does not belong to "Vanguard Sonic" in Tamiya's numbering. Item 19407 and year 1995 are corroborated by a retailer listing and a wiki, not independently confirmed via a direct tamiya.com fetch in this pass — flagged for follow-up official confirmation. |

### Releases of the audited products

| Product | Release | Old item | New item | Status | Chassis | Year | Notes |
|---|---|---|---|---|---|---|---|
| Aero Avante | Aero Avante (original) | 18626 | 18701 | CORRECTED | AR | 2012 | Inherits corrected product item/chassis (no per-release override existed). |
| Aero Avante | Clear Body (Polycarbonate) | 18626 | 18701 | CORRECTED | AR | 2013 | Same. |
| Aero Avante | Black Special | 18626 | 18701 | CORRECTED | AR | 2014 | Same. |
| Magnum Saber | Magnum Saber (original) | 19401 | 19401 | VERIFIED | Super 1 | 1994 | Unchanged. |
| Magnum Saber | Magnum Saber Premium | 19401 | **19431** | CORRECTED | Super 1 → **Super II** | 2012 | Was silently inheriting the product's item/chassis — Premium is a distinct real release. |
| Thunder Shot | Thunder Shot (Type 3) | 18075 | NULL | CORRECTED | Type 3 | 1988 | Inherits product-level NULL. |
| Thunder Shot | Thunder Shot Premium | 18075 | NULL | CORRECTED | Super II | 2015 | Same — this 2015/Super-II Premium specifically was NOT independently searched for its own possibly-different real item number; left NULL along with the product rather than guessed. |
| Dash-1 Emperor | Dash-1 Emperor (Type 3 Chassis, 1990) | 18025 | 18025 | UNVERIFIED | Type 3 | 1990 | Item number plausible (matches the still-current listing) but the 1990 release's own packaging/specifics were not independently archival-verified. |
| Dash-1 Emperor | Dash-1 Emperor Premium | 18713 | 18713 | UNVERIFIED | Super II | 2013 | Not independently checked this pass. |
| Dash-1 Emperor | Dash-1 Emperor Premium (Black Special) | 95359 | 95359 | UNVERIFIED | Super II | 2015 | Not independently checked this pass. |
| Dash-1 Emperor | Dash-1 Emperor 30th Anniversary | 92403 | 92403 | UNVERIFIED | Super II | 2018 | Not independently checked this pass. |
| Dash-1 Emperor | Dash-1 Emperor (2026 Reissue) | 18025 / Super II | 18025 / **Type 3** | CORRECTED | Super II → **Type 3** | 2026 | Verified live at tamiya.com/18025, page dated "current as of June 24, 2026" — still Type 3, not Super-II. |
| Raikiri | Raikiri (original) | 18646 | 18640 | CORRECTED | MA | 2014 | Inherits corrected product item/chassis. |
| Raikiri | Raikiri Black Special | 18646 | 18640 | CORRECTED | MA | 2016 | Same. |
| DCR-01 | DCR-01 (original) | 18647 | 18646 | CORRECTED | MA | 2018 | Inherits corrected product item. |
| Geo Glider | Geo Glider (original) | 18093 | 18716 | CORRECTED | FM-A | 2018 | Inherits corrected product item/year. |
| Shadow Shark | Shadow Shark (original) | 18095 | 18704 | CORRECTED | AR | 2020 | Inherits corrected product item/chassis. |
| Super Avante | Super Avante (original) | 18716 | 18101 | CORRECTED | VZ | 2020 | Inherits corrected product item. |
| Dash-4 Cannon Ball | Dash-4 Cannon Ball (original) | 18704 | NULL | CORRECTED | Type 3 | 1990 | Inherits product-level NULL. |
| Avante Mk.II | Avante Mk.II (original) | 18710 | 18614 | CORRECTED | Zero → MS | 1990 → 2006 | Inherits corrected product item/chassis/year; release_date newly populated as 2006-06-24 (a previously-unused DB column, now wired for this entry). No longer marked discontinued. |
| Festa Jaune | Festa Jaune (original) | 18641 | 18637 | CORRECTED | AR → MA | 2013 → 2014 | Inherits corrected product item/chassis/year. |
| Neo-Tridagger ZMC | Neo-Tridagger ZMC (original) | 19434 | 19409 | CORRECTED | Super TZ → Super 1 | 1998 | Inherits corrected product item/chassis. |
| Neo-Tridagger ZMC | Neo-Tridagger ZMC (Premium) | 19434 | 19409 | UNVERIFIED | Super II | 2016 | Inherits corrected product item by default (NOT independently re-verified for its own distinct item number — Premium reissues of Fully Cowled cars very often use a different item number than the original, per the pattern seen with Magnum Saber/Victory Magnum/Sonic Saber/Vanguard Sonic Premiums above; this one specifically was not checked). |
| Victory Magnum | Victory Magnum Premium | 19404 | **19434** | CORRECTED | Super 1 → Super II | 2014 → 2011 | [tamiya.com/19434 EN](https://www.tamiya.com/english/products/19434/index.html) + [JP](https://www.tamiya.com/japan/products/19434/index.html) confirm "Victory Magnum Premium (Carbon Super-II Chassis)", released 2011-06-25 (release_date populated). |
| Sonic Saber | Sonic Saber Premium | 19402 | **19432** | CORRECTED | Super 1 → Super II | 2013 → 2011 | [tamiya.com/19432](https://www.tamiya.com/english/products/19432/index.html) confirms "Sonic Saber Premium (Super-II Chassis)". Year 2011 corroborated by retailer listings citing 2011-01-22, not independently confirmed via an official page showing a release date — PARTIALLY VERIFIED for the exact date. |
| Vanguard Sonic | Vanguard Sonic (original) | 18725 | 19407 | PARTIALLY VERIFIED | Super 1 (unchanged) | 1996 → 1995 | See product-level note — retailer/wiki corroborated, not an official tamiya.com fetch. |
| Vanguard Sonic | Vanguard Sonic (Super II) | 18725 | **19435** | CORRECTED | Super II (unchanged) | 2013 | [tamiya.com/19435](https://www.tamiya.com/english/products/19435/index.html) confirms "Vanguard Sonic Premium (Carbon Super-II Chassis)". |

### Products NOT individually audited this pass (22) — genuinely UNVERIFIED

No claim of correctness or error is made for any of these; their current
item numbers/chassis/years are exactly as inherited from the original
seed, unexamined against an official source in this pass. Given the
pattern found above, several are likely wrong.

| TrackDash product | Current item | Releases | Status |
|---|---|---|---|
| Sonic Saber | 19402 | 2 | PARTIALLY VERIFIED — base product/original release confirmed correct (item 19402, Super 1, 1994); see release table above for the Premium correction already applied. |
| Victory Magnum | 19404 | 2 | PARTIALLY VERIFIED — base product/original release not independently re-checked this pass; see release table above for the Premium correction already applied. |
| Cyclone Magnum | 19425 | 2 | UNVERIFIED |
| Beat Magnum | 19426 | 2 | UNVERIFIED |
| Hurricane Sonic | 19424 | 2 | UNVERIFIED — a real Tamiya "Hurricane Sonic Premium" was incidentally found at item **19441** (AR chassis) while searching for something else this pass; not cross-checked against this entry's own structure. |
| Buster Sonic | 19430 | 1 | UNVERIFIED |
| Avante | 18709 | 2 | UNVERIFIED |
| Great Emperor | 18713 | 2 | UNVERIFIED — note: this catalog's Dash-1 Emperor Premium release also uses item 18713 (see above); this may or may not be a genuine collision, not checked. |
| Proto Emperor ZX | 18714 | 2 | UNVERIFIED |
| Dash-2 Burning Sun | 18702 | 1 | UNVERIFIED |
| Dash-3 Shooting Star | 18703 | 1 | UNVERIFIED — note: a real Tamiya item 18703 ("Aero Manta Ray") was incidentally found during this pass; not cross-checked against this entry. |
| Astute | 19412 | 2 | UNVERIFIED |
| Manta Ray | 19413 | 2 | UNVERIFIED |
| Fire Dragon | 19414 | 2 | UNVERIFIED |
| Dash-01 Horizon | 19415 | 1 | UNVERIFIED |
| Dyna-Hawk GX | 19601 | 2 | UNVERIFIED |
| Mad Bull | 18615 | 2 | UNVERIFIED |
| Trigale | 18660 | 1 | UNVERIFIED |
| Sword Flash | 18091 | 1 | UNVERIFIED |
| Copperfang | 18092 | 1 | UNVERIFIED |
| Emperor (Premium Black Special) | 18717 | 1 | UNVERIFIED |
| Aero Avante Japan Cup 2013 | 18718 | 1 | UNVERIFIED |

## Recommended next steps (not done in this pass)

1. Audit the 25 un-checked products the same way as the 11 above —
   expect a similar correction rate based on the pattern found here.
2. Specifically re-check **Great Emperor (18713)** against **Dash-1
   Emperor Premium (also 18713 in this catalog)** for a possible genuine
   collision, and **Dash-3 Shooting Star (18703)** against the "Aero
   Manta Ray" lead found incidentally.
3. Follow up on the **Vanguard Sonic Premium (item 19435)** lead.
4. Seek verified real MSRP/JAN figures where Tamiya (or another
   authoritative, non-marketplace source) publishes them, to start
   populating `verifiedMsrpJPY`/`verifiedJAN` for real.
5. If the historical "Avante Jr." (item 18014, Type 2 chassis, 1988) is
   wanted in the catalog, add it as its own new product entry (its own
   `seedKey`) — it is a genuinely distinct product from Avante Mk.II
   (item 18614, MS chassis, 2006), not a release of it. Not added in
   this pass since it wasn't part of the original 36.
