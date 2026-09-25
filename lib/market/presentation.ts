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

export type ObservedMarketDisplayKind = "ask" | "sold"

export function observedMarketDisplayKind(
  signal?: ReleaseMarketSignalView | null,
): ObservedMarketDisplayKind | null {
  const askPrice = observedMarketPrice(signal)
  if (askPrice != null && askPrice > 0) return "ask"
  if (signal?.soldAnchorEUR != null && signal.soldAnchorEUR > 0) return "sold"
  return null
}

export function observedMarketDisplayPrice(
  signal?: ReleaseMarketSignalView | null,
): number | null {
  const askPrice = observedMarketPrice(signal)
  if (askPrice != null && askPrice > 0) return askPrice
  return signal?.soldAnchorEUR != null && signal.soldAnchorEUR > 0
    ? signal.soldAnchorEUR
    : null
}

export function observedMarketDisplayLabel(
  signal: ReleaseMarketSignalView | null | undefined,
  it: boolean,
): string {
  return observedMarketDisplayKind(signal) === "sold"
    ? (it ? "Prezzo da vendite concluse" : "Price from completed sales")
    : observedMarketAskLabel(signal, it)
}

export function observedMarketDisplayEvidenceLabel(
  signal: ReleaseMarketSignalView | null | undefined,
  it: boolean,
): string | null {
  if (observedMarketDisplayKind(signal) === "sold") {
    const count = signal?.soldUnits ?? 0
    if (count <= 0) return null
    if (it) return `${count} ${count === 1 ? "vendita conclusa osservata" : "vendite concluse osservate"}`
    return `${count} ${count === 1 ? "completed sale observed" : "completed sales observed"}`
  }
  return observedMarketAskCountLabel(signal, it)
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
  return it ? "Prezzo richiesto più basso" : "Lowest asking price"
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
  if (it) return `${count} ${count === 1 ? "annuncio attivo osservato" : "annunci attivi osservati"}`
  return `${count} ${count === 1 ? "active listing observed" : "active listings observed"}`
}
