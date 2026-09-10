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
  soldAnchorEUR: number | null
  startingItemPriceEUR: number | null
  retailSourceCount: number
  activeOfferCount: number
  currentOfferCount: number
  soldUnits: number
  trendPercent: number | null
  trendWindowMonths: 1 | 3 | 6 | 12 | null
  computedAt: string
}

export type ReleaseMarketSignalMap = Record<string, ReleaseMarketSignalView>
