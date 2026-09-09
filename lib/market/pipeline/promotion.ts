import type {
  ClassifiedCandidate,
  CompletedSaleObservationType,
  MarketQualityFlag,
  PricePointDraft,
} from "./types"

const COMPLETED = new Set<CompletedSaleObservationType>([
  "sold_confirmed",
  "auction_awarded",
  "marketplace_sold",
])

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function uniq<T>(values: T[]): T[] {
  return [...new Set(values)]
}

export type PromotionResult =
  | { ok: true; point: PricePointDraft }
  | { ok: false; reason: string }

export function buildPricePointDraft(candidate: ClassifiedCandidate): PromotionResult {
  if (candidate.decision !== "accepted") return { ok: false, reason: "CANDIDATE_NOT_ACCEPTED" }
  if (!candidate.resolvedReleaseId) return { ok: false, reason: "RELEASE_REQUIRED" }
  if (!candidate.matchConfidence || !["exact", "strong"].includes(candidate.matchConfidence)) {
    return { ok: false, reason: "MATCH_CONFIDENCE_REQUIRED" }
  }
  if (!candidate.matchEvidence.length) return { ok: false, reason: "MATCH_EVIDENCE_REQUIRED" }
  if (!COMPLETED.has(candidate.observationType as CompletedSaleObservationType)) {
    return { ok: false, reason: "NOT_A_COMPLETED_SALE" }
  }
  if (!candidate.soldOn) return { ok: false, reason: "SOLD_ON_REQUIRED" }
  if (candidate.price == null || candidate.price <= 0 || !candidate.currency) {
    return { ok: false, reason: "PRICE_AND_CURRENCY_REQUIRED" }
  }

  // Hard comparability blockers. Unknown secondary facts are no longer blockers,
  // but explicit negative facts still are.
  if (candidate.isLot === true) return { ok: false, reason: "LOT_NOT_COMPARABLE" }
  if (candidate.quantity != null && candidate.quantity !== 1) {
    return { ok: false, reason: "MULTI_QUANTITY_NOT_COMPARABLE" }
  }
  if (candidate.isComplete === false) return { ok: false, reason: "INCOMPLETE_NOT_COMPARABLE" }
  if (["built_complete", "incomplete_parts_custom"].includes(candidate.condition)) {
    return { ok: false, reason: "CONDITION_NOT_COMPARABLE" }
  }

  // Strict v1 shipping-adjusted amount remains available when the source gives
  // enough information. It is useful as a higher-quality benchmark but no longer
  // determines whether a real completed sale can contribute at all.
  let valuationPrice: number | null = null
  if (candidate.shippingBasis === "excluded" || candidate.shippingBasis === "buyer_paid") {
    valuationPrice = round2(candidate.price)
  } else if (candidate.shippingBasis === "included_exact") {
    if (candidate.shippingCost == null || candidate.shippingCost < 0 || candidate.shippingCost > candidate.price) {
      return { ok: false, reason: "EXACT_SHIPPING_INVALID" }
    }
    valuationPrice = round2(candidate.price - candidate.shippingCost)
  }

  // R2 comparable market amount. Unknown shipping uses the raw sold amount and
  // is explicitly downgraded through a quality flag rather than thrown away.
  let marketNativePrice = candidate.price
  let marketPriceBasis: PricePointDraft["marketPriceBasis"] = "raw_sale"
  if (candidate.shippingBasis === "excluded" || candidate.shippingBasis === "buyer_paid") {
    marketNativePrice = candidate.price
    marketPriceBasis = "shipping_adjusted"
  } else if (candidate.shippingBasis === "included_exact") {
    marketNativePrice = valuationPrice!
    marketPriceBasis = "shipping_adjusted"
  }

  let normalizedPriceEUR: number | null = null
  let marketPriceEUR: number | null = null
  let fxRateToEUR: number | null = null
  let fxRateDate: string | null = null

  if (candidate.currency === "EUR") {
    normalizedPriceEUR = valuationPrice
    marketPriceEUR = round2(marketNativePrice)
  } else {
    if (!candidate.fxRateToEUR || candidate.fxRateToEUR <= 0 || !candidate.fxRateDate) {
      return { ok: false, reason: "FX_PROVENANCE_REQUIRED" }
    }
    fxRateToEUR = candidate.fxRateToEUR
    fxRateDate = candidate.fxRateDate
    if (valuationPrice != null) normalizedPriceEUR = round2(valuationPrice * fxRateToEUR)
    marketPriceEUR = round2(marketNativePrice * fxRateToEUR)
  }

  const qualityFlags: MarketQualityFlag[] = []
  if (!candidate.sellerFingerprint) qualityFlags.push("seller_unknown")
  if (["included_unknown", "unknown"].includes(candidate.shippingBasis)) qualityFlags.push("shipping_unknown")
  if (candidate.isComplete !== true) qualityFlags.push("completeness_unconfirmed")
  if (candidate.condition === "unknown") qualityFlags.push("condition_inferred")
  if (candidate.innerBagsSealed === "unknown") qualityFlags.push("inner_bags_unknown")
  if (candidate.boxCondition === "unknown") qualityFlags.push("box_condition_unknown")

  const uniqueFlags = uniq(qualityFlags)
  const evidenceGrade = uniqueFlags.length === 0 ? "verified" : "indicative"

  const valuationEligible = Boolean(
    !candidate.needsRevalidation &&
      candidate.evidenceGroupKey &&
      marketPriceEUR != null &&
      marketPriceEUR > 0,
  )

  return {
    ok: true,
    point: {
      releaseId: candidate.resolvedReleaseId,
      observationType: candidate.observationType as CompletedSaleObservationType,
      condition: candidate.condition,
      price: candidate.price,
      currency: candidate.currency,
      shippingCost: candidate.shippingCost,
      shippingBasis: candidate.shippingBasis,
      valuationPrice,
      normalizedPriceEUR,
      marketPriceEUR,
      marketPriceBasis,
      fxRateToEUR,
      fxRateDate,
      innerBagsSealed: candidate.innerBagsSealed,
      boxCondition: candidate.boxCondition,
      isComplete: candidate.isComplete,
      isLot: candidate.isLot,
      quantity: candidate.quantity,
      matchConfidence: candidate.matchConfidence as "exact" | "strong",
      matchEvidence: candidate.matchEvidence,
      evidenceGroupKey: candidate.evidenceGroupKey,
      evidenceGrade,
      qualityFlags: uniqueFlags,
      valuationEligible,
      needsRevalidation: candidate.needsRevalidation,
      soldAt: candidate.soldAt,
      soldOn: candidate.soldOn,
      observedAt: candidate.observedAt,
    },
  }
}
