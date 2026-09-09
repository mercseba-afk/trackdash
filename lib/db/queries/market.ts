import "server-only"

import { and, eq } from "drizzle-orm"
import type { InferSelectModel } from "drizzle-orm"
import { db } from "../index"
import {
  marketEstimates,
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

// Product cards show the cheapest CURRENT PURCHASABLE Release offer only.
// Sold evidence and out-of-stock retail can influence Market Value/trend but can
// never masquerade as "A partire da". When shipping is known, compare delivered
// cost; otherwise retain the item-only price (UI can label it "+ sped.").
export async function getCatalogStartingPrices(): Promise<Record<string, number>> {
  const rows = await db
    .select({
      productId: productReleases.productId,
      startingEffectiveCostEUR: marketReleaseSignals.startingEffectiveCostEUR,
      startingItemPriceEUR: marketReleaseSignals.startingItemPriceEUR,
    })
    .from(marketReleaseSignals)
    .innerJoin(productReleases, eq(productReleases.id, marketReleaseSignals.releaseId))
    .where(eq(marketReleaseSignals.condition, COLLECTOR_VALUE_CONDITION))

  const result: Record<string, number> = {}

  for (const row of rows) {
    const raw = row.startingEffectiveCostEUR ?? row.startingItemPriceEUR
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
