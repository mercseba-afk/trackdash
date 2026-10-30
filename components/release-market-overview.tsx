"use client"

import { Card, CardContent } from "@/components/ui/card"
import { formatMoney } from "@/lib/format"
import { useI18n } from "@/lib/i18n"
import type { ReleaseMarketSignalView } from "@/lib/market/view-types"
import {
  observedMarketKnownShipping,
  representativeAskingCaption,
  observedMarketOfferOrigin,
  observedMarketReferenceIsHistorical,
  observedMarketReferencePrice,
} from "@/lib/market/presentation"

// Shared by Release detail AND copy detail. All Releases use the same neutral
// two-row layout, even if evidence is missing. The scan-backed projection owns
// the selected ASK, observation age, shipping and verified geographic origin.
export function ReleaseMarketOverview({
  signal,
  compact = false,
  showCollectionInvite = false,
}: {
  signal?: ReleaseMarketSignalView | null
  compact?: boolean
  showCollectionInvite?: boolean
}) {
  const { locale } = useI18n()
  const it = locale === "it"
  const sold = signal?.soldAnchorEUR != null && signal.soldAnchorEUR > 0 ? signal.soldAnchorEUR : null
  const mv = signal?.valueEUR != null && signal.valueEUR > 0 ? signal.valueEUR : null
  const reference = mv ?? sold
  const soldCount = signal?.soldUnits ?? 0
  const soldCountText = it
    ? `${soldCount} ${soldCount === 1 ? "vendita conclusa" : "vendite concluse"}`
    : `${soldCount} completed ${soldCount === 1 ? "sale" : "sales"}`
  const ask = observedMarketReferencePrice(signal)
  const historical = observedMarketReferenceIsHistorical(signal)
  const origin = observedMarketOfferOrigin(signal)
  // A median does not correspond to a single shipping quote. Do not attach
  // the canonically selected offer's shipping price to an aggregate.
  const representative = representativeAskingCaption(signal, it)
  const shipping = representative ? null
    : historical ? signal?.historicalAskShippingEUR : observedMarketKnownShipping(signal)
  const observedAt = representative ? signal?.representativeAskObservedAt
    : historical ? signal?.historicalAskObservedAt : signal?.observedPriceAt
  const date = observedAt && Number.isFinite(Date.parse(observedAt))
    ? new Intl.DateTimeFormat(it ? "it-IT" : "en-GB", {
        day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
      }).format(new Date(observedAt))
    : null

  return (
    <Card className="overflow-hidden border-border/70 bg-muted/30 shadow-sm">
      <CardContent className={compact ? "space-y-3 p-4" : "space-y-3 p-5 md:p-6"}>
        <p className="text-sm font-semibold">{it ? "Mercato" : "Market"}</p>
        <div className="divide-y divide-border/60 rounded-xl border border-border/70 bg-background/80">
          <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">{it ? "Riferimento mercato" : "Market reference"}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {mv != null
                  ? `${it ? "Stima TrackDash" : "TrackDash estimate"}${soldCount > 0 ? ` · ${soldCountText}` : ""}`
                  : sold != null
                    ? `${soldCountText} · ${it ? "riferimento, non stima" : "reference, not an estimate"}`
                    : (it ? "Nessuna vendita osservata" : "No completed sales observed")}
              </p>
            </div>
            <span className="shrink-0 text-lg font-semibold tabular-nums">
              {reference != null ? `≈ ${formatMoney(reference)}` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">{it ? "Prezzi negli annunci" : "Listing prices"}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {ask == null
                  ? (it ? "Non abbiamo un prezzo richiesto" : "We haven't observed an asking price")
                  : representative
                    ? `${representative}${date ? ` · ${date}` : ""}`
                    : historical
                    ? (it
                      ? `Ultima offerta osservata${date ? ` · ${date}` : ""} · da verificare`
                      : `Last observed offer${date ? ` · ${date}` : ""} · unverified`)
                    : (it ? "Offerta verificata di recente" : "Recently verified offer")}
              </p>
              {ask != null && shipping != null && shipping >= 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {it ? `Spedizione indicata: ${formatMoney(shipping)}` : `Listed shipping: ${formatMoney(shipping)}`}
                </p>
              ) : null}
            </div>
            {ask != null ? (
              <div className="shrink-0 text-right">
                <p className="text-lg font-semibold tabular-nums">{formatMoney(ask)}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{it ? "Spedizione esclusa" : "Shipping excluded"}</p>
              </div>
            ) : null}
          </div>
        </div>
        {ask != null && origin === "extra_eu" ? (
          <div className="inline-flex w-fit items-center rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900">
            {it ? "Extra-UE · possibili oneri d'importazione" : "Outside EU · import charges may apply"}
          </div>
        ) : null}
        {showCollectionInvite ? (
          <p className="px-3 text-xs leading-relaxed text-muted-foreground sm:px-4">
            <span className="font-semibold text-brand">{it ? "Ne hai una?" : "Own one?"}</span>{" "}
            {it ? "Aggiungila alla collezione e fai il tuo prezzo!" : "Add it to your collection and set your price!"}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
