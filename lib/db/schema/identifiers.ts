import { sql } from "drizzle-orm"
import { boolean, check, date, index, pgPolicy, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core"
import { anonRole, authenticatedRole } from "drizzle-orm/supabase"
import { productReleases } from "./catalog"

// Generic exact identifiers for any collectible Release.
// Existing Mini 4WD item_number / barcode_jan columns remain authoritative
// for the current scanner and are not rewritten by this table. New verticals
// can use multiple identifier schemes without adding one column per provider.
export const releaseIdentifiers = pgTable(
  "release_identifiers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    releaseId: uuid("release_id")
      .notNull()
      .references(() => productReleases.id, { onDelete: "cascade" }),
    scheme: text("scheme").notNull(),
    value: text("value").notNull(),
    market: text("market"),
    isPrimary: boolean("is_primary").notNull().default(false),
    verificationStatus: text("verification_status").notNull().default("unverified"),
    sourceUrl: text("source_url"),
    checkedAt: date("checked_at"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_release_identifiers_release").on(table.releaseId),
    index("idx_release_identifiers_lookup").on(table.scheme, table.value),
    unique("release_identifiers_release_scheme_value_market_unique")
      .on(table.releaseId, table.scheme, table.value, table.market)
      .nullsNotDistinct(),
    check(
      "release_identifiers_verification_status_check",
      sql`${table.verificationStatus} in ('verified', 'partial', 'unverified')`,
    ),
    pgPolicy("release_identifiers_public_read", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS()
