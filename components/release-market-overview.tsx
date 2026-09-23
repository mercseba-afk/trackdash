"use client"

import { BarChart3, Info } from "lucide-react"
import { TrendIndicator } from "@/components/market-bits"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate, formatMoney } from "@/lib/format"
import { useI18n } from "@/lib/i18n"
import type { ReleaseMarketSignalView } from "@/lib/market/view-types"

function observedPrice(signal?: ReleaseMarketSignalView | null) {
  return (
    signal?.startingEffectiveCostEUR ??
    signal?.startingItemPriceEUR ??
    signal?.retailAnchorEUR ??
    signal?.activeAnchorEUR ??
    null
  )
}

function trendDirection(value: number, it: boolean) {
  if (value > 1) return it ? "In salita" : "Rising"
  if (value < -1) return it ? "In calo" : "Falling"
  return it ? "Stabile" : "Stable"
}

function valueTrendWindow(months: ReleaseMarketSignalView["trendWindowMonths"], it: boolean) {
  if (months === 12) return it ? "ultimo anno" : "last year"
  if (months === 6) return it ? "ultimi 6 mesi" : "last 6 months"
  if (months === 3) return it ? "ultimi 3 mesi" : "last 3 months"
  if (months === 1) return it ? "ultimo mese" : "last month"
  return null
}

function askTrendWindow(days: ReleaseMarketSignalView["askTrendWindowDays"], it: boolean) {
  if (!days) return null
  return it ? `ultimi ${days} giorni` : `last ${days} days`
}

export function ReleaseMarketOverview({
  signal,
  compact = false,
}: {
  signal?: ReleaseMarketSignalView | null
  compact?: boolean
}) {
  const { locale } = useI18n()
  const it = locale === "it"
  const observed = observedPrice(signal)
  const hasValue = signal?.valueEUR != null && signal.valueEUR > 0
  const hasObserved = observed != null && observed > 0

  const trend = signal?.trendPercent != null
    ? {
        value: signal.trendPercent,
        label: it ? "Trend mercato" : "Market trend",
        window: valueTrendWindow(signal.trendWindowMonths, it),
      }
    : signal?.askTrendPercent != null
      ? {
          value: signal.askTrendPercent,
          label: it ? "Trend prezzo osservato" : "Observed price trend",
          window: askTrendWindow(signal.askTrendWindowDays, it),
        }
      : null

  const evidence: string[] = []
  if ((signal?.currentOfferCount ?? 0) >= 3) {
    evidence.push(
      it
        ? `${signal!.currentOfferCount} riferimenti correnti osservati`
        : `${signal!.currentOfferCount} current references observed`,
    )
  }
  if ((signal?.soldUnits ?? 0) >= 3) {
    evidence.push(
      it
        ? `${signal!.soldUnits} vendite osservate`
        : `${signal!.soldUnits} observed sales`,
    )
  }

  const concentratedSoldEvidence =
    !hasValue &&
    (signal?.soldUnits ?? 0) >= 3 &&
    signal?.soldSellerCount === 1

  const updatedAt = signal?.observedPriceAt ?? signal?.computedAt ?? null

  return (
    <Card className="overflow-hidden border-brand/20 bg-[linear-gradient(135deg,rgba(247,251,255,.98)_0%,rgba(238,245,255,.92)_100%)] shadow-sm">
      <CardContent className={compact ? "p-4" : "p-5 md:p-6"}>
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-brand" />
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
            {it ? "Mercato" : "Market"}
          </p>
        </div>

        {hasValue ? (
          <div className="mt-3">
            <p className="text-sm font-medium text-muted-foreground">{it ? "Valore stimato" : "Estimated value"}</p>
            <div className="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1">
              <p className={compact ? "text-2xl font-semibold tabular-nums" : "text-4xl font-semibold tracking-[-0.04em] tabular-nums"}>
                ≈ {formatMoney(signal!.valueEUR!)}
              </p>
              {trend ? (
                <div className="flex items-center gap-1.5 pb-1 text-sm">
                  <span className="font-medium text-muted-foreground">{trend.label}</span>
                  <TrendIndicator value={trend.value} />
                </div>
              ) : null}
            </div>
            {hasObserved ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {it ? "Prezzo osservato" : "Observed price"}{" "}
                <strong className="font-semibold tabular-nums text-foreground">≈ {formatMoney(observed!)}</strong>
              </p>
            ) : null}
          </div>
        ) : hasObserved ? (
          <div className="mt-3">
            <p className="text-sm font-medium text-muted-foreground">{it ? "Prezzo osservato" : "Observed price"}</p>
            <div className="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1">
              <p className={compact ? "text-2xl font-semibold tabular-nums" : "text-4xl font-semibold tracking-[-0.04em] tabular-nums"}>
                ≈ {formatMoney(observed!)}
              </p>
              {trend ? (
                <div className="flex items-center gap-1.5 pb-1 text-sm">
                  <span className="font-medium text-muted-foreground">{trend.label}</span>
                  <TrendIndicator value={trend.value} />
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-xl font-semibold">{it ? "Dati di mercato in verifica" : "Market data under review"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {it ? "Non c'è ancora un riferimento di prezzo abbastanza chiaro da pubblicare." : "There is not yet a sufficiently clear price reference to publish."}
            </p>
          </div>
        )}

        {trend ? (
          <p className="mt-2 text-xs font-medium text-muted-foreground">
            {trendDirection(trend.value, it)}
            {trend.window ? ` · ${trend.window}` : ""}
          </p>
        ) : signal ? (
          <p className="mt-2 text-xs font-medium text-muted-foreground">
            {it ? "Trend in raccolta: servono più osservazioni nel tempo." : "Trend gathering: more observations over time are needed."}
          </p>
        ) : null}

        {evidence.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {evidence.map((item) => (
              <span key={item} className="rounded-full border border-brand/15 bg-white/75 px-2.5 py-1 text-[11px] font-medium text-foreground">
                {item}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-4 border-t border-brand/10 pt-3 text-xs leading-5 text-muted-foreground">
          <p>
            {hasValue
              ? (it
                  ? "Stima TrackDash costruita incrociando le evidenze di mercato disponibili, con priorità alle vendite osservate e al mercato europeo."
                  : "TrackDash estimate built by combining available market evidence, prioritising observed sales and the European market.")
              : hasObserved
                ? (it
                    ? "Riferimento ricavato dall'osservazione corrente del mercato. Quando il costo di consegna è noto, TrackDash considera il costo effettivo per un acquirente europeo."
                    : "Reference derived from the current observed market. When delivery cost is known, TrackDash considers the effective cost for a European buyer.")
                : (it
                    ? "TrackDash continuerà ad aggiornare questa Release quando arriveranno nuovi dati."
                    : "TrackDash will keep updating this Release as new data arrives.")}
          </p>

          {concentratedSoldEvidence ? (
            <p className="mt-2 flex gap-2">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              <span>
                {it
                  ? "Le vendite osservate sono concentrate su un solo venditore: sono utili come contesto, ma non bastano da sole per consolidare un Valore stimato."
                  : "Observed sales are concentrated on a single seller: they are useful context, but not sufficient on their own to consolidate an Estimated value."}
              </span>
            </p>
          ) : null}

          {updatedAt ? (
            <p className="mt-2">
              {it ? "Ultimo aggiornamento" : "Last update"} · {formatDate(updatedAt)}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
