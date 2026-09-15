import type { ReleaseMarketSignalView } from "@/lib/market/view-types"

export type MarketLiquidityLevel = "very_low" | "low" | "medium" | "high"

export interface MarketLiquidityView {
  level: MarketLiquidityLevel
  observedSales3m: number
  averageSalesPerMonth: number
}

// Liquidity v1 intentionally uses completed-sale volume only.
// Active asks, retail availability, Market Value and price trend do not raise it.
// Thresholds are deliberately simple/provisional and can be recalibrated after
// the Vintage 100 pilot gives us a representative Mini 4WD distribution.
export function getMarketLiquidity(
  signal: Pick<ReleaseMarketSignalView, "recentSoldUnits3m">,
): MarketLiquidityView | null {
  const units = signal.recentSoldUnits3m
  if (units == null || !Number.isFinite(units) || units < 0) return null

  const level: MarketLiquidityLevel =
    units >= 12 ? "high" : units >= 6 ? "medium" : units >= 2 ? "low" : "very_low"

  return {
    level,
    observedSales3m: units,
    averageSalesPerMonth: Math.round((units / 3) * 10) / 10,
  }
}

export function marketLiquidityLabel(level: MarketLiquidityLevel, it: boolean): string {
  if (!it) {
    if (level === "high") return "High"
    if (level === "medium") return "Medium"
    if (level === "low") return "Low"
    return "Very low"
  }

  if (level === "high") return "Alta"
  if (level === "medium") return "Media"
  if (level === "low") return "Bassa"
  return "Molto bassa"
}
