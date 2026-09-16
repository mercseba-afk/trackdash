import type { EbayMarketplaceId } from "./ebay-browse-adapter"

export interface ExistingEbayOfferIdentity {
  candidateId: string
  releaseId: string
  itemId: string
  originalMarketplace: EbayMarketplaceId | null
  availability: string
}

export interface EbayMarketplaceFetchState {
  marketplace: EbayMarketplaceId
  succeeded: boolean
  complete: boolean
  itemIds: ReadonlySet<string>
}

export function ebaySourceRecordKey(itemId: string): string {
  return `ebay:${itemId}`
}

/**
 * Plans conservative offer-state neutralization after a Browse sweep.
 *
 * A prior offer is absent only when its original marketplace completed
 * successfully and the item did not appear in any successful marketplace
 * response. Failed/partial marketplace fetches never imply that a listing ended.
 */
export function planMissingEbayOffers(
  targetReleaseId: string,
  existing: ExistingEbayOfferIdentity[],
  fetches: EbayMarketplaceFetchState[],
): string[] {
  const completed = new Map(fetches.filter((fetch) => fetch.succeeded && fetch.complete).map((fetch) => [fetch.marketplace, fetch]))
  const presentItemIds = new Set(fetches.filter((fetch) => fetch.succeeded).flatMap((fetch) => [...fetch.itemIds]))

  return existing.flatMap((offer) => {
    if (offer.releaseId !== targetReleaseId || offer.availability === "unknown") return []
    if (presentItemIds.has(offer.itemId)) return []
    if (!offer.originalMarketplace || !completed.has(offer.originalMarketplace)) return []
    return [offer.candidateId]
  })
}
