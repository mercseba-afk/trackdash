"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/format"
import { useI18n } from "@/lib/i18n"
import type { ReleaseMarketSignalView } from "@/lib/market/view-types"
import {
  isKnownExtraEuAsk,
  observedAskOriginCountry,
  observedMarketKnownShipping,
  observedMarketReferenceIsHistorical,
  observedMarketReferencePrice,
} from "@/lib/market/presentation"

// One shared, neutral, evidence-aware box on Release and copy detail.
// All amounts are kit-only EUR; current/historic ASK status, shipping and
// import-origin warnings are derived live from the same selected listing.
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
  const origin = observedAskOriginCountry(signal)
  const extraEu = isKnownExtraEuAsk(signal)
  const date = observedAt ? new Date(observedAt) : null
  const dateLabel = date && Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat(it ? "it-IT" : "en-GB", {
        day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
      }).format(date)
    : null
  const originLabel = origin
    ? new Intl.DisplayNames([it ? "it" : "en"], { type: "region" }).of(origin)
    : null

  return (
    <Card className="overflow-hidden border-brand/15 bg-brand/[0.035] shadow-sm">
      <CardContent className={compact ? "space-y-3 p-4" : "space-y-3 p-5 md:p-6"}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">{it ? "Mercato" : "Market"}</p>
          {sold != null ? (
            <Badge variant="outline" className="border-brand/20 bg-brand/10 text-[10px] font-semibold text-brand">
              {signal?.soldUnits ?? 0} {it ? (signal?.soldUnits === 1 ? "vendita conclusa" : "vendite concluse") : (signal?.soldUnits === 1 ? "completed sale" : "completed sales")}
            </Badge>
          ) : ask != null ? (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">{it ? "Solo prezzo richiesto" : "Asking price only"}</Badge>
          ) : null}
        </div>

        {sold != null || ask != null ? (
          <div className="divide-y divide-border/60 rounded-xl border border-border/70 bg-card/85">
            {sold != null ? (
              <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
                <p className="min-w-0 text-sm font-medium">{it ? "Vendite concluse" : "Completed sales"}</p>
                <span className="shrink-0 text-lg font-semibold tabular-nums">≈ {formatMoney(sold)}</span>
              </div>
            ) : null}
            {ask != null ? (
              <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{it ? "Prezzo richiesto osservato" : "Seller asking price"}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {historical
                      ? (it ? "Disponibilità da verificare" : "Availability not verified")
                      : (it ? "Offerta verificata" : "Verified listing")}
                    {dateLabel ? ` · ${dateLabel}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-lg font-semibold tabular-nums">{formatMoney(ask)}</span>
              </div>
            ) : null}
          </div>
        ) : hasValue ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/85 px-3 py-3 sm:px-4">
            <p className="text-sm font-medium">{it ? "Valore stimato" : "Estimated value"}</p>
            <span className="text-lg font-semibold tabular-nums">≈ {formatMoney(signal!.valueEUR!)}</span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{it ? "Mercato in osservazione" : "Market under observation"}</p>
        )}

        <p className="text-xs leading-tight text-muted-foreground">
          {it ? "Prezzi del solo kit · " : "Kit-only prices · "}
          <strong className="font-semibold text-foreground">{it ? "spedizione esclusa" : "shipping excluded"}</strong>
        </p>
        {ask != null ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            <span className="text-muted-foreground">
              {shipping != null
                ? (it ? "Spedizione indicata:" : "Listed shipping:")
                : (it ? "Spedizione da verificare" : "Shipping not verified")}
              {shipping != null ? <strong className="ml-1 font-semibold tabular-nums text-foreground">+{formatMoney(shipping)} {it ? "· esclusa" : "· excluded"}</strong> : null}
            </span>
            {extraEu ? (
              <Badge variant="outline" className="rounded-md border-border/70 bg-muted/55 px-2 py-0.5 text-[10px] font-semibold text-foreground">
                {it ? "Extra-UE" : "Outside EU"}{originLabel ? ` · ${originLabel}` : ""}
                {it ? " · possibili IVA/dazi" : " · possible VAT/duties"}
              </Badge>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
