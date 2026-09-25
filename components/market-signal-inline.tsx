"use client"

import { BadgeCheck, Tag } from "lucide-react"
import type { ReleaseMarketSignalView } from "@/lib/market/view-types"
import { formatMoney } from "@/lib/format"
import { useI18n } from "@/lib/i18n"
import { TrendIndicator } from "@/components/market-bits"
import {
  hasReliableObservedPriceTrend,
  observedMarketAskDirection,
  observedMarketDisplayKind,
  observedMarketDisplayLabel,
  observedMarketDisplayPrice,
  observedMarketDisplayEvidenceLabel,
} from "@/lib/market/presentation"

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
  const observedPrice = observedMarketDisplayPrice(signal)
  const hasObservedPrice = observedPrice != null && observedPrice > 0
  const observedKind = observedMarketDisplayKind(signal)
  const observedEvidence = observedMarketDisplayEvidenceLabel(signal, it)
  const observedTrend = hasReliableObservedPriceTrend(signal) ? signal.askTrendPercent : null
  const observedDirection = observedMarketAskDirection(observedTrend, it)

  return (
    <div className="flex flex-col gap-1">
      {hasValue ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-lg font-semibold tabular-nums">≈ {formatMoney(signal.valueEUR!)}</span>
          {signal.trendPercent != null ? <TrendIndicator value={signal.trendPercent} /> : null}
        </div>
      ) : hasObservedPrice ? (
        <>
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={
                observedKind === "sold"
                  ? "inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-emerald-800"
                  : "inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-amber-800"
              }
            >
              {observedKind === "sold" ? <BadgeCheck className="size-2.5" /> : <Tag className="size-2.5" />}
              {observedKind === "sold"
                ? (it ? "Vendite concluse" : "Completed sales")
                : (it ? "Annunci attivi" : "Active listings")}
            </span>
            <span className="text-xs font-medium text-muted-foreground">{observedMarketDisplayLabel(signal, it)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold tabular-nums text-foreground">
              {observedKind === "sold" ? "≈ " : ""}{formatMoney(observedPrice)}
            </span>
            {observedTrend != null ? <TrendIndicator value={observedTrend} className="text-xs" /> : null}
          </div>
          {observedEvidence ? (
            <span className={observedKind === "sold" ? "text-[11px] text-emerald-700" : "text-[11px] text-amber-700"}>
              {observedEvidence}
              {observedKind === "ask" ? (it ? " · richiesta, non vendita" : " · asking price, not a sale") : ""}
            </span>
          ) : null}
        </>
      ) : (
        <span className="text-xs font-medium text-muted-foreground">{it ? "Dati di mercato in verifica" : "Market data under review"}</span>
      )}

      {hasValue && showStartingPrice && hasObservedPrice ? (
        <span className="text-xs text-muted-foreground">
          {observedMarketDisplayLabel(signal, it)}{" "}
          <span className="font-medium text-foreground">{formatMoney(observedPrice)}</span>
          {observedDirection ? <span className="ml-1.5 font-medium text-brand">· {observedDirection}</span> : null}
        </span>
      ) : null}
    </div>
  )
}
