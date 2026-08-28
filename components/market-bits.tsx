import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import type { MarketEstimate, Rarity } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { RARITY_STYLE, formatPercent } from "@/lib/format"

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

export function ConfidenceBadge({ estimate }: { estimate: MarketEstimate }) {
  return (
    <Badge variant="secondary" className={cn("gap-1", CONFIDENCE_STYLE[estimate.confidence])}>
      {estimate.confidence} confidence
    </Badge>
  )
}
