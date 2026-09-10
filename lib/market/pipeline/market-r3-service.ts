import "server-only"

import type { MarketCondition } from "./types"
import {
  computeCurrentMarketSignal,
  type MarketSignalDraft,
} from "./market-model"
import {
  applyPublicMarketPublicationPolicy,
  filterFreshCurrentOffers,
} from "./market-publication-policy"
import { MarketR3Repository } from "./market-r3-repository"
import { selectCurrentSoldEvidence } from "./sold-selection"

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

  // Stored availability is never trusted forever. The pure policy applies a
  // bounded freshness window per channel; stale states remain in history but
  // cannot influence the public current-market signal until revalidated.
  const freshOffers = filterFreshCurrentOffers(offers, now)

  const soldEvidence = selectCurrentSoldEvidence({
    granular,
    aggregate,
    asOfDate,
  })
  const monthlySoldEvidence = aggregate.filter((row) => row.grain === "monthly")

  const computedSignal = computeCurrentMarketSignal({
    offers: freshOffers,
    soldEvidence,
    monthlySoldEvidence,
    asOfDate,
  })

  // The calculation may retain thin evidence for audit, but the public layer is
  // intentionally stricter: one lone secondary-market ask is not a Market Value.
  const signal = applyPublicMarketPublicationPolicy(computedSignal)

  await repo.upsertReleaseSignal(releaseId, condition, signal)
  await repo.upsertMonthlySoldSignals(releaseId, condition, signal)

  return signal
}
