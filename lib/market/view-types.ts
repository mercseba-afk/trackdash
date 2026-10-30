import type { CollectorSoldTrendComparison } from "./collector-sold-trend-comparison"
import type { OfferOrigin } from "./offer-origin"

export type ReleaseMarketRegime =
  | "retail_driven"
  | "mixed_scarce"
  | "secondary_market_driven"
  | "insufficient"

export type ReleaseMarketConfidence = "low" | "medium" | "high"

export interface ReleaseMarketSignalView {
  /** Inclusive deadline of this offer projection; a clock change requires re-projection, not a TTL extension. */
  offersValidUntil?: string | null
  /** Compatibility mirror of the exact catalog asking-price reference. */
  collectionAskItemEUR?: number | null
  collectionAskSellerCount?: number
  collectionAskObservedAt?: string | null
  collectionAskOrigin?: OfferOrigin
  collectionAskIsHistorical?: boolean
  collectionAskValidUntil?: string | null
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
  startingItemPriceEUR: number | null
  /** Display-only asking median; never a purchase listing, SOLD or canonical MV. */
  representativeAskItemEUR?: number | null
  representativeAskSellerCount?: number
  representativeAskOrigin?: OfferOrigin
  representativeAskObservedAt?: string | null
  startingEffectiveCostEUR: number | null
  startingCostBasis: "delivered" | "item_only" | null
  observedPriceAt: string | null
  observedPriceChannel: "retail" | "marketplace" | null
  observedShippingEUR: number | null
  currentAskOrigin: OfferOrigin
  historicalAskOrigin: OfferOrigin
  /** Last observed asking price (kit only), kept as dated historical evidence. */
  historicalAskItemEUR: number | null
  historicalAskShippingEUR: number | null
  historicalAskObservedAt: string | null
  /** Last observed item+shipping amount, NEVER an Italian landed-cost guarantee. */
  historicalAskItemPlusShippingEUR: number | null
  retailSourceCount: number
  activeOfferCount: number
  currentOfferCount: number
  soldUnits: number
  soldSellerCount: number | null
  marketContextEvidenceCount: number
  recentSoldUnits3m: number | null
  recentSoldPeriodStart: string | null
  recentSoldPeriodEnd: string | null
  trendPercent: number | null
  trendWindowMonths: 1 | 3 | 6 | 12 | null
  trendBasis: "sold" | "market_value" | null
  trendUpdatedAt: string | null
  soldTrendComparison: CollectorSoldTrendComparison | null
  askTrendPercent: number | null
  askTrendWindowDays: number | null
  computedAt: string
}

export type ReleaseMarketSignalMap = Record<string, ReleaseMarketSignalView>
