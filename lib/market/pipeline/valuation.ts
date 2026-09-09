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

interface EvidenceGroupStat {
  evidenceGroupKey: string
  anchorDate: string
  representativeEUR: number
  points: EstimateInputPoint[]
}

function comparePoints(a: EstimateInputPoint, b: EstimateInputPoint): number {
  const dateCompare = a.soldOn.localeCompare(b.soldOn)
  if (dateCompare !== 0) return dateCompare
  const aAt = a.soldAt ?? "9999-12-31T23:59:59.999Z"
  const bAt = b.soldAt ?? "9999-12-31T23:59:59.999Z"
  const timeCompare = aAt.localeCompare(bAt)
  if (timeCompare !== 0) return timeCompare
  return a.stableId.localeCompare(b.stableId)
}

function buildGroups(points: EstimateInputPoint[]): EvidenceGroupStat[] {
  const buckets = new Map<string, EstimateInputPoint[]>()
  for (const point of points) {
    const bucket = buckets.get(point.evidenceGroupKey) ?? []
    bucket.push(point)
    buckets.set(point.evidenceGroupKey, bucket)
  }

  return [...buckets.entries()].map(([evidenceGroupKey, bucket]) => {
    const sorted = [...bucket].sort(comparePoints)
    return {
      evidenceGroupKey,
      anchorDate: sorted[0].soldOn,
      representativeEUR: median(sorted.map((point) => point.normalizedPriceEUR)),
      points: sorted,
    }
  })
}

function groupsInPeriod(
  groups: EvidenceGroupStat[],
  startExclusiveMs: number,
  endInclusiveMs: number,
): EvidenceGroupStat[] {
  return groups.filter((group) => {
    const anchor = dateMs(group.anchorDate)
    return anchor > startExclusiveMs && anchor <= endInclusiveMs
  })
}

function chooseWindow(groups: EvidenceGroupStat[], asOfDate: string): { groups: EvidenceGroupStat[]; windowDays: 365 | 730 } {
  const asOf = dateMs(asOfDate)
  const in365 = groupsInPeriod(groups, asOf - 365 * DAY_MS, asOf)
  const in730 = groupsInPeriod(groups, asOf - 730 * DAY_MS, asOf)
  return tier(in730.length) > tier(in365.length)
    ? { groups: in730, windowDays: 730 }
    : { groups: in365, windowDays: 365 }
}

function latestPoint(groups: EvidenceGroupStat[]): EstimateInputPoint {
  const points = groups.flatMap((group) => group.points)
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

function groupMedianInPeriod(
  groups: EvidenceGroupStat[],
  startExclusiveMs: number,
  endInclusiveMs: number,
): { count: number; median: number | null } {
  const selected = groupsInPeriod(groups, startExclusiveMs, endInclusiveMs)
  const values = selected.map((group) => group.representativeEUR)
  return { count: values.length, median: values.length ? median(values) : null }
}

function computeTrend(groups: EvidenceGroupStat[], asOfDate: string): { percent: number | null; window: 90 | 365 | null } {
  const asOf = dateMs(asOfDate)

  const recent90 = groupMedianInPeriod(groups, asOf - 90 * DAY_MS, asOf)
  const previous90 = groupMedianInPeriod(groups, asOf - 180 * DAY_MS, asOf - 90 * DAY_MS)
  if (recent90.count >= 3 && previous90.count >= 3 && previous90.median && previous90.median > 0 && recent90.median != null) {
    return { percent: round2(((recent90.median - previous90.median) / previous90.median) * 100), window: 90 }
  }

  const recent365 = groupMedianInPeriod(groups, asOf - 365 * DAY_MS, asOf)
  const previous365 = groupMedianInPeriod(groups, asOf - 730 * DAY_MS, asOf - 365 * DAY_MS)
  if (recent365.count >= 3 && previous365.count >= 3 && previous365.median && previous365.median > 0 && recent365.median != null) {
    return { percent: round2(((recent365.median - previous365.median) / previous365.median) * 100), window: 365 }
  }

  return { percent: null, window: null }
}

export function computeMarketEstimate(points: EstimateInputPoint[], asOfDate: string): MarketEstimateDraft | null {
  const asOfMs = dateMs(asOfDate)
  const valid = points.filter((point) => {
    if (
      point.normalizedPriceEUR <= 0 ||
      !point.evidenceGroupKey ||
      !/^\d{4}-\d{2}-\d{2}$/.test(point.soldOn)
    ) return false
    return dateMs(point.soldOn) <= asOfMs
  })

  // Build each independent group once before applying windows. This prevents a
  // fixed-anchor group that straddles a window boundary from being counted in
  // two periods or having a different representative in each period.
  const allGroups = buildGroups(valid)
  const chosen = chooseWindow(allGroups, asOfDate)
  if (!chosen.groups.length) return null

  const reps = chosen.groups.map((group) => group.representativeEUR)
  const latest = latestPoint(chosen.groups)
  const trend = computeTrend(allGroups, asOfDate)
  const count = reps.length
  const sortedReps = [...reps].sort((a, b) => a - b)
  const center = round2(median(sortedReps))
  const sampleSize = chosen.groups.reduce((sum, group) => sum + group.points.length, 0)

  const base = {
    currency: "EUR" as const,
    sampleSize,
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
