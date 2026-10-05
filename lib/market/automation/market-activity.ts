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

// Backward-compatible lane alias. Both eBay Active and exact retail use the
// same slow collector-market cadence; the cron remains a dispatcher only.
export const ebayCollectorScanIntervalHours = collectorScanIntervalHours
