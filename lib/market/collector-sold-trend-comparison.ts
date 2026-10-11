// UI-only provenance for an observed SOLD trend. Not another price engine.
// Only explicitly stored, corroborated before/after sold windows can be used.
// Never reverse-calculate a historical price from current Market Value or ASK.
export type CollectorSoldTrendComparison = {
  previousAverageEUR: number
  recentAverageEUR: number
  previousSaleCount: number
  recentSaleCount: number
  windowMonths: 1 | 3 | 6 | 12
  capturedAt: string
}

type StoredCollectorTrend = {
  percent: number | null
  windowMonths: number | null
  basis: "sold" | "market_value" | null
  updatedAt: string | null
}

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function positive(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function getCollectorSoldTrendComparison(
  rawPayload: unknown,
  capturedAt: string,
  trend: StoredCollectorTrend,
): CollectorSoldTrendComparison | null {
  if (trend.basis !== "sold" || trend.percent == null || trend.windowMonths == null || !trend.updatedAt) return null

  // Compare to the exact audit that originated the persisted trend. A new scan
  // must not silently assign old baseline prices to a newer trend.
  const evidenceTimestamp = Date.parse(capturedAt)
  const trendTimestamp = Date.parse(trend.updatedAt)
  if (!Number.isFinite(evidenceTimestamp) || !Number.isFinite(trendTimestamp) ||
      Math.abs(evidenceTimestamp - trendTimestamp) > 60_000) return null

  const evidence = object(object(rawPayload)?.trend_evidence)
  const before = object(evidence?.previous_window)
  const after = object(evidence?.recent_window)
  const previousAverageEUR = positive(before?.average_eur)
  const recentAverageEUR = positive(after?.average_eur)
  const previousSaleCount = positive(before?.sales_count)
  const recentSaleCount = positive(after?.sales_count)
  const recordedPercent = evidence?.trend_percent
  const windowMonths = evidence?.trend_window_months

  if (previousAverageEUR == null || recentAverageEUR == null ||
      previousSaleCount == null || recentSaleCount == null ||
      typeof recordedPercent !== "number" ||
      windowMonths !== trend.windowMonths ||
      ![1, 3, 6, 12].includes(windowMonths)) return null

  const calculatedPercent = ((recentAverageEUR - previousAverageEUR) / previousAverageEUR) * 100
  if (!Number.isFinite(calculatedPercent) ||
      Math.abs(calculatedPercent - recordedPercent) > 0.25 ||
      Math.abs(recordedPercent - trend.percent) > 0.025) return null

  return {
    previousAverageEUR,
    recentAverageEUR,
    previousSaleCount,
    recentSaleCount,
    windowMonths: windowMonths as 1 | 3 | 6 | 12,
    capturedAt,
  }
}
