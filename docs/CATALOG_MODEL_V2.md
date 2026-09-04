# TrackDash — Catalog Model V2

This document describes the **final, locked** catalog architecture as of
this implementation pass. It supersedes any earlier informal description
of the Product/Release relationship in `docs/CATALOG_AUDIT.md` (which
remains the record of the underlying *factual* audit — item numbers,
chassis, sources — that this architecture normalizes on top of).

## 1. The hierarchy

```
PRODUCT
  ↓
PRODUCT RELEASE
  ↓
COLLECTION ITEM
  ↓
MARKETPLACE LISTING (future)
```

- **Product** — the conceptual model identity (`Dyna-Hawk GX`). Not a
  specific printing or reissue.
- **Product Release** — a specific collectible/commercial edition
  (`Dyna-Hawk GX — 19201 Original`, `— Super XX Special`,
  `— 95467 Super XX Special Reissue`). A collector owns a **Release**,
  never an abstract Product.
- **Collection Item** — a user's physical specimen of a Release.
- **Marketplace Listing** — *not implemented in this pass* — a future
  sale listing for a Collection Item. See section 8.

## 2. Product = model identity only

A `products` row now carries only conceptual identity: immutable
TrackDash UUID, brand, category, canonical name, Japanese/native name,
series, description, generic imagery, and a pointer to its canonical
release. It does **not** independently define chassis, item number, or
original-release-year as its own truth — see section 4.

## 3. Release = authoritative collectible edition

`product_releases` is the primary factual source for everything that can
legitimately vary between editions of the same model: item number,
chassis, release year/date, color, JAN, verified MSRP, production
status, edition type, verification status, and notes. Two releases of
the same product may legitimately differ in every one of these fields —
this is expected, not an anomaly to reconcile.

## 4. Compatibility fields (`products.canonical_item_number`,
   `products.chassis`, `products.original_release_year`)

These three columns still exist — existing application code reads them
(product cards, the collection/wishlist/dashboard/market screens, the
scanner's fuzzy-match scoring) — but they are no longer an independent
source of truth. They are **denormalized, always derived from
`products.canonical_release_id`**:

```
products.canonical_item_number = canonical_release.item_number
products.chassis               = canonical_release.chassis
products.original_release_year = canonical_release.release_year
```

**This is enforced by construction, not by convention.** In the seed
layer, `PRODUCTS.map()` in `lib/data/products.ts` computes these three
fields directly from the resolved canonical release — there is no code
path that sets them independently. In the database layer, migration
`0007_catalog_normalization.sql` writes the same derived values, and
`lib/actions/mappers.ts`'s `mapProductRow` prefers the eager-loaded
canonical release's own fields over the cached columns when both are
available. `scripts/check-catalog-invariants.mjs` asserts the two can
never drift (checks 6–8).

**Concrete effect of this pass**: three products — Avante, Vanguard
Sonic, and Great Emperor — had a product-level `chassis` that quietly
matched a *non-original* release (typically the Premium) rather than
their own canonical/original release. This is now structurally
impossible: `chassis` is always read from whichever release
`canonical_release_id` points at. Vanguard Sonic's product page now
correctly shows `Super 1` (its Original), not `Super II` (its Premium).

## 5. `canonical_release_id`

`products.canonical_release_id` is a nullable FK into `product_releases`
(added by migration `0006_catalog_model_v2.sql`; no circular-creation
issue since `product_releases` already exists as of migration `0003` —
this is a plain `ALTER TABLE ... ADD COLUMN`). Normally points at the
model's original historical release.

**UNKNOWN > INVENTED.** It may be `NULL` when no release can be
confidently identified as canonical. As of this pass, every one of this
catalog's 36 products has exactly one release marked `isOriginal: true`
in the seed, so all 36 currently have a canonical release — but nothing
in the code assumes this will always be true for a future product, and
nothing forces an arbitrary choice to avoid a `NULL`.

## 6. Special editions stay Releases, not new Products

Black Special, Premium, Limited, Anniversary, Japan Cup, Reissue, and
similar naming describe a **Release** of an existing Product, never a
new Product. A new Product exists only when the model identity itself
changes (Avante Jr., Avante Mk.II, and Aero Avante are three separate
Products even though they share the Avante lineage — this catalog
already models it this way; nothing changed here).

`edition_type` (new column, `product_releases.edition_type`) gives this a
small, controlled vocabulary — `original | premium | color_special |
limited | anniversary | japan_cup | reissue | special | other` —
**derived automatically** from the existing, richer `release_type` field
via `inferEditionType()` in `lib/data/products.ts`. It is never
hand-annotated per release, so it can never drift from `release_type`.
`edition_name` (existing column, unchanged) remains the primary
human-readable display value (`"Super XX Special"`,
`"Premium Black Special"`).

## 7. Item number stays Release-level, never identity

Confirmed unchanged from the catalog integrity pass: `item_number` lives
on `product_releases`, is nullable, and is never used to derive a
TrackDash UUID (`stable-id.ts` derives every id from a frozen `seedKey` /
array position, never from `item`). The same manufacturer number may
legitimately repeat across historically distinct releases (Tamiya does
reuse numbers) — the unique constraint on `product_releases` is
`(product_id, item_number, release_year, color)`, which blocks true
duplicate rows, not legitimate reuse. An item number repeated across two
*different* products is always a real collision, and
`scripts/check-catalog-invariants.mjs` (check 16) surfaces it.

## 8. Verification status & provenance

`product_releases.verification_status` (`verified | partial |
unverified`, CHECK-constrained) describes how confidently a release's
*identity* is backed by evidence — **not** field-by-field completeness.
A `verified` release can legitimately have `barcode_jan = NULL`, because
the barcode specifically was never checked; that's valid, not a
contradiction.

`release_sources` (new table) is queryable provenance: source type
(`official_manufacturer | official_catalog_pdf | official_archive |
trusted_secondary | other`), URL, which specific fields it backs
(`verified_fields`), when it was checked, and free-text notes. Populated
in this pass **only from URLs already documented** during the earlier
catalog integrity audit — see `lib/data/products.ts`'s `KNOWN_SOURCES`
table — never from new research. Coverage is deliberately partial: 38
releases have `verification_status = 'verified'`, and 35 of those have
at least one `release_sources` row; the remaining 3 (Magnum Saber, Sonic
Saber, and Victory Magnum's own original releases) are flagged as
non-fatal warnings by `scripts/check-catalog-invariants.mjs` — genuine,
honest provenance backlog, not an error to block on.

## 9. Production status

`product_releases.production_status` (`announced | active | discontinued
| unknown`) is deliberately distinct from marketplace availability
(whether a copy can currently be found on eBay/Amazon) — that's a future
Market Data concern, not a catalog fact. The existing `discontinued`
boolean is kept as a compatibility field (existing code reads it) and is
always kept in sync: `discontinued === (production_status ===
'discontinued')`, enforced by both `lib/data/products.ts`'s generation
logic and `scripts/check-catalog-invariants.mjs` (checks 22–23).

## 10. Two new releases added this pass

`scripts/check-catalog-invariants.mjs`'s stable-id floor and
`docs/CATALOG_AUDIT.md`'s "New releases added" section both cover this
in detail. In short: Dash-2 Burning Sun's Type-3 reissue (item `18026`)
and Dyna-Hawk GX's 2019 Super XX reissue (item `95467`) are genuinely new
release rows with genuinely new ids — every one of the 96 previously
deployed ids (36 products + 60 releases) is untouched.

---

## Compatibility assessment

### Collection

**No change needed.** `collection_items.release_id` was already
`NOT NULL` and already the row a collector's physical item points at —
Catalog Model V2 doesn't touch this table at all. A collection item
always identifies an exact Release; nothing here assumed a Product-only
identity to begin with.

### Wishlist

**No change needed — already supports both levels.**
`wishlist_items.release_id` was already nullable (`NULL` = "any release
of this model"), with `product_id` always required. This is precisely
the Product-level/Release-level distinction the architecture asks for:

```
"Any Dyna-Hawk GX"              → release_id = NULL
"Specifically Dyna-Hawk GX 95467" → release_id = <that release's id>
```

`lib/types.ts`'s `WishlistItem.releaseId?: string` already reflects
this. This pass verified the existing schema and left it exactly as-is,
per instruction not to modify what already evolves cleanly.

### Images

**No change needed to the resolver; migration renamed 0006→0008.** The
three-level image model (Product image / Release image / Collection Item
photo) already exists as three separate tables
(`product_images`/`release_images`/`collection_item_photos`) and was
never merged. The resolver rule from the Images MVP pass is unchanged
and was re-verified this pass (`lib/images/resolve.ts`):

- Viewing a **specific Release**: exact release image → generic Product
  image → placeholder. **Never** release A's image standing in for
  release B's.
- Viewing a **Product in general** (no release selected, e.g. a catalog
  grid card): Product image → any suitable Release image → placeholder.

The image *seed* migration was renumbered from `0006`/`0007` (depending
on which pass) to `0008_seed_catalog_images.sql`, since it references
product/release rows that must already exist — it now correctly runs
last in the sequence. Content is otherwise unchanged and was re-verified
idempotent (two runs, byte-identical output) and correctly resolving
against the final 62-release structure.

### Market schema

**No change needed — already Release-based.** `price_points.release_id`
and `market_estimates.release_id` were already `NOT NULL`, never
`product_id`-only. `Dyna-Hawk GX 95467 estimated value = €X` was already
the only shape this schema supports; `Dyna-Hawk GX estimated value = €X`
(product-only) was never representable. This pass verified this and
changed nothing in `lib/db/schema/market.ts`.

### Future Scanner

Not implemented in this pass. The architecture already supports the
intended future flow because Release identity is now the clean, stable
thing to identify: a confident scan resolves directly to a
`product_releases.id`; an ambiguous scan resolves to a `products.id`
and prompts the user to choose among that product's `releases`. No
schema change is needed to support this later — `getReleaseById` and
`listReleasesForProduct` (`lib/db/queries/catalog.ts`) already provide
the query shapes a future scanner flow would need.

### Future Marketplace

Not implemented in this pass; no Marketplace tables added. The
architecture supports the intended future flow without one:

```
Product → Release → Collection Item → Marketplace Listing
```

A future `marketplace_listings` table would reference
`collection_items.id` (never a bare `product_id`/`release_id`) — since a
`CollectionItem` already carries `productId` + `releaseId` +
condition + photos, a seller listing an owned item would never need to
re-enter model/item-number/chassis/release-year; a future listing form
only adds listing-specific fields (asking price, shipping, seller
notes, status) and reuses the Collection Item's own photos. This is a
documented linkage strategy, not a schema change made in this pass.

### Future Price Intelligence

Already Release-based (see "Market schema" above) — nothing to change
to support it; not implemented in this pass.

### Future Catalog Admin / Importer

Not implemented in this pass. Documented expected workflow (section 31
of the originating spec): create/select Product → add Release → populate
only known factual fields → attach a `release_sources` row → choose
`verification_status` → run `scripts/check-catalog-invariants.mjs` →
save. Adding the 200th product should require running that script, never
re-auditing the previous 199 — which is exactly what the script is built
for (see below).

### Future user-submitted corrections

Not implemented in this pass. Catalog mutation remains fully
privileged/admin-controlled — no schema or RLS policy in this pass grants
`INSERT`/`UPDATE`/`DELETE` on `products`/`product_releases` to
`anon`/`authenticated`; both remain `SELECT`-only for those roles (see
each table's `pgPolicy` in `lib/db/schema/catalog.ts`).

---

## Automated invariants

`scripts/check-catalog-invariants.mjs` is the permanent, reusable
consistency checker this architecture depends on for scaling to 200,
2,000, and beyond without a global re-audit every time one historical
field is corrected. Run it after any change to `lib/data/products.ts`:

```
node --experimental-strip-types scripts/check-catalog-invariants.mjs
```

It validates (see the script's own inline comments for exactly which
numbered check does what): id shape and a permanent stable-id floor that
only ever grows; canonical-release ownership and compatibility-field
sync; controlled-vocabulary membership (verification status, edition
type, production status, source type); no literal fake placeholders in
factual columns; no fabricated barcodes; no estimated MSRP masquerading
as factual; cross-product item-number collisions; image-mapping
validity; and production-status/discontinued consistency. A handful of
checks that need a live database (Collection/Wishlist foreign key
validity) run only when `DATABASE_URL` is set and reachable, and are
clearly reported as skipped otherwise — never silently ignored.

Provenance completeness (a `verified` release having at least one
`release_sources` row) is intentionally a **warning**, not a hard
failure — this pass's source population is explicitly non-exhaustive, by
instruction, and a missing source is a backfill candidate, not a defect.

## Migration sequence (none applied to Supabase in this pass)

| | Contents |
|---|---|
| `0006_catalog_model_v2.sql` | Schema/architecture only — auto-generated by `drizzle-kit generate` from `lib/db/schema/*.ts` (not hand-written). New `release_sources` table; new `product_releases` columns (`edition_type`, `verification_status`, `production_status`, `status_checked_at`) + CHECK constraints; new `products.canonical_release_id`; `product_releases.item_number` becomes nullable (folding in a gap where the old, now-removed `0006_catalog_integrity_corrections.sql` had changed this without a tracked Drizzle snapshot). |
| `0007_catalog_normalization.sql` | Data only — generated by `scripts/generate-catalog-normalization.mjs` as a full sync (not a diff) from `lib/data/products.ts`. Absorbs everything the old `0006_catalog_integrity_corrections.sql` did (factual corrections, pseudo-JAN removal, demo-MSRP removal) plus the new V2 fields: `canonical_release_id`, `verification_status`, `edition_type`, `production_status`, and `release_sources` rows. Every statement targets an existing row by id, except two `INSERT ... on conflict (id) do nothing` blocks for the 2 genuinely new releases and the `release_sources` rows. |
| `0008_seed_catalog_images.sql` | Renamed from the earlier `0006`/`0007` (depending on when you last looked) — unchanged content, generated by `scripts/seed-images.mjs`. Runs last since it references rows the prior two migrations must have already created/corrected. |

None of these three has been applied to Supabase in this pass.
