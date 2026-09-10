import type { CurrentOfferEvidence, MarketSignalDraft } from "./market-model"

const HOUR_MS = 3_600_000

// Scanner cadence deliberately runs inside these windows:
// marketplace normal/cold = 72h, expiry = 96h
// retail normal/cold = 168h, expiry = 192h
// The extra day is operational grace, not permission to keep stale stock forever.
export const MARKETPLACE_OFFER_MAX_AGE_HOURS = 96
export const RETAIL_OFFER_MAX_AGE_HOURS = 192

export function filterFreshCurrentOffers(
  offers: CurrentOfferEvidence[],
  now: Date,
): CurrentOfferEvidence[] {
  return offers.filter((offer) => {
    const checkedAt = Date.parse(offer.observedAt)
    if (!Number.isFinite(checkedAt)) return false

    const ageMs = Math.max(0, now.getTime() - checkedAt)
    const maxAgeHours = offer.channel === "marketplace"
      ? MARKETPLACE_OFFER_MAX_AGE_HOURS
      : RETAIL_OFFER_MAX_AGE_HOURS

    return ageMs <= maxAgeHours * HOUR_MS
  })
}

// Public v1 semantics deliberately keep three different concepts separate:
// - Market Value: demonstrated market value (sold evidence on the secondary market,
//   or the composite retail regime while the product is genuinely available retail).
// - Active asks: current seller expectations. They remain visible as a separate
//   signal but never pull a secondary-market Market Value up or down.
// - Trend: derived only from completed-sale history elsewhere in R3.
//
// Therefore a secondary-only Release without sold evidence never publishes a
// Market Value, even if several sellers are currently asking a price. Those asks
// are still retained on the signal so the UI can show the market's asking level.
export function applyPublicMarketPublicationPolicy(
  signal: MarketSignalDraft,
): MarketSignalDraft {
  if (signal.retailSourceCount > 0) return signal

  if (signal.soldAnchorEUR != null && signal.soldEvidenceCount > 0) {
    return {
      ...signal,
      marketRegime: "secondary_market_driven",
      marketValueEUR: signal.soldAnchorEUR,
      lowEUR: signal.soldAnchorEUR,
      highEUR: signal.soldAnchorEUR,
    }
  }

  if (signal.activeAnchorEUR != null || signal.activeOfferCount > 0) {
    return {
      ...signal,
      marketRegime: "insufficient",
      marketValueEUR: null,
      lowEUR: null,
      highEUR: null,
    }
  }

  return signal
}
