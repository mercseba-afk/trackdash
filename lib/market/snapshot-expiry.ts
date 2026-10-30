import type { ReleaseMarketSignalMap, ReleaseMarketSignalView } from "./view-types"

const HISTORICAL_ASK_MAX_AGE_MS = 180 * 86_400_000

function historicalDeadline(signal: ReleaseMarketSignalView): number | null {
  const checkedAt = Date.parse(signal.historicalAskObservedAt ?? "")
  return signal.historicalAskItemEUR != null && Number.isFinite(checkedAt)
    ? checkedAt + HISTORICAL_ASK_MAX_AGE_MS : null
}

/** Read-only safety boundary for cached/offline snapshots, NOT a price engine.
 * When any offer expires, the median/counts cannot be recomputed from a public
 * summary. Remove current-offer claims until the canonical server projection
 * succeeds. Keep MV/SOLD/trend and a dated, observed single quote as history.
 */
export function expirePublicMarketSignals(signals: ReleaseMarketSignalMap, now = Date.now()): ReleaseMarketSignalMap {
  let result = signals
  for (const [id, original] of Object.entries(signals)) {
    let signal = original
    if (signal.offersValidUntil != null &&
      (!Number.isFinite(Date.parse(signal.offersValidUntil)) || now > Date.parse(signal.offersValidUntil))) {
      const observedAt = Date.parse(signal.observedPriceAt ?? "")
      const keepQuote = signal.startingItemPriceEUR != null && signal.startingItemPriceEUR > 0 &&
        Number.isFinite(observedAt) && observedAt <= now && now - observedAt <= HISTORICAL_ASK_MAX_AGE_MS
      signal = {
        ...signal,
        ...(keepQuote ? {
          historicalAskItemEUR: signal.startingItemPriceEUR,
          historicalAskObservedAt: signal.observedPriceAt,
          historicalAskOrigin: signal.currentAskOrigin,
          historicalAskShippingEUR: signal.observedShippingEUR,
          historicalAskItemPlusShippingEUR: signal.startingCostBasis === "delivered" &&
            signal.observedShippingEUR != null && signal.observedShippingEUR >= 0 &&
            signal.startingEffectiveCostEUR != null &&
            Math.abs(signal.startingEffectiveCostEUR - signal.startingItemPriceEUR! - signal.observedShippingEUR) <= 0.025
              ? signal.startingEffectiveCostEUR : null,
        } : {}),
        collectionAskIsHistorical: signal.collectionAskItemEUR != null,
        offersValidUntil: null,
        startingItemPriceEUR: null, startingEffectiveCostEUR: null, startingCostBasis: null,
        observedPriceAt: null, observedPriceChannel: null, observedShippingEUR: null, currentAskOrigin: "unknown",
        representativeAskItemEUR: null, representativeAskSellerCount: 0,
        representativeAskOrigin: "unknown", representativeAskObservedAt: null,
        retailAnchorEUR: null, activeAnchorEUR: null, activeLowEUR: null, activeHighEUR: null,
        currentOfferCount: 0, activeOfferCount: 0, retailSourceCount: 0,
      }
    }
    const collectionExpiry = Date.parse(signal.collectionAskValidUntil ?? "")
    if (signal.collectionAskItemEUR != null && (!Number.isFinite(collectionExpiry) || now > collectionExpiry)) {
      signal = { ...signal, collectionAskItemEUR: null, collectionAskSellerCount: 0,
        collectionAskObservedAt: null, collectionAskOrigin: "unknown", collectionAskIsHistorical: false, collectionAskValidUntil: null }
    }
    const historicalExpiry = historicalDeadline(signal)
    if (historicalExpiry != null && now > historicalExpiry) {
      signal = {
        ...signal,
        historicalAskItemEUR: null, historicalAskObservedAt: null, historicalAskOrigin: "unknown",
        historicalAskShippingEUR: null, historicalAskItemPlusShippingEUR: null,
      }
    }
    if (signal !== original) {
      if (result === signals) result = { ...signals }
      result[id] = signal
    }
  }
  return result
}

export function nextPublicMarketExpiry(signals: ReleaseMarketSignalMap): number | null {
  const deadlines = Object.values(signals).flatMap((signal) => [
    signal.offersValidUntil == null ? null : Date.parse(signal.offersValidUntil),
    historicalDeadline(signal),
    signal.collectionAskValidUntil == null ? null : Date.parse(signal.collectionAskValidUntil),
  ]).filter((value): value is number => value != null && Number.isFinite(value))
  return deadlines.length ? Math.min(...deadlines) : null
}
