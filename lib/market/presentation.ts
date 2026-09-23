import type { ReleaseMarketSignalView } from "@/lib/market/view-types"

export function observedMarketPrice(
  signal?: ReleaseMarketSignalView | null,
): number | null {
  return signal?.startingEffectiveCostEUR
    ?? signal?.startingItemPriceEUR
    ?? signal?.retailAnchorEUR
    ?? signal?.activeAnchorEUR
    ?? null
}

export function hasReliableObservedPriceTrend(
  signal?: ReleaseMarketSignalView | null,
): boolean {
  return Boolean(
    signal?.askTrendPercent != null
    && signal.askTrendWindowDays != null
    && signal.askTrendWindowDays >= 7
    && signal.currentOfferCount >= 3,
  )
}

export function collectorMarketTrend(
  signal?: ReleaseMarketSignalView | null,
): number | null {
  if (signal?.trendPercent != null) return signal.trendPercent
  if (hasReliableObservedPriceTrend(signal)) return signal!.askTrendPercent
  return null
}
