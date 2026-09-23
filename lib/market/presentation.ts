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


export function observedMarketAskLabel(
  signal: ReleaseMarketSignalView | null | undefined,
  it: boolean,
): string {
  const count = signal?.currentOfferCount ?? 0
  if (count === 1) return it ? "Richiesta venditore osservata" : "Observed seller ask"
  if (count > 1) return it ? "Richiesta più bassa osservata" : "Lowest observed ask"
  return it ? "Richiesta osservata" : "Observed ask"
}

export function observedMarketAskTrendLabel(it: boolean): string {
  return it ? "Trend richieste osservate" : "Observed ask trend"
}

export function observedMarketAskDirection(
  value: number | null | undefined,
  it: boolean,
): string | null {
  if (value == null) return null
  if (value >= 5) return it ? "Richieste in salita" : "Asks rising"
  if (value <= -5) return it ? "Richieste in calo" : "Asks falling"
  return null
}

export function observedMarketAskCountLabel(
  signal: ReleaseMarketSignalView | null | undefined,
  it: boolean,
): string | null {
  const count = signal?.currentOfferCount ?? 0
  if (count <= 0) return null
  if (it) return `${count} ${count === 1 ? "richiesta corrente osservata" : "richieste correnti osservate"}`
  return `${count} ${count === 1 ? "current ask observed" : "current asks observed"}`
}
