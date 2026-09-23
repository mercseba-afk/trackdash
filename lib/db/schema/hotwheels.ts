import { sql } from "drizzle-orm"
import { boolean, index, jsonb, pgPolicy, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core"
import { anonRole, authenticatedRole } from "drizzle-orm/supabase"
import { productReleases } from "./catalog"

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
