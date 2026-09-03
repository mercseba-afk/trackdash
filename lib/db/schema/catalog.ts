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

import { sql } from "drizzle-orm"
import { boolean, date, index, integer, jsonb, numeric, pgPolicy, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core"
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
    // Representative item number for the model as a whole; the release a
    // collector actually owns has its own item_number on product_releases.
    canonicalItemNumber: text("canonical_item_number"),
    name: text("name").notNull(),
    japaneseName: text("japanese_name"),
    series: text("series"), // e.g. 'Racing Mini 4WD' — free text, not an enum: the vocabulary grows as new series ship
    chassis: text("chassis"), // representative chassis; a release can override this (see product_releases.chassis)
    originalReleaseYear: integer("original_release_year").notNull(), // first-ever release year of the model
    rarity: text("rarity").notNull(), // fallback rarity when a release doesn't set its own
    description: text("description"),
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
    // 0006_catalog_integrity_corrections.sql): a release whose official
    // Tamiya item number cannot be confidently verified stores NULL here,
    // never a placeholder/sentinel string like "UNVERIFIED" -- that would
    // itself be fabricated catalog data, exactly what this field exists
    // to avoid. See docs/CATALOG_AUDIT.md.
    itemNumber: text("item_number"), // item number of THIS release specifically, when verified
    releaseType: text("release_type").notNull(), // 'Original' | 'Reissue' | 'Special Edition' | ... (open vocabulary, validated at the app layer)
    editionName: text("edition_name").notNull(), // e.g. "Dash-1 Emperor (40th Anniversary)"
    releaseYear: integer("release_year").notNull(),
    releaseDate: date("release_date"),
    chassis: text("chassis").notNull(),
    barcodeJan: text("barcode_jan"),
    color: text("color"),
    countryMarket: text("country_market"),
    msrpJpy: numeric("msrp_jpy", { precision: 10, scale: 2 }),
    msrpEur: numeric("msrp_eur", { precision: 10, scale: 2 }),
    notes: text("notes"),
    discontinued: boolean("discontinued").notNull().default(false),
    isOriginal: boolean("is_original").notNull().default(false),
    rarity: text("rarity"), // overrides products.rarity when set
    dataSource: text("data_source"), // 'manual' | 'tamiya_catalog' | 'community' | ... — provenance of this catalog entry, not of a price
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_releases_product").on(table.productId),
    index("idx_releases_item_number").on(table.itemNumber),
    index("idx_releases_barcode").on(table.barcodeJan),
    unique("product_releases_identity_unique").on(table.productId, table.itemNumber, table.releaseYear, table.color),
    pgPolicy("product_releases_public_read", {
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
