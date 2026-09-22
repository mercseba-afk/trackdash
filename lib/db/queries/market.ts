import "server-only"

import { and, eq, inArray } from "drizzle-orm"
import type { InferSelectModel } from "drizzle-orm"
import { db } from "../index"
import {
  marketAggregateObservations,
  marketCandidates,
  marketEstimates,
  marketOfferStates,
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
  releaseId: string
  sourceId: string
  channel: string
  itemPriceEUR: string
  shippingEUR: string | null
  lastCheckedAt: Date
}

export interface MarketContextEvidenceRow {
  releaseId: string
  evidenceCount: number
}

// Safe public context only: expose a per-Release count, never raw candidate data.
// This distinguishes "real market evidence exists, but it is historical/thin"
// from "no attributable market evidence has been observed yet".
export async function listMarketContextEvidence(
  releaseIds?: string[],
): Promise<MarketContextEvidenceRow[]> {
  if (releaseIds && releaseIds.length === 0) return []

  const candidateWhere = releaseIds
    ? and(
        eq(marketCandidates.decision, "accepted"),
        inArray(marketCandidates.matchConfidence, ["exact", "strong"]),
        inArray(marketCandidates.resolvedReleaseId, releaseIds),
      )
    : and(
        eq(marketCandidates.decision, "accepted"),
        inArray(marketCandidates.matchConfidence, ["exact", "strong"]),
      )

  const aggregateWhere = releaseIds
    ? and(
        inArray(marketAggregateObservations.attributionStatus, ["release_exact", "release_matched"]),
        inArray(marketAggregateObservations.releaseId, releaseIds),
      )
    : inArray(marketAggregateObservations.attributionStatus, ["release_exact", "release_matched"])

  const [candidates, aggregates] = await Promise.all([
    db
      .select({ releaseId: marketCandidates.resolvedReleaseId })
      .from(marketCandidates)
      .where(candidateWhere),
    db
      .select({ releaseId: marketAggregateObservations.releaseId })
      .from(marketAggregateObservations)
      .where(aggregateWhere),
  ])

  const counts = new Map<string, number>()
  for (const row of [...candidates, ...aggregates]) {
    if (!row.releaseId) continue
    counts.set(row.releaseId, (counts.get(row.releaseId) ?? 0) + 1)
  }

  return [...counts.entries()].map(([releaseId, evidenceCount]) => ({ releaseId, evidenceCount }))
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

  return db
    .select({
      releaseId: marketOfferStates.releaseId,
      sourceId: marketOfferStates.sourceId,
      channel: marketOfferStates.channel,
      itemPriceEUR: marketOfferStates.itemPriceEUR,
      shippingEUR: marketOfferStates.shippingEUR,
      lastCheckedAt: marketOfferStates.lastCheckedAt,
    })
    .from(marketOfferStates)
    .where(where)
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
      startingItemPriceEUR: marketReleaseSignals.startingItemPriceEUR,
    })
    .from(marketReleaseSignals)
    .innerJoin(productReleases, eq(productReleases.id, marketReleaseSignals.releaseId))
    .where(eq(marketReleaseSignals.condition, COLLECTOR_VALUE_CONDITION))

  const result: Record<string, number> = {}

  for (const row of rows) {
    const raw = row.startingItemPriceEUR
    if (raw == null) continue
    const amount = Number(raw)
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
