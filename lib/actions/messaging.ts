"use server"

import { getCurrentUser } from "@/lib/auth/current-user"
import { withUserContext } from "@/lib/db/rls"
import {
  blockCollector,
  createConversationRequest,
  getBlocksForUser,
  getConversationForUser,
  getConversationsForUser,
  getMessagesForConversation,
  insertMessage,
  respondToConversation,
  unblockCollector,
  type ConversationDecision,
} from "@/lib/db/queries/messaging"

function cleanMessage(value: string, max: number) {
  const body = value.trim()
  if (!body) throw new Error("Message cannot be empty")
  if (body.length > max) throw new Error(`Message is too long (max ${max} characters)`)
  return body
}

function hasBlockBetween(
  userId: string,
  otherUserId: string,
  blocks: Awaited<ReturnType<typeof getBlocksForUser>>,
) {
  return blocks.some(
    (block) =>
      (block.blockerId === userId && block.blockedId === otherUserId) ||
      (block.blockerId === otherUserId && block.blockedId === userId),
  )
}

export async function createConversationRequestAction(collectionShareId: string, message: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")
  const requestMessage = cleanMessage(message, 1000)

  const row = await withUserContext(user.id, (tx) =>
    createConversationRequest(user.id, collectionShareId, requestMessage, tx),
  )
  return { id: row.id, status: row.status }
}

export async function getMyConversationsAction() {
  const user = await getCurrentUser()
  if (!user) return []

  return withUserContext(user.id, async (tx) => {
    const [rows, blocks] = await Promise.all([
      getConversationsForUser(user.id, tx),
      getBlocksForUser(user.id, tx),
    ])

    return rows.map((row) => {
      const isOwner = row.ownerId === user.id
      const otherUserId = isOwner ? row.requesterId : row.ownerId
      const blockedByMe = blocks.some((block) => block.blockerId === user.id && block.blockedId === otherUserId)
      const blockedByThem = blocks.some((block) => block.blockerId === otherUserId && block.blockedId === user.id)
      const offerStillOpen = row.collectionShare?.shareMode === "open_to_offers"

      return {
        id: row.id,
        status: row.status as "pending" | "accepted" | "declined",
        isOwner,
        otherUserId,
        otherUsername: isOwner ? row.requesterUsername : row.ownerUsername,
        requestMessage: row.requestMessage,
        blockedByMe,
        blockedByThem,
        canAccept: isOwner && row.status === "pending" && offerStillOpen && !blockedByMe && !blockedByThem,
        offerStillOpen,
        product: { id: row.product.id, name: row.product.name },
        release: {
          id: row.release.id,
          editionName: row.release.editionName,
          itemNumber: row.release.itemNumber ?? undefined,
        },
        createdAt: row.createdAt.toISOString(),
        respondedAt: row.respondedAt?.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }
    })
  })
}

export async function getConversationMessagesAction(conversationId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")

  return withUserContext(user.id, async (tx) => {
    const conversation = await getConversationForUser(user.id, conversationId, tx)
    if (!conversation) throw new Error("Conversation not found")

    const rows = await getMessagesForConversation(conversationId, tx)
    return rows.map((row) => ({
      id: row.id,
      senderId: row.senderId,
      body: row.body,
      createdAt: row.createdAt.toISOString(),
    }))
  })
}

export async function respondConversationAction(conversationId: string, decision: ConversationDecision) {
  if (decision !== "accepted" && decision !== "declined") throw new Error("Invalid decision")
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")

  const row = await withUserContext(user.id, (tx) =>
    respondToConversation(user.id, conversationId, decision, tx),
  )
  return { id: row.id, status: row.status }
}

export async function sendMessageAction(conversationId: string, message: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")
  const body = cleanMessage(message, 2000)

  try {
    return await withUserContext(user.id, async (tx) => {
      const conversation = await getConversationForUser(user.id, conversationId, tx)
      if (!conversation || conversation.status !== "accepted") {
        return { ok: false as const, reason: "closed" as const }
      }

      const otherUserId = conversation.ownerId === user.id ? conversation.requesterId : conversation.ownerId
      const blocks = await getBlocksForUser(user.id, tx)
      if (hasBlockBetween(user.id, otherUserId, blocks)) {
        return { ok: false as const, reason: "blocked" as const }
      }

      const row = await insertMessage(user.id, conversationId, body, tx)
      return {
        ok: true as const,
        message: {
          id: row.id,
          senderId: row.senderId,
          body: row.body,
          createdAt: row.createdAt.toISOString(),
        },
      }
    })
  } catch (error) {
    // A block can be created between the pre-check and INSERT. RLS correctly
    // rejects that INSERT; convert only that newly-valid business state into
    // a controlled response instead of leaking a production Server Action error.
    const state = await withUserContext(user.id, async (tx) => {
      const conversation = await getConversationForUser(user.id, conversationId, tx)
      if (!conversation || conversation.status !== "accepted") return "closed" as const

      const otherUserId = conversation.ownerId === user.id ? conversation.requesterId : conversation.ownerId
      const blocks = await getBlocksForUser(user.id, tx)
      return hasBlockBetween(user.id, otherUserId, blocks) ? ("blocked" as const) : null
    })

    if (state) return { ok: false as const, reason: state }
    throw error
  }
}

export async function blockCollectorAction(otherUserId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")
  await withUserContext(user.id, (tx) => blockCollector(user.id, otherUserId, tx))
}

export async function unblockCollectorAction(otherUserId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")
  await withUserContext(user.id, (tx) => unblockCollector(user.id, otherUserId, tx))
}
