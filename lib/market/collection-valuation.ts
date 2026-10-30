import type { ReleaseMarketSignalView } from "./view-types"

export type CollectionReferenceKind = "observed"
export interface SealedCollectionReference {
  valueEUR: number
  kind: CollectionReferenceKind
}

/** One consistent collection basis: the server's current EU asking median.
 * The server validates edition, condition, seller independence and source.
 * Missing ASK stays unvalued; never fill it with SOLD, canonical MV, a single
 * seller quote, personal asking price or an international display median.
 */
export function sealedCollectionReference(
  signal: ReleaseMarketSignalView | null | undefined,
  now = Date.now(),
): SealedCollectionReference | null {
  if (!signal || signal.collectionAskItemEUR == null ||
      !Number.isFinite(signal.collectionAskItemEUR) || signal.collectionAskItemEUR <= 0 ||
      !Number.isFinite(signal.collectionAskSellerCount) || (signal.collectionAskSellerCount ?? 0) < 2) return null
  const checkedAt = Date.parse(signal.collectionAskObservedAt ?? "")
  const deadline = Date.parse(signal.offersValidUntil ?? "")
  if (!Number.isFinite(checkedAt) || checkedAt > now || now - checkedAt > 15 * 86_400_000 ||
      !Number.isFinite(deadline) || now > deadline) return null
  return { valueEUR: signal.collectionAskItemEUR, kind: "observed" }
}
