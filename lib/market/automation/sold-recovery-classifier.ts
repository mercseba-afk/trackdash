// Diagnostic-only classification of already persisted SOLD evidence.
// The canonical Market Method v4 is the ONLY source allowed to publish MV.
export interface RecoveryAggregate {
  sourceId: string
  attributionStatus: string
  grain: string
  periodStart: string
  periodEnd: string
  salesCount: number
  sellerCount: number | null
  averageEUR: number
  evidenceGrade: string
}

export type SoldRecoveryCategory =
  | "valued"
  | "no_sold"
  | "single_sold"
  | "thin_sold"
  | "corroboration_candidate"
  | "broader_sold"

export function hasThinSoldHistoricalCorroboration(input: {
  soldUnits: number
  soldAnchorEUR: number | null
  aggregates: RecoveryAggregate[]
  asOfDate: string
}): boolean {
  const { soldUnits, soldAnchorEUR, aggregates, asOfDate } = input
  if (soldUnits < 3 || soldUnits > 4 || soldAnchorEUR == null || soldAnchorEUR <= 0) return false
  const endOfToday = Date.parse(`${asOfDate}T00:00:00Z`)
  if (!Number.isFinite(endOfToday)) return false

  return aggregates.some((recent) => {
    if (
      recent.grain !== "rolling_window" ||
      recent.attributionStatus !== "release_exact" ||
      recent.evidenceGrade !== "indicative" ||
      recent.salesCount !== soldUnits ||
      recent.averageEUR <= 0 ||
      Math.abs(recent.averageEUR - soldAnchorEUR) > 0.025
    ) return false

    const latestSoldAt = Date.parse(`${recent.periodEnd}T00:00:00Z`)
    const ageDays = (endOfToday - latestSoldAt) / 86_400_000
    if (!Number.isFinite(ageDays) || ageDays < 0 || ageDays > 365) return false

    return aggregates.some((history) =>
      history.grain === "full_history" &&
      history.attributionStatus === "release_exact" &&
      history.sourceId === recent.sourceId &&
      history.salesCount >= 8 &&
      (history.sellerCount ?? 0) >= 2 &&
      history.periodStart <= recent.periodStart &&
      history.periodEnd >= recent.periodEnd &&
      history.periodEnd <= asOfDate &&
      history.averageEUR > 0 &&
      Math.abs(history.averageEUR - recent.averageEUR) / Math.max(history.averageEUR, recent.averageEUR) <= 0.3
    )
  })
}

export function classifySoldRecovery(input: {
  marketValueEUR: number | null
  soldUnits: number
  soldAnchorEUR: number | null
  aggregates: RecoveryAggregate[]
  asOfDate: string
}): SoldRecoveryCategory {
  if (input.marketValueEUR != null && input.marketValueEUR > 0) return "valued"
  if (input.soldAnchorEUR == null || input.soldAnchorEUR <= 0 || input.soldUnits < 1) return "no_sold"
  if (input.soldUnits === 1) return "single_sold"
  if (hasThinSoldHistoricalCorroboration(input)) return "corroboration_candidate"
  if (input.soldUnits <= 3) return "thin_sold"
  return "broader_sold"
}
