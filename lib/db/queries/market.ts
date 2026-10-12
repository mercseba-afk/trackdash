import "server-only"

import { and, eq, inArray } from "drizzle-orm"
import { createAdminClient } from "@/lib/supabase/admin"
import { normalizeMarketListingKey } from "@/lib/market/representative-asking"
import type { InferSelectModel } from "drizzle-orm"
import { db } from "../index"
import {
  MARKETPLACE_OFFER_MAX_AGE_HOURS,
  RETAIL_OFFER_MAX_AGE_HOURS,
} from "@/lib/market/pipeline/market-publication-policy"
import {
  marketEstimates,
  marketOfferStates,
  priceSources,
  marketReleaseMonthlySignals,
  marketReleaseSignals,
  marketValueHistory,
  pricePoints,
  productReleases,
} from "../schema"

export const COLLECTOR_VALUE_CONDITION = "new_complete_unbuilt"

export type PricePoint = InferSelectModel<typeof pricePoints>
export type MarketEstimate = InferSelectModel<typeof marketEstimates>
export type MarketValueHistoryPoint = InferSelectModel<typeof marketValueHistory>
export type MarketReleaseSignal = InferSelectModel<typeof marketReleaseSignals>
export type MarketReleaseMonthlySignal = InferSelectModel<typeof marketReleaseMonthlySignals>

export interface CurrentObservedOfferRow {
  candidateId: string
  releaseId: string
  sourceId: string
  channel: string
  itemPriceEUR: string
  shippingEUR: string | null
  effectiveCostEUR: string | null
  costBasis: string
  lastCheckedAt: Date
  /** Seller's verified shipping origin, never eBay marketplace country. */
  originCountry: string | null
  sourceMarketRegion: string | null
  /** Private, server-side-only metadata for deduplicated representative ASK. */
  listingKey: string | null
  sellerFingerprint: string | null
  acceptedExactKit: boolean
}

// Normalized completed-sale observations only. Candidate/raw listing evidence stays
// behind the service-only market_candidates boundary.
export async function getPricePointsForRelease(releaseId: string, limit = 50) {
  return db.query.pricePoints.findMany({
    where: and(eq(pricePoints.releaseId, releaseId), eq(pricePoints.status, "active")),
    with: { source: true },
    orderBy: (fields, { desc }) => [desc(fields.soldOn), desc(fields.soldAt), desc(fields.createdAt)],
    limit,
  })
}

// Legacy completed-sale-only estimate kept for audit/backward compatibility.
export async function getMarketEstimateForRelease(
  releaseId: string,
  condition = COLLECTOR_VALUE_CONDITION,
) {
  return db.query.marketEstimates.findFirst({
    where: and(eq(marketEstimates.releaseId, releaseId), eq(marketEstimates.condition, condition)),
  })
}

export async function listMarketEstimatesForRelease(releaseId: string) {
  return db.query.marketEstimates.findMany({
    where: eq(marketEstimates.releaseId, releaseId),
  })
}

// R3 composite current signal. This is the canonical current market surface:
// retail in stock + active fixed-price marketplace + completed-sale evidence.
export async function getMarketSignalForRelease(
  releaseId: string,
  condition = COLLECTOR_VALUE_CONDITION,
) {
  return db.query.marketReleaseSignals.findFirst({
    where: and(
      eq(marketReleaseSignals.releaseId, releaseId),
      eq(marketReleaseSignals.condition, condition),
    ),
  })
}

// Public app surfaces need the same R3 rows as the Release page. Keep this query
// centralized so Scanner/Dashboard/Collection/Wishlist/Market cannot drift back
// to a separate pricing engine. With no ids supplied it returns every current
// collector-condition signal; callers may optionally request only known releases.
export async function listMarketSignals(
  releaseIds?: string[],
  condition = COLLECTOR_VALUE_CONDITION,
) {
  if (releaseIds && releaseIds.length === 0) return []

  return db.query.marketReleaseSignals.findMany({
    where: releaseIds
      ? and(
          eq(marketReleaseSignals.condition, condition),
          inArray(marketReleaseSignals.releaseId, releaseIds),
        )
      : eq(marketReleaseSignals.condition, condition),
  })
}


export async function listCurrentObservedOffers(
  releaseIds?: string[],
  condition = COLLECTOR_VALUE_CONDITION,
): Promise<CurrentObservedOfferRow[]> {
  if (releaseIds && releaseIds.length === 0) return []

  const where = releaseIds
    ? and(
        eq(marketOfferStates.condition, condition),
        inArray(marketOfferStates.releaseId, releaseIds),
        inArray(marketOfferStates.availability, ["in_stock", "low_stock"]),
      )
    : and(
        eq(marketOfferStates.condition, condition),
        inArray(marketOfferStates.availability, ["in_stock", "low_stock"]),
      )

  const offers = await db
    .select({
      candidateId: marketOfferStates.candidateId,
      releaseId: marketOfferStates.releaseId,
      sourceId: marketOfferStates.sourceId,
      channel: marketOfferStates.channel,
      itemPriceEUR: marketOfferStates.itemPriceEUR,
      shippingEUR: marketOfferStates.shippingEUR,
      effectiveCostEUR: marketOfferStates.effectiveCostEUR,
      costBasis: marketOfferStates.costBasis,
      lastCheckedAt: marketOfferStates.lastCheckedAt,
      sourceMarketRegion: priceSources.marketRegion,
    })
    .from(marketOfferStates)
    .leftJoin(priceSources, eq(priceSources.id, marketOfferStates.sourceId))
    .where(where)

  // market_candidates is private (no public read privileges). Never join it
  // with the public Drizzle connection: a permission error otherwise blanks
  // all pricing surfaces, including perfectly valid SOLD-based Market Values.
  // Enrich only origin metadata with the service client; fail closed to
  // unknown origin if this optional lookup is unavailable.
  const candidates = new Map<string, {
    originCountry: string | null
    listingKey: string | null
    sellerFingerprint: string | null
    acceptedExactKit: boolean
    resolvedReleaseId: string | null
  }>()
  const ids = [...new Set(offers.map((row) => row.candidateId).filter(Boolean))]
  try {
    const admin = createAdminClient()
    for (let offset = 0; offset < ids.length; offset += 200) {
      const { data, error } = await admin
        .from("market_candidates")
        .select("id,raw_payload,source_record_key,external_listing_id,seller_fingerprint,decision,condition,is_lot,is_complete,resolved_release_id")
        .in("id", ids.slice(offset, offset + 200))
      if (error) throw error
      for (const row of data ?? []) {
        const payload = row.raw_payload
        const country = payload && typeof payload === "object" && !Array.isArray(payload)
          ? (payload as Record<string, unknown>).itemLocationCountry : null
        const knownCountry = typeof country === "string" && /^[A-Z]{2}$/.test(country) ? country : null
        // eBay may store v1|123456789012|0 and legacy 123456789012 for
        // the SAME listing. Normalize its numeric item ID before deduping.
        const externalId = row.external_listing_id ?? row.source_record_key ?? ""
        candidates.set(row.id, {
          originCountry: knownCountry,
          listingKey: normalizeMarketListingKey(externalId),
          sellerFingerprint: row.seller_fingerprint ?? null,
          acceptedExactKit: row.decision === "accepted" &&
            row.condition === condition && row.is_lot === false && row.is_complete === true &&
            typeof row.resolved_release_id === "string",
          resolvedReleaseId: row.resolved_release_id ?? null,
        })
      }
    }
  } catch (error) {
    console.error("[public-market] optional origin enrichment failed", error instanceof Error ? error.message : String(error))
  }

  return offers.map((row) => {
    const candidate = candidates.get(row.candidateId)
    return {
      ...row,
      originCountry: candidate?.originCountry ?? null,
      listingKey: candidate?.listingKey ?? null,
      sellerFingerprint: candidate?.sellerFingerprint ?? null,
      acceptedExactKit: Boolean(candidate?.acceptedExactKit && candidate.resolvedReleaseId === row.releaseId),
    }
  })
}

export async function getMarketMonthlySignalsForRelease(
  releaseId: string,
  condition = COLLECTOR_VALUE_CONDITION,
  limit = 60,
) {
  return db.query.marketReleaseMonthlySignals.findMany({
    where: and(
      eq(marketReleaseMonthlySignals.releaseId, releaseId),
      eq(marketReleaseMonthlySignals.condition, condition),
    ),
    orderBy: (fields, { desc }) => [desc(fields.month)],
    limit,
  })
}

export async function listMarketMonthlySignals(
  releaseIds?: string[],
  condition = COLLECTOR_VALUE_CONDITION,
) {
  if (releaseIds && releaseIds.length === 0) return []

  return db.query.marketReleaseMonthlySignals.findMany({
    where: releaseIds
      ? and(
          eq(marketReleaseMonthlySignals.condition, condition),
          inArray(marketReleaseMonthlySignals.releaseId, releaseIds),
        )
      : eq(marketReleaseMonthlySignals.condition, condition),
    orderBy: (fields, { asc }) => [asc(fields.releaseId), asc(fields.month)],
  })
}

// Product cards show the cheapest CURRENT PURCHASABLE Release item price only.
// Sold evidence and out-of-stock retail can influence Market Value/trend but can
// never masquerade as "Da"/"From". Shipping remains separate provenance and
// never gets folded into this clean item-price headline.
export async function getCatalogStartingPrices(): Promise<Record<string, number>> {
  const rows = await db
    .select({
      productId: productReleases.productId,
      channel: marketOfferStates.channel,
      itemPriceEUR: marketOfferStates.itemPriceEUR,
      lastCheckedAt: marketOfferStates.lastCheckedAt,
    })
    .from(marketOfferStates)
    .innerJoin(productReleases, eq(productReleases.id, marketOfferStates.releaseId))
    .where(and(
      eq(marketOfferStates.condition, COLLECTOR_VALUE_CONDITION),
      inArray(marketOfferStates.availability, ["in_stock", "low_stock"]),
    ))

  const result: Record<string, number> = {}
  const now = Date.now()

  for (const row of rows) {
    const checkedAt = row.lastCheckedAt instanceof Date
      ? row.lastCheckedAt.getTime()
      : Date.parse(String(row.lastCheckedAt))
    if (!Number.isFinite(checkedAt)) continue

    const maxAgeHours = row.channel === "marketplace"
      ? MARKETPLACE_OFFER_MAX_AGE_HOURS
      : RETAIL_OFFER_MAX_AGE_HOURS
    if (Math.max(0, now - checkedAt) > maxAgeHours * 3_600_000) continue

    const amount = Number(row.itemPriceEUR)
    if (!Number.isFinite(amount) || amount <= 0) continue

    const current = result[row.productId]
    if (current == null || amount < current) result[row.productId] = amount
  }

  return result
}

export async function getMarketValueHistoryForRelease(
  releaseId: string,
  condition = COLLECTOR_VALUE_CONDITION,
  limit = 104,
) {
  return db.query.marketValueHistory.findMany({
    where: and(
      eq(marketValueHistory.releaseId, releaseId),
      eq(marketValueHistory.condition, condition),
    ),
    orderBy: (fields, { desc }) => [desc(fields.snapshotPeriod)],
    limit,
  })
}
