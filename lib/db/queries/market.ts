import "server-only"

import { and, eq } from "drizzle-orm"
import type { InferSelectModel } from "drizzle-orm"
import { db } from "../index"
import { marketEstimates, marketValueHistory, pricePoints, productReleases } from "../schema"

export const COLLECTOR_VALUE_CONDITION = "new_complete_unbuilt"

export type PricePoint = InferSelectModel<typeof pricePoints>
export type MarketEstimate = InferSelectModel<typeof marketEstimates>
export type MarketValueHistoryPoint = InferSelectModel<typeof marketValueHistory>

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

// No row means zero independent eligible evidence groups. The principal Collector
// Value defaults explicitly to New / Unused + Complete + Unbuilt.
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

// Product cards intentionally do not invent a model-level valuation. Instead they
// show "starting from" the cheapest RELEASE headline value backed by real
// Price Intelligence evidence. Release headline semantics mirror the public UI:
// - 1 evidence group => last verified sale / value
// - 2-4 groups       => low end of the estimated range
// - 5+ groups        => Collector Value / median
// Products with no real release estimate are omitted from the map entirely.
export async function getCatalogStartingPrices(): Promise<Record<string, number>> {
  const rows = await db
    .select({
      productId: productReleases.productId,
      displayMode: marketEstimates.displayMode,
      value: marketEstimates.value,
      low: marketEstimates.low,
      lastVerifiedSale: marketEstimates.lastVerifiedSale,
    })
    .from(marketEstimates)
    .innerJoin(productReleases, eq(productReleases.id, marketEstimates.releaseId))
    .where(eq(marketEstimates.condition, COLLECTOR_VALUE_CONDITION))

  const result: Record<string, number> = {}

  for (const row of rows) {
    const raw =
      row.displayMode === "range"
        ? row.low
        : row.value ?? row.lastVerifiedSale

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
