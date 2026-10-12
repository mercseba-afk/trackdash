import type { ReleaseMarketSignalView } from "./view-types"

export type CollectionReferenceKind = "estimated" | "sold" | "observed"

export interface SealedCollectionReference {
  valueEUR: number
  kind: CollectionReferenceKind
}

function positive(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value) && value > 0
}

/**
 * This is an indicative, kit-only COLLECTION REFERENCE, not the canonical
 * Market Value (MV). All three evidence types remain explicitly distinguishable:
 *
 * 1. A publishable canonical MV always wins.
 * 2. An exact-Release completed-sale reference is a weaker historical fallback
 *    (even one sale), NEVER promoted to canonical MV or personal gain.
 * 3. A current, Europe-comparable ASK is a last resort. An extra-EU asking
 *    price without a verified Italian delivery quote cannot value an owned kit.
 *
 * Old/dated ASK remains displayable in the Release card, but is NOT a
 * valuation input. Neither kit shipping nor unverified import fees are added.
 */
export function sealedCollectionReference(
  signal: ReleaseMarketSignalView | null | undefined,
): SealedCollectionReference | null {
  if (!signal) return null

  if (positive(signal.valueEUR)) {
    return { valueEUR: signal.valueEUR, kind: "estimated" }
  }

  if (signal.soldUnits > 0 && positive(signal.soldAnchorEUR)) {
    return { valueEUR: signal.soldAnchorEUR, kind: "sold" }
  }

  // The public projection sets startingItemPriceEUR only for a current,
  // TTL-valid, canonically selected offer. Unlike historicalAskItemEUR,
  // this may support a conservative reference if the source is comparable.
  const ask = signal.startingItemPriceEUR
  if (!positive(ask)) return null
  const explicitlyEuropean = signal.currentAskOrigin === "eu"
  const verifiedDelivery =
    signal.startingCostBasis === "delivered" &&
    positive(signal.startingEffectiveCostEUR) &&
    signal.observedShippingEUR != null &&
    Number.isFinite(signal.observedShippingEUR) &&
    signal.observedShippingEUR >= 0 &&
    Math.abs(signal.startingEffectiveCostEUR - (ask + signal.observedShippingEUR)) <= 0.025

  // Never value an owned EU collection using a Japan/US item-only ASK.
  // Unknown-origin listings qualify only when actual delivery to Italy
  // has been quoted for the SAME selected offer.
  if (!explicitlyEuropean && (signal.currentAskOrigin === "extra_eu" || !verifiedDelivery)) {
    return null
  }
  return { valueEUR: ask, kind: "observed" }
}
