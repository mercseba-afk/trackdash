import type { ReleaseMarketSignalView } from "@/lib/market/view-types"

export function observedMarketPrice(
  signal?: ReleaseMarketSignalView | null,
): number | null {
  // Public current-price display must come from a fresh observed purchasable
  // offer. The public projection populates starting* only from TTL-valid
  // market_offer_states rows; raw materialized anchors are intentionally not a
  // fallback because they can outlive their publication TTL until recompute.
  // Uniform public price basis: PRICE OF THE KIT ONLY.
  // Shipping and any import costs are a separate purchasing calculation.
  // This selects the existing, Europe-first, TTL-valid canonical offer;
  // never invent prices from stale anchors or from an extra-EU source.
  return signal?.startingItemPriceEUR ?? null
}

// Known item+shipping quote, never a guarantee of total landed-in-Italy
// cost. Unknown or international-only shipping stays NULL (fail closed).
export function observedMarketKnownPurchaseCost(
  signal?: ReleaseMarketSignalView | null,
): number | null {
  if (signal?.startingCostBasis !== "delivered") return null
  const item = observedMarketPrice(signal)
  const shipping = signal.observedShippingEUR
  const total = signal.startingEffectiveCostEUR
  if (item == null || !Number.isFinite(item) || item <= 0 ||
      shipping == null || !Number.isFinite(shipping) || shipping < 0 ||
      total == null || !Number.isFinite(total) || total <= 0 ||
      Math.abs(total - item - shipping) > 0.025) return null
  return total
}

export function observedMarketKnownShipping(
  signal?: ReleaseMarketSignalView | null,
): number | null {
  if (observedMarketKnownPurchaseCost(signal) == null) return null
  const shipping = signal?.observedShippingEUR
  return shipping != null && Number.isFinite(shipping) && shipping >= 0 ? shipping : null
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
  // Main collector trend is persistent value/SOLD direction only.
  // ASK movement is intentionally separate and may be shown only as
  // "Trend prezzi richiesti" when enough current listings support it.
  return signal?.trendPercent ?? null
}


export function observedMarketAskLabel(
  _signal: ReleaseMarketSignalView | null | undefined,
  it: boolean,
): string {
  return it ? "Prezzo richiesto · solo kit" : "Asking price · kit only"
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
