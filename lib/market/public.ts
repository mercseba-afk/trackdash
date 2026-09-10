import "server-only"

import {
  getMarketSignalForRelease,
  listMarketSignals,
  type MarketReleaseSignal,
} from "@/lib/db/queries/market"
import type {
  ReleaseMarketConfidence,
  ReleaseMarketRegime,
  ReleaseMarketSignalMap,
  ReleaseMarketSignalView,
} from "@/lib/market/view-types"

function numberOrNull(value: string | number | null | undefined): number | null {
  if (value == null) return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

export function toPublicMarketSignalView(
  signal: MarketReleaseSignal | null | undefined,
): ReleaseMarketSignalView | null {
  if (!signal) return null

  const valueEUR = numberOrNull(signal.marketValueEUR)
  const retailAnchorEUR = numberOrNull(signal.retailAnchorEUR)
  const activeAnchorEUR = numberOrNull(signal.activeAnchorEUR)
  const soldAnchorEUR = numberOrNull(signal.soldAnchorEUR)
  const hasMarketEvidence =
    (valueEUR != null && valueEUR > 0) ||
    (retailAnchorEUR != null && retailAnchorEUR > 0) ||
    (activeAnchorEUR != null && activeAnchorEUR > 0) ||
    (soldAnchorEUR != null && soldAnchorEUR > 0) ||
    signal.currentOfferCount > 0 ||
    signal.soldUnits > 0

  if (!hasMarketEvidence) return null

  return {
    marketRegime: signal.marketRegime as ReleaseMarketRegime,
    valueEUR: valueEUR != null && valueEUR > 0 ? valueEUR : null,
    lowEUR: numberOrNull(signal.lowEUR),
    highEUR: numberOrNull(signal.highEUR),
    confidenceScore: signal.confidenceScore,
    confidenceLabel: signal.confidenceLabel as ReleaseMarketConfidence,
    retailAnchorEUR,
    activeAnchorEUR,
    soldAnchorEUR,
    startingItemPriceEUR: numberOrNull(signal.startingItemPriceEUR),
    retailSourceCount: signal.retailSourceCount,
    activeOfferCount: signal.activeOfferCount,
    currentOfferCount: signal.currentOfferCount,
    soldUnits: signal.soldUnits,
    trendPercent: numberOrNull(signal.trendPercent),
    trendWindowMonths: signal.trendWindowMonths === 1 || signal.trendWindowMonths === 3 ? signal.trendWindowMonths : null,
    computedAt: signal.computedAt instanceof Date ? signal.computedAt.toISOString() : String(signal.computedAt),
  }
}

export async function getPublicMarketSignalForRelease(
  releaseId: string,
): Promise<ReleaseMarketSignalView | null> {
  const row = await getMarketSignalForRelease(releaseId)
  return toPublicMarketSignalView(row)
}

export async function getPublicMarketSignalMap(
  releaseIds?: string[],
): Promise<ReleaseMarketSignalMap> {
  const rows = await listMarketSignals(releaseIds)
  const result: ReleaseMarketSignalMap = {}

  for (const row of rows) {
    const view = toPublicMarketSignalView(row)
    if (view) result[row.releaseId] = view
  }

  return result
}
