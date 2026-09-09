import type { EstimateInputPoint, MarketEstimateDraft } from "./types"

const DAY_MS = 86_400_000

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function median(values: number[]): number {
  if (!values.length) throw new Error("median requires at least one value")
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

// Same continuous linear-interpolation semantics as PostgreSQL percentile_cont.
function percentileCont(values: number[], percentile: number): number {
  if (!values.length) throw new Error("percentile requires at least one value")
  const sorted = [...values].sort((a, b) => a - b)
  if (sorted.length === 1) return sorted[0]
  const position = (sorted.length - 1) * percentile
  const lower = Math.floor(position)
  const upper = Math.ceil(position)
  if (lower === upper) return sorted[lower]
  const weight = position - lower
  return sorted[lower] + (sorted[upper] - sorted[lower]) * weight
}

function tier(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count <= 4) return 2
  if (count <= 9) return 3
  return 4
}

function dateMs(value: string): number {
  const parsed = Date.parse(`${value}T00:00:00Z`)
  if (!Number.isFinite(parsed)) throw new Error(`Invalid ISO date: ${value}`)
  return parsed
}

function filterByDays(points: EstimateInputPoint[], asOfDate: string, days: number): EstimateInputPoint[] {
  const asOf = dateMs(asOfDate)
  const lowerExclusive = asOf - days * DAY_MS
  return points.filter((point) => {
    const sold = dateMs(point.soldOn)
    return sold > lowerExclusive && sold <= asOf
  })
}

function representatives(points: EstimateInputPoint[]): Map<string, number> {
  const buckets = new Map<string, number[]>()
  for (const point of points) {
    const bucket = buckets.get(point.evidenceGroupKey) ?? []
    bucket.push(point.normalizedPriceEUR)
    buckets.set(point.evidenceGroupKey, bucket)
  }
  return new Map([...buckets].map(([key, values]) => [key, median(values)]))
}

function latestPoint(points: EstimateInputPoint[]): EstimateInputPoint {
  return [...points].sort((a, b) => {
    const dateCompare = b.soldOn.localeCompare(a.soldOn)
    if (dateCompare !== 0) return dateCompare
    const aAt = a.soldAt ?? ""
    const bAt = b.soldAt ?? ""
    const timeCompare = bAt.localeCompare(aAt)
    if (timeCompare !== 0) return timeCompare
    return b.stableId.localeCompare(a.stableId)
  })[0]
}

function chooseWindow(points: EstimateInputPoint[], asOfDate: string): { points: EstimateInputPoint[]; windowDays: 365 | 730 } {
  const in365 = filterByDays(points, asOfDate, 365)
  const in730 = filterByDays(points, asOfDate, 730)
  const tier365 = tier(representatives(in365).size)
  const tier730 = tier(representatives(in730).size)
  return tier730 > tier365 ? { points: in730, windowDays: 730 } : { points: in365, windowDays: 365 }
}

function groupMedianInPeriod(
  points: EstimateInputPoint[],
  startExclusiveMs: number,
  endInclusiveMs: number,
): { count: number; median: number | null } {
  const selected = points.filter((point) => {
    const sold = dateMs(point.soldOn)
    return sold > startExclusiveMs && sold <= endInclusiveMs
  })
  const reps = [...representatives(selected).values()]
  return { count: reps.length, median: reps.length ? median(reps) : null }
}

function computeTrend(points: EstimateInputPoint[], asOfDate: string): { percent: number | null; window: 90 | 365 | null } {
  const asOf = dateMs(asOfDate)

  const recent90 = groupMedianInPeriod(points, asOf - 90 * DAY_MS, asOf)
  const previous90 = groupMedianInPeriod(points, asOf - 180 * DAY_MS, asOf - 90 * DAY_MS)
  if (recent90.count >= 3 && previous90.count >= 3 && previous90.median && previous90.median > 0 && recent90.median != null) {
    return { percent: round2(((recent90.median - previous90.median) / previous90.median) * 100), window: 90 }
  }

  const recent365 = groupMedianInPeriod(points, asOf - 365 * DAY_MS, asOf)
  const previous365 = groupMedianInPeriod(points, asOf - 730 * DAY_MS, asOf - 365 * DAY_MS)
  if (recent365.count >= 3 && previous365.count >= 3 && previous365.median && previous365.median > 0 && recent365.median != null) {
    return { percent: round2(((recent365.median - previous365.median) / previous365.median) * 100), window: 365 }
  }

  return { percent: null, window: null }
}

export function computeMarketEstimate(points: EstimateInputPoint[], asOfDate: string): MarketEstimateDraft | null {
  const valid = points.filter(
    (point) =>
      point.normalizedPriceEUR > 0 &&
      Boolean(point.evidenceGroupKey) &&
      /^\d{4}-\d{2}-\d{2}$/.test(point.soldOn),
  )

  const chosen = chooseWindow(valid, asOfDate)
  const reps = [...representatives(chosen.points).values()]
  if (!reps.length) return null

  const latest = latestPoint(chosen.points)
  const trend = computeTrend(valid, asOfDate)
  const count = reps.length
  const sortedReps = [...reps].sort((a, b) => a - b)
  const center = round2(median(sortedReps))

  const base = {
    currency: "EUR" as const,
    sampleSize: chosen.points.length,
    independentEvidenceCount: count,
    windowDays: chosen.windowDays,
    lastVerifiedSale: round2(latest.normalizedPriceEUR),
    lastVerifiedSaleOn: latest.soldOn,
    lastVerifiedSaleAt: latest.soldAt ?? null,
    trendPercent: trend.percent,
    trendWindowDays: trend.window,
    algorithmVersion: "v1" as const,
  }

  if (count === 1) {
    return {
      ...base,
      displayMode: "last_sale",
      value: base.lastVerifiedSale,
      low: null,
      high: null,
      median: null,
      rangeMethod: null,
    }
  }

  if (count <= 4) {
    return {
      ...base,
      displayMode: "range",
      value: null,
      low: round2(sortedReps[0]),
      high: round2(sortedReps[sortedReps.length - 1]),
      median: null,
      rangeMethod: "cleaned_min_max",
    }
  }

  if (count <= 9) {
    return {
      ...base,
      displayMode: "value",
      value: center,
      low: round2(sortedReps[0]),
      high: round2(sortedReps[sortedReps.length - 1]),
      median: center,
      rangeMethod: "cleaned_min_max",
    }
  }

  return {
    ...base,
    displayMode: "value",
    value: center,
    low: round2(percentileCont(sortedReps, 0.25)),
    high: round2(percentileCont(sortedReps, 0.75)),
    median: center,
    rangeMethod: "q1_q3",
  }
}
