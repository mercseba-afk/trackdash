// Catalog: Product (the model) vs. ProductRelease (the specific commercial
// edition) — the core distinction TrackDash is built around.
//
// Example: Tamiya Dash-1 Emperor is one `products` row. Its original 1994
// release, the "Black Special" release, and the 40th Anniversary reissue are
// three separate `product_releases` rows under it — each with its own
// rarity/value, because collector value differs by release, not by model.
//
// Every valuation, every collection item, and every price point below
// always points at a `release_id`, never at a bare `product_id` — the only
// deliberate exception is the wishlist, where "any release of this model"
// is a valid thing to want (see wishlist.ts).
//
// CATALOG MODEL V2 (see docs/CATALOG_MODEL_V2.md): `products` no longer
// independently defines chassis/item-number/original-year as its own
// truth. Those three columns are now COMPATIBILITY/CACHE fields,
// denormalized from `canonical_release_id`'s own release row and kept in
// sync by lib/data/products.ts's generation logic + migration
// 0007_catalog_normalization.sql + scripts/check-catalog-invariants.mjs.
// A Product genuinely does not have one universally true chassis (e.g.
// Vanguard Sonic: Original = Super 1, Premium = Super II) — the release is
// now the authoritative source for every fact that can legitimately vary
// between editions of the same model.

import { sql } from "drizzle-orm"
import {
  type AnyPgColumn,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core"
import { anonRole, authenticatedRole } from "drizzle-orm/supabase"
import { brands, categories } from "./taxonomy"

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id),
    slug: text("slug").notNull().unique(),
    // COMPATIBILITY/CACHE (Catalog Model V2) — see file header. Denormalized
    // from canonicalReleaseId's own item_number; never set independently
    // once a canonical release exists.
    canonicalItemNumber: text("canonical_item_number"),
    name: text("name").notNull(),
    japaneseName: text("japanese_name"),
    series: text("series"), // e.g. 'Racing Mini 4WD' — free text, not an enum: the vocabulary grows as new series ship
    // COMPATIBILITY/CACHE (Catalog Model V2) — see file header. Denormalized
    // from canonicalReleaseId's own chassis; never set independently once a
    // canonical release exists. A release may still override this for
    // itself (see product_releases.chassis, the actual source of truth).
    chassis: text("chassis"),
    // COMPATIBILITY/CACHE (Catalog Model V2) — see file header. Denormalized
    // from canonicalReleaseId's own release_year.
    // COMPATIBILITY/CACHE (Catalog Model V2) — see file header. Denormalized
    // from canonicalReleaseId's own release_year. Nullable (hardening
    // point 1): NULL when there is no canonical release, never an invented
    // default. Every current product has one, so no existing data is NULL.
    originalReleaseYear: integer("original_release_year"), // first-ever release year of the model
    rarity: text("rarity").notNull(), // fallback rarity when a release doesn't set its own
    description: text("description"),
    // The release considered authoritative for this model's identity —
    // normally the original historical release. Nullable: UNKNOWN >
    // INVENTED, never force an arbitrary release to be canonical merely to
    // populate this column. References product_releases, which already
    // exists as of migration 0003 -- no circular-creation issue, this is a
    // plain nullable FK added by ALTER TABLE in migration
    // 0006_catalog_model_v2.sql.
    canonicalReleaseId: uuid("canonical_release_id").references((): AnyPgColumn => productReleases.id),
    // Category-specific fields that don't warrant their own column yet.
    // Keep using real columns for anything shared and queried often; this
    // is an escape hatch for the long tail, not a replacement for columns.
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_products_category").on(table.categoryId),
    index("idx_products_brand").on(table.brandId),
    index("idx_products_item_number").on(table.canonicalItemNumber),
    index("idx_products_canonical_release").on(table.canonicalReleaseId),
    pgPolicy("products_public_read", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS()

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  () => [
    pgPolicy("product_images_public_read", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS()

export const productReleases = pgTable(
  "product_releases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    // Nullable as of the catalog integrity pass (migration
    // 0006_catalog_integrity_corrections.sql, since folded into
    // 0007_catalog_normalization.sql): a release whose official Tamiya item
    // number cannot be confidently verified stores NULL here, never a
    // placeholder/sentinel string like "UNVERIFIED" -- that would itself be
    // fabricated catalog data, exactly what this field exists to avoid. See
    // docs/CATALOG_AUDIT.md and docs/CATALOG_MODEL_V2.md.
    itemNumber: text("item_number"), // item number of THIS release specifically, when verified
    releaseType: text("release_type").notNull(), // 'Original' | 'Reissue' | 'Special Edition' | ... (open vocabulary, validated at the app layer)
    // Coarse controlled classification (Catalog Model V2, see
    // docs/CATALOG_MODEL_V2.md) — deliberately smaller vocabulary than
    // release_type above, which remains the primary display value.
    editionType: text("edition_type").notNull().default("other"),
    editionName: text("edition_name").notNull(), // e.g. "Dash-1 Emperor (40th Anniversary)"
    // Nullable (Catalog Model V2 hardening, point 2): a real release can
    // exist before its exact year is confirmed. NULL = genuinely unknown,
    // never a placeholder. Every current release has a year -- this is a
    // capability change for future catalog items.
    releaseYear: integer("release_year"),
    releaseDate: date("release_date"),
    // Nullable (Catalog Model V2 hardening, point 2): a release's chassis
    // can be genuinely unknown. NULL, never an invented default.
    chassis: text("chassis"),
    barcodeJan: text("barcode_jan"),
    color: text("color"),
    countryMarket: text("country_market"),
    msrpJpy: numeric("msrp_jpy", { precision: 10, scale: 2 }),
    msrpEur: numeric("msrp_eur", { precision: 10, scale: 2 }),
    notes: text("notes"),
    // COMPATIBILITY field (Catalog Model V2) — kept in sync with
    // productionStatus below (discontinued === productionStatus ===
    // 'discontinued'); productionStatus is the authoritative source. Not
    // removed since existing application code depends on it (see
    // docs/CATALOG_MODEL_V2.md's compatibility assessment).
    discontinued: boolean("discontinued").notNull().default(false),
    isOriginal: boolean("is_original").notNull().default(false),
    rarity: text("rarity"), // overrides products.rarity when set
    dataSource: text("data_source"), // 'manual' | 'tamiya_catalog' | 'community' | ... — provenance of this catalog entry, not of a price
    // Catalog Model V2 (docs/CATALOG_MODEL_V2.md): how confidently this
    // release's factual data is backed by evidence. Does NOT require every
    // field to be populated -- a 'verified' release can legitimately have
    // barcode_jan = NULL because the barcode specifically was never
    // checked.
    verificationStatus: text("verification_status").notNull().default("unverified"),
    // Whether Tamiya still officially sells/produces this exact release --
    // deliberately distinct from marketplace availability (eBay/Amazon
    // stock), which is a future Market Data concern, not a catalog fact.
    productionStatus: text("production_status").notNull().default("unknown"),
    statusCheckedAt: timestamp("status_checked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_releases_product").on(table.productId),
    index("idx_releases_item_number").on(table.itemNumber),
    index("idx_releases_barcode").on(table.barcodeJan),
    // Legitimate reissues MAY share an item number with an earlier release
    // of the SAME product (Tamiya does reuse numbers) — this constraint's
    // job is only to prevent two rows from being byte-identical duplicates
    // (same product + same item + same year + same color), not to forbid
    // item-number reuse across genuinely distinct release rows. See
    // docs/CATALOG_MODEL_V2.md section 8.
    //
    // NULLS NOT DISTINCT (Catalog Model V2 hardening, point 8): a standard
    // Postgres UNIQUE treats every NULL as distinct, so two rows that are
    // identical EXCEPT both have item_number NULL (or year NULL, or color
    // NULL) would NOT be caught — exactly the duplicate this is meant to
    // block, now that those fields are legitimately nullable. NULLS NOT
    // DISTINCT makes two NULLs compare equal, closing that hole while still
    // permitting genuinely distinct reissues (which differ on at least one
    // of the four columns).
    unique("product_releases_identity_unique").on(table.productId, table.itemNumber, table.releaseYear, table.color).nullsNotDistinct(),
    check("product_releases_verification_status_check", sql`${table.verificationStatus} in ('verified', 'partial', 'unverified')`),
    check(
      "product_releases_edition_type_check",
      sql`${table.editionType} in ('original', 'premium', 'color_special', 'limited', 'anniversary', 'japan_cup', 'reissue', 'special', 'other')`,
    ),
    check(
      "product_releases_production_status_check",
      sql`${table.productionStatus} in ('announced', 'active', 'discontinued', 'unknown')`,
    ),
    pgPolicy("product_releases_public_read", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS()

// Catalog Model V2 (docs/CATALOG_MODEL_V2.md): persistent, queryable
// provenance for a release's factual data — so a future maintainer can see
// WHY a value exists without reading old chat history or dense code
// comments. `verifiedFields` names which specific release columns this
// source backs (e.g. ['item_number', 'chassis']); one source rarely
// confirms every field on a release at once. A release can have zero rows
// here (no source recorded yet) -- that's valid, never a reason to invent
// one.
export const releaseSources = pgTable(
  "release_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    releaseId: uuid("release_id")
      .notNull()
      .references(() => productReleases.id, { onDelete: "cascade" }),
    sourceType: text("source_type").notNull(),
    sourceUrl: text("source_url"),
    verifiedFields: text("verified_fields").array().notNull().default(sql`'{}'::text[]`),
    checkedAt: date("checked_at"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_release_sources_release").on(table.releaseId),
    check(
      "release_sources_source_type_check",
      sql`${table.sourceType} in ('official_manufacturer', 'official_catalog_pdf', 'official_archive', 'trusted_secondary', 'other')`,
    ),
    pgPolicy("release_sources_public_read", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS()

export const releaseImages = pgTable(
  "release_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    releaseId: uuid("release_id")
      .notNull()
      .references(() => productReleases.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    position: integer("position").notNull().default(0),
  },
  () => [
    pgPolicy("release_images_public_read", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS()
