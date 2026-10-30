import type { ReleaseMarketSignalView } from "./view-types"

export type CollectionReferenceKind = "observed"
export interface SealedCollectionReference {
  valueEUR: number
  kind: CollectionReferenceKind
}

/** One consistent collection basis: the server's external asking reference.
 * The server validates edition, condition, seller independence and source.
 * A quote may be international or dated, with provenance shown alongside.
 * Never fill it with SOLD, canonical MV or the owner’s own asking price.
 */
export function sealedCollectionReference(
  signal: ReleaseMarketSignalView | null | undefined,
  now = Date.now(),
): SealedCollectionReference | null {
  if (!signal || signal.collectionAskItemEUR == null ||
      !Number.isFinite(signal.collectionAskItemEUR) || signal.collectionAskItemEUR <= 0 ||
      !Number.isFinite(signal.collectionAskSellerCount) || (signal.collectionAskSellerCount ?? 0) < 1) return null
  const checkedAt = Date.parse(signal.collectionAskObservedAt ?? "")
  const deadline = Date.parse(signal.collectionAskValidUntil ?? signal.offersValidUntil ?? "")
  if (!Number.isFinite(checkedAt) || checkedAt > now || now - checkedAt > 180 * 86_400_000 ||
      !Number.isFinite(deadline) || now > deadline) return null
  return { valueEUR: signal.collectionAskItemEUR, kind: "observed" }
}

export function collectionReferenceCaption(signal: ReleaseMarketSignalView | null | undefined, it: boolean): string {
  if (!signal?.collectionAskItemEUR) return it ? "Quotazioni in raccolta" : "Collecting quotes"
  const count = signal.collectionAskSellerCount ?? 0
  const sample = count === 1 ? (it ? "1 quotazione" : "1 quote") : (it ? `Mediana · ${count} venditori` : `Median · ${count} sellers`)
  const origin = signal.collectionAskOrigin === "eu" ? (it ? "UE" : "EU") : signal.collectionAskOrigin === "extra_eu" ? (it ? "Extra UE" : "Non-EU") : (it ? "Internazionale" : "International")
  const date = signal.collectionAskIsHistorical && signal.collectionAskObservedAt
    ? ` · ${new Date(signal.collectionAskObservedAt).toLocaleDateString(it ? "it-IT" : "en-GB")}` : ""
  return `${sample} · ${origin}${date}`
}
