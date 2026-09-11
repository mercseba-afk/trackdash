import "server-only"

import { sql } from "drizzle-orm"
import { db as defaultDb } from "../index"
import type { Database } from "../types"

export type DealOfferStatus = "pending" | "accepted" | "rejected" | "superseded" | "withdrawn"
export type DealStatus = "open" | "cancelled" | "sale_reported" | "confirmed"
export type DealSaleStatus = "pending_confirmation" | "confirmed" | "disputed"
export type DealCurrency = "EUR" | "USD" | "JPY" | "GBP"

type SqlDate = string | Date

interface OfferSqlRow {
  id: string
  conversation_id: string
  release_id: string
  creator_id: string
  condition: string
  amount: string | number
  currency: DealCurrency
  status: DealOfferStatus
  deal_status: DealStatus
  responded_at: SqlDate | null
  accepted_at: SqlDate | null
  followup_due_at: SqlDate | null
  created_at: SqlDate
  updated_at: SqlDate
}

interface SaleSqlRow {
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
  reported_at: SqlDate
  buyer_responded_at: SqlDate | null
  confirmed_at: SqlDate | null
  updated_at: SqlDate
}

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

function iso(value: SqlDate): string {
  return new Date(value).toISOString()
}

export async function getConversationOffers(
  conversationId: string,
  dbClient: Database = defaultDb,
): Promise<DealOfferRow[]> {
  const result = await dbClient.execute(sql`
    select id, conversation_id, release_id, creator_id, condition, amount, currency,
           status, deal_status, responded_at, accepted_at, followup_due_at, created_at, updated_at
    from public.marketplace_offers
    where conversation_id = ${conversationId}::uuid
    order by created_at asc
  `)
  const rows = result as unknown as OfferSqlRow[]

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
    respondedAt: row.responded_at ? iso(row.responded_at) : null,
    acceptedAt: row.accepted_at ? iso(row.accepted_at) : null,
    followupDueAt: row.followup_due_at ? iso(row.followup_due_at) : null,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  }))
}

export async function getConversationSale(
  conversationId: string,
  dbClient: Database = defaultDb,
): Promise<DealSaleRow | null> {
  const result = await dbClient.execute(sql`
    select id, conversation_id, offer_id, release_id, seller_id, buyer_id, condition,
           item_price, shipping_price, currency, item_price_eur, fx_rate_to_eur, fx_rate_date,
           sale_date, status, reported_at, buyer_responded_at, confirmed_at, updated_at
    from public.marketplace_sales
    where conversation_id = ${conversationId}::uuid
    limit 1
  `)
  const row = (result as unknown as SaleSqlRow[])[0]
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
    reportedAt: iso(row.reported_at),
    buyerRespondedAt: row.buyer_responded_at ? iso(row.buyer_responded_at) : null,
    confirmedAt: row.confirmed_at ? iso(row.confirmed_at) : null,
    updatedAt: iso(row.updated_at),
  }
}

export async function getSaleById(
  saleId: string,
  dbClient: Database = defaultDb,
): Promise<DealSaleRow | null> {
  const result = await dbClient.execute(sql`select conversation_id from public.marketplace_sales where id = ${saleId}::uuid limit 1`)
  const row = (result as unknown as Array<{ conversation_id: string }>)[0]
  return row?.conversation_id ? getConversationSale(row.conversation_id, dbClient) : null
}

function scalarUuid(result: unknown, key: string): string | null {
  const row = (result as Array<Record<string, unknown>>)[0]
  const value = row?.[key]
  return typeof value === "string" && value ? value : null
}

export async function createMarketplaceOffer(
  conversationId: string,
  amount: number,
  currency: DealCurrency,
  dbClient: Database = defaultDb,
): Promise<string | null> {
  const result = await dbClient.execute(sql`
    select public.trackdash_create_marketplace_offer(
      ${conversationId}::uuid,
      ${amount}::numeric,
      ${currency}::text
    ) as offer_id
  `)
  return scalarUuid(result, "offer_id")
}

export async function respondMarketplaceOffer(
  offerId: string,
  decision: "accepted" | "rejected",
  dbClient: Database = defaultDb,
): Promise<string | null> {
  const result = await dbClient.execute(sql`
    select public.trackdash_respond_marketplace_offer(${offerId}::uuid, ${decision}::text) as offer_id
  `)
  return scalarUuid(result, "offer_id")
}

export async function snoozeMarketplaceFollowup(
  offerId: string,
  dbClient: Database = defaultDb,
): Promise<string | null> {
  const result = await dbClient.execute(sql`
    select public.trackdash_snooze_marketplace_followup(${offerId}::uuid) as offer_id
  `)
  return scalarUuid(result, "offer_id")
}

export async function cancelMarketplaceDeal(
  offerId: string,
  dbClient: Database = defaultDb,
): Promise<string | null> {
  const result = await dbClient.execute(sql`
    select public.trackdash_cancel_marketplace_deal(${offerId}::uuid) as offer_id
  `)
  return scalarUuid(result, "offer_id")
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
): Promise<string | null> {
  const result = await dbClient.execute(sql`
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
  return scalarUuid(result, "sale_id")
}

export async function respondMarketplaceSale(
  saleId: string,
  decision: "confirmed" | "disputed",
  dbClient: Database = defaultDb,
): Promise<string | null> {
  const result = await dbClient.execute(sql`
    select public.trackdash_respond_marketplace_sale(${saleId}::uuid, ${decision}::text) as sale_id
  `)
  return scalarUuid(result, "sale_id")
}
