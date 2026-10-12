"use client"

import { BadgeCheck, Tag, TrendingUp } from "lucide-react"
import { MarketPricePanelShell } from "@/components/market-price-panel-shell"
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
  observedMarketReferencePrice,
  observedMarketReferenceIsHistorical,
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

  // Compact cards always use the same two-row market layout, including when
  // no signal exists. Never change the labels based on available evidence.
  if (!signal && !compactPreview) {
    return <span className="text-xs text-muted-foreground">{it ? "Dati di mercato in verifica" : "Market data under review"}</span>
  }
  if (!signal && compactPreview) {
    return <PreviewPricePanel it={it} valueEUR={null} askingEUR={null} historical={false} observedAt={null} soldCount={0} />
  }
  if (!signal) return null

  const hasValue = signal.valueEUR != null && signal.valueEUR > 0
  const observedPrice = observedMarketDisplayPrice(signal)
  const hasObservedPrice = observedPrice != null && observedPrice > 0
  // Only TTL-verified, currently purchasable offers may appear as ASK.
  // Never let a stale materialized retail/active anchor obscure a real SOLD.
  const askPrice = observedMarketReferencePrice(signal)
  const askHistorical = observedMarketReferenceIsHistorical(signal)
  const hasAsk = askPrice != null && askPrice > 0
  const soldPrice = signal.soldAnchorEUR
  const hasSold = soldPrice != null && soldPrice > 0
  const showDualReferences = showBothReferences && hasAsk && hasSold
  const observedKind = observedMarketDisplayKind(signal)
  const observedEvidence = observedMarketDisplayEvidenceLabel(signal, it)
  const observedTrend = hasReliableObservedPriceTrend(signal) ? signal.askTrendPercent : null
  const observedDirection = observedMarketAskDirection(observedTrend, it)

  if (compactPreview) {
    return (
      <PreviewPricePanel
        it={it}
        valueEUR={hasValue ? signal.valueEUR : null}
        askingEUR={hasAsk ? askPrice : null}
        historical={askHistorical}
        observedAt={signal.historicalAskObservedAt}
        soldCount={signal.soldUnits ?? 0}
      />
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {showDualReferences ? (
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-2.5 py-2 text-foreground">
            <span className="inline-flex min-w-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.07em]">
              <BadgeCheck className="size-3 shrink-0" />
              <span>{it ? "Vendite concluse" : "Completed sales"}</span>
            </span>
            <strong className="shrink-0 text-sm font-semibold tabular-nums">≈ {formatMoney(soldPrice!)}</strong>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-2.5 py-2 text-foreground">
            <span className="inline-flex min-w-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.07em]">
              <Tag className="size-3 shrink-0" />
              <span>{it ? "Prezzo richiesto" : "Asking price"}</span>
            </span>
            <strong className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(askPrice!)}</strong>
          </div>
          <span className="text-[10px] leading-tight text-muted-foreground">
            {askHistorical
              ? (it ? "Ultima offerta osservata, disponibilità da verificare · spedizione esclusa." : "Last observed offer, availability unverified · shipping excluded.")
              : (it ? "Offerta verificata di recente · spedizione esclusa." : "Recently verified offer · shipping excluded.")}
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
                  ? "inline-flex items-center gap-1 rounded-full bg-muted/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-foreground"
                  : "inline-flex items-center gap-1 rounded-full bg-muted/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-foreground"
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
            <span className={observedKind === "sold" ? "text-[11px] text-muted-foreground" : "text-[11px] text-muted-foreground"}>
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


// Fixed two-row, source-aware preview panel shared by every catalogue Release.
// SOLD information is supplemental; an asking price never becomes Market Value.
function PreviewPricePanel({
  it, valueEUR, askingEUR, historical, observedAt, soldCount,
}: {
  it: boolean
  valueEUR: number | null
  askingEUR: number | null
  historical: boolean
  observedAt?: string | null
  soldCount: number
}) {
  const observedDate = observedAt && Number.isFinite(Date.parse(observedAt))
    ? new Intl.DateTimeFormat(it ? "it-IT" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(observedAt))
    : null

  return (
    <MarketPricePanelShell>
      <div className="grid min-h-8 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
        <span className="inline-flex min-w-0 items-center gap-2 text-[11px] font-semibold leading-snug text-foreground/85 sm:text-xs">
          <TrendingUp className="size-4 shrink-0 text-sky-700 dark:text-sky-300" aria-hidden="true" />
          {it ? "Valore di mercato" : "Market value"}
        </span>
        <strong className="whitespace-nowrap text-right text-sm font-semibold tabular-nums text-foreground sm:text-base">
          {valueEUR != null ? `≈ ${formatMoney(valueEUR)}` : "—"}
        </strong>
      </div>

      <div className="my-2.5 h-px bg-sky-200/75 dark:bg-sky-800/50" />

      <div className="grid min-h-8 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
        <span className="inline-flex min-w-0 items-center gap-2 text-[11px] font-semibold leading-snug text-foreground/85 sm:text-xs">
          <Tag className="size-4 shrink-0 text-sky-700 dark:text-sky-300" aria-hidden="true" />
          {it ? "Prezzo richiesto" : "Asking price"}
        </span>
        <strong className="whitespace-nowrap text-right text-sm font-semibold tabular-nums text-foreground sm:text-base">
          {askingEUR != null ? formatMoney(askingEUR) : "—"}
        </strong>
      </div>

      {askingEUR != null ? (
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          {historical
            ? (it ? "Ultima offerta osservata" : "Last observed offer") + (observedDate ? ` · ${observedDate}` : "") + (it ? " · disponibilità da verificare · spedizione esclusa" : " · availability unverified · shipping excluded")
            : (it ? "Offerta verificata di recente · spedizione esclusa" : "Recently verified offer · shipping excluded")}
        </p>
      ) : valueEUR != null ? (
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{it ? "Spedizione esclusa" : "Shipping excluded"}</p>
      ) : null}
      {soldCount > 0 ? (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-2.5 py-1 text-[10px] font-medium text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-300">
          <BadgeCheck className="size-3.5 shrink-0" aria-hidden="true" />
          {it ? `${soldCount} ${soldCount === 1 ? "vendita conclusa" : "vendite concluse"}` : `${soldCount} completed ${soldCount === 1 ? "sale" : "sales"}`}
        </p>
      ) : null}
      {valueEUR == null && askingEUR == null && soldCount === 0 ? (
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          {it ? "Dati di mercato in arrivo" : "Market data coming soon"}
        </p>
      ) : null}
    </MarketPricePanelShell>
  )
}
