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
  getUnreadMessagingCount,
  insertMessage,
  markConversationRead,
  respondToConversation,
  unblockCollector,
  type ConversationDecision,
} from "@/lib/db/queries/messaging"
import {
  cancelMarketplaceDeal,
  createMarketplaceOffer,
  getConversationOffers,
  getConversationSale,
  getSaleById,
  reportMarketplaceSale,
  respondMarketplaceOffer,
  respondMarketplaceSale,
  snoozeMarketplaceFollowup,
  type DealCurrency,
} from "@/lib/db/queries/deals"
import { getUnreadDealNotificationCount } from "@/lib/db/queries/deal-notifications"
import { resolveHistoricalEurBasis } from "@/lib/fx/ecb"
import { recomputeReleaseMarketSignal } from "@/lib/market/pipeline/market-r3-service"
import type { MarketCondition } from "@/lib/market/pipeline/types"

const DEAL_CURRENCIES = new Set<DealCurrency>(["EUR", "USD", "JPY", "GBP"])

function cleanMessage(value: string, max: number) {
  const body = value.trim()
  if (!body) throw new Error("Message cannot be empty")
  if (body.length > max) throw new Error(`Message is too long (max ${max} characters)`)
  return body
}

function cleanCurrency(value: string): DealCurrency {
  const currency = value.trim().toUpperCase() as DealCurrency
  if (!DEAL_CURRENCIES.has(currency)) throw new Error("Unsupported currency")
  return currency
}

function cleanPositiveAmount(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${label} must be positive`)
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function cleanOptionalNonNegativeAmount(value: number | null | undefined, label: string) {
  if (value == null) return null
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} cannot be negative`)
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function cleanSaleDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Invalid sale date")
  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error("Invalid sale date")
  if (value > new Date().toISOString().slice(0, 10)) throw new Error("Sale date cannot be in the future")
  return value
}

function marketConditionForCollection(condition: string): MarketCondition {
  if (condition === "Sealed" || condition === "New / Opened") return "new_complete_unbuilt"
  if (condition === "Built" || condition === "Used") return "built_complete"
  if (condition === "Incomplete") return "incomplete_parts_custom"
  return "unknown"
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
      const rawAskingPrice = row.collectionShare?.askingPrice

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
        askingPrice: rawAskingPrice == null ? null : Number(rawAskingPrice),
        askingCurrency: (row.collectionShare?.askingCurrency ?? null) as DealCurrency | null,
        condition: row.collectionShare?.condition ?? null,
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

export async function getUnreadMessagingCountAction() {
  const user = await getCurrentUser()
  if (!user) return 0
  return withUserContext(user.id, async (tx) => {
    const [messages, deals] = await Promise.all([
      getUnreadMessagingCount(user.id, tx),
      getUnreadDealNotificationCount(user.id, tx),
    ])
    return messages + deals
  })
}

export async function markConversationReadAction(conversationId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")

  await withUserContext(user.id, async (tx) => {
    const conversation = await getConversationForUser(user.id, conversationId, tx)
    if (!conversation) throw new Error("Conversation not found")
    await markConversationRead(user.id, conversationId, tx)
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

export async function getConversationDealAction(conversationId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")
  return withUserContext(user.id, async (tx) => {
    const conversation = await getConversationForUser(user.id, conversationId, tx)
    if (!conversation) throw new Error("Conversation not found")
    const [offers, sale] = await Promise.all([
      getConversationOffers(conversationId, tx),
      getConversationSale(conversationId, tx),
    ])
    return { offers, sale }
  })
}

export async function createMarketplaceOfferAction(conversationId: string, amount: number, currency: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")
  const cleanAmount = cleanPositiveAmount(amount, "Offer amount")
  const cleanCode = cleanCurrency(currency)
  const id = await withUserContext(user.id, (tx) => createMarketplaceOffer(conversationId, cleanAmount, cleanCode, tx))
  if (!id) throw new Error("Couldn't create offer")
  return { id }
}

export async function respondMarketplaceOfferAction(offerId: string, decision: "accepted" | "rejected") {
  if (decision !== "accepted" && decision !== "rejected") throw new Error("Invalid decision")
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")
  const id = await withUserContext(user.id, (tx) => respondMarketplaceOffer(offerId, decision, tx))
  if (!id) throw new Error("Couldn't update offer")
  return { id }
}

export async function snoozeMarketplaceFollowupAction(offerId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")
  const id = await withUserContext(user.id, (tx) => snoozeMarketplaceFollowup(offerId, tx))
  if (!id) throw new Error("Couldn't postpone follow-up")
  return { id }
}

export async function cancelMarketplaceDealAction(offerId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")
  const id = await withUserContext(user.id, (tx) => cancelMarketplaceDeal(offerId, tx))
  if (!id) throw new Error("Couldn't cancel deal")
  return { id }
}

export async function reportMarketplaceSaleAction(input: {
  offerId: string
  itemPrice: number
  shippingPrice?: number | null
  currency: string
  saleDate: string
}) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")
  const itemPrice = cleanPositiveAmount(input.itemPrice, "Final item price")
  const shippingPrice = cleanOptionalNonNegativeAmount(input.shippingPrice, "Shipping")
  const currency = cleanCurrency(input.currency)
  const saleDate = cleanSaleDate(input.saleDate)
  const basis = await resolveHistoricalEurBasis(itemPrice, currency, saleDate)

  const id = await withUserContext(user.id, (tx) => reportMarketplaceSale({
    offerId: input.offerId,
    itemPrice,
    shippingPrice,
    currency,
    saleDate,
    itemPriceEUR: basis.amountEUR,
    fxRateToEUR: basis.fxRateToEUR,
    fxRateDate: basis.fxRateDate,
  }, tx))
  if (!id) throw new Error("Couldn't report sale")
  return { id }
}

export async function respondMarketplaceSaleAction(saleId: string, decision: "confirmed" | "disputed") {
  if (decision !== "confirmed" && decision !== "disputed") throw new Error("Invalid decision")
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")

  const sale = await withUserContext(user.id, async (tx) => {
    const id = await respondMarketplaceSale(saleId, decision, tx)
    if (!id) throw new Error("Couldn't update sale")
    return getSaleById(id, tx)
  })
  if (!sale) throw new Error("Sale not found")

  if (decision === "confirmed" && sale.itemPriceEUR != null) {
    try {
      await recomputeReleaseMarketSignal(
        sale.releaseId,
        marketConditionForCollection(sale.condition),
      )
    } catch (error) {
      console.error("[marketplace-sale] confirmed sale stored but market recompute failed", error)
    }
  }

  return { id: sale.id, status: decision }
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
