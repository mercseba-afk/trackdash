import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import type { SoldMarketEvidence } from "./market-model"
import type { MarketCondition } from "./types"

function collectionConditionToMarket(value: string): MarketCondition {
  if (value === "Sealed" || value === "New / Opened") return "new_complete_unbuilt"
  if (value === "Built" || value === "Used") return "built_complete"
  if (value === "Incomplete") return "incomplete_parts_custom"
  return "unknown"
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

function daysBetween(a: string, b: string) {
  return Math.abs(new Date(`${a}T00:00:00Z`).getTime() - new Date(`${b}T00:00:00Z`).getTime()) / 86_400_000
}

function monthBounds(month: string) {
  const [year, monthNumber] = month.split("-").map(Number)
  const end = new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10)
  return { start: `${month}-01`, end }
}

export function buildTrackDashMonthlySaleEvidence(events: SoldMarketEvidence[]): SoldMarketEvidence[] {
  const byMonth = new Map<string, SoldMarketEvidence[]>()
  for (const event of events) {
    if (event.grain !== "event") continue
    const month = event.periodEnd.slice(0, 7)
    const bucket = byMonth.get(month) ?? []
    bucket.push(event)
    byMonth.set(month, bucket)
  }

  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, rows]) => {
      const bounds = monthBounds(month)
      const sourceId = rows[0].sourceId
      return {
        stableId: `trackdash-month|${sourceId}|${month}`,
        sourceId,
        // Pair-capped confirmed events already represent independent clusters.
        // Median keeps a single unusual deal from dominating a sparse month.
        averagePriceEUR: Number(median(rows.map((row) => row.averagePriceEUR)).toFixed(2)),
        salesCount: rows.reduce((sum, row) => sum + Math.max(1, row.salesCount), 0),
        periodStart: bounds.start,
        periodEnd: bounds.end,
        grain: "monthly" as const,
        evidenceGrade: "verified" as const,
      }
    })
}

export async function loadConfirmedTrackDashSales(
  releaseId: string,
  condition: MarketCondition,
): Promise<SoldMarketEvidence[]> {
  const client = createAdminClient()
  const { data: source, error: sourceError } = await client
    .from("price_sources")
    .select("id")
    .eq("slug", "trackdash_confirmed_sales")
    .maybeSingle()
  if (sourceError) throw new Error(`load TrackDash sale source: ${sourceError.message}`)
  if (!source?.id) return []

  const { data, error } = await client
    .from("marketplace_sales")
    .select("id,seller_id,buyer_id,condition,item_price_eur,sale_date")
    .eq("release_id", releaseId)
    .eq("status", "confirmed")
    .not("item_price_eur", "is", null)
    .order("sale_date", { ascending: true })
  if (error) throw new Error(`load confirmed TrackDash sales: ${error.message}`)

  const eligible = (data ?? []).flatMap((row: any) => {
    const price = Number(row.item_price_eur)
    if (collectionConditionToMarket(row.condition) !== condition || !Number.isFinite(price) || price <= 0) return []
    const pair = [String(row.seller_id), String(row.buyer_id)].sort().join("|")
    return [{ id: String(row.id), pair, price, date: String(row.sale_date) }]
  })

  // Anti-manipulation: repeated transactions between the same two accounts in
  // a 30-day period form one independent evidence cluster, regardless of how
  // many copies they report. The cluster price is the median of its confirmed
  // item-only prices; this preserves the data without manufacturing volume.
  const byPair = new Map<string, typeof eligible>()
  for (const sale of eligible) {
    const rows = byPair.get(sale.pair) ?? []
    rows.push(sale)
    byPair.set(sale.pair, rows)
  }

  const evidence: SoldMarketEvidence[] = []
  for (const [pair, rows] of byPair) {
    const ordered = [...rows].sort((a, b) => a.date.localeCompare(b.date))
    let cluster: typeof eligible = []
    const flush = () => {
      if (!cluster.length) return
      const first = cluster[0]
      const last = cluster[cluster.length - 1]
      evidence.push({
        stableId: `trackdash|${releaseId}|${pair}|${first.date}`,
        sourceId: source.id,
        averagePriceEUR: Number(median(cluster.map((sale) => sale.price)).toFixed(2)),
        salesCount: 1,
        periodStart: first.date,
        periodEnd: last.date,
        grain: "event",
        evidenceGrade: "verified",
      })
      cluster = []
    }

    for (const sale of ordered) {
      const previous = cluster[cluster.length - 1]
      if (previous && daysBetween(previous.date, sale.date) > 30) flush()
      cluster.push(sale)
    }
    flush()
  }

  return evidence
}
