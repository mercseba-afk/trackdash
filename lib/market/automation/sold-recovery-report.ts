import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { classifySoldRecovery, type RecoveryAggregate, type SoldRecoveryCategory } from "./sold-recovery-classifier"

export interface Mini4wdSoldRecoveryRow {
  releaseId: string
  family: string
  itemNumber: string | null
  edition: string
  verificationStatus: string
  soldUnits: number
  soldEUR: number
  category: Exclude<SoldRecoveryCategory, "valued" | "no_sold">
  queued: boolean
}

export interface Mini4wdSoldRecoveryReport {
  checkedAt: string
  publicReleases: number
  withMarketValue: number
  withSoldReference: number
  soldWithoutValue: number
  oneSale: number
  twoOrThreeSales: number
  corroborationCandidates: number
  largerSamples: number
  pendingRecomputes: number
  rows: Mini4wdSoldRecoveryRow[]
}

function check(error: { message?: string } | null, label: string): void {
  if (error) throw new Error(`${label}: ${error.message ?? "unknown Supabase error"}`)
}
function num(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

// Read-only and derived LIVE from canonical signals and stored evidence;
// not a competing pricing engine or a separate SOLD history. New/releases
// or newly ingested evidence show up without any hardcoded release list.
export async function getMini4wdSoldRecoveryReport(): Promise<Mini4wdSoldRecoveryReport> {
  const client = createAdminClient()
  const checkedAt = new Date().toISOString()
  const asOfDate = checkedAt.slice(0, 10)

  const { data: category, error: categoryError } = await client
    .from("categories").select("id").eq("slug", "mini4wd").maybeSingle()
  check(categoryError, "load Mini4WD category")

  const empty: Mini4wdSoldRecoveryReport = {
    checkedAt, publicReleases: 0, withMarketValue: 0, withSoldReference: 0,
    soldWithoutValue: 0, oneSale: 0, twoOrThreeSales: 0,
    corroborationCandidates: 0, largerSamples: 0, pendingRecomputes: 0, rows: [],
  }
  if (!category) return empty

  const { data: products, error: productError } = await client
    .from("products").select("id,name,metadata").eq("category_id", category.id)
  check(productError, "load Mini4WD products")
  const publishedProducts = (products ?? []).filter((product: any) => product.metadata?.launch_status === "available")
  if (!publishedProducts.length) return empty

  const productIds = publishedProducts.map((product: any) => product.id)
  const productNames = new Map<string, string>(publishedProducts.map((p: any) => [p.id, p.name]))
  const { data: releases, error: releaseError } = await client
    .from("product_releases")
    .select("id,product_id,item_number,edition_name,catalog_visibility,verification_status")
    .in("product_id", productIds)
    .eq("catalog_visibility", "public")
  check(releaseError, "load public verified Mini4WD Releases")
  if (!releases?.length) return empty

  const releaseIds = releases.map((r: any) => r.id)
  const { data: signals, error: signalsError } = await client
    .from("market_release_signals")
    .select("release_id,market_value_eur,sold_anchor_eur,sold_units")
    .eq("condition", "new_complete_unbuilt")
    .in("release_id", releaseIds)
  check(signalsError, "load canonical Mini4WD market signals")

  const signalsById = new Map<string, any>((signals ?? []).map((s: any) => [s.release_id, s]))
  const soldOnly = releases.filter((release: any) => {
    const signal = signalsById.get(release.id)
    return signal &&
      (signal.market_value_eur == null || num(signal.market_value_eur) <= 0) &&
      signal.sold_anchor_eur != null && num(signal.sold_anchor_eur) > 0
  })
  const withMarketValue = (signals ?? []).filter((s: any) => num(s.market_value_eur) > 0).length
  const withSoldReference = (signals ?? []).filter((s: any) => num(s.sold_anchor_eur) > 0).length
  if (!soldOnly.length) return {
    ...empty, publicReleases: releases.length, withMarketValue, withSoldReference,
  }

  const soldIds = soldOnly.map((r: any) => r.id)
  const [{ data: aggregate, error: aggregateError }, { data: queue, error: queueError }] = await Promise.all([
    client.from("market_aggregate_observations")
      .select("release_id,source_id,attribution_status,grain,period_start,period_end,sales_count,seller_count,market_average_eur,evidence_grade")
      .eq("condition", "new_complete_unbuilt")
      .in("attribution_status", ["release_exact", "release_matched"])
      .in("release_id", soldIds)
      .not("market_average_eur", "is", null),
    client.from("market_recompute_queue")
      .select("release_id")
      .eq("condition", "new_complete_unbuilt")
      .in("release_id", soldIds),
  ])
  check(aggregateError, "load existing SOLD history")
  check(queueError, "load pending canonical recomputes")

  const byRelease = new Map<string, RecoveryAggregate[]>()
  for (const item of aggregate ?? []) {
    const row: RecoveryAggregate = {
      sourceId: item.source_id,
      attributionStatus: item.attribution_status,
      grain: item.grain,
      periodStart: item.period_start,
      periodEnd: item.period_end,
      salesCount: item.sales_count,
      sellerCount: item.seller_count,
      averageEUR: num(item.market_average_eur),
      evidenceGrade: item.evidence_grade,
    }
    const rows = byRelease.get(item.release_id) ?? []
    rows.push(row)
    byRelease.set(item.release_id, rows)
  }
  const queued = new Set((queue ?? []).map((j: any) => j.release_id))
  const rows: Mini4wdSoldRecoveryRow[] = soldOnly.map((release: any) => {
    const signal = signalsById.get(release.id)
    const soldUnits = num(signal.sold_units)
    const soldEUR = num(signal.sold_anchor_eur)
    const category = classifySoldRecovery({
      marketValueEUR: null,
      soldUnits,
      soldAnchorEUR: soldEUR,
      aggregates: byRelease.get(release.id) ?? [],
      asOfDate,
    })
    return {
      releaseId: release.id,
      family: productNames.get(release.product_id) ?? "Mini 4WD",
      itemNumber: release.item_number,
      edition: release.edition_name,
      verificationStatus: release.verification_status,
      soldUnits,
      soldEUR,
      category: category === "valued" || category === "no_sold" ? "thin_sold" as const : category,
      queued: queued.has(release.id),
    }
  })

  const priority = (row: Mini4wdSoldRecoveryRow) =>
    row.category === "corroboration_candidate" ? 0
    : row.category === "broader_sold" ? 1
    : row.category === "thin_sold" ? 2 : 3
  rows.sort((a, b) => priority(a) - priority(b) || b.soldUnits - a.soldUnits || a.edition.localeCompare(b.edition))

  return {
    checkedAt,
    publicReleases: releases.length,
    withMarketValue,
    withSoldReference,
    soldWithoutValue: rows.length,
    oneSale: rows.filter((r) => r.soldUnits === 1).length,
    twoOrThreeSales: rows.filter((r) => r.soldUnits >= 2 && r.soldUnits <= 3).length,
    corroborationCandidates: rows.filter((r) => r.category === "corroboration_candidate").length,
    largerSamples: rows.filter((r) => r.soldUnits >= 4).length,
    pendingRecomputes: rows.filter((r) => r.queued).length,
    rows,
  }
}
