import type { OfferOrigin } from "./offer-origin"

// Private candidate metadata is processed server-side. Never serialize seller
// identities or raw listing records to public clients.
export interface RepresentativeAskCandidate {
  listingKey: string | null
  sellerFingerprint: string | null
  itemPriceEUR: number | null
  origin: OfferOrigin
  deliveredToItaly: boolean
  checkedAt: string
  acceptedExactKit: boolean
}

// Stable eBay item identifier across Browse v1/legacy API formats.
// IMPORTANT: capturing group [1] must contain the 12-digit listing ID,
// never undefined. A missing capture previously collapsed every listing into
// the same "ebay:undefined" key, producing a false one-seller quote.
export function normalizeMarketListingKey(externalId: string | null | undefined): string | null {
  const raw = externalId?.trim() ?? ""
  if (!raw) return null
  const match = /(?:^|\\|)([0-9]{12})(?:\\||$)/.exec(raw)
  return match ? `ebay:${match[1]}` : raw
}

export interface RepresentativeAsk {
  itemPriceEUR: number
  sellerCount: number
  origin: OfferOrigin
  observedAt: string
}

function validPrice(n: number | null): n is number {
  return n != null && Number.isFinite(n) && n > 0
}

function median(values: number[]): number {
  const prices = [...values].sort((a, b) => a - b)
  const mid = Math.floor(prices.length / 2)
  return prices.length % 2 === 1 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2
}

// Pure projection algorithm; it is NOT a new eBay scan and it NEVER writes
// canonical Market Value, asking snapshots, collection values or queue jobs.
//
// Asking prices describe seller expectations, NOT Market Value or European
// landed cost. One verified seller => that seller's actual lowest current
// quote. Two or more => median of independent sellers' current kit-only asks,
// including international sellers, with geographic provenance disclosed.
// Never use geography to silently discard legitimate asking-price evidence.
export function representativeAskingMedian(
  candidates: RepresentativeAskCandidate[],
  asOf = new Date(),
): RepresentativeAsk | null {
  const cutoffMs = asOf.getTime() - 15 * 86_400_000
  const byListing = new Map<string, RepresentativeAskCandidate>()
  for (const offer of candidates) {
    if (!offer.acceptedExactKit || !offer.listingKey || !offer.sellerFingerprint ||
        !validPrice(offer.itemPriceEUR)) continue
    const timestamp = Date.parse(offer.checkedAt)
    if (!Number.isFinite(timestamp) || timestamp > asOf.getTime() || timestamp < cutoffMs) continue
    const old = byListing.get(offer.listingKey)
    if (!old || Date.parse(old.checkedAt) < timestamp) byListing.set(offer.listingKey, offer)
  }

  // Each independently identified seller has one vote, regardless of number
  // of listings or their eBay country domains. This is an informational market
  // sample, so we do NOT discard Japan/US offers when EU ones also exist.
  const bySeller = new Map<string, RepresentativeAskCandidate>()
  for (const offer of byListing.values()) {
    const seller = offer.sellerFingerprint!
    const previous = bySeller.get(seller)
    if (!previous || offer.itemPriceEUR! < previous.itemPriceEUR!) bySeller.set(seller, offer)
  }
  if (bySeller.size === 0) return null

  const independent = [...bySeller.values()]
  // Geographic label describes this ENTIRE sample, not just one listing.
  // Mixed or unknown origins never claim that all sellers ship from the EU.
  const origins = new Set(independent.map((offer) => offer.origin))
  const origin: OfferOrigin = origins.size === 1 ? independent[0].origin : "unknown"
  // One known seller is an actual asking price; two or more produce a median.
  // Use integer cents to avoid floating-point half-cent instability.
  const valueCents = median(independent.map((x) => Math.round(x.itemPriceEUR! * 100)))
  const last = independent.map((x) => x.checkedAt).sort().at(-1)!
  return {
    itemPriceEUR: Math.round(valueCents) / 100,
    sellerCount: independent.length,
    origin,
    observedAt: last,
  }
}
