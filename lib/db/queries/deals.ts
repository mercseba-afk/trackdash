import "server-only"

import { sql } from "drizzle-orm"
import { db as defaultDb } from "../index"
import type { Database } from "../types"

export type DealOfferStatus = "pending" | "accepted" | "rejected" | "superseded" | "withdrawn"
export type DealStatus = "open" | "cancelled" | "sale_reported" | "confirmed"
export type DealSaleStatus = "pending_confirmation" | "confirmed" | "disputed"
export type DealCurrency = "EUR" | "USD" | "JPY" | "GBP"

export interface DealOfferRow {
  id: string
  conversationId: string
  releaseId: string
  creatorId: string
  condition: string
  amount: number
  currency: DealCurrency
  status: DealOfferStatus
  dealStatus: DealStatus
  respondedAt: string | null
  acceptedAt: string | null
  followupDueAt: string | null
  createdAt: string
  updatedAt: string
}

export interface DealSaleRow {
  id: string
  conversationId: string
  offerId: string
  releaseId: string
  sellerId: string
  buyerId: string
  condition: string
  itemPrice: number
  shippingPrice: number | null
  currency: DealCurrency
  itemPriceEUR: number | null
  fxRateToEUR: number | null
  fxRateDate: string | null
  saleDate: string
  status: DealSaleStatus
  reportedAt: string
  buyerRespondedAt: string | null
  confirmedAt: string | null
  updatedAt: string
}

function n(value: unknown): number | null {
  if (value == null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export async function getConversationOffers(
  conversationId: string,
  dbClient: Database = defaultDb,
): Promise<DealOfferRow[]> {
  const rows = await dbClient.execute(sql<{
    id: string
    conversation_id: string
    release_id: string
    creator_id: string
    condition: string
    amount: string | number
    currency: DealCurrency
    status: DealOfferStatus
    deal_status: DealStatus
    responded_at: Date | string | null
    accepted_at: Date | string | null
    followup_due_at: Date | string | null
    created_at: Date | string
    updated_at: Date | string
  }>`
    select id, conversation_id, release_id, creator_id, condition, amount, currency,
           status, deal_status, responded_at, accepted_at, followup_due_at, created_at, updated_at
    from public.marketplace_offers
    where conversation_id = ${conversationId}::uuid
    order by created_at asc
  `)

  return rows.map((row) => ({
    id: row.id,
    conversationId: row.conversation_id,
    releaseId: row.release_id,
    creatorId: row.creator_id,
    condition: row.condition,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    dealStatus: row.deal_status,
    respondedAt: row.responded_at ? new Date(row.responded_at).toISOString() : null,
    acceptedAt: row.accepted_at ? new Date(row.accepted_at).toISOString() : null,
    followupDueAt: row.followup_due_at ? new Date(row.followup_due_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }))
}

export async function getConversationSale(
  conversationId: string,
  dbClient: Database = defaultDb,
): Promise<DealSaleRow | null> {
  const rows = await dbClient.execute(sql<{
    id: string
    conversation_id: string
    offer_id: string
    release_id: string
    seller_id: string
    buyer_id: string
    condition: string
    item_price: string | number
    shipping_price: string | number | null
    currency: DealCurrency
    item_price_eur: string | number | null
    fx_rate_to_eur: string | number | null
    fx_rate_date: string | null
    sale_date: string
    status: DealSaleStatus
    reported_at: Date | string
    buyer_responded_at: Date | string | null
    confirmed_at: Date | string | null
    updated_at: Date | string
  }>`
    select id, conversation_id, offer_id, release_id, seller_id, buyer_id, condition,
           item_price, shipping_price, currency, item_price_eur, fx_rate_to_eur, fx_rate_date,
           sale_date, status, reported_at, buyer_responded_at, confirmed_at, updated_at
    from public.marketplace_sales
    where conversation_id = ${conversationId}::uuid
    limit 1
  `)
  const row = rows[0]
  if (!row) return null
  return {
    id: row.id,
    conversationId: row.conversation_id,
    offerId: row.offer_id,
    releaseId: row.release_id,
    sellerId: row.seller_id,
    buyerId: row.buyer_id,
    condition: row.condition,
    itemPrice: Number(row.item_price),
    shippingPrice: n(row.shipping_price),
    currency: row.currency,
    itemPriceEUR: n(row.item_price_eur),
    fxRateToEUR: n(row.fx_rate_to_eur),
    fxRateDate: row.fx_rate_date,
    saleDate: row.sale_date,
    status: row.status,
    reportedAt: new Date(row.reported_at).toISOString(),
    buyerRespondedAt: row.buyer_responded_at ? new Date(row.buyer_responded_at).toISOString() : null,
    confirmedAt: row.confirmed_at ? new Date(row.confirmed_at).toISOString() : null,
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

export async function getSaleById(
  saleId: string,
  dbClient: Database = defaultDb,
): Promise<DealSaleRow | null> {
  const rows = await dbClient.execute(sql<{
    conversation_id: string
  }>`select conversation_id from public.marketplace_sales where id = ${saleId}::uuid limit 1`)
  const conversationId = rows[0]?.conversation_id
  if (!conversationId) return null
  return getConversationSale(conversationId, dbClient)
}

export async function createMarketplaceOffer(
  conversationId: string,
  amount: number,
  currency: DealCurrency,
  dbClient: Database = defaultDb,
) {
  const rows = await dbClient.execute(sql<{ offer_id: string }>`
    select public.trackdash_create_marketplace_offer(
      ${conversationId}::uuid,
      ${amount}::numeric,
      ${currency}::text
    ) as offer_id
  `)
  return rows[0]?.offer_id ?? null
}

export async function respondMarketplaceOffer(
  offerId: string,
  decision: "accepted" | "rejected",
  dbClient: Database = defaultDb,
) {
  const rows = await dbClient.execute(sql<{ offer_id: string }>`
    select public.trackdash_respond_marketplace_offer(${offerId}::uuid, ${decision}::text) as offer_id
  `)
  return rows[0]?.offer_id ?? null
}

export async function snoozeMarketplaceFollowup(
  offerId: string,
  dbClient: Database = defaultDb,
) {
  const rows = await dbClient.execute(sql<{ offer_id: string }>`
    select public.trackdash_snooze_marketplace_followup(${offerId}::uuid) as offer_id
  `)
  return rows[0]?.offer_id ?? null
}

export async function cancelMarketplaceDeal(
  offerId: string,
  dbClient: Database = defaultDb,
) {
  const rows = await dbClient.execute(sql<{ offer_id: string }>`
    select public.trackdash_cancel_marketplace_deal(${offerId}::uuid) as offer_id
  `)
  return rows[0]?.offer_id ?? null
}

export interface ReportMarketplaceSaleInput {
  offerId: string
  itemPrice: number
  shippingPrice: number | null
  currency: DealCurrency
  saleDate: string
  itemPriceEUR: number | null
  fxRateToEUR: number | null
  fxRateDate: string | null
}

export async function reportMarketplaceSale(
  input: ReportMarketplaceSaleInput,
  dbClient: Database = defaultDb,
) {
  const rows = await dbClient.execute(sql<{ sale_id: string }>`
    select public.trackdash_report_marketplace_sale(
      ${input.offerId}::uuid,
      ${input.itemPrice}::numeric,
      ${input.shippingPrice}::numeric,
      ${input.currency}::text,
      ${input.saleDate}::date,
      ${input.itemPriceEUR}::numeric,
      ${input.fxRateToEUR}::numeric,
      ${input.fxRateDate}::date
    ) as sale_id
  `)
  return rows[0]?.sale_id ?? null
}

export async function respondMarketplaceSale(
  saleId: string,
  decision: "confirmed" | "disputed",
  dbClient: Database = defaultDb,
) {
  const rows = await dbClient.execute(sql<{ sale_id: string }>`
    select public.trackdash_respond_marketplace_sale(${saleId}::uuid, ${decision}::text) as sale_id
  `)
  return rows[0]?.sale_id ?? null
}
