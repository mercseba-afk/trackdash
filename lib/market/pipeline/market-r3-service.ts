import "server-only"

import type { MarketCondition } from "./types"
import {
  computeCurrentMarketSignal,
  type MarketSignalDraft,
} from "./market-model"
import { MarketR3Repository } from "./market-r3-repository"
import { selectCurrentSoldEvidence } from "./sold-selection"

const DAY_MS = 86_400_000
const MARKETPLACE_MAX_AGE_MS = 3 * DAY_MS
const RETAIL_MAX_AGE_MS = 7 * DAY_MS

export async function recomputeReleaseMarketSignal(
  releaseId: string,
  condition: MarketCondition = "new_complete_unbuilt",
  now = new Date(),
  repo = new MarketR3Repository(),
): Promise<MarketSignalDraft> {
  const asOfDate = now.toISOString().slice(0, 10)

  const [offers, granular, aggregate] = await Promise.all([
    repo.listCurrentOffers(releaseId, condition),
    repo.listGranularSoldEvidence(releaseId, condition),
    repo.listAggregateSoldEvidence(releaseId, condition),
  ])

  // A stored offer is not automatically a current offer forever. Marketplace
  // inventory is volatile, so it must have been checked within 3 days; retail
  // stock gets a 7-day window. Older states remain available for audit/history
  // but are excluded from the current R3 signal until explicitly revalidated.
  const freshOffers = offers.filter((offer) => {
    const checkedAt = Date.parse(offer.lastCheckedAt)
    if (!Number.isFinite(checkedAt)) return false
    const ageMs = Math.max(0, now.getTime() - checkedAt)
    const maxAgeMs = offer.channel === "marketplace" ? MARKETPLACE_MAX_AGE_MS : RETAIL_MAX_AGE_MS
    return ageMs <= maxAgeMs
  })

  const soldEvidence = selectCurrentSoldEvidence({
    granular,
    aggregate,
    asOfDate,
  })
  const monthlySoldEvidence = aggregate.filter((row) => row.grain === "monthly")

  const signal = computeCurrentMarketSignal({
    offers: freshOffers,
    soldEvidence,
    monthlySoldEvidence,
    asOfDate,
  })

  await repo.upsertReleaseSignal(releaseId, condition, signal)
  await repo.upsertMonthlySoldSignals(releaseId, condition, signal)

  return signal
}
