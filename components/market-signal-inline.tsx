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
    return <span className="text-xs text-muted-foreground">{it ? "Mercato raro · valore non disponibile" : "Thin market · value unavailable"}</span>
  }

  const hasValue = signal.valueEUR != null && signal.valueEUR > 0
  const hasCleanActiveAsk =
    !hasValue &&
    signal.activeOfferCount > 0 &&
    signal.retailSourceCount === 0 &&
    signal.startingItemPriceEUR != null &&
    signal.startingItemPriceEUR > 0

  return (
    <div className="flex flex-col gap-1">
      {hasValue ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-lg font-semibold tabular-nums">≈ {formatMoney(signal.valueEUR!)}</span>
          {signal.trendPercent != null ? <TrendIndicator value={signal.trendPercent} /> : null}
        </div>
      ) : hasCleanActiveAsk ? (
        <>
          <span className="text-xs font-medium text-muted-foreground">{it ? "Valore in definizione" : "Value being established"}</span>
          <span className="text-xs text-muted-foreground">
            {it ? "In vendita da" : "Listed from"} <span className="font-semibold text-foreground">{formatMoney(signal.startingItemPriceEUR!)}</span>
          </span>
        </>
      ) : (
        <span className="text-xs font-medium text-muted-foreground">{it ? "Mercato raro · valore non disponibile" : "Thin market · value unavailable"}</span>
      )}
      {hasValue && showStartingPrice && signal.startingItemPriceEUR != null ? (
        <span className="text-xs text-muted-foreground">
          {it ? "Disponibile da" : "Available from"} <span className="font-medium text-foreground">{formatMoney(signal.startingItemPriceEUR)}</span>
        </span>
      ) : null}
    </div>
  )
}
