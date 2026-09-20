export type ReleaseMarketRegime =
  | "retail_driven"
  | "mixed_scarce"
  | "secondary_market_driven"
  | "insufficient"

export type ReleaseMarketConfidence = "low" | "medium" | "high"

export interface ReleaseMarketSignalView {
  marketRegime: ReleaseMarketRegime
  valueEUR: number | null
  lowEUR: number | null
  highEUR: number | null
  confidenceScore: number
  confidenceLabel: ReleaseMarketConfidence
  retailAnchorEUR: number | null
  activeAnchorEUR: number | null
  activeLowEUR: number | null
  activeHighEUR: number | null
  soldAnchorEUR: number | null
  // Legacy compatibility field. Public surfaces now interpret this as the
  // latest fresh observed item price, never as a TrackDash selling price.
  startingItemPriceEUR: number | null
  observedPriceEUR: number | null
  observedShippingEUR: number | null
  observedAt: string | null
  observedChannel: "retail" | "marketplace" | null
  retailSourceCount: number
  activeOfferCount: number
  currentOfferCount: number
  soldUnits: number
  soldSellerCount: number | null
  recentSoldUnits3m: number | null
  recentSoldPeriodStart: string | null
  recentSoldPeriodEnd: string | null
  trendPercent: number | null
  trendWindowMonths: 1 | 3 | 6 | 12 | null
  askTrendPercent: number | null
  askTrendWindowDays: number | null
  computedAt: string
}

export type ReleaseMarketSignalMap = Record<string, ReleaseMarketSignalView>
