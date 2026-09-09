import type { ClassifiedCandidate, CompletedSaleObservationType, PricePointDraft } from "./types"

const COMPLETED = new Set<CompletedSaleObservationType>([
  "sold_confirmed",
  "auction_awarded",
  "marketplace_sold",
])

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
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
  if (candidate.price == null || candidate.price < 0 || !candidate.currency) {
    return { ok: false, reason: "PRICE_AND_CURRENCY_REQUIRED" }
  }

  let valuationPrice: number | null = null
  if (candidate.shippingBasis === "excluded" || candidate.shippingBasis === "buyer_paid") {
    valuationPrice = round2(candidate.price)
  } else if (candidate.shippingBasis === "included_exact") {
    if (candidate.shippingCost == null || candidate.shippingCost < 0 || candidate.shippingCost > candidate.price) {
      return { ok: false, reason: "EXACT_SHIPPING_INVALID" }
    }
    valuationPrice = round2(candidate.price - candidate.shippingCost)
  }

  let normalizedPriceEUR: number | null = null
  let fxRateToEUR: number | null = null
  let fxRateDate: string | null = null

  if (valuationPrice != null) {
    if (candidate.currency === "EUR") {
      normalizedPriceEUR = valuationPrice
    } else {
      if (!candidate.fxRateToEUR || candidate.fxRateToEUR <= 0 || !candidate.fxRateDate) {
        return { ok: false, reason: "FX_PROVENANCE_REQUIRED" }
      }
      fxRateToEUR = candidate.fxRateToEUR
      fxRateDate = candidate.fxRateDate
      normalizedPriceEUR = round2(valuationPrice * fxRateToEUR)
    }
  }

  const valuationEligible = Boolean(
    !candidate.needsRevalidation &&
      candidate.condition === "new_complete_unbuilt" &&
      candidate.isComplete === true &&
      candidate.isLot === false &&
      candidate.quantity === 1 &&
      candidate.evidenceGroupKey &&
      ["excluded", "included_exact", "buyer_paid"].includes(candidate.shippingBasis) &&
      valuationPrice != null &&
      valuationPrice > 0 &&
      normalizedPriceEUR != null &&
      normalizedPriceEUR > 0,
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
      valuationEligible,
      needsRevalidation: candidate.needsRevalidation,
      soldAt: candidate.soldAt,
      soldOn: candidate.soldOn,
      observedAt: candidate.observedAt,
    },
  }
}
