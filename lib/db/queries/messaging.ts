import "server-only"

import { and, asc, desc, eq, or } from "drizzle-orm"
import { db as defaultDb } from "../index"
import {
  collectionShares,
  collectorBlocks,
  conversations,
  messages,
  profiles,
} from "../schema"
import type { Database } from "../types"

export type ConversationDecision = "accepted" | "declined"

export async function createConversationRequest(
  userId: string,
  collectionShareId: string,
  requestMessage: string,
  dbClient: Database = defaultDb,
) {
  const share = await dbClient.query.collectionShares.findFirst({
    where: eq(collectionShares.id, collectionShareId),
    with: { collector: true },
  })
  if (!share || share.shareMode !== "open_to_offers") {
    throw new Error("This item is no longer open to offers")
  }
  if (share.userId === userId) throw new Error("You cannot message yourself about your own item")

  const requesterProfile = await dbClient.query.profiles.findFirst({ where: eq(profiles.id, userId) })
  if (!requesterProfile) throw new Error("Your collector profile is unavailable")

  const blocked = await dbClient.query.collectorBlocks.findFirst({
    where: or(
      and(eq(collectorBlocks.blockerId, userId), eq(collectorBlocks.blockedId, share.userId)),
      and(eq(collectorBlocks.blockerId, share.userId), eq(collectorBlocks.blockedId, userId)),
    ),
  })
  if (blocked) throw new Error("Messaging is unavailable between these collectors")

  const existing = await dbClient.query.conversations.findFirst({
    where: and(
      eq(conversations.collectionShareId, collectionShareId),
      eq(conversations.requesterId, userId),
    ),
  })
  if (existing) return existing

  const [row] = await dbClient
    .insert(conversations)
    .values({
      collectionShareId,
      productId: share.productId,
      releaseId: share.releaseId,
      ownerId: share.userId,
      requesterId: userId,
      ownerUsername: share.collector.username,
      requesterUsername: requesterProfile.username,
      requestMessage: requestMessage.trim(),
      status: "pending",
    })
    // The database unique index remains the source of truth under concurrent
    // double submits. If another request wins the race, treat this operation
    // as idempotent and return the row that now exists instead of surfacing a
    // raw unique-constraint error to the UI.
    .onConflictDoNothing()
    .returning()

  if (row) return row

  const concurrentExisting = await dbClient.query.conversations.findFirst({
    where: and(
      eq(conversations.collectionShareId, collectionShareId),
      eq(conversations.requesterId, userId),
    ),
  })
  if (concurrentExisting) return concurrentExisting

  throw new Error("Couldn't create this message request")
}

export async function getConversationsForUser(userId: string, dbClient: Database = defaultDb) {
  return dbClient.query.conversations.findMany({
    where: or(eq(conversations.ownerId, userId), eq(conversations.requesterId, userId)),
    with: { product: true, release: true, collectionShare: true },
    orderBy: (fields) => [desc(fields.updatedAt)],
  })
}

export async function getConversationForUser(
  userId: string,
  conversationId: string,
  dbClient: Database = defaultDb,
) {
  return dbClient.query.conversations.findFirst({
    where: and(
      eq(conversations.id, conversationId),
      or(eq(conversations.ownerId, userId), eq(conversations.requesterId, userId)),
    ),
    with: { product: true, release: true, collectionShare: true },
  })
}

export async function respondToConversation(
  ownerId: string,
  conversationId: string,
  decision: ConversationDecision,
  dbClient: Database = defaultDb,
) {
  const [row] = await dbClient
    .update(conversations)
    .set({ status: decision, updatedAt: new Date() })
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.ownerId, ownerId),
        eq(conversations.status, "pending"),
      ),
    )
    .returning()
  if (!row) throw new Error("This request is no longer pending")
  return row
}

export async function getMessagesForConversation(
  conversationId: string,
  dbClient: Database = defaultDb,
) {
  return dbClient.query.messages.findMany({
    where: eq(messages.conversationId, conversationId),
    orderBy: (fields) => [asc(fields.createdAt)],
  })
}

export async function insertMessage(
  senderId: string,
  conversationId: string,
  body: string,
  dbClient: Database = defaultDb,
) {
  const [row] = await dbClient
    .insert(messages)
    .values({ conversationId, senderId, body: body.trim() })
    .returning()
  return row
}

export async function getBlocksForUser(userId: string, dbClient: Database = defaultDb) {
  return dbClient.query.collectorBlocks.findMany({
    where: or(eq(collectorBlocks.blockerId, userId), eq(collectorBlocks.blockedId, userId)),
  })
}

export async function blockCollector(
  blockerId: string,
  blockedId: string,
  dbClient: Database = defaultDb,
) {
  if (blockerId === blockedId) throw new Error("You cannot block yourself")
  const [row] = await dbClient
    .insert(collectorBlocks)
    .values({ blockerId, blockedId })
    .onConflictDoNothing({ target: [collectorBlocks.blockerId, collectorBlocks.blockedId] })
    .returning()
  return row ?? null
}

export async function unblockCollector(
  blockerId: string,
  blockedId: string,
  dbClient: Database = defaultDb,
) {
  await dbClient
    .delete(collectorBlocks)
    .where(and(eq(collectorBlocks.blockerId, blockerId), eq(collectorBlocks.blockedId, blockedId)))
}
