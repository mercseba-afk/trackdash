"use client"

import type { ReleaseMarketSignalView } from "@/lib/market/view-types"
import { formatMoney } from "@/lib/format"
import { useI18n } from "@/lib/i18n"
import { ConfidenceBadge, TrendIndicator } from "@/components/market-bits"

export function signalConfidence(
  signal: ReleaseMarketSignalView,
): "High" | "Medium" | "Low" | "Insufficient" {
  if (signal.valueEUR == null || signal.valueEUR <= 0) return "Insufficient"
  if (signal.confidenceLabel === "high") return "High"
  if (signal.confidenceLabel === "medium") return "Medium"
  return "Low"
}

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
    return <span className="text-xs text-muted-foreground">{it ? "Dati mercato in arrivo" : "Market data coming soon"}</span>
  }

  const hasValue = signal.valueEUR != null && signal.valueEUR > 0

  return (
    <div className="flex flex-col gap-1">
      {hasValue ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-lg font-semibold tabular-nums">{formatMoney(signal.valueEUR!)}</span>
          {signal.trendPercent != null ? <TrendIndicator value={signal.trendPercent} /> : null}
          <ConfidenceBadge confidence={signalConfidence(signal)} />
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-foreground">{it ? "Valore non consolidato" : "Value not consolidated"}</span>
          <ConfidenceBadge confidence="Insufficient" />
        </div>
      )}
      {showStartingPrice && signal.startingItemPriceEUR != null ? (
        <span className="text-xs text-muted-foreground">
          {it ? "Da" : "From"} <span className="font-medium text-foreground">{formatMoney(signal.startingItemPriceEUR)}</span>
        </span>
      ) : null}
    </div>
  )
}
