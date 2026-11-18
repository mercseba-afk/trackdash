import type { OfferOrigin } from "./offer-origin"
import type { ReleaseMarketSignalView } from "./view-types"
import { observedMarketReferencePrice } from "./presentation.ts"
import { withCatalogAskingReference } from "./collection-valuation.ts"

const DAY = 86_400_000
export const RECENT_RETAIL_RESERVE_DAYS = 30

export interface RecentRetailReserveOffer {
  releaseId: string
  releaseDate: string
  itemPriceEUR: number
  checkedAt: string
  origin: OfferOrigin
  acceptedExactKit: boolean
  availability: string
  channel: string
}

/** Last dated shop quote for a newly released kit, never a current offer.
 * Preserve every existing catalog/collection quote and all canonical metrics.
 * A later current offer wins through the normal shared server projection.
 */
export function withRecentRetailReserve(
  signal: ReleaseMarketSignalView,
  offers: RecentRetailReserveOffer[],
  now = Date.now(),
): ReleaseMarketSignalView {
  if (observedMarketReferencePrice(signal) != null) return signal
  const eligible = offers.flatMap((offer) => {
    const released = Date.parse(offer.releaseDate)
    const checked = Date.parse(offer.checkedAt)
    const expiry = Math.min(released, checked) + RECENT_RETAIL_RESERVE_DAYS * DAY
    if (offer.channel !== "retail" || offer.availability !== "out_of_stock" ||
      !offer.acceptedExactKit || !Number.isFinite(offer.itemPriceEUR) || offer.itemPriceEUR <= 0 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(offer.releaseDate) ||
      !Number.isFinite(released) || !Number.isFinite(checked) ||
      released > now || checked > now || expiry < now) return []
    return [{ ...offer, checked, expiry }]
  }).sort((a, b) => b.checked - a.checked || a.itemPriceEUR - b.itemPriceEUR)
  const quote = eligible[0]
  if (!quote) return signal
  return withCatalogAskingReference({
    ...signal,
    historicalAskItemEUR: quote.itemPriceEUR,
    historicalAskObservedAt: quote.checkedAt,
    historicalAskOrigin: quote.origin,
    historicalAskShippingEUR: null,
    historicalAskItemPlusShippingEUR: null,
    historicalAskKind: "recent_retail_out_of_stock",
    historicalAskValidUntil: new Date(quote.expiry).toISOString(),
  })
}
