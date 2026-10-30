import type { ReleaseMarketSignalView } from "./view-types"
import {
  observedMarketReferencePrice,
  observedMarketReferenceIsHistorical,
  observedMarketOfferOrigin,
  representativeAskingCaption,
} from "./presentation.ts"

export type CollectionReferenceKind = "observed"
export interface SealedCollectionReference { valueEUR: number; kind: CollectionReferenceKind }

/** The exact catalog "Prezzi negli annunci" value, with no independent
 * geography, sample-size or history selection. Shared snapshot expiry runs
 * before either catalog rendering or collection analytics. SOLD stays separate.
 */
export function sealedCollectionReference(
  signal: ReleaseMarketSignalView | null | undefined,
  _now = Date.now(),
): SealedCollectionReference | null {
  const valueEUR = observedMarketReferencePrice(signal)
  return valueEUR != null && Number.isFinite(valueEUR) && valueEUR > 0
    ? { valueEUR, kind: "observed" } : null
}

export function collectionReferenceCaption(signal: ReleaseMarketSignalView | null | undefined, it: boolean): string {
  const current = representativeAskingCaption(signal, it)
  if (current) return current
  if (observedMarketReferencePrice(signal) == null) return it ? "Quotazioni in raccolta" : "Collecting quotes"
  const historical = observedMarketReferenceIsHistorical(signal)
  const date = historical ? signal?.historicalAskObservedAt : signal?.observedPriceAt
  const origin = observedMarketOfferOrigin(signal)
  const region = origin === "eu" ? (it ? "UE" : "EU") : origin === "extra_eu" ? (it ? "Extra UE" : "Non-EU") : (it ? "Internazionale" : "International")
  return `${it ? "1 quotazione" : "1 quote"} · ${region}${date ? ` · ${new Date(date).toLocaleDateString(it ? "it-IT" : "en-GB")}` : ""}`
}

/** Compatibility fields mirror the same catalog selector. No second engine.
 * Preserve object identity when nothing changed (provider/cache expiry).
 */
export function withCatalogAskingReference(signal: ReleaseMarketSignalView): ReleaseMarketSignalView {
  const price = observedMarketReferencePrice(signal)
  const representative = signal.representativeAskItemEUR != null && signal.representativeAskItemEUR > 0
  const historical = observedMarketReferenceIsHistorical(signal)
  const date = representative ? signal.representativeAskObservedAt : historical ? signal.historicalAskObservedAt : signal.observedPriceAt
  const fields = {
    collectionAskItemEUR: price,
    collectionAskSellerCount: price == null ? 0 : representative ? signal.representativeAskSellerCount ?? 1 : 1,
    collectionAskObservedAt: date ?? null,
    collectionAskOrigin: observedMarketOfferOrigin(signal),
    collectionAskIsHistorical: historical,
    collectionAskValidUntil: price == null ? null : historical && date && Number.isFinite(Date.parse(date))
      ? new Date(Date.parse(date) + 180 * 86_400_000).toISOString() : signal.offersValidUntil ?? null,
  }
  return Object.entries(fields).some(([key, value]) => signal[key as keyof ReleaseMarketSignalView] !== value)
    ? { ...signal, ...fields } : signal
}
