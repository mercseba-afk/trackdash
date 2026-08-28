import { ArrowDownRight, ArrowUpRight, Minus, Info } from "lucide-react"
import type { MarketEstimate } from "@/lib/types"
import { formatMoney, formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const CONFIDENCE_STYLE: Record<MarketEstimate["confidence"], string> = {
  High: "bg-success/15 text-success",
  Medium: "bg-warning/20 text-warning",
  Low: "bg-muted text-muted-foreground",
  Insufficient: "bg-muted text-muted-foreground",
}

export function TrendPill({ value, className }: { value: number; className?: string }) {
  const dir = value > 0 ? "up" : value < 0 ? "down" : "flat"
  const Icon = dir === "up" ? ArrowUpRight : dir === "down" ? ArrowDownRight : Minus
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-mono text-xs font-medium tabular-nums",
        dir === "up" && "text-success",
        dir === "down" && "text-destructive",
        dir === "flat" && "text-muted-foreground",
        className,
      )}
    >
      <Icon className="size-3" />
      {formatPercent(value)}
    </span>
  )
}

export function ConfidenceBadge({ estimate }: { estimate: MarketEstimate }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Badge className={cn("gap-1", CONFIDENCE_STYLE[estimate.confidence])} variant="secondary" />
        }
      >
        <Info className="size-3" />
        {estimate.confidence} confidence
      </TooltipTrigger>
      <TooltipContent className="max-w-56 text-pretty">
        Based on {estimate.sampleSize} data point{estimate.sampleSize === 1 ? "" : "s"} from sold
        listings. Demo market data — not a real appraisal.
      </TooltipContent>
    </Tooltip>
  )
}

export function MarketValue({
  estimate,
  size = "md",
  showTrend = true,
}: {
  estimate: MarketEstimate
  size?: "sm" | "md" | "lg"
  showTrend?: boolean
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span
        className={cn(
          "font-mono font-semibold tabular-nums text-foreground",
          size === "lg" ? "text-3xl" : size === "sm" ? "text-sm" : "text-lg",
        )}
      >
        {formatMoney(estimate.value, estimate.currency)}
      </span>
      {showTrend && <TrendPill value={estimate.trend90d} />}
    </div>
  )
}
