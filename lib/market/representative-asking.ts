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
// Require at least THREE distinct verified sellers for a robust median. EU
// source takes priority, but unknown-origin listings are eligible for this
// EU-comparable group only with a verified Italian delivery quote. When no
// European sample exists, an international median is allowed only as an
// informational asking-price benchmark, explicitly marked non-EU in UI.
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

  const values = [...byListing.values()]
  const eu = values.filter((x) => x.origin === "eu" || (x.origin === "unknown" && x.deliveredToItaly))
  const other = values.filter((x) => x.origin === "extra_eu")
  const unknown = values.filter((x) => x.origin === "unknown" && !x.deliveredToItaly)
  // Never mix a Europe-comparable sample with cheaper international item-only
  // prices; never fill a thin European pool with foreign sellers.
  const chosen = eu.length > 0 ? eu : other.length > 0 ? other : unknown
  const origin: OfferOrigin = eu.length > 0 ? "eu" : other.length > 0 ? "extra_eu" : "unknown"

  // A seller may publish many listings at different prices. Their lowest
  // verified available kit is one market quote, not multiple independent votes.
  const bySeller = new Map<string, RepresentativeAskCandidate>()
  for (const offer of chosen) {
    const seller = offer.sellerFingerprint!
    const previous = bySeller.get(seller)
    if (!previous || offer.itemPriceEUR! < previous.itemPriceEUR!) bySeller.set(seller, offer)
  }
  if (bySeller.size < 3) return null

  const independent = [...bySeller.values()]
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
