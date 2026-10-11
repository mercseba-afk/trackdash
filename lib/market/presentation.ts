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
  return observedMarketPrice(signal) ??
    (signal?.historicalAskItemEUR != null && signal.historicalAskItemEUR > 0
      ? signal.historicalAskItemEUR : null)
}

export function observedMarketReferenceIsHistorical(
  signal?: ReleaseMarketSignalView | null,
): boolean {
  return observedMarketPrice(signal) == null &&
    signal?.historicalAskItemEUR != null && signal.historicalAskItemEUR > 0
}

// The origin is the listing's actual itemLocation country, NEVER the
// eBay marketplace queried (EBAY_IT can list an item shipping from Japan).
// Keep old snapshots with missing location as UNKNOWN, not "imported".
const EU_ORIGIN_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI",
  "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU",
  "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
])

export function observedAskOriginCountry(signal?: ReleaseMarketSignalView | null): string | null {
  const current = observedMarketPrice(signal)
  const country = current != null
    ? signal?.observedAskOriginCountry
    : signal?.historicalAskOriginCountry
  const normalized = country?.trim().toUpperCase() ?? ""
  if (!/^[A-Z]{2}$/.test(normalized) || ["EU", "UN", "ZZ", "XX"].includes(normalized)) return null
  return normalized
}

export function isKnownExtraEuAsk(signal?: ReleaseMarketSignalView | null): boolean {
  if (observedMarketReferencePrice(signal) == null) return false
  const origin = observedAskOriginCountry(signal)
  return origin != null && !EU_ORIGIN_COUNTRIES.has(origin)
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
