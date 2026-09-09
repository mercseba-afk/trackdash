export const MATCH_EVIDENCE_CODES = [
  "item_number_exact",
  "edition_name_exact",
  "release_year_stated",
  "reissue_stated",
  "chassis_stated",
  "color_variant_match",
  "packaging_generation_match",
  "image_reviewed",
  "official_reference_match",
  "manual_override",
] as const

export type MatchEvidence = (typeof MATCH_EVIDENCE_CODES)[number]

export type ObservationType =
  | "sold_confirmed"
  | "auction_awarded"
  | "marketplace_sold"
  | "active_listing"
  | "retail_in_stock"
  | "dealer_buyback"
  | "retail_out_of_stock"
  | "ended_unsold"
  | "msrp_reference"
  | "unknown"

export type CompletedSaleObservationType = Extract<
  ObservationType,
  "sold_confirmed" | "auction_awarded" | "marketplace_sold"
>

export type MarketCondition =
  | "new_complete_unbuilt"
  | "built_complete"
  | "incomplete_parts_custom"
  | "unknown"

export type ShippingBasis =
  | "excluded"
  | "included_exact"
  | "included_unknown"
  | "buyer_paid"
  | "unknown"

export type MatchConfidence = "exact" | "strong" | "ambiguous" | "rejected"
export type CandidateDecision = "accepted" | "needs_review" | "rejected" | "duplicate"

export interface CatalogReleaseIdentity {
  id: string
  productName?: string | null
  itemNumber: string | null
  editionName: string
  releaseYear: number | null
  releaseType?: string | null
  editionType?: string | null
  chassis: string | null
  color: string | null
}

export interface SourceObservation {
  sourceRecordKey: string
  externalListingId?: string | null
  originalSource?: string | null
  originalRecordId?: string | null
  listingUrl?: string | null
  titleRaw?: string | null
  itemNumberObserved?: string | null

  explicitReleaseId?: string | null
  identityReviewed?: boolean
  matchEvidence?: MatchEvidence[]

  price?: number | null
  currency?: string | null
  shippingCost?: number | null
  shippingBasis?: ShippingBasis
  observationType?: ObservationType

  conditionRaw?: string | null
  condition?: MarketCondition
  innerBagsSealed?: "yes" | "no" | "unknown"
  boxCondition?: "normal" | "significantly_damaged" | "unknown"
  isComplete?: boolean | null
  isLot?: boolean | null
  quantity?: number | null

  sellerFingerprint?: string | null
  soldAt?: string | null
  soldOn?: string | null
  listingDate?: string | null
  observedAt?: string | null

  fxRateToEUR?: number | null
  fxRateDate?: string | null

  rawPayload?: unknown
}

export interface ClassifiedCandidate {
  sourceRecordKey: string
  externalListingId: string | null
  originalSource: string | null
  originalRecordId: string | null
  listingUrl: string | null
  titleRaw: string | null
  itemNumberObserved: string | null
  possibleReleaseIds: string[]
  resolvedReleaseId: string | null

  price: number | null
  currency: string | null
  shippingCost: number | null
  shippingBasis: ShippingBasis
  observationType: ObservationType
  conditionRaw: string | null
  condition: MarketCondition
  innerBagsSealed: "yes" | "no" | "unknown"
  boxCondition: "normal" | "significantly_damaged" | "unknown"
  isComplete: boolean | null
  isLot: boolean | null
  quantity: number | null

  matchConfidence: MatchConfidence | null
  matchEvidence: MatchEvidence[]
  sellerFingerprint: string | null
  evidenceGroupKey: string | null
  soldAt: string | null
  soldOn: string | null
  listingDate: string | null
  observedAt: string
  decision: CandidateDecision
  reasonCodes: string[]
  reviewNotes: string | null
  needsRevalidation: boolean
  rawPayload: unknown

  fxRateToEUR: number | null
  fxRateDate: string | null
}

export interface EvidenceSale {
  stableId: string
  releaseId: string
  condition: MarketCondition
  sourceId: string
  sellerFingerprint: string | null
  soldOn: string
  soldAt?: string | null
  normalizedPriceEUR?: number | null
  evidenceGroupKey?: string | null
}

export interface EvidenceGroupRepresentative {
  evidenceGroupKey: string
  releaseId: string
  condition: MarketCondition
  sourceId: string
  sellerFingerprint: string
  anchorDate: string
  representativeEUR: number
  saleCount: number
  latestSoldOn: string
}

export interface EstimateInputPoint {
  stableId: string
  soldOn: string
  soldAt?: string | null
  normalizedPriceEUR: number
  evidenceGroupKey: string
}

export interface MarketEstimateDraft {
  displayMode: "last_sale" | "range" | "value"
  value: number | null
  currency: "EUR"
  low: number | null
  high: number | null
  median: number | null
  rangeMethod: "cleaned_min_max" | "q1_q3" | null
  sampleSize: number
  independentEvidenceCount: number
  windowDays: 365 | 730
  lastVerifiedSale: number
  lastVerifiedSaleOn: string
  lastVerifiedSaleAt: string | null
  trendPercent: number | null
  trendWindowDays: 90 | 365 | null
  algorithmVersion: "v1"
}

export interface PricePointDraft {
  releaseId: string
  observationType: CompletedSaleObservationType
  condition: MarketCondition
  price: number
  currency: string
  shippingCost: number | null
  shippingBasis: ShippingBasis
  valuationPrice: number | null
  normalizedPriceEUR: number | null
  fxRateToEUR: number | null
  fxRateDate: string | null
  innerBagsSealed: "yes" | "no" | "unknown"
  boxCondition: "normal" | "significantly_damaged" | "unknown"
  isComplete: boolean | null
  isLot: boolean | null
  quantity: number | null
  matchConfidence: Extract<MatchConfidence, "exact" | "strong">
  matchEvidence: MatchEvidence[]
  evidenceGroupKey: string | null
  valuationEligible: boolean
  needsRevalidation: boolean
  soldAt: string | null
  soldOn: string
  observedAt: string
}
