import "server-only"

import { and, eq } from "drizzle-orm"
import type { InferSelectModel } from "drizzle-orm"
import { db } from "../index"
import { marketEstimates, marketValueHistory, pricePoints } from "../schema"

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
