export type ReleaseMarketRegime =
  | "retail_driven"
  | "mixed_scarce"
  | "secondary_market_driven"
  | "insufficient"

export type ReleaseMarketConfidence = "low" | "medium" | "high"

export interface ReleaseMarketSignalView {
  marketRegime: ReleaseMarketRegime
  valueEUR: number
  lowEUR: number | null
  highEUR: number | null
  confidenceScore: number
  confidenceLabel: ReleaseMarketConfidence
  retailAnchorEUR: number | null
  activeAnchorEUR: number | null
  soldAnchorEUR: number | null
  startingItemPriceEUR: number | null
  currentOfferCount: number
  soldUnits: number
  trendPercent: number | null
  computedAt: string
}
