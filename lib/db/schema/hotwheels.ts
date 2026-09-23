import { sql } from "drizzle-orm"
import { boolean, check, date, index, integer, jsonb, pgPolicy, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core"
import { anonRole, authenticatedRole } from "drizzle-orm/supabase"
import { productReleases, products } from "./catalog"

// Hot Wheels-specific extension of the shared Product identity.
//
// TrackDash Product = Hot Wheels CASTING. A casting is the tooling/model
// identity that can have many commercially meaningful Releases over time.
export const hotwheelsCastingDetails = pgTable(
  "hotwheels_casting_details",
  {
    productId: uuid("product_id")
      .primaryKey()
      .references(() => products.id, { onDelete: "cascade" }),
    modelReference: text("model_reference"),
    designer: text("designer"),
    castingDebutYear: integer("casting_debut_year"),
    scale: text("scale"),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_hotwheels_casting_details_debut").on(table.castingDebutYear),
    pgPolicy("hotwheels_casting_details_public_read", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS()

// Hot Wheels-specific extension of the shared ProductRelease identity.
//
// TrackDash ProductRelease = commercially meaningful collectible Release:
// a distinct RLC, Boulevard, Car Culture release, chase, recolor, exclusive,
// etc. Minor manufacturing/packaging differences belong in
// hotwheels_release_subvariants instead of becoming duplicate Releases.
export const hotwheelsReleaseDetails = pgTable(
  "hotwheels_release_details",
  {
    releaseId: uuid("release_id")
      .primaryKey()
      .references(() => productReleases.id, { onDelete: "cascade" }),
    lineSlug: text("line_slug").notNull(),
    lineName: text("line_name").notNull(),
    subseries: text("subseries"),
    masterSeries: text("master_series"),
    mixCode: text("mix_code"),
    collectorNumber: text("collector_number"),
    seriesPosition: text("series_position"),
    variationCode: text("variation_code"),
    chaseType: text("chase_type"),
    exclusiveTo: text("exclusive_to"),
    packagingVariant: text("packaging_variant"),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_hotwheels_release_details_line").on(table.lineSlug),
    index("idx_hotwheels_release_details_subseries").on(table.subseries),
    index("idx_hotwheels_release_details_master_series").on(table.masterSeries),
    pgPolicy("hotwheels_release_details_public_read", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS()

// Minor differences within ONE commercial Release.
//
// Examples:
// - USA long card vs International long/short card;
// - wheel-type change during the same run;
// - Malaysia vs Indonesia production when the commercial identity is the same;
// - alternate UPC/assortment caused only by regional packaging;
// - small base/deco differences that do not justify their own market identity.
//
// A Subvariant is intentionally NOT valued as a separate ProductRelease unless
// evidence later proves that collectors consistently trade it as a distinct
// market object. This prevents catalog explosion while preserving exact detail.
export const hotwheelsReleaseSubvariants = pgTable(
  "hotwheels_release_subvariants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    releaseId: uuid("release_id")
      .notNull()
      .references(() => productReleases.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    wheelType: text("wheel_type"),
    packagingStyle: text("packaging_style"),
    productionCountry: text("production_country"),
    region: text("region"),
    assortmentNumber: text("assortment_number"),
    upc: text("upc"),
    baseVariation: text("base_variation"),
    decorationVariation: text("decoration_variation"),
    isPrimary: boolean("is_primary").notNull().default(false),
    verificationStatus: text("verification_status").notNull().default("unverified"),
    sourceUrl: text("source_url"),
    checkedAt: date("checked_at"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_hotwheels_release_subvariants_release").on(table.releaseId),
    index("idx_hotwheels_release_subvariants_upc").on(table.upc),
    unique("hotwheels_release_subvariants_release_title_region_unique")
      .on(table.releaseId, table.title, table.region)
      .nullsNotDistinct(),
    check(
      "hotwheels_release_subvariants_verification_status_check",
      sql`${table.verificationStatus} in ('verified', 'partial', 'unverified')`,
    ),
    pgPolicy("hotwheels_release_subvariants_public_read", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS()
