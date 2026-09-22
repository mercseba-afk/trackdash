"use client"

import type { ReleaseMarketSignalView } from "@/lib/market/view-types"
import { formatMoney } from "@/lib/format"
import { useI18n } from "@/lib/i18n"
import { TrendIndicator } from "@/components/market-bits"

export function MarketSignalInline({
  signal,
  showStartingPrice = false,
}: {
  signal?: ReleaseMarketSignalView | null
  showStartingPrice?: boolean
}) {
  const { locale } = useI18n()
  const it = locale === "it"

  if (!signal) {
    return <span className="text-xs text-muted-foreground">{it ? "Dati di mercato in verifica" : "Market data under review"}</span>
  }

  const hasValue = signal.valueEUR != null && signal.valueEUR > 0
  const observedPrice =
    signal.startingEffectiveCostEUR ??
    signal.startingItemPriceEUR ??
    signal.retailAnchorEUR ??
    signal.activeAnchorEUR ??
    null
  const hasObservedPrice = observedPrice != null && observedPrice > 0
  const observedDirection =
    signal.askTrendPercent != null && signal.askTrendPercent >= 5
      ? (it ? "Prezzo osservato in salita" : "Observed price rising")
      : signal.askTrendPercent != null && signal.askTrendPercent <= -5
        ? (it ? "Prezzo osservato in calo" : "Observed price falling")
        : null

  return (
    <div className="flex flex-col gap-1">
      {hasValue ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-lg font-semibold tabular-nums">≈ {formatMoney(signal.valueEUR!)}</span>
          {signal.trendPercent != null ? <TrendIndicator value={signal.trendPercent} /> : null}
        </div>
      ) : hasObservedPrice ? (
        <>
          <span className="text-xs font-medium text-muted-foreground">{it ? "Prezzo osservato" : "Observed price"}</span>
          <span className="text-lg font-semibold tabular-nums text-foreground">≈ {formatMoney(observedPrice)}</span>
        </>
      ) : (
        <span className="text-xs font-medium text-muted-foreground">{it ? "Dati di mercato in verifica" : "Market data under review"}</span>
      )}
      {hasValue && showStartingPrice && hasObservedPrice ? (
        <span className="text-xs text-muted-foreground">
          {it ? "Prezzo osservato" : "Observed price"} <span className="font-medium text-foreground">{formatMoney(observedPrice)}</span>
          {observedDirection ? <span className="ml-1.5 font-medium text-brand">· {observedDirection}</span> : null}
        </span>
      ) : null}
    </div>
  )
}
