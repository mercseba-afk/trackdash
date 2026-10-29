import type { ReleaseMarketSignalView } from "./view-types"

const DAY_MS = 86_400_000
export const MARKET_HIGHLIGHT_TREND_DAYS = 30

function recentTimestamp(value: string | null | undefined, days: number, now: number): number | null {
  if (!value) return null
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) && timestamp <= now && timestamp >= now - days * DAY_MS
    ? timestamp : null
}

// Editorial freshness only: keep the persistent collector trend and its history
// intact. Recomputing a signal or refreshing an ASK cannot renew a SOLD trend.
export function recentCollectorMarketTrend(
  signal: ReleaseMarketSignalView | null | undefined,
  now = Date.now(),
): number | null {
  const trend = signal?.trendPercent
  if (trend == null || !Number.isFinite(trend) ||
      (signal?.trendBasis !== "sold" && signal?.trendBasis !== "market_value") ||
      recentTimestamp(signal.trendUpdatedAt, MARKET_HIGHLIGHT_TREND_DAYS, now) == null) return null
  return trend
}

export function verifiedAskingObservation(
  signal: ReleaseMarketSignalView | null | undefined,
  now = Date.now(),
): { priceEUR: number; observedAt: string; origin: "eu" | "extra_eu" | "unknown"; representative: boolean } | null {
  if (!signal) return null
  if (signal.offersValidUntil != null) {
    const deadline = Date.parse(signal.offersValidUntil)
    if (!Number.isFinite(deadline) || now > deadline) return null
  }
  const representative = signal.representativeAskItemEUR
  if (representative != null && Number.isFinite(representative) && representative > 0 &&
      (signal.representativeAskSellerCount ?? 0) >= 1 &&
      recentTimestamp(signal.representativeAskObservedAt, 15, now) != null) {
    return { priceEUR: representative, observedAt: signal.representativeAskObservedAt!,
      origin: signal.representativeAskOrigin ?? "unknown", representative: true }
  }
  const price = signal.startingItemPriceEUR
  const ageDays = signal.observedPriceChannel === "retail" ? 31 : 15
  if (price == null || !Number.isFinite(price) || price <= 0 || signal.currentOfferCount < 1 ||
      recentTimestamp(signal.observedPriceAt, ageDays, now) == null) return null
  return { priceEUR: price, observedAt: signal.observedPriceAt!,
    origin: signal.currentAskOrigin ?? "unknown", representative: false }
}

export function latestVerifiedAskingRows<T extends {
  product: { id: string }; release: { id: string }; signal: ReleaseMarketSignalView
}>(rows: readonly T[], limit = 4, now = Date.now()): T[] {
  const ranked = rows.flatMap((row) => {
    const observation = verifiedAskingObservation(row.signal, now)
    return observation ? [{ row, timestamp: Date.parse(observation.observedAt) }] : []
  }).sort((a, b) => b.timestamp - a.timestamp || a.row.release.id.localeCompare(b.row.release.id))
  const products = new Set<string>()
  return ranked.filter(({ row }) => {
    if (products.has(row.product.id)) return false
    products.add(row.product.id)
    return true
  }).slice(0, Math.max(0, limit)).map(({ row }) => row)
}
