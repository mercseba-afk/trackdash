import "server-only"

import { and, eq } from "drizzle-orm"
import type { InferSelectModel } from "drizzle-orm"
import { db } from "../index"
import { marketEstimates, pricePoints } from "../schema"

export type PricePoint = InferSelectModel<typeof pricePoints>
export type MarketEstimate = InferSelectModel<typeof marketEstimates>

// Raw observed data points for a release (sales, listings, manual entries,
// MSRP — see lib/db/schema/market.ts). No source integration exists yet;
// this just reads whatever is in the table, however it got there.
export async function getPricePointsForRelease(releaseId: string, limit = 50) {
  return db.query.pricePoints.findMany({
    where: eq(pricePoints.releaseId, releaseId),
    with: { source: true },
    orderBy: (fields, { desc }) => [desc(fields.createdAt)],
    limit,
  })
}

// Cached aggregate for a release, optionally narrowed to one condition.
// Returns undefined if no market_estimates row has been computed yet for
// that (release, condition) pair — there is no fallback/demo value
// generated here, unlike the current prototype's lib/data/market.ts.
export async function getMarketEstimateForRelease(releaseId: string, condition?: string) {
  return db.query.marketEstimates.findFirst({
    where: condition
      ? and(eq(marketEstimates.releaseId, releaseId), eq(marketEstimates.condition, condition))
      : eq(marketEstimates.releaseId, releaseId),
  })
}

export async function listMarketEstimatesForRelease(releaseId: string) {
  return db.query.marketEstimates.findMany({
    where: eq(marketEstimates.releaseId, releaseId),
  })
}
