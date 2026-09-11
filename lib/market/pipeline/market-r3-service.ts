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
import { buildTrackDashMonthlySaleEvidence, loadConfirmedTrackDashSales } from "./trackdash-sales"

export async function recomputeReleaseMarketSignal(
  releaseId: string,
  condition: MarketCondition = "new_complete_unbuilt",
  now = new Date(),
  repo = new MarketR3Repository(),
): Promise<MarketSignalDraft> {
  const asOfDate = now.toISOString().slice(0, 10)

  const [offers, granularExternal, aggregate, trackDashSales] = await Promise.all([
    repo.listCurrentOffers(releaseId, condition),
    repo.listGranularSoldEvidence(releaseId, condition),
    repo.listAggregateSoldEvidence(releaseId, condition),
    loadConfirmedTrackDashSales(releaseId, condition),
  ])

  // Confirmed bilateral TrackDash sales are first-class completed-sale evidence.
  // Their loader caps repeated buyer/seller pairs into conservative independence
  // clusters, while external marketplace evidence keeps its source-specific rules.
  const granular = [...granularExternal, ...trackDashSales]

  // Stored availability is never trusted forever. The pure policy applies a
  // bounded freshness window per channel; stale states remain in history but
  // cannot influence the public current-market signal until revalidated.
  const freshOffers = filterFreshCurrentOffers(offers, now)

  const soldEvidence = selectCurrentSoldEvidence({
    granular,
    aggregate,
    asOfDate,
  })

  // TrackDash confirmed events also become chronological monthly evidence for
  // trend once a calendar month is complete. This lets real in-app transactions
  // affect direction over time without inventing a percentage from offers/asks.
  const monthlySoldEvidence = [
    ...aggregate.filter((row) => row.grain === "monthly"),
    ...buildTrackDashMonthlySaleEvidence(trackDashSales),
  ]

  const computedSignal = computeCurrentMarketSignal({
    offers: freshOffers,
    soldEvidence,
    monthlySoldEvidence,
    asOfDate,
  })

  // Public v2 keeps demonstrated sold value, verified retail and current seller
  // asks as separate concepts. Confidence is recalibrated from the completed-sale
  // evidence behind the headline, not from unrelated asking-price volume.
  const signal = applyPublicMarketPublicationPolicy(computedSignal, soldEvidence, asOfDate)

  await repo.upsertReleaseSignal(releaseId, condition, signal)
  await repo.upsertMonthlySoldSignals(releaseId, condition, signal)

  return signal
}
