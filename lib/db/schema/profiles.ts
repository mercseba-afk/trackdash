// Application-level user data, linked 1:1 to Supabase's own `auth.users`.
//
// TrackDash does NOT store passwords or run its own auth. Supabase Auth is the
// sole source of truth for identity. This table only holds collector-specific
// profile/preferences data.

import { relations, sql } from "drizzle-orm"
import { check, pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { authenticatedRole, authUid, authUsers } from "drizzle-orm/supabase"
import { collectionItems } from "./collection"
import { wishlistItems } from "./wishlist"

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    username: text("username").notNull().unique(),
    country: text("country"),
    avatarUrl: text("avatar_url"),
    collectorLevel: text("collector_level").notNull().default("Starter"),
    preferredCurrency: text("preferred_currency").notNull().default("EUR"),
    preferredLocale: text("preferred_locale").notNull().default("en"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("profiles_preferred_locale_check", sql`${table.preferredLocale} in ('en', 'it')`),
    pgPolicy("profiles_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.id} = ${authUid}`,
    }),
    pgPolicy("profiles_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.id} = ${authUid}`,
    }),
    pgPolicy("profiles_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.id} = ${authUid}`,
      withCheck: sql`${table.id} = ${authUid}`,
    }),
  ],
).enableRLS()

export const profilesRelations = relations(profiles, ({ many }) => ({
  collectionItems: many(collectionItems),
  wishlistItems: many(wishlistItems),
}))
