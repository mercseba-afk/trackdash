"use client"

import { Card, CardContent } from "@/components/ui/card"
import { formatMoney } from "@/lib/format"
import { useI18n } from "@/lib/i18n"
import type { ReleaseMarketSignalView } from "@/lib/market/view-types"
import {
  observedMarketKnownShipping,
  observedMarketPrice,
  observedMarketReferenceIsHistorical,
  observedMarketReferencePrice,
} from "@/lib/market/presentation"

// One neutral, predictable presentation on EVERY Release and copy detail.
// Every headline is the price of the KIT ONLY. Shipping is never added to
// SOLD, ASK or Market Value; it is supplementary acquisition information.
export function ReleaseMarketOverview({
  signal,
  compact = false,
}: {
  signal?: ReleaseMarketSignalView | null
  compact?: boolean
}) {
  const { locale } = useI18n()
  const it = locale === "it"
  const sold = signal?.soldAnchorEUR != null && signal.soldAnchorEUR > 0 ? signal.soldAnchorEUR : null
  const ask = observedMarketReferencePrice(signal)
  const historical = observedMarketReferenceIsHistorical(signal)
  const hasValue = signal?.valueEUR != null && signal.valueEUR > 0
  const observedAt = historical ? signal?.historicalAskObservedAt : signal?.observedPriceAt
  const shipping = historical ? signal?.historicalAskShippingEUR : observedMarketKnownShipping(signal)
  const date = observedAt ? new Date(observedAt) : null
  const dateLabel = date && Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat(it ? "it-IT" : "en-GB", {
        day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
      }).format(date)
    : null

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardContent className={compact ? "space-y-3 p-4" : "space-y-3 p-5 md:p-6"}>
        <p className="text-sm font-semibold">{it ? "Mercato" : "Market"}</p>
        {sold != null || ask != null ? (
          <>
            <div className="divide-y divide-border/60 rounded-xl border border-border/70">
              {sold != null ? (
                <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{it ? "Vendite concluse" : "Completed sales"}</p>
                    {signal && signal.soldUnits > 0 ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {signal.soldUnits} {it
                          ? (signal.soldUnits === 1 ? "vendita osservata" : "vendite osservate")
                          : (signal.soldUnits === 1 ? "observed sale" : "observed sales")}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-lg font-semibold tabular-nums">≈ {formatMoney(sold)}</span>
                </div>
              ) : null}
              {ask != null ? (
                <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{it ? "Prezzo richiesto osservato" : "Seller asking price"}</p>
                    {historical ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {it ? "Disponibilità da verificare" : "Availability not verified"}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-lg font-semibold tabular-nums">{formatMoney(ask)}</span>
                </div>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              {it ? "Prezzi del solo kit · spedizione esclusa." : "Kit-only prices · shipping excluded."}
            </p>
            {ask != null ? (
              <p className="text-xs leading-relaxed text-muted-foreground">
                {dateLabel ? (it ? `Offerta osservata il ${dateLabel}.` : `Offer observed on ${dateLabel}.`) : null}
                {shipping != null && shipping >= 0
                  ? (it ? ` Spedizione indicata: +${formatMoney(shipping)} (non inclusa).` : ` Listed shipping: +${formatMoney(shipping)} (not included).`)
                  : (it ? " Spedizione da verificare." : " Shipping not verified.")}
                {it ? " Per acquisti extra-UE possono aggiungersi spedizione internazionale e oneri d'importazione." : " International shipping and import charges may apply to purchases from outside the EU."}
              </p>
            ) : null}
          </>
        ) : hasValue ? (
          <div className="rounded-xl border border-border/70 px-3 py-3 sm:px-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">{it ? "Valore stimato" : "Estimated value"}</p>
              <span className="text-lg font-semibold tabular-nums">≈ {formatMoney(signal!.valueEUR!)}</span>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">{it ? "Solo kit · spedizione esclusa." : "Kit only · shipping excluded."}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{it ? "Mercato in osservazione" : "Market under observation"}</p>
        )}
      </CardContent>
    </Card>
  )
}
