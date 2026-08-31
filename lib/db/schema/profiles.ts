// Application-level user data, linked 1:1 to Supabase's own `auth.users`.
//
// Per the corrected direction from Step 1's review: TrackDash does NOT
// store passwords or run its own auth. Supabase Auth is the sole source of
// truth for identity (email, password hash, sessions, providers). This
// table only holds the collector-specific profile data that Supabase Auth
// has no reason to know about.
//
// `authUsers` is Drizzle's own pre-defined reference to Supabase's
// `auth.users` table (from drizzle-orm/supabase) — it lets us declare a
// real foreign key without drizzle-kit trying to (re)create that table,
// since drizzle.config.ts restricts migrations to the `public` schema
// (schemaFilter: ["public"]) where `auth` is managed by Supabase itself.
//
// Deliberately NOT implemented yet (belongs to the future auth step, not
// to schema definition): the `on_auth_user_created` trigger that Supabase's
// docs recommend for auto-inserting a `profiles` row when someone signs up.
// https://supabase.com/docs/guides/auth/managing-user-data

import { relations, sql } from "drizzle-orm"
import { pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { authenticatedRole, authUid, authUsers } from "drizzle-orm/supabase"
import { collectionItems } from "./collection"
import { wishlistItems } from "./wishlist"

export const profiles = pgTable(
  "profiles",
  {
    // Same id as the corresponding auth.users row — this is a 1:1 extension
    // table, not an independent entity, hence PK == FK and no defaultRandom().
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    username: text("username").notNull().unique(),
    country: text("country"),
    avatarUrl: text("avatar_url"),
    collectorLevel: text("collector_level").notNull().default("Starter"),
    preferredCurrency: text("preferred_currency").notNull().default("EUR"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // A user can only see, create, and edit their own profile row. No public
    // read policy: nothing in the current UI needs to show other users'
    // profiles, so the safer default (private) is the one we start with.
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
