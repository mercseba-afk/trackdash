import { sql } from "drizzle-orm"
import { boolean, check, date, index, integer, jsonb, pgPolicy, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core"
import { anonRole, authenticatedRole } from "drizzle-orm/supabase"
import { productReleases, products } from "./catalog"


// TrackDash Product = exact Hot Wheels CASTING.
//
// Casting-level facts belong here instead of being repeated on every Release.
// This keeps designer/debut/model-reference data queryable and gives the
// Hot Wheels vertical a stable family identity without changing the shared
// Product schema used by Mini 4WD.
export const hotwheelsCastingDetails = pgTable(
  "hotwheels_casting_details",
  {
    productId: uuid("product_id")
      .primaryKey()
      .references(() => products.id, { onDelete: "cascade" }),
    modelReference: text("model_reference"),
    designer: text("designer"),
    castingDebutYear: integer("casting_debut_year"),
    debutSeries: text("debut_series"),
    scale: text("scale"),
    verificationStatus: text("verification_status").notNull().default("unverified"),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_hotwheels_casting_details_debut").on(table.castingDebutYear),
    index("idx_hotwheels_casting_details_designer").on(table.designer),
    check(
      "hotwheels_casting_details_verification_status_check",
      sql`${table.verificationStatus} in ('verified', 'partial', 'unverified')`,
    ),
    pgPolicy("hotwheels_casting_details_public_read", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS()

// Persistent provenance for casting-level facts. Release sources remain in
// release_sources; these rows explain WHY a Product/casting fact exists.
export const hotwheelsCastingSources = pgTable(
  "hotwheels_casting_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => hotwheelsCastingDetails.productId, { onDelete: "cascade" }),
    sourceType: text("source_type").notNull(),
    sourceUrl: text("source_url"),
    verifiedFields: text("verified_fields").array().notNull().default(sql`'{}'::text[]`),
    checkedAt: date("checked_at"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_hotwheels_casting_sources_product").on(table.productId),
    check(
      "hotwheels_casting_sources_source_type_check",
      sql`${table.sourceType} in ('official_manufacturer', 'official_catalog_pdf', 'official_archive', 'trusted_secondary', 'other')`,
    ),
    pgPolicy("hotwheels_casting_sources_public_read", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS()

// Hot Wheels-specific extension of the shared ProductRelease identity.
// Keep only fields that are useful for exact matching/filtering as real
// columns; long-tail attributes belong in metadata until proven query-worthy.
export const hotwheelsReleaseDetails = pgTable(
  "hotwheels_release_details",
  {
    releaseId: uuid("release_id")
      .primaryKey()
      .references(() => productReleases.id, { onDelete: "cascade" }),
    lineSlug: text("line_slug").notNull(),
    lineName: text("line_name").notNull(),
    subseries: text("subseries"),
    mixCode: text("mix_code"),
    collectorNumber: text("collector_number"),
    seriesPosition: text("series_position"),
    chaseType: text("chase_type"),
    packagingVariant: text("packaging_variant"),
    variationCode: text("variation_code"),
    countryOfManufacture: text("country_of_manufacture"),
    wheelType: text("wheel_type"),
    exclusivity: text("exclusivity"),
    masterSeries: text("master_series"),
    theme: text("theme"),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_hotwheels_release_details_line").on(table.lineSlug),
    index("idx_hotwheels_release_details_subseries").on(table.subseries),
    pgPolicy("hotwheels_release_details_public_read", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS()


// Minor physical/package differences under one commercial Hot Wheels Release.
// Examples: regional card, small wheel change, base/interior/window variation.
// These do NOT become separate ProductRelease rows unless collector identity
// and market evidence justify a true commercial Release split.
export const hotwheelsReleaseSubvariants = pgTable(
  "hotwheels_release_subvariants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    releaseId: uuid("release_id")
      .notNull()
      .references(() => productReleases.id, { onDelete: "cascade" }),
    code: text("code"),
    name: text("name").notNull(),
    countryOfManufacture: text("country_of_manufacture"),
    wheelType: text("wheel_type"),
    packagingVariant: text("packaging_variant"),
    baseVariant: text("base_variant"),
    interiorVariant: text("interior_variant"),
    windowVariant: text("window_variant"),
    decoVariant: text("deco_variant"),
    marketDistinct: boolean("market_distinct").notNull().default(false),
    verificationStatus: text("verification_status").notNull().default("unverified"),
    sourceUrl: text("source_url"),
    checkedAt: timestamp("checked_at", { withTimezone: true }),
    notes: text("notes"),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_hotwheels_release_subvariants_release").on(table.releaseId),
    unique("hotwheels_release_subvariants_release_name_unique").on(table.releaseId, table.name),
    pgPolicy("hotwheels_release_subvariants_public_read", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS()
