"use client"

import { BarChart3 } from "lucide-react"
import { TrendIndicator } from "@/components/market-bits"
import { Card, CardContent } from "@/components/ui/card"
import { formatMoney } from "@/lib/format"
import { useI18n } from "@/lib/i18n"
import type { ReleaseMarketSignalView } from "@/lib/market/view-types"
import { hasReliableObservedPriceTrend, observedMarketAskCountLabel, observedMarketDisplayLabel, observedMarketDisplayPrice, observedMarketAskTrendLabel } from "@/lib/market/presentation"

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
  const observed = observedMarketDisplayPrice(signal)
  const hasValue = signal?.valueEUR != null && signal.valueEUR > 0
  const hasObserved = observed != null && observed > 0

  const hasReliableAskTrend = hasReliableObservedPriceTrend(signal)

  const trend = signal?.trendPercent != null
    ? {
        value: signal.trendPercent,
        label: it ? "Trend mercato" : "Market trend",
        window: valueTrendWindow(signal.trendWindowMonths, it),
      }
    : hasReliableAskTrend
      ? {
          value: signal!.askTrendPercent!,
          label: observedMarketAskTrendLabel(it),
          window: askTrendWindow(signal!.askTrendWindowDays, it),
        }
      : null

  const evidence: string[] = []
  if ((signal?.currentOfferCount ?? 0) > 0) {
    const askCountLabel = observedMarketAskCountLabel(signal, it)
    if (askCountLabel) evidence.push(askCountLabel)
  }
  if ((signal?.soldUnits ?? 0) > 0) {
    evidence.push(
      it
        ? `${signal!.soldUnits} vendite osservate`
        : `${signal!.soldUnits} observed sales`,
    )
  }

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
                <div className="flex flex-wrap items-center gap-1.5 pb-1 text-sm">
                  <span className="font-medium text-muted-foreground">{trend.label}</span>
                  <TrendIndicator value={trend.value} />
                  {trend.window ? <span className="text-xs text-muted-foreground">· {trend.window}</span> : null}
                </div>
              ) : null}
            </div>
            {hasObserved ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {observedMarketDisplayLabel(signal, it)}{" "}
                <strong className="font-semibold tabular-nums text-foreground">≈ {formatMoney(observed!)}</strong>
              </p>
            ) : null}
          </div>
        ) : hasObserved ? (
          <div className="mt-3">
            <p className="text-sm font-medium text-muted-foreground">{observedMarketDisplayLabel(signal, it)}</p>
            <div className="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1">
              <p className={compact ? "text-2xl font-semibold tabular-nums" : "text-4xl font-semibold tracking-[-0.04em] tabular-nums"}>
                ≈ {formatMoney(observed!)}
              </p>
              {trend ? (
                <div className="flex flex-wrap items-center gap-1.5 pb-1 text-sm">
                  <span className="font-medium text-muted-foreground">{trend.label}</span>
                  <TrendIndicator value={trend.value} />
                  {trend.window ? <span className="text-xs text-muted-foreground">· {trend.window}</span> : null}
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

        {evidence.length > 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">{evidence.join(" · ")}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
