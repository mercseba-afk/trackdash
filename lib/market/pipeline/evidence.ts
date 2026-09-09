import { createHash } from "node:crypto"
import type { EvidenceGroupRepresentative, EvidenceSale, MarketCondition } from "./types"

const DAY_MS = 86_400_000

function isoDateToMs(value: string): number {
  const ms = Date.parse(`${value}T00:00:00Z`)
  if (!Number.isFinite(ms)) throw new Error(`Invalid ISO sale date: ${value}`)
  return ms
}

function median(values: number[]): number {
  if (!values.length) throw new Error("median requires at least one value")
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

function compareSales(a: EvidenceSale, b: EvidenceSale): number {
  const dateCompare = a.soldOn.localeCompare(b.soldOn)
  if (dateCompare !== 0) return dateCompare

  const aTime = a.soldAt ?? "9999-12-31T23:59:59.999Z"
  const bTime = b.soldAt ?? "9999-12-31T23:59:59.999Z"
  const timeCompare = aTime.localeCompare(bTime)
  if (timeCompare !== 0) return timeCompare

  return a.stableId.localeCompare(b.stableId)
}

export function evidencePartitionKey(input: {
  releaseId: string
  condition: MarketCondition
  sourceId: string
  sellerFingerprint: string
}): string {
  return [input.releaseId, input.condition, input.sourceId, input.sellerFingerprint].join("|")
}

export function makeEvidenceGroupKey(input: {
  releaseId: string
  condition: MarketCondition
  sourceId: string
  sellerFingerprint: string
  anchorDate: string
}): string {
  const raw = [
    input.releaseId,
    input.condition,
    input.sourceId,
    input.sellerFingerprint,
    input.anchorDate,
  ].join("|")
  return `eg:v1:${createHash("sha256").update(raw).digest("hex")}`
}

export function assignEvidenceGroups(sales: EvidenceSale[]): Map<string, string | null> {
  const result = new Map<string, string | null>()
  const partitions = new Map<string, EvidenceSale[]>()

  for (const sale of sales) {
    if (!sale.sellerFingerprint) {
      result.set(sale.stableId, null)
      continue
    }

    const partition = evidencePartitionKey({
      releaseId: sale.releaseId,
      condition: sale.condition,
      sourceId: sale.sourceId,
      sellerFingerprint: sale.sellerFingerprint,
    })
    const bucket = partitions.get(partition) ?? []
    bucket.push(sale)
    partitions.set(partition, bucket)
  }

  for (const bucket of partitions.values()) {
    const sorted = [...bucket].sort(compareSales)
    let anchorDate: string | null = null
    let anchorMs = 0
    let groupKey: string | null = null

    for (const sale of sorted) {
      const soldOnMs = isoDateToMs(sale.soldOn)
      if (anchorDate === null || soldOnMs >= anchorMs + 7 * DAY_MS) {
        anchorDate = sale.soldOn
        anchorMs = soldOnMs
        groupKey = makeEvidenceGroupKey({
          releaseId: sale.releaseId,
          condition: sale.condition,
          sourceId: sale.sourceId,
          sellerFingerprint: sale.sellerFingerprint!,
          anchorDate,
        })
      }
      result.set(sale.stableId, groupKey)
    }
  }

  return result
}

export function buildEvidenceGroupRepresentatives(sales: EvidenceSale[]): EvidenceGroupRepresentative[] {
  const grouped = new Map<string, EvidenceSale[]>()

  for (const sale of sales) {
    if (!sale.evidenceGroupKey || sale.normalizedPriceEUR == null) continue
    const bucket = grouped.get(sale.evidenceGroupKey) ?? []
    bucket.push(sale)
    grouped.set(sale.evidenceGroupKey, bucket)
  }

  return [...grouped.entries()].map(([evidenceGroupKey, bucket]) => {
    const sorted = [...bucket].sort(compareSales)
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    return {
      evidenceGroupKey,
      releaseId: first.releaseId,
      condition: first.condition,
      sourceId: first.sourceId,
      sellerFingerprint: first.sellerFingerprint!,
      anchorDate: first.soldOn,
      representativeEUR: median(sorted.map((row) => row.normalizedPriceEUR!)),
      saleCount: sorted.length,
      latestSoldOn: last.soldOn,
    }
  })
}

export function isPossibleOutlier(newRepresentativeEUR: number, priorRepresentativesEUR: number[]): boolean {
  if (priorRepresentativesEUR.length < 3) return false
  const priorMedian = median(priorRepresentativesEUR)
  if (priorMedian <= 0) return false
  return newRepresentativeEUR > priorMedian * 3 || newRepresentativeEUR < priorMedian / 3
}
