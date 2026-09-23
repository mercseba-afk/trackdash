import { sql } from "drizzle-orm"
import { index, jsonb, pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
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
