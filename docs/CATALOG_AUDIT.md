# TrackDash — Catalog Integrity Audit

## Scope and honesty note (read this first)

This audit was run against **official Tamiya sources only**
(`www.tamiya.com`'s English/global product pages; regional sites like
`tamiyausa.com` were tried but block automated access). Every correction
below reflects an actual fetched Tamiya page, never a marketplace listing
or a guess.

**Coverage is genuinely partial, not a completed 36/36 audit.** Of this
catalog's 36 products, **11 were individually researched** against a real
Tamiya source this pass (listed in full below, most resulting in a real
correction — this catalog's item numbers turned out to be wrong far more
often than the four originally-flagged cases). The remaining **25
products / releases were not individually checked in this pass** and are
marked `UNVERIFIED` honestly rather than assumed correct — per this
task's own instruction, an unconfirmed field is left alone (not corrected
to a guess) and its status says so plainly. Continuing this audit for the
remaining products is real, valuable follow-up work, not a formality.

**A pattern worth flagging explicitly:** of the 11 products actually
checked, corrections were needed for 9 of them, and three of those
corrections (Geo Glider, Shadow Shark, Super Avante — see below) surfaced
*because* two different products in this catalog were independently
found to be using the same real Tamiya item number for two different real
kits. This suggests the un-audited 25 likely contain more of the same
kind of error, not fewer — the 4 errors this task started with were very
much the tip of the iceberg. Whoever continues this audit should expect
a similar hit rate, and should specifically watch for cross-product
collisions like the ones documented here (correcting product A to a
verified item number that product B in this catalog already happens to
be using).

## Totals

| | Count |
|---|---|
| Products individually audited this pass | 11 / 36 |
| Products corrected | 9 |
| Products confirmed correct as-is (no change needed) | 0 (all 11 checked needed at least a status note; see table) |
| Products left `UNVERIFIED` (not checked this pass) | 25 / 36 |
| Releases individually audited this pass | ~17 / 60 (releases belonging to the 11 audited products) |
| Releases corrected | 15 |
| Releases left `UNVERIFIED` (not checked this pass) | ~43 / 60 |
| Pseudo-JAN barcodes removed | 60 / 60 (all — see below) |
| Verified-real MSRP figures retained | 0 |
| Estimated/demo MSRP values cleared from the factual DB columns | 60 / 60 releases |
| Item numbers corrected to a verified real value | 8 (7 products + 1 release-only: Magnum Saber Premium) |
| Item numbers set to `NULL` (no confident replacement found) | 3 products (+ their 5 releases) — Thunder Shot (×2 releases), Dash-4 Cannon Ball, Avante Mk.II |
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
| Avante Mk.II | 18710 | **NULL** | CORRECTED | Zero (unchanged) | 1990 | item → NULL | [tamiya.com/18614](https://www.tamiya.com/english/products/18614/index.html) (a *different*, modern product also called "Avante Mk.II") | 18710 could not be confirmed; the only "Avante Mk.II" found live is a clearly modern (2019-era, MA/MS chassis) product, not this catalog's 1990/Zero-chassis entry — reusing that number would have been a new mismatch of the same kind this pass exists to fix. |

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
| Avante Mk.II | Avante Mk.II (original) | 18710 | NULL | CORRECTED | Zero | 1990 | Inherits product-level NULL. |

### Products NOT individually audited this pass (25) — genuinely UNVERIFIED

No claim of correctness or error is made for any of these; their current
item numbers/chassis/years are exactly as inherited from the original
seed, unexamined against an official source in this pass. Given the
pattern found above, several are likely wrong.

| TrackDash product | Current item | Releases | Status |
|---|---|---|---|
| Festa Jaune | 18641 | 1 | UNVERIFIED |
| Neo-Tridagger ZMC | 19434 | 2 | UNVERIFIED |
| Sonic Saber | 19402 | 2 | UNVERIFIED |
| Victory Magnum | 19404 | 2 | UNVERIFIED |
| Cyclone Magnum | 19425 | 2 | UNVERIFIED |
| Beat Magnum | 19426 | 2 | UNVERIFIED |
| Hurricane Sonic | 19424 | 2 | UNVERIFIED |
| Buster Sonic | 19430 | 1 | UNVERIFIED |
| Avante | 18709 | 2 | UNVERIFIED |
| Vanguard Sonic | 18725 | 2 | PARTIALLY VERIFIED — a real Tamiya "Vanguard Sonic Premium" was incidentally found at item **19435** (tamiya.com/19435) while searching for something else, but this catalog's specific release structure (original vs. "Super II reissue" at item 18725) was not cross-checked against it. Left unchanged rather than partially applied without full confidence. |
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
