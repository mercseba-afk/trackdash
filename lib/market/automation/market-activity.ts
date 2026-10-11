export interface MarketActivityFingerprint {
  marketValueEUR: number | null
  soldAnchorEUR: number | null
  activeAnchorEUR: number | null
  startingEffectiveCostEUR: number | null
  currentOfferCount: number
}

export const MATERIAL_MARKET_PRICE_MOVE_RATIO = 0.05

function finitePositive(value: number | null): number | null {
  return value != null && Number.isFinite(value) && value > 0 ? value : null
}

export function materialPriceChange(
  before: number | null,
  after: number | null,
  thresholdRatio = MATERIAL_MARKET_PRICE_MOVE_RATIO,
): boolean {
  const previous = finitePositive(before)
  const next = finitePositive(after)

  if (previous == null || next == null) return previous !== next
  return Math.abs(next - previous) / previous >= thresholdRatio
}

export function marketActivityMateriallyChanged(
  before: MarketActivityFingerprint,
  after: MarketActivityFingerprint,
): boolean {
  if (materialPriceChange(before.marketValueEUR, after.marketValueEUR)) return true
  if (materialPriceChange(before.soldAnchorEUR, after.soldAnchorEUR)) return true
  if (materialPriceChange(before.activeAnchorEUR, after.activeAnchorEUR)) return true
  if (materialPriceChange(before.startingEffectiveCostEUR, after.startingEffectiveCostEUR)) return true

  // Listing-count churn is not enough to make a slow collector market "hot".
  // Availability entering or leaving the market entirely is material; 2 -> 3
  // equivalent offers is not.
  return (before.currentOfferCount === 0) !== (after.currentOfferCount === 0)
}


export const COLLECTOR_SCAN_INTERVAL_HOURS = {
  hot: 28 * 24,
  normal: 42 * 24,
  cold: 84 * 24,
} as const

export type MarketActivityTier = keyof typeof COLLECTOR_SCAN_INTERVAL_HOURS

export function collectorScanIntervalHours(tier: string): number {
  return COLLECTOR_SCAN_INTERVAL_HOURS[tier as MarketActivityTier]
    ?? COLLECTOR_SCAN_INTERVAL_HOURS.normal
}

// eBay ASK needs a faster refresh than exact-retail page polling: public offers
// expire after 15 days, so NORMAL must be checked comfortably within that TTL.
// Keep retail on its independent slow collector cadence above.
export const EBAY_ACTIVE_SCAN_INTERVAL_HOURS = {
  hot: 3 * 24,
  normal: 7 * 24,
  cold: 30 * 24,
} as const

export function ebayCollectorScanIntervalHours(tier: string): number {
  return EBAY_ACTIVE_SCAN_INTERVAL_HOURS[tier as MarketActivityTier]
    ?? EBAY_ACTIVE_SCAN_INTERVAL_HOURS.normal
}
