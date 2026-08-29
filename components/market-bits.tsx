import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import type { MarketEstimate, Rarity } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { RARITY_STYLE, formatMoney, formatPercent } from "@/lib/format"

export function RarityBadge({ rarity, className }: { rarity: Rarity; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        RARITY_STYLE[rarity],
        className,
      )}
    >
      {rarity}
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

export function ConfidenceBadge({
  estimate,
  confidence,
}: {
  estimate?: MarketEstimate
  confidence?: MarketEstimate["confidence"]
}) {
  const c = confidence ?? estimate?.confidence ?? "Insufficient"
  return (
    <Badge variant="secondary" className={cn("gap-1", CONFIDENCE_STYLE[c])}>
      {c} confidence
    </Badge>
  )
}

// A full market-value card for a specific estimate (release- or model-level).
export function MarketEstimateCard({
  estimate,
  title = "Estimated market value",
  msrp,
}: {
  estimate: MarketEstimate
  title?: string
  msrp?: number
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
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
            <div className="tabular-nums">{estimate.sampleSize} data points</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 border-t pt-3 text-center">
          <RangeStat label="Low" value={formatMoney(estimate.low)} />
          <RangeStat label="Average" value={formatMoney(estimate.average)} accent />
          <RangeStat label="High" value={formatMoney(estimate.high)} />
        </div>
        {estimate.isDemo && (
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Indicative demo estimate derived from this edition&apos;s rarity, age and reference pricing — not an
            appraisal. Production values come from real sold listings. Updated {estimate.lastUpdated}.
          </p>
        )}
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
