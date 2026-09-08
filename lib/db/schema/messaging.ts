import { relations, sql } from "drizzle-orm"
import { check, index, pgPolicy, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core"
import { authenticatedRole, authUid } from "drizzle-orm/supabase"
import { products, productReleases } from "./catalog"
import { profiles } from "./profiles"
import { collectionShares } from "./sharing"

export const collectorBlocks = pgTable(
  "collector_blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    blockerId: uuid("blocker_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    blockedId: uuid("blocked_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("collector_blocks_pair_unique").on(table.blockerId, table.blockedId),
    index("idx_collector_blocks_blocked").on(table.blockedId),
    check("collector_blocks_not_self_check", sql`${table.blockerId} <> ${table.blockedId}`),
    pgPolicy("collector_blocks_participant_read", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.blockerId} = ${authUid} or ${table.blockedId} = ${authUid}`,
    }),
    pgPolicy("collector_blocks_owner_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.blockerId} = ${authUid} and ${table.blockedId} <> ${authUid}`,
    }),
    pgPolicy("collector_blocks_owner_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${table.blockerId} = ${authUid}`,
    }),
  ],
).enableRLS()

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Nullable because a collector may later stop sharing the item. The
    // conversation retains its safe Product/Release snapshot and history.
    collectionShareId: uuid("collection_share_id").references(() => collectionShares.id, { onDelete: "set null" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    releaseId: uuid("release_id")
      .notNull()
      .references(() => productReleases.id),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    requesterId: uuid("requester_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    // Public-safe identity snapshots avoid ever exposing another user's
    // owner-only `profiles` row to the opposite participant.
    ownerUsername: text("owner_username").notNull(),
    requesterUsername: text("requester_username").notNull(),
    requestMessage: text("request_message").notNull(),
    status: text("status").notNull().default("pending"),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("conversations_share_requester_unique")
      .on(table.collectionShareId, table.requesterId)
      .where(sql`${table.collectionShareId} is not null`),
    index("idx_conversations_owner_status").on(table.ownerId, table.status, table.updatedAt),
    index("idx_conversations_requester_status").on(table.requesterId, table.status, table.updatedAt),
    check("conversations_participants_distinct_check", sql`${table.ownerId} <> ${table.requesterId}`),
    check("conversations_status_check", sql`${table.status} in ('pending', 'accepted', 'declined')`),
    check("conversations_request_message_check", sql`char_length(btrim(${table.requestMessage})) between 1 and 1000`),
    pgPolicy("conversations_participant_read", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.ownerId} = ${authUid} or ${table.requesterId} = ${authUid}`,
    }),
    pgPolicy("conversations_requester_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.requesterId} = ${authUid}
        and ${table.ownerId} <> ${authUid}
        and ${table.status} = 'pending'
        and ${table.respondedAt} is null
        and ${table.collectionShareId} is not null
        and exists (
          select 1 from ${collectionShares} s
          where s.id = ${table.collectionShareId}
            and s.user_id = ${table.ownerId}
            and s.product_id = ${table.productId}
            and s.release_id = ${table.releaseId}
            and s.share_mode = 'open_to_offers'
        )
        and exists (
          select 1 from ${profiles} p
          where p.id = ${authUid} and p.username = ${table.requesterUsername}
        )
        and not exists (
          select 1 from ${collectorBlocks} b
          where (b.blocker_id = ${table.requesterId} and b.blocked_id = ${table.ownerId})
             or (b.blocker_id = ${table.ownerId} and b.blocked_id = ${table.requesterId})
        )`,
    }),
    pgPolicy("conversations_owner_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.ownerId} = ${authUid}`,
      withCheck: sql`${table.ownerId} = ${authUid}
        and (
          ${table.status} <> 'accepted'
          or (
            ${table.collectionShareId} is not null
            and exists (
              select 1 from ${collectionShares} s
              where s.id = ${table.collectionShareId}
                and s.user_id = ${table.ownerId}
                and s.share_mode = 'open_to_offers'
            )
            and not exists (
              select 1 from ${collectorBlocks} b
              where (b.blocker_id = ${table.requesterId} and b.blocked_id = ${table.ownerId})
                 or (b.blocker_id = ${table.ownerId} and b.blocked_id = ${table.requesterId})
            )
          )
        )`,
    }),
  ],
).enableRLS()

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_messages_conversation_created").on(table.conversationId, table.createdAt),
    check("messages_body_check", sql`char_length(btrim(${table.body})) between 1 and 2000`),
    pgPolicy("messages_participant_read", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from ${conversations} c
        where c.id = ${table.conversationId}
          and (c.owner_id = ${authUid} or c.requester_id = ${authUid})
      )`,
    }),
    pgPolicy("messages_participant_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.senderId} = ${authUid}
        and exists (
          select 1 from ${conversations} c
          where c.id = ${table.conversationId}
            and c.status = 'accepted'
            and (c.owner_id = ${authUid} or c.requester_id = ${authUid})
            and not exists (
              select 1 from ${collectorBlocks} b
              where (b.blocker_id = c.requester_id and b.blocked_id = c.owner_id)
                 or (b.blocker_id = c.owner_id and b.blocked_id = c.requester_id)
            )
        )`,
    }),
  ],
).enableRLS()

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  collectionShare: one(collectionShares, {
    fields: [conversations.collectionShareId],
    references: [collectionShares.id],
  }),
  product: one(products, { fields: [conversations.productId], references: [products.id] }),
  release: one(productReleases, { fields: [conversations.releaseId], references: [productReleases.id] }),
  messages: many(messages),
}))

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
}))
