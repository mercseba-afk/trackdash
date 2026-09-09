import "server-only"

import type { MarketCondition } from "./types"
import {
  computeCurrentMarketSignal,
  type MarketSignalDraft,
} from "./market-model"
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

  const soldEvidence = selectCurrentSoldEvidence({
    granular,
    aggregate,
    asOfDate,
  })
  const monthlySoldEvidence = aggregate.filter((row) => row.grain === "monthly")

  const signal = computeCurrentMarketSignal({
    offers,
    soldEvidence,
    monthlySoldEvidence,
    asOfDate,
  })

  await repo.upsertReleaseSignal(releaseId, condition, signal)
  await repo.upsertMonthlySoldSignals(releaseId, condition, signal)

  return signal
}
