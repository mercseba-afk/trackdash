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
  showBothReferences = false,
  compactPreview = false,
}: {
  signal?: ReleaseMarketSignalView | null
  showStartingPrice?: boolean
  showBothReferences?: boolean
  compactPreview?: boolean
}) {
  const { locale } = useI18n()
  const it = locale === "it"

  if (!signal) {
    return compactPreview ? (
      <div className="rounded-lg bg-muted/45 px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground">
        {it ? "Dati di mercato in verifica" : "Market data under review"}
      </div>
    ) : (
      <span className="text-xs text-muted-foreground">{it ? "Dati di mercato in verifica" : "Market data under review"}</span>
    )
  }

  const hasValue = signal.valueEUR != null && signal.valueEUR > 0
  const observedPrice = observedMarketDisplayPrice(signal)
  const hasObservedPrice = observedPrice != null && observedPrice > 0
  const askPrice = signal.startingEffectiveCostEUR
    ?? signal.startingItemPriceEUR
    ?? signal.retailAnchorEUR
    ?? signal.activeAnchorEUR
    ?? null
  const hasAsk = askPrice != null && askPrice > 0
  const soldPrice = signal.soldAnchorEUR
  const hasSold = soldPrice != null && soldPrice > 0
  const showDualReferences = showBothReferences && !hasValue && hasAsk && hasSold
  const observedKind = observedMarketDisplayKind(signal)
  const observedEvidence = observedMarketDisplayEvidenceLabel(signal, it)
  const observedTrend = hasReliableObservedPriceTrend(signal) ? signal.askTrendPercent : null
  const observedDirection = observedMarketAskDirection(observedTrend, it)

  if (compactPreview) {
    return (
      <div className="grid gap-1">
        {hasValue ? (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-brand/5 px-2.5 py-1.5 text-brand">
            <span className="text-[10px] font-bold uppercase tracking-[0.06em]">
              {it ? "Valore stimato" : "Estimated value"}
            </span>
            <strong className="shrink-0 text-sm font-semibold tabular-nums">≈ {formatMoney(signal.valueEUR!)}</strong>
          </div>
        ) : (
          <>
            {hasSold ? (
              <div className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-emerald-900">
                <span className="inline-flex min-w-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.06em]">
                  <BadgeCheck className="size-3 shrink-0" />
                  <span>{it ? "Vendite concluse" : "Completed sales"}</span>
                </span>
                <strong className="shrink-0 text-sm font-semibold tabular-nums">≈ {formatMoney(soldPrice!)}</strong>
              </div>
            ) : null}
            {hasAsk ? (
              <div className="flex items-center justify-between gap-3 rounded-lg bg-amber-50 px-2.5 py-1.5 text-amber-900">
                <span className="inline-flex min-w-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.06em]">
                  <Tag className="size-3 shrink-0" />
                  <span>{it ? "Annunci attivi" : "Active listings"}</span>
                </span>
                <strong className="shrink-0 text-sm font-semibold tabular-nums">{it ? "da " : "from "}{formatMoney(askPrice!)}</strong>
              </div>
            ) : null}
            {!hasSold && !hasAsk ? (
              <div className="rounded-lg bg-muted/45 px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground">
                {it ? "Dati di mercato in verifica" : "Market data under review"}
              </div>
            ) : null}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {showDualReferences ? (
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 px-2.5 py-2 text-emerald-900">
            <span className="inline-flex min-w-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.07em]">
              <BadgeCheck className="size-3 shrink-0" />
              <span>{it ? "Vendite concluse" : "Completed sales"}</span>
            </span>
            <strong className="shrink-0 text-sm font-semibold tabular-nums">≈ {formatMoney(soldPrice!)}</strong>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg bg-amber-50 px-2.5 py-2 text-amber-900">
            <span className="inline-flex min-w-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.07em]">
              <Tag className="size-3 shrink-0" />
              <span>{it ? "Annunci attivi" : "Active listings"}</span>
            </span>
            <strong className="shrink-0 text-sm font-semibold tabular-nums">{it ? "da " : "from "}{formatMoney(askPrice!)}</strong>
          </div>
          <span className="text-[10px] leading-tight text-muted-foreground">
            {it ? "Venduto osservato vs richiesta attuale" : "Observed sale vs current asking price"}
          </span>
        </div>
      ) : hasValue ? (
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
