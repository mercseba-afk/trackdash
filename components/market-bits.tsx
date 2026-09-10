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
  if (signal.marketRegime === "retail_driven") return it ? "Retail attivo" : "Active retail"
  if (signal.marketRegime === "mixed_scarce") return it ? "Mercato misto / scarso" : "Mixed / scarce"
  if (signal.marketRegime === "secondary_market_driven") return it ? "Mercato secondario" : "Secondary market"
  return it ? "Mercato in formazione" : "Market forming"
}

function AskPositionSignal({ signal, it }: { signal: ReleaseMarketSignalView; it: boolean }) {
  if (signal.activeAnchorEUR == null) return null

  if (signal.soldAnchorEUR == null || signal.soldAnchorEUR <= 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-foreground">
            {it ? "Richieste attive" : "Active asks"}
          </span>
          <span className="font-semibold tabular-nums">~{formatMoney(signal.activeAnchorEUR)}</span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {it
            ? `${signal.activeOfferCount} ${signal.activeOfferCount === 1 ? "offerta marketplace monitorata" : "offerte marketplace monitorate"}. È un livello richiesto dai venditori, non ancora un valore di mercato consolidato.`
            : `${signal.activeOfferCount} active marketplace ${signal.activeOfferCount === 1 ? "ask" : "asks"} monitored. This is seller expectation, not yet a consolidated Market Value.`}
        </p>
      </div>
    )
  }

  const differencePct = ((signal.activeAnchorEUR - signal.soldAnchorEUR) / signal.soldAnchorEUR) * 100
  const direction = differencePct > 10 ? "above" : differencePct < -10 ? "below" : "aligned"
  const Icon = direction === "above" ? ArrowUpRight : direction === "below" ? ArrowDownRight : Minus
  const label = direction === "above"
    ? (it ? "Prezzi richiesti sopra il venduto" : "Asking prices above sold")
    : direction === "below"
      ? (it ? "Prezzi richiesti sotto il venduto" : "Asking prices below sold")
      : (it ? "Prezzi richiesti in linea col venduto" : "Asking prices in line with sold")

  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Icon className="size-4" aria-hidden /> {label}
        </span>
        <span className="text-xs font-semibold tabular-nums text-muted-foreground">
          {formatPercent(differencePct)}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-muted-foreground">{it ? "Venduto osservato" : "Observed sold"}</p>
          <p className="mt-0.5 font-semibold tabular-nums text-foreground">{formatMoney(signal.soldAnchorEUR)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{it ? "Richieste attive" : "Active asks"}</p>
          <p className="mt-0.5 font-semibold tabular-nums text-foreground">~{formatMoney(signal.activeAnchorEUR)}</p>
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        {it
          ? "Questo confronto misura le aspettative dei venditori rispetto alle vendite concluse: non è un trend di prezzo."
          : "This compares seller expectations with completed sales; it is not a price trend."}
      </p>
    </div>
  )
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
  const hasValue = signal.valueEUR != null && signal.valueEUR > 0
  const hasUsefulRange = hasValue && signal.lowEUR != null && signal.highEUR != null && Math.abs(signal.highEUR - signal.lowEUR) > 0.01

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm text-muted-foreground">{resolvedTitle}</CardTitle>
        <ConfidenceBadge confidence={hasValue ? signalConfidence(signal) : "Insufficient"} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            {hasValue ? (
              <>
                <span className="text-3xl font-semibold tabular-nums">{formatMoney(signal.valueEUR!)}</span>
                {signal.trendPercent != null ? (
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{it ? "Trend vendite" : "Sales trend"}</span>
                    <TrendIndicator value={signal.trendPercent} />
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <p className="text-xl font-semibold text-foreground">
                  {it ? "Valore non ancora consolidato" : "Value not yet consolidated"}
                </p>
                <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
                  {it
                    ? "TrackDash ha segnali di mercato reali, ma non ancora abbastanza evidenze indipendenti per pubblicare un valore affidabile."
                    : "TrackDash has real market activity, but not yet enough independent evidence to publish a reliable value."}
                </p>
              </>
            )}
          </div>
          <div className="shrink-0 text-right text-xs text-muted-foreground">
            <div>{regimeLabel(signal, it)}</div>
            {hasValue ? <div className="tabular-nums">{signal.confidenceScore}/100</div> : null}
            {msrp != null && <div>MSRP {formatMoney(msrp)}</div>}
          </div>
        </div>

        {hasUsefulRange ? (
          <div className="grid grid-cols-3 gap-3 border-t pt-3 text-center">
            <RangeStat label={it ? "Minimo" : "Low"} value={formatMoney(signal.lowEUR!)} />
            <RangeStat label={it ? "Valore" : "Value"} value={formatMoney(signal.valueEUR!)} accent />
            <RangeStat label={it ? "Massimo" : "High"} value={formatMoney(signal.highEUR!)} />
          </div>
        ) : null}

        <AskPositionSignal signal={signal} it={it} />

        <div className="flex flex-col gap-1 border-t pt-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {signal.retailAnchorEUR != null ? <span>{it ? "Retail verificato" : "Verified retail"}: {formatMoney(signal.retailAnchorEUR)}</span> : null}
            {signal.soldAnchorEUR != null ? <span>{it ? "Venduto osservato" : "Observed sold"}: {formatMoney(signal.soldAnchorEUR)}</span> : null}
            {signal.activeAnchorEUR != null ? <span>{it ? "Richieste attive" : "Active asks"}: ~{formatMoney(signal.activeAnchorEUR)}</span> : null}
          </div>
          <div>
            {signal.currentOfferCount} {it ? "offerte correnti verificate" : "verified current offers"} · {signal.soldUnits} {it ? "unità vendute osservate" : "observed sold units"}
          </div>
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