import type { SoldMarketEvidence } from "./market-model"

const DAY_MS = 86_400_000

function dateMs(value: string): number {
  const parsed = Date.parse(`${value}T00:00:00Z`)
  if (!Number.isFinite(parsed)) throw new Error(`Invalid date: ${value}`)
  return parsed
}

function ageDays(date: string, asOfDate: string): number {
  return Math.max(0, (dateMs(asOfDate) - dateMs(date)) / DAY_MS)
}

function grainRank(grain: SoldMarketEvidence["grain"]): number {
  if (grain === "rolling_window") return 2
  if (grain === "full_history") return 1
  if (grain === "monthly") return 0
  return -1
}

export function selectCurrentSoldEvidence(input: {
  granular: SoldMarketEvidence[]
  aggregate: SoldMarketEvidence[]
  asOfDate: string
}): SoldMarketEvidence[] {
  const bySource = new Map<string, SoldMarketEvidence[]>()
  for (const row of input.aggregate.filter((item) => item.grain !== "event")) {
    const bucket = bySource.get(row.sourceId) ?? []
    bucket.push(row)
    bySource.set(row.sourceId, bucket)
  }

  const chosen: SoldMarketEvidence[] = []
  const aggregateSources = new Set<string>()

  for (const [sourceId, rows] of bySource) {
    const monthly = rows
      .filter((row) => row.grain === "monthly")
      .sort((a, b) => a.periodEnd.localeCompare(b.periodEnd))
    const latestMonthly = monthly[monthly.length - 1]

    if (latestMonthly && ageDays(latestMonthly.periodEnd, input.asOfDate) <= 180) {
      chosen.push(...monthly.slice(-12))
      aggregateSources.add(sourceId)
      continue
    }

    const broad = rows
      .filter((row) => row.grain !== "monthly")
      .sort((a, b) => {
        const dateCompare = b.periodEnd.localeCompare(a.periodEnd)
        if (dateCompare !== 0) return dateCompare
        return grainRank(b.grain) - grainRank(a.grain)
      })[0]

    if (broad) {
      chosen.push(broad)
      aggregateSources.add(sourceId)
      continue
    }

    if (latestMonthly) {
      chosen.push(...monthly.slice(-6))
      aggregateSources.add(sourceId)
    }
  }

  chosen.push(...input.granular.filter((row) => !aggregateSources.has(row.sourceId)))
  return chosen
}
