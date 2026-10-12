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

// Informational ONLY. A dated historical ASK stays visible after active-offer
// TTL expires, but it is never an in-stock claim. Always KIT ONLY in EUR.
export function observedMarketReferencePrice(
  signal?: ReleaseMarketSignalView | null,
): number | null {
  return (signal?.representativeAskItemEUR != null && signal.representativeAskItemEUR > 0
      ? signal.representativeAskItemEUR : null) ??
    observedMarketPrice(signal) ??
    (signal?.historicalAskItemEUR != null && signal.historicalAskItemEUR > 0
      ? signal.historicalAskItemEUR : null)
}

export function observedMarketReferenceIsHistorical(
  signal?: ReleaseMarketSignalView | null,
): boolean {
  return signal?.representativeAskItemEUR == null &&
    observedMarketPrice(signal) == null &&
    signal?.historicalAskItemEUR != null && signal.historicalAskItemEUR > 0
}

// The warning follows the SAME selected or dated historical offer as the
// displayed ASK, not another source or an eBay marketplace locale.
export function observedMarketOfferOrigin(
  signal?: ReleaseMarketSignalView | null,
): "eu" | "extra_eu" | "unknown" {
  if (observedMarketReferencePrice(signal) == null) return "unknown"
  if (signal?.representativeAskItemEUR != null && signal.representativeAskItemEUR > 0) {
    return signal.representativeAskOrigin ?? "unknown"
  }
  return observedMarketReferenceIsHistorical(signal)
    ? signal?.historicalAskOrigin ?? "unknown"
    : signal?.currentAskOrigin ?? "unknown"
}

// Consistent compact subtitle for the same two-row market card. The price
// shown may be a median of distinct sellers, not one arbitrary cheapest listing.
export function representativeAskingCaption(
  signal: ReleaseMarketSignalView | null | undefined,
  it: boolean,
): string | null {
  const sellers = signal?.representativeAskSellerCount ?? 0
  if (signal?.representativeAskItemEUR == null || sellers < 3) return null
  const region = signal.representativeAskOrigin === "extra_eu"
    ? (it ? " · annunci extra-UE" : " · non-EU listings")
    : signal.representativeAskOrigin === "unknown"
      ? (it ? " · provenienza da verificare" : " · origin unknown")
      : ""
  return it
    ? `Mediana di ${sellers} venditori${region}`
    : `Median of ${sellers} sellers${region}`
}

export type ObservedMarketDisplayKind = "ask" | "sold"

export function observedMarketDisplayKind(
  signal?: ReleaseMarketSignalView | null,
): ObservedMarketDisplayKind | null {
  const askPrice = observedMarketReferencePrice(signal)
  if (askPrice != null && askPrice > 0) return "ask"
  if (signal?.soldAnchorEUR != null && signal.soldAnchorEUR > 0) return "sold"
  return null
}

export function observedMarketDisplayPrice(
  signal?: ReleaseMarketSignalView | null,
): number | null {
  const askPrice = observedMarketReferencePrice(signal)
  if (askPrice != null && askPrice > 0) return askPrice
  return signal?.soldAnchorEUR != null && signal.soldAnchorEUR > 0
    ? signal.soldAnchorEUR
    : null
}

export function observedMarketDisplayLabel(
  signal: ReleaseMarketSignalView | null | undefined,
  it: boolean,
): string {
  if (observedMarketDisplayKind(signal) === "sold") {
    return it ? "Prezzo da vendite concluse" : "Price from completed sales"
  }
  if (representativeAskingCaption(signal, it)) return representativeAskingCaption(signal, it)!
  if (observedMarketReferenceIsHistorical(signal)) {
    return it ? "Ultimo prezzo richiesto osservato · solo kit" : "Last observed asking price · kit only"
  }
  return observedMarketAskLabel(signal, it)
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
  if (observedMarketReferenceIsHistorical(signal)) {
    return it ? "Ultima osservazione, disponibilità da verificare" : "Last observation, availability not verified"
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
