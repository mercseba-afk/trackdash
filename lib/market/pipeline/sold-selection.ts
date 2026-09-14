import type { SoldMarketEvidence } from "./market-model"

const DAY_MS = 86_400_000
const CURRENT_SOLD_MAX_AGE_DAYS = 365

function dateMs(value: string): number {
  const parsed = Date.parse(`${value}T00:00:00Z`)
  if (!Number.isFinite(parsed)) throw new Error(`Invalid date: ${value}`)
  return parsed
}

function ageDays(date: string, asOfDate: string): number {
  return Math.max(0, (dateMs(asOfDate) - dateMs(date)) / DAY_MS)
}

function canFeedCurrentSoldAnchor(evidence: SoldMarketEvidence, asOfDate: string): boolean {
  if (evidence.grain === "full_history") return false
  if (ageDays(evidence.periodEnd, asOfDate) > CURRENT_SOLD_MAX_AGE_DAYS) return false
  return evidence.salesCount > 0 && evidence.averagePriceEUR > 0
}

function spanDays(row: SoldMarketEvidence): number {
  return Math.max(0, (dateMs(row.periodEnd) - dateMs(row.periodStart)) / DAY_MS)
}

function totalSales(rows: SoldMarketEvidence[]): number {
  return rows.reduce((sum, row) => sum + Math.max(0, row.salesCount), 0)
}

function chooseRollingWindow(rows: SoldMarketEvidence[], asOfDate: string): SoldMarketEvidence | null {
  const rolling = rows
    .filter(
      (row) =>
        row.grain === "rolling_window" &&
        row.salesCount >= 3 &&
        canFeedCurrentSoldAnchor(row, asOfDate),
    )
    .sort((a, b) => {
      const dateCompare = b.periodEnd.localeCompare(a.periodEnd)
      if (dateCompare !== 0) return dateCompare
      if (a.salesCount !== b.salesCount) return b.salesCount - a.salesCount
      return spanDays(a) - spanDays(b)
    })

  const tiers = [
    (row: SoldMarketEvidence) => row.salesCount >= 5 && spanDays(row) <= 120,
    (row: SoldMarketEvidence) => row.salesCount >= 3 && spanDays(row) <= 210,
    (row: SoldMarketEvidence) => row.salesCount >= 3 && spanDays(row) <= 400,
  ]

  for (const eligible of tiers) {
    const match = rolling.find(eligible)
    if (match) return match
  }

  return null
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
    const currentMonthly = rows
      .filter(
        (row) =>
          row.grain === "monthly" &&
          canFeedCurrentSoldAnchor(row, input.asOfDate),
      )
      .sort((a, b) => a.periodEnd.localeCompare(b.periodEnd))
    const latestMonthly = currentMonthly[currentMonthly.length - 1]

    if (latestMonthly && ageDays(latestMonthly.periodEnd, input.asOfDate) <= 180) {
      const latestSix = currentMonthly.slice(-6)
      const selected = totalSales(latestSix) >= 3 ? latestSix : currentMonthly.slice(-12)
      if (selected.length) {
        chosen.push(...selected)
        aggregateSources.add(sourceId)
      }
      continue
    }

    const currentRolling = chooseRollingWindow(rows, input.asOfDate)
    if (currentRolling) {
      chosen.push(currentRolling)
      aggregateSources.add(sourceId)
      continue
    }

    // A current-but-thin monthly trace can remain evidence. Full-history and
    // stale aggregate fallbacks stay stored for historical context only; they
    // never become today's sold anchor merely because fresher evidence is absent.
    if (latestMonthly) {
      const selected = currentMonthly.slice(-6)
      if (selected.length) {
        chosen.push(...selected)
        aggregateSources.add(sourceId)
      }
    }
  }

  // Granular completed sales from sources without an aggregate summary remain
  // first-class evidence only while they are current. Old transactions remain
  // in history and can support analytics, but cannot drag today's headline down.
  chosen.push(
    ...input.granular.filter(
      (row) =>
        !aggregateSources.has(row.sourceId) &&
        canFeedCurrentSoldAnchor(row, input.asOfDate),
    ),
  )
  return chosen
}
