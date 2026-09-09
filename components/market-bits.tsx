"use client"

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import type { MarketEstimate, Rarity } from "@/lib/types"
import type { ReleaseMarketSignalView } from "@/lib/market/view-types"
import { useI18n } from "@/lib/i18n"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { RARITY_STYLE, formatDate, formatMoney, formatPercent } from "@/lib/format"

function rarityLabel(rarity: Rarity, it: boolean): string {
  if (!it) return rarity
  const labels: Record<Rarity, string> = {
    Common: "Comune",
    Uncommon: "Non comune",
    Rare: "Raro",
    "Very Rare": "Molto raro",
    Grail: "Grail",
  }
  return labels[rarity]
}

export function RarityBadge({ rarity, className }: { rarity: Rarity; className?: string }) {
  const { locale } = useI18n()
  const it = locale === "it"
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        RARITY_STYLE[rarity],
        className,
      )}
    >
      {rarityLabel(rarity, it)}
    </span>
  )
}

export function TrendIndicator({
  value,
  className,
  showIcon = true,
}: {
  value: number
  className?: string
  showIcon?: boolean
}) {
  const dir = value > 0 ? "up" : value < 0 ? "down" : "flat"
  const Icon = dir === "up" ? ArrowUpRight : dir === "down" ? ArrowDownRight : Minus
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-medium tabular-nums",
        dir === "up" && "text-success",
        dir === "down" && "text-brand",
        dir === "flat" && "text-muted-foreground",
        className,
      )}
    >
      {showIcon && <Icon className="size-3.5" aria-hidden />}
      {formatPercent(value)}
    </span>
  )
}

const CONFIDENCE_STYLE: Record<MarketEstimate["confidence"], string> = {
  High: "bg-success/15 text-success",
  Medium: "bg-warning/20 text-warning",
  Low: "bg-muted text-muted-foreground",
  Insufficient: "bg-muted text-muted-foreground",
}

function confidenceLabel(confidence: MarketEstimate["confidence"], it: boolean): string {
  if (!it) return `${confidence} confidence`
  if (confidence === "High") return "Affidabilità alta"
  if (confidence === "Medium") return "Affidabilità media"
  if (confidence === "Low") return "Affidabilità bassa"
  return "Dati insufficienti"
}

export function ConfidenceBadge({
  estimate,
  confidence,
}: {
  estimate?: MarketEstimate
  confidence?: MarketEstimate["confidence"]
}) {
  const { locale } = useI18n()
  const it = locale === "it"
  const c = confidence ?? estimate?.confidence ?? "Insufficient"
  return (
    <Badge variant="secondary" className={cn("gap-1", CONFIDENCE_STYLE[c])}>
      {confidenceLabel(c, it)}
    </Badge>
  )
}

function signalConfidence(signal: ReleaseMarketSignalView): MarketEstimate["confidence"] {
  if (signal.confidenceLabel === "high") return "High"
  if (signal.confidenceLabel === "medium") return "Medium"
  return "Low"
}

function regimeLabel(signal: ReleaseMarketSignalView, it: boolean): string {
  if (signal.marketRegime === "retail_driven") return it ? "Retail attivo" : "Retail-driven"
  if (signal.marketRegime === "mixed_scarce") return it ? "Mercato misto / scarso" : "Mixed / scarce"
  if (signal.marketRegime === "secondary_market_driven") return it ? "Mercato secondario" : "Secondary-market driven"
  return it ? "Dati insufficienti" : "Insufficient data"
}

export function MarketSignalCard({
  signal,
  title,
  msrp,
}: {
  signal: ReleaseMarketSignalView
  title?: string
  msrp?: number
}) {
  const { locale } = useI18n()
  const it = locale === "it"
  const resolvedTitle = title ?? (it ? "Valore di mercato" : "Market value")

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm text-muted-foreground">{resolvedTitle}</CardTitle>
        <ConfidenceBadge confidence={signalConfidence(signal)} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums">{formatMoney(signal.valueEUR)}</span>
            {signal.trendPercent != null ? <TrendIndicator value={signal.trendPercent} className="text-sm" /> : null}
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div>{regimeLabel(signal, it)}</div>
            <div className="tabular-nums">{signal.confidenceScore}/100</div>
            {msrp != null && <div>MSRP {formatMoney(msrp)}</div>}
          </div>
        </div>

        {signal.lowEUR != null && signal.highEUR != null ? (
          <div className="grid grid-cols-3 gap-3 border-t pt-3 text-center">
            <RangeStat label={it ? "Minimo" : "Low"} value={formatMoney(signal.lowEUR)} />
            <RangeStat label={it ? "Valore" : "Value"} value={formatMoney(signal.valueEUR)} accent />
            <RangeStat label={it ? "Massimo" : "High"} value={formatMoney(signal.highEUR)} />
          </div>
        ) : null}

        <div className="flex flex-col gap-1 border-t pt-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {signal.retailAnchorEUR != null ? <span>{it ? "Retail" : "Retail"}: {formatMoney(signal.retailAnchorEUR)}</span> : null}
            {signal.activeAnchorEUR != null ? <span>{it ? "Marketplace attivo" : "Active marketplace"}: {formatMoney(signal.activeAnchorEUR)}</span> : null}
            {signal.soldAnchorEUR != null ? <span>{it ? "Venduto" : "Sold"}: {formatMoney(signal.soldAnchorEUR)}</span> : null}
          </div>
          <div>
            {signal.currentOfferCount} {it ? "offerte correnti" : "current offers"} · {signal.soldUnits} {it ? "unità vendute osservate" : "sold units observed"}
          </div>
          {signal.startingItemPriceEUR != null ? (
            <div>{it ? "A partire da" : "From"} {formatMoney(signal.startingItemPriceEUR)}</div>
          ) : null}
          <div>{it ? "Aggiornato" : "Updated"} {formatDate(signal.computedAt)}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export function MarketEstimateCard({
  estimate,
  title,
  msrp,
}: {
  estimate: MarketEstimate
  title?: string
  msrp?: number
}) {
  const { locale } = useI18n()
  const it = locale === "it"
  const resolvedTitle = title ?? (it ? "Valore di mercato stimato" : "Estimated market value")

  // Legacy demo estimates may still be used internally by collection analytics,
  // but R3 never exposes synthetic prices as market data. Until a real R3 signal
  // is wired to this surface, show an explicit empty state instead of fake values.
  if (estimate.isDemo) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-sm text-muted-foreground">{resolvedTitle}</CardTitle>
          <ConfidenceBadge confidence="Insufficient" />
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="text-lg font-semibold">{it ? "Dati mercato in arrivo" : "Market data coming soon"}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {it
              ? "TrackDash mostrerà qui solo valori ricavati da evidenze reali della release: retail realmente disponibile, marketplace attivo e vendite concluse. Nessuna stima demo viene pubblicata."
              : "TrackDash only publishes values backed by real release evidence here: genuinely available retail, active marketplace offers, and completed sales. Demo estimates are never published."}
          </p>
          {msrp != null && <p className="text-xs text-muted-foreground">MSRP {formatMoney(msrp)}</p>}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm text-muted-foreground">{resolvedTitle}</CardTitle>
        <ConfidenceBadge estimate={estimate} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums">{formatMoney(estimate.value)}</span>
            <TrendIndicator value={estimate.trend90d} className="text-sm" />
          </div>
          <div className="text-right text-xs text-muted-foreground">
            {msrp != null && <div>MSRP {formatMoney(msrp)}</div>}
            <div className="tabular-nums">{estimate.sampleSize} {it ? "dati osservati" : "data points"}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 border-t pt-3 text-center">
          <RangeStat label={it ? "Minimo" : "Low"} value={formatMoney(estimate.low)} />
          <RangeStat label={it ? "Media" : "Average"} value={formatMoney(estimate.average)} accent />
          <RangeStat label={it ? "Massimo" : "High"} value={formatMoney(estimate.high)} />
        </div>
      </CardContent>
    </Card>
  )
}

function RangeStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-semibold tabular-nums", accent && "text-brand")}>{value}</span>
    </div>
  )
}
