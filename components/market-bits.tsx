"use client"

import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react"
import type { MarketEstimate, Rarity } from "@/lib/types"
import type { ReleaseMarketSignalView } from "@/lib/market/view-types"
import { useI18n } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { RARITY_STYLE, formatMoney, formatPercent } from "@/lib/format"

const STABLE_TREND_THRESHOLD_PERCENT = 1

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

function trendDirection(value: number, it: boolean): string {
  if (value > STABLE_TREND_THRESHOLD_PERCENT) return it ? "In crescita" : "Rising"
  if (value < -STABLE_TREND_THRESHOLD_PERCENT) return it ? "In calo" : "Falling"
  return it ? "Stabile" : "Stable"
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
  const { locale } = useI18n()
  const it = locale === "it"
  const dir = value > STABLE_TREND_THRESHOLD_PERCENT ? "up" : value < -STABLE_TREND_THRESHOLD_PERCENT ? "down" : "flat"
  const Icon = dir === "up" ? ArrowUp : dir === "down" ? ArrowDown : ArrowRight
  const formatted = formatPercent(value)
  const label = `${trendDirection(value, it)} ${formatted}`

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold tabular-nums",
        dir === "up" && "text-success",
        dir === "down" && "text-brand",
        dir === "flat" && "text-muted-foreground",
        className,
      )}
      aria-label={label}
      title={label}
    >
      {showIcon && <Icon className="size-4" aria-hidden />}
      {formatted}
    </span>
  )
}

// Kept as a no-op compatibility export while all public surfaces migrate to the
// collector-facing value/trend UI. Confidence remains an internal publication gate.
export function ConfidenceBadge(_props: {
  estimate?: MarketEstimate
  confidence?: MarketEstimate["confidence"]
}) {
  return null
}

function trendWindowLabel(signal: ReleaseMarketSignalView, it: boolean): string {
  if (signal.trendPercent == null) return it ? "Trend in raccolta" : "Trend gathering"
  const direction = trendDirection(signal.trendPercent, it)
  if (signal.trendWindowMonths === 12) return `${direction} · ${it ? "ultimo anno" : "last year"}`
  if (signal.trendWindowMonths === 6) return `${direction} · ${it ? "ultimi 6 mesi" : "last 6 months"}`
  if (signal.trendWindowMonths === 3) return `${direction} · ${it ? "ultimi 3 mesi" : "last 3 months"}`
  if (signal.trendWindowMonths === 1) return `${direction} · ${it ? "ultimo mese" : "last month"}`
  return direction
}

export function MarketSignalCard({
  signal,
  title,
  msrp: _msrp,
  rarity,
}: {
  signal: ReleaseMarketSignalView
  title?: string
  msrp?: number
  rarity?: Rarity | null
}) {
  const { locale } = useI18n()
  const it = locale === "it"
  const resolvedTitle = title ?? (it ? "Valore attuale stimato" : "Estimated current value")
  const hasValue = signal.valueEUR != null && signal.valueEUR > 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{resolvedTitle}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {hasValue ? (
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-3xl font-semibold tabular-nums md:text-4xl">{formatMoney(signal.valueEUR!)}</span>
              {signal.trendPercent != null ? <TrendIndicator value={signal.trendPercent} className="text-base md:text-lg" /> : null}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{trendWindowLabel(signal, it)}</p>
          </div>
        ) : (
          <div>
            <p className="text-xl font-semibold text-foreground">{it ? "Valore in elaborazione" : "Value being calculated"}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {it
                ? "Stiamo raccogliendo abbastanza dati reali per pubblicare un valore utile per questa release."
                : "We are gathering enough real market data to publish a useful value for this release."}
            </p>
          </div>
        )}

        {rarity !== undefined ? (
          <div className="flex items-center justify-between gap-3 border-t pt-3">
            <span className="text-sm text-muted-foreground">{it ? "Rarità" : "Rarity"}</span>
            {rarity ? (
              <RarityBadge rarity={rarity} className="px-2 py-1 text-xs" />
            ) : (
              <span className="text-sm font-medium text-muted-foreground">{it ? "In verifica" : "Under review"}</span>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

// Backward-compatible rendering only. Legacy estimates are never published.
export function MarketEstimateCard({
  title,
}: {
  estimate: MarketEstimate
  title?: string
  msrp?: number
}) {
  const { locale } = useI18n()
  const it = locale === "it"
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title ?? (it ? "Valore attuale stimato" : "Estimated current value")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{it ? "Dati mercato in elaborazione" : "Market data being processed"}</p>
      </CardContent>
    </Card>
  )
}
