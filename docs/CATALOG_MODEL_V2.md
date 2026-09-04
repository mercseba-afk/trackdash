# TrackDash — Catalog Model V2

This document describes the **final, locked** catalog architecture,
including the **hardening pass** that closed the structural gaps found in
review before applying to Supabase. Where the hardening pass changed a
behavior, this document describes the FINAL (post-hardening) state, not
the intermediate one.

## Hardening pass — summary of what became structurally enforced

The base Catalog Model V2 established the Product/Release boundary. The
hardening pass made its guarantees real rather than conventional:

- **UNKNOWN > INVENTED, end to end.** Product compat fields
  (`canonical_item_number`, `chassis`, `original_release_year`) and
  release factual fields (`item_number`, `release_year`, `chassis`) are
  all nullable in the type layer, the DB schema, and the UI. There are
  **no factual fallbacks** anywhere — no `?? seed.item`, no `?? "MA"`, no
  `primary?.chassis` — a value is either the canonical release's real
  value or `NULL`/`—`. Verified with the invariant checker (a product
  with no canonical release must have all three compat fields NULL) and
  in the UI (every display site renders `—` for a missing value).
- **DB-level drift enforcement (triggers).** Three PL/pgSQL triggers in
  `0006_catalog_model_v2.sql` make product↔canonical-release drift
  impossible even under a direct post-deploy SQL edit — tested on a real
  Postgres (see "DB trigger enforcement" below).
- **Safe verification default.** `unverified` is the default;
  `verified` is reached only via curated official provenance, never from
  a plausible-looking item number. A `verified` release with no
  provenance is a **hard fail** in the checker.
- **Immutable 98-ID manifest.** `lib/data/stable-id-manifest.ts` is a
  checked-in, append-only literal — the checker compares against it
  rather than re-deriving the floor from the catalog, so a *disappeared*
  id is actually detectable (proven with a negative test).
- **releaseSeedKey (fully positional-independent).** Release UUIDs
  derive from an immutable `productSeedKey:releaseSeedKey` pair. In the
  consistency-fix pass `releaseSeedKey` became **required** on every
  `ReleaseSeed` (all 62 releases carry an explicit key), and
  `buildReleases()` no longer falls back to `String(i + 1)` — so the
  UUID has **zero** dependence on array position. Proven by
  `scripts/test-release-id-reorder.mjs`, which physically reverses a
  product's `releases` array and confirms every UUID is byte-identical.
- **NULLS NOT DISTINCT.** The release identity unique constraint treats
  NULLs as equal, so nullable factual fields can't defeat duplicate
  protection — tested on real Postgres.
- **Image identity by seed key.** `tamiya-images.ts`/`seed-images.mjs`
  key images on `productSeedKey`/`releaseSeedKey`, never Tamiya item
  number (retained only as human-readable metadata).
- **Factual production status.** `production_status` defaults to
  `unknown`; the legacy `discontinued` boolean derives from it, not the
  reverse. A non-`unknown` (factual) status now additionally requires
  `status_checked_at` **and** provenance — a production claim can't exist
  without evidence (invariant checker).
- **UNKNOWN in the seed layer too (consistency fix).** Beyond the compat
  fields, the *release* factual fields are now genuinely unknown-capable
  at the seed level: `ReleaseSeed.year` is `number | null` (no invented
  default), `chassis` uses the same three-way omitted/`null`/value
  semantics as `item` (`null` = explicitly unknown, never inherited),
  and `country` has **no `?? "Japan"` default** — an unknown market is
  `NULL`, enforced by an invented-geographic-default invariant.
- **MSRP JPY and EUR are independent facts (consistency fix).** Factual
  `msrp_eur` comes only from a real `verifiedMsrpEUR`, **never** from
  converting `verifiedMsrpJPY` — a converted JP price is not an official
  European MSRP. Currency conversion lives only in the demo estimate
  fields. Each populated factual price requires provenance backing that
  specific field (JPY and EUR checked independently).



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

**DB-level enforcement (hardening).** The seed layer keeps these in sync
by construction, but a *direct SQL edit after deploy* (a future Catalog
Admin, a manual fix, a bulk import) could still drift them. Three
PL/pgSQL triggers at the bottom of `0006_catalog_model_v2.sql` close
that gap — Drizzle can't express triggers, so this is explicit,
documented SQL (architectural correctness over "everything must be
generated"):

- `products_canonical_release_ownership` (a deferrable constraint
  trigger): `canonical_release_id`, when set, MUST reference a release of
  the same product — a plain FK can't express "same product".
- `products_sync_from_canonical` (BEFORE UPDATE OF canonical_release_id):
  changing the pointer re-pulls all three compat columns from the new
  canonical release, or NULLs them if the pointer is set NULL.
- `releases_sync_canonical_product` (AFTER UPDATE OF item_number/chassis/
  release_year): editing a canonical release's own fields re-syncs its
  product's compat columns.

All three were tested end-to-end on a real (embedded) Postgres: setting/
repointing/NULLing `canonical_release_id`, editing a canonical release's
fields, and an attempted cross-product ownership violation (correctly
rejected). The live-DB branch of `scripts/check-catalog-invariants.mjs`
additionally re-checks, when `DATABASE_URL` is set, that no product's
compat columns have drifted from its canonical release in the actual
database.

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

**Safe default (hardening).** The default is **`unverified`**. A
plausible-looking item number is NEVER treated as verification. A
release reaches `verified` only when it carries at least one OFFICIAL
source (`official_manufacturer`/`official_catalog_pdf`/
`official_archive`) in the curated `KNOWN_SOURCES` table that backs a
field the release actually has a value for. That table is the explicit,
hand-curated record of what was officially confirmed during the catalog
integrity audit, so deriving `verified` from it is an explicit editorial
signal, not a heuristic. (Mad Bull's source documents *why its item is
NULL* — it backs a field the release doesn't have — so Mad Bull
correctly stays `unverified`.) Final distribution: 35 verified, 4
partial, 23 unverified. The three releases that were `verified` without
provenance in the pre-hardening state (Magnum Saber, Sonic Saber, and
Victory Magnum's own originals) correctly downgraded to `unverified` —
no new research was done to "rescue" them, per instruction.

`release_sources` (table) is queryable provenance: source type, URL,
which specific fields it backs (`verified_fields`, drawn from a
controlled vocabulary of app field keys — validated by the checker),
when it was checked, and notes.

**Provenance is a hard requirement (hardening).** The invariant checker
**hard-fails** (not warns) on: a `verified` release with zero sources; a
`verified_fields` value outside the controlled vocabulary; and any
populated factual `barcode_jan`, `msrp_jpy`, or `msrp_eur` whose release
has no source specifically backing that field. `msrp_jpy` and `msrp_eur`
are checked **independently** (consistency fix) — a factual EUR price
must have its own EUR provenance and is never a converted JP price (the
seed builder sources `msrp_eur` only from `verifiedMsrpEUR`, never from
`verifiedMsrpJPY`). Currency conversion exists only in the demo estimate
fields (`estimatedMsrpEUR`), never in the factual `msrp_eur`. (This
catalog has no verified barcode/MSRP today, so the field-level checks
pass vacuously — they guard the future.)

## 9. Production status

`product_releases.production_status` (`announced | active | discontinued
| unknown`) is deliberately distinct from marketplace availability
(whether a copy can currently be found on eBay/Amazon) — that's a future
Market Data concern, not a catalog fact.

**Factual default (hardening).** It defaults to `unknown` and is a
FACTUAL field: `active`/`announced`/`discontinued` are only ever set
with a real status check (`status_checked_at`). It is **never
auto-inferred** from the legacy `discontinued` prototype boolean. The
direction of derivation is now reversed: the compatibility `discontinued`
boolean **derives from** `production_status` (`discontinued === true`
iff `production_status === 'discontinued'`), so a leftover seed-level
`discontinued: true` can no longer silently become a factual production
claim. Both `lib/data/products.ts` and
`scripts/check-catalog-invariants.mjs` (production-status/discontinued
consistency) enforce this.

**Evidence required for a factual status (consistency fix).** A
non-`unknown` status (`active`/`announced`/`discontinued`) must be
backed by both a `status_checked_at` timestamp and at least one
provenance source — the invariant checker hard-fails otherwise. Without
evidence, the status stays `unknown`; no status or source is ever
invented. This catalog currently has every release at `unknown`, so the
check passes cleanly.

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
never merged. The resolver rule is unchanged (release A never stands in for release
B); what the hardening pass changed is **image IDENTITY**. Previously
`tamiya-images.ts` keyed each mapping on the Tamiya item number
(`productItem`/`releaseItem`) — correctable factual data. Now entries key
on TrackDash's own immutable identifiers: a product's `seedKey` and, for
release-specific images, that release's `releaseSeedKey`
(`productSeedKey`/`releaseSeedKey`). The Tamiya item number is retained
only as human-readable metadata (`tamiyaItemNumber`/`note`), never as
identity, and each image ROW's own UUID is likewise derived from the
seed key, not the item number. `scripts/seed-images.mjs` resolves
targets by these keys, and `scripts/check-catalog-invariants.mjs`
validates image mappings the same way. Re-verified idempotent (two runs,
byte-identical) and all three current mappings resolve correctly.

The image *seed* migration was renumbered to
`0008_seed_catalog_images.sql`, since it references product/release rows
that must already exist — it now correctly runs last in the sequence.

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
check does what): id shape; **the immutable 98-ID manifest**
(`lib/data/stable-id-manifest.ts` — a checked-in, append-only literal;
the checker hard-fails if any manifested id has disappeared or changed
kind, and warns when a new catalog id needs appending — a runtime-derived
floor could never catch a *deletion*, which is the whole reason the
manifest is a separate file); canonical-release ownership and
compatibility-field sync (including the NULL-canonical ⇒ NULL-compat
rule); controlled-vocabulary membership (verification status, edition
type, production status, source type, **and `verified_fields`**); no
literal fake placeholders in factual columns; no fabricated barcodes; no
estimated MSRP masquerading as factual; **cross-product item-number
collisions across ALL release item numbers**; **NULL-aware duplicate
release identity** (mirroring the `NULLS NOT DISTINCT` constraint);
image-mapping validity **by seed key**; production-status/
discontinued consistency **plus the factual-status evidence rule**
(a non-`unknown` production status requires `status_checked_at` +
provenance); **no invented geographic default** (catches a reintroduced
`?? "Japan"`); and **independent JPY/EUR MSRP provenance** (a factual
`msrp_eur` must have its own EUR source, never a converted JP price).
Checks that need a live database (Collection/Wishlist FK validity **and
product↔canonical compat-column drift in the actual DB**) run only when
`DATABASE_URL` is set and reachable, and are clearly reported as skipped
otherwise — never silently ignored.

A separate script, `scripts/test-release-id-reorder.mjs`, proves release
UUIDs are independent of array position: it builds a product's releases
in normal order and again with the `releases` array physically reversed,
and confirms every UUID is byte-identical.

**Provenance is a hard requirement (hardening).** A `verified` release
with zero `release_sources`, or a populated factual barcode/MSRP with no
source specifically backing that field, is now a **hard failure**, not a
warning. The catalog passes this cleanly: the safe `unverified` default
means nothing is `verified` without curated official provenance.

## Migration sequence (none applied to Supabase in this pass)

| | Contents |
|---|---|
| `0006_catalog_model_v2.sql` | Schema/architecture. The CREATE/ALTER/ADD-CONSTRAINT block is auto-generated by `drizzle-kit generate` from `lib/db/schema/*.ts`; the trigger block at the bottom is explicit hand-written SQL (point 3). New `release_sources` table; new `product_releases` columns (`edition_type`, `verification_status`, `production_status`, `status_checked_at`) + CHECK constraints; new `products.canonical_release_id`; `item_number`, `release_year`, `chassis` on `product_releases` and `original_release_year` on `products` all become nullable (UNKNOWN > INVENTED); the identity unique constraint gains `NULLS NOT DISTINCT`; three canonical-sync triggers. |
| `0007_catalog_normalization.sql` | Data only — generated by `scripts/generate-catalog-normalization.mjs` as a full sync (not a diff) from `lib/data/products.ts`. Absorbs everything the old `0006_catalog_integrity_corrections.sql` did (factual corrections, pseudo-JAN removal, demo-MSRP removal) plus the new V2 fields: `canonical_release_id`, `verification_status`, `edition_type`, `production_status`, and `release_sources` rows. Every statement targets an existing row by id, except two `INSERT ... on conflict (id) do nothing` blocks for the 2 genuinely new releases and the `release_sources` rows. |
| `0008_seed_catalog_images.sql` | Renamed to run last. Generated by `scripts/seed-images.mjs` from `scripts/data/tamiya-images.ts`, now keyed on immutable `productSeedKey`/`releaseSeedKey` (hardening point 9), not item number. Idempotent (`on conflict (id) do nothing`). |

None of these three has been applied to Supabase in this pass.
