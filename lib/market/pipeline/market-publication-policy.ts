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

// A single secondary-market asking price is evidence, not a market value.
// Publish secondary-only R3 only when there is either release-specific sold
// evidence or at least two independent active marketplace representatives.
// One genuinely available retail source may still publish a low-confidence
// retail signal because it is an observable purchasable market price.
export function applyPublicMarketPublicationPolicy(
  signal: MarketSignalDraft,
): MarketSignalDraft {
  const singleSecondaryAskOnly =
    signal.retailSourceCount === 0 &&
    signal.soldEvidenceCount === 0 &&
    signal.activeOfferCount < 2 &&
    signal.activeAnchorEUR != null

  if (!singleSecondaryAskOnly) return signal

  return {
    ...signal,
    marketRegime: "insufficient",
    marketValueEUR: null,
    lowEUR: null,
    highEUR: null,
  }
}
