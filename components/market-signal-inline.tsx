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
    return <span className="text-xs text-muted-foreground">{it ? "Dati di mercato in arrivo" : "Market data coming soon"}</span>
  }

  const hasValue = signal.valueEUR != null && signal.valueEUR > 0
  const hasCleanActiveAsk =
    !hasValue &&
    signal.activeOfferCount > 0 &&
    signal.retailSourceCount === 0 &&
    signal.startingItemPriceEUR != null &&
    signal.startingItemPriceEUR > 0
  const askDirection =
    signal.askTrendPercent != null && signal.askTrendPercent >= 5
      ? (it ? "Offerte in salita" : "Offers rising")
      : signal.askTrendPercent != null && signal.askTrendPercent <= -5
        ? (it ? "Offerte in calo" : "Offers falling")
        : null

  return (
    <div className="flex flex-col gap-1">
      {hasValue ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-lg font-semibold tabular-nums">≈ {formatMoney(signal.valueEUR!)}</span>
          {signal.trendPercent != null ? <TrendIndicator value={signal.trendPercent} /> : null}
        </div>
      ) : hasCleanActiveAsk ? (
        <>
          <span className="text-xs font-medium text-muted-foreground">{it ? "Mercato in osservazione" : "Market under observation"}</span>
          <span className="text-xs text-muted-foreground">
            {it ? "Disponibile da" : "Available from"} <span className="font-semibold text-foreground">{formatMoney(signal.startingItemPriceEUR!)}</span>
          </span>
        </>
      ) : (
        <span className="text-xs font-medium text-muted-foreground">{it ? "Dati di mercato in arrivo" : "Market data coming soon"}</span>
      )}
      {hasValue && showStartingPrice && signal.startingItemPriceEUR != null ? (
        <span className="text-xs text-muted-foreground">
          {it ? "Disponibile da" : "Available from"} <span className="font-medium text-foreground">{formatMoney(signal.startingItemPriceEUR)}</span>
          {askDirection ? <span className="ml-1.5 font-medium text-brand">· {askDirection}</span> : null}
        </span>
      ) : null}
    </div>
  )
}
