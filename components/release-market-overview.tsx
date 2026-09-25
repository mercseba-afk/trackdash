"use client"

import { BadgeCheck, BarChart3, Tag } from "lucide-react"
import { TrendIndicator } from "@/components/market-bits"
import { Card, CardContent } from "@/components/ui/card"
import { formatMoney } from "@/lib/format"
import { useI18n } from "@/lib/i18n"
import type { ReleaseMarketSignalView } from "@/lib/market/view-types"
import {
  hasReliableObservedPriceTrend,
  observedMarketAskTrendLabel,
  observedMarketPrice,
} from "@/lib/market/presentation"

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

function MarketReference({
  kind,
  price,
  count,
  it,
  compact,
  trend,
}: {
  kind: "ask" | "sold"
  price: number
  count: number
  it: boolean
  compact: boolean
  trend?: { value: number; label: string; window: string | null } | null
}) {
  const ask = kind === "ask"

  return (
    <div
      className={
        ask
          ? "rounded-2xl border border-amber-200 bg-amber-50/80 p-4"
          : "rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={
            ask
              ? "inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-800"
              : "inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-800"
          }
        >
          {ask ? <Tag className="size-3" /> : <BadgeCheck className="size-3" />}
          {ask
            ? (it ? "Annunci attivi" : "Active listings")
            : (it ? "Vendite concluse" : "Completed sales")}
        </span>
      </div>

      <p className={ask ? "mt-3 text-sm font-semibold text-amber-950" : "mt-3 text-sm font-semibold text-emerald-950"}>
        {ask
          ? (it ? "Prezzo richiesto più basso" : "Lowest asking price")
          : (it ? "Prezzo da vendite concluse" : "Price from completed sales")}
      </p>

      <div className="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1">
        <p
          className={
            compact
              ? "text-2xl font-semibold tabular-nums text-foreground"
              : "text-3xl font-semibold tracking-[-0.035em] tabular-nums text-foreground"
          }
        >
          {ask ? formatMoney(price) : `≈ ${formatMoney(price)}`}
        </p>
        {ask && trend ? (
          <div className="flex flex-wrap items-center gap-1.5 pb-1 text-sm">
            <span className="font-medium text-amber-800">{trend.label}</span>
            <TrendIndicator value={trend.value} />
            {trend.window ? <span className="text-xs text-amber-700">· {trend.window}</span> : null}
          </div>
        ) : null}
      </div>

      <p className={ask ? "mt-2 text-xs leading-relaxed text-amber-800" : "mt-2 text-xs leading-relaxed text-emerald-800"}>
        {ask
          ? count > 0
            ? (it
                ? `Il minimo tra ${count} ${count === 1 ? "annuncio attivo osservato" : "annunci attivi osservati"}. È una richiesta del venditore, non una vendita conclusa.`
                : `Lowest of ${count} active ${count === 1 ? "listing" : "listings"} observed. This is a seller asking price, not a completed sale.`)
            : (it ? "Richiesta del venditore: non indica una vendita conclusa." : "Seller asking price: this is not a completed sale.")
          : count > 0
            ? (it
                ? `Basato su ${count} ${count === 1 ? "vendita conclusa osservata" : "vendite concluse osservate"}.`
                : `Based on ${count} completed ${count === 1 ? "sale" : "sales"} observed.`)
            : (it ? "Riferimento derivato da vendite concluse osservate." : "Reference derived from observed completed sales.")}
      </p>
    </div>
  )
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

  const hasValue = signal?.valueEUR != null && signal.valueEUR > 0
  const askPrice = observedMarketPrice(signal)
  const hasAsk = askPrice != null && askPrice > 0
  const soldPrice = signal?.soldAnchorEUR ?? null
  const hasSold = soldPrice != null && soldPrice > 0

  const valueTrend = signal?.trendPercent != null
    ? {
        value: signal.trendPercent,
        label: it ? "Trend mercato" : "Market trend",
        window: valueTrendWindow(signal.trendWindowMonths, it),
      }
    : null

  const askTrend = hasReliableObservedPriceTrend(signal)
    ? {
        value: signal!.askTrendPercent!,
        label: observedMarketAskTrendLabel(it),
        window: askTrendWindow(signal!.askTrendWindowDays, it),
      }
    : null

  return (
    <Card className="overflow-hidden border-border/70 bg-white shadow-sm">
      <CardContent className={compact ? "p-4" : "p-5 md:p-6"}>
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-brand" />
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
            {it ? "Mercato" : "Market"}
          </p>
        </div>

        {hasValue ? (
          <div className="mt-3 rounded-2xl border border-brand/20 bg-brand/5 p-4">
            <p className="text-sm font-medium text-brand">{it ? "Valore stimato" : "Estimated value"}</p>
            <div className="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1">
              <p className={compact ? "text-2xl font-semibold tabular-nums" : "text-4xl font-semibold tracking-[-0.04em] tabular-nums"}>
                ≈ {formatMoney(signal!.valueEUR!)}
              </p>
              {valueTrend ? (
                <div className="flex flex-wrap items-center gap-1.5 pb-1 text-sm">
                  <span className="font-medium text-muted-foreground">{valueTrend.label}</span>
                  <TrendIndicator value={valueTrend.value} />
                  {valueTrend.window ? <span className="text-xs text-muted-foreground">· {valueTrend.window}</span> : null}
                </div>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {it ? "Stima TrackDash basata sulle evidenze di mercato disponibili." : "TrackDash estimate based on available market evidence."}
            </p>
          </div>
        ) : null}

        {hasAsk || hasSold ? (
          <div className={hasValue ? "mt-3" : "mt-4"}>
            {!hasValue && hasAsk && hasSold ? (
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {it
                  ? "Sono due riferimenti diversi: ciò che i venditori chiedono oggi e ciò che è stato realmente venduto."
                  : "These are two different references: what sellers ask today and what has actually sold."}
              </p>
            ) : null}
            <div className={hasAsk && hasSold ? "grid gap-3 sm:grid-cols-2" : "grid gap-3"}>
              {hasAsk ? (
                <MarketReference
                  kind="ask"
                  price={askPrice!}
                  count={signal?.currentOfferCount ?? 0}
                  it={it}
                  compact={compact}
                  trend={askTrend}
                />
              ) : null}
              {hasSold ? (
                <MarketReference
                  kind="sold"
                  price={soldPrice!}
                  count={signal?.soldUnits ?? 0}
                  it={it}
                  compact={compact}
                />
              ) : null}
            </div>
          </div>
        ) : !hasValue ? (
          <div className="mt-3">
            <p className="text-xl font-semibold">{it ? "Dati di mercato in verifica" : "Market data under review"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {it ? "Non c'è ancora un riferimento di prezzo abbastanza chiaro da pubblicare." : "There is not yet a sufficiently clear price reference to publish."}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
