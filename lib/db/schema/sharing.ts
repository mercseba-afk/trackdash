import { relations, sql } from "drizzle-orm"
import { check, index, pgPolicy, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core"
import { authenticatedRole, authUid } from "drizzle-orm/supabase"
import { products, productReleases } from "./catalog"
import { collectionItems } from "./collection"
import { profiles } from "./profiles"

// Public-safe collector identity. This intentionally contains only the fields
// TrackDash may show next to shared collection items. Email, preferences and
// every other private profile field remain in `profiles` behind owner-only RLS.
export const collectorProfiles = pgTable(
  "collector_profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => profiles.id, { onDelete: "cascade" }),
    username: text("username").notNull(),
    country: text("country"),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("collector_profiles_username_unique").on(table.username),
    // These rows are intentionally discoverable by signed-in collectors. The
    // table contains only the public-safe projection above, never the private
    // `profiles` row.
    pgPolicy("collector_profiles_authenticated_read", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
    pgPolicy("collector_profiles_owner_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("collector_profiles_owner_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("collector_profiles_owner_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
  ],
).enableRLS()

// Opt-in public projection of one physical collection row. Private purchase
// data stays in `collection_items`; only identity + condition + sharing intent
// are copied here so public reads never need access to the private parent row.
export const collectionShares = pgTable(
  "collection_shares",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    collectionItemId: uuid("collection_item_id")
      .notNull()
      .references(() => collectionItems.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => collectorProfiles.userId, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    releaseId: uuid("release_id")
      .notNull()
      .references(() => productReleases.id),
    condition: text("condition").notNull(),
    shareMode: text("share_mode").notNull().default("showcase"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("collection_shares_collection_item_unique").on(table.collectionItemId),
    index("idx_collection_shares_user").on(table.userId),
    index("idx_collection_shares_product").on(table.productId),
    index("idx_collection_shares_release").on(table.releaseId),
    check("collection_shares_mode_check", sql`${table.shareMode} in ('showcase', 'open_to_offers')`),
    check(
      "collection_shares_condition_check",
      sql`${table.condition} in ('Sealed', 'New / Opened', 'Built', 'Used', 'Incomplete')`,
    ),
    pgPolicy("collection_shares_authenticated_read", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
    // A caller may only share a collection row they actually own, and the
    // public snapshot must exactly match that private row's product/release/
    // condition. This blocks forged "I own this release" API writes.
    pgPolicy("collection_shares_owner_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid} and exists (
        select 1 from ${collectionItems}
        where ${collectionItems.id} = ${table.collectionItemId}
          and ${collectionItems.userId} = ${authUid}
          and ${collectionItems.productId} = ${table.productId}
          and ${collectionItems.releaseId} = ${table.releaseId}
          and ${collectionItems.condition} = ${table.condition}
      )`,
    }),
    pgPolicy("collection_shares_owner_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid} and exists (
        select 1 from ${collectionItems}
        where ${collectionItems.id} = ${table.collectionItemId}
          and ${collectionItems.userId} = ${authUid}
          and ${collectionItems.productId} = ${table.productId}
          and ${collectionItems.releaseId} = ${table.releaseId}
          and ${collectionItems.condition} = ${table.condition}
      )`,
    }),
    pgPolicy("collection_shares_owner_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
  ],
).enableRLS()

export const collectorProfilesRelations = relations(collectorProfiles, ({ one, many }) => ({
  privateProfile: one(profiles, { fields: [collectorProfiles.userId], references: [profiles.id] }),
  shares: many(collectionShares),
}))

export const collectionSharesRelations = relations(collectionShares, ({ one }) => ({
  collector: one(collectorProfiles, {
    fields: [collectionShares.userId],
    references: [collectorProfiles.userId],
  }),
  collectionItem: one(collectionItems, {
    fields: [collectionShares.collectionItemId],
    references: [collectionItems.id],
  }),
  product: one(products, { fields: [collectionShares.productId], references: [products.id] }),
  release: one(productReleases, {
    fields: [collectionShares.releaseId],
    references: [productReleases.id],
  }),
}))
