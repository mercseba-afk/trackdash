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
  _signal: ReleaseMarketSignalView | null | undefined,
  it: boolean,
): string {
  return it ? "Prezzo minimo richiesto" : "Lowest asking price"
}

export function observedMarketAskTrendLabel(it: boolean): string {
  return it ? "Trend prezzi richiesti" : "Asking price trend"
}

export function observedMarketAskDirection(
  value: number | null | undefined,
  it: boolean,
): string | null {
  if (value == null) return null
  if (value >= 5) return it ? "Prezzi richiesti in salita" : "Asking prices rising"
  if (value <= -5) return it ? "Prezzi richiesti in calo" : "Asking prices falling"
  return null
}

export function observedMarketAskCountLabel(
  signal: ReleaseMarketSignalView | null | undefined,
  it: boolean,
): string | null {
  const count = signal?.currentOfferCount ?? 0
  if (count <= 0) return null
  if (it) return `${count} ${count === 1 ? "annuncio osservato" : "annunci osservati"}`
  return `${count} ${count === 1 ? "listing observed" : "listings observed"}`
}
