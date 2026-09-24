"use server"

import { requireAdmin } from "@/lib/admin/access"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  listHotWheelsEbayAuditProfiles,
  runHotWheelsEbayAskAuditForRelease,
  type HotWheelsAskAuditResult,
} from "@/lib/market/automation/hotwheels-ebay-audit"
import {
  buildHcj81MarketSignalPreview,
  type HotWheelsMarketSignalPreview,
} from "@/lib/market/automation/hotwheels-hcj81-preview"

export type HotWheelsAuditProfileOption = {
  releaseId: string
  castingName: string
  identifier: string
  releaseYear: number | null
  lineName: string
  subseries: string | null
  chaseType: string | null
}

function countBy(values: string[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1
  return counts
}

function numericOrNull(value: unknown): number | null {
  if (value == null) return null
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

async function persistHcj81AskSnapshot(preview: HotWheelsMarketSignalPreview) {
  const admin = createAdminClient()
  const snapshotDate = preview.generatedAt.slice(0, 10)
  const offerCount = preview.evidence.filter(
    (row) => row.marketUse === "ask" && row.itemPriceEUR != null,
  ).length

  const { error: upsertError } = await admin
    .from("market_release_ask_snapshots")
    .upsert({
      release_id: preview.releaseId,
      condition: "new_carded",
      snapshot_date: snapshotDate,
      typical_eur: preview.signal.askAnchorEUR,
      low_eur: preview.signal.askMinEUR,
      high_eur: preview.signal.askMaxEUR,
      offer_count: offerCount,
      computed_at: preview.generatedAt,
    }, {
      onConflict: "release_id,condition,snapshot_date",
    })

  if (upsertError) throw upsertError

  const { data, error } = await admin
    .from("market_release_ask_snapshots")
    .select("snapshot_date,typical_eur,low_eur,high_eur,offer_count,computed_at")
    .eq("release_id", preview.releaseId)
    .eq("condition", "new_carded")
    .order("snapshot_date", { ascending: false })
    .limit(14)

  if (error) throw error

  preview.askHistory = (data ?? []).map((row) => ({
    snapshotDate: String(row.snapshot_date),
    typicalEUR: numericOrNull(row.typical_eur),
    lowEUR: numericOrNull(row.low_eur),
    highEUR: numericOrNull(row.high_eur),
    offerCount: Number(row.offer_count ?? 0),
    computedAt: String(row.computed_at),
  }))
}

function logHotWheelsAuditSummary(
  result: HotWheelsAskAuditResult,
  includeFallbackQuery: boolean,
) {
  const reasonCounts = countBy(result.listings.flatMap((row) => row.reasonCodes))
  const detailLookupCounts = countBy(result.listings.map((row) => row.detailLookup))
  const acceptedListings = result.listings.filter((row) => row.decision === "accepted")
  const deliveredEuAccepted = acceptedListings
    .filter((row) => row.costBasis === "delivered_eu" && row.effectiveCostEUR != null)
    .sort((a, b) => (a.effectiveCostEUR ?? Infinity) - (b.effectiveCostEUR ?? Infinity))

  const sample = result.listings
    .filter((row) => row.decision !== "rejected")
    .slice(0, 15)
    .map((row) => ({
      itemId: row.itemId,
      marketplace: row.marketplace,
      decision: row.decision,
      title: row.title,
      price: row.price,
      currency: row.currency,
      shipping: row.shipping,
      originCountry: row.itemLocationCountry,
      shippingEstimateCountry: row.shippingEstimateCountry,
      itemPriceEUR: row.itemPriceEUR,
      shippingEUR: row.shippingEUR,
      shippingAdjustedSubtotalEUR: row.shippingAdjustedSubtotalEUR,
      effectiveCostEUR: row.effectiveCostEUR,
      costBasis: row.costBasis,
      reasonCodes: row.reasonCodes,
      detailLookup: row.detailLookup,
    }))

  console.info("[hotwheels-ebay-audit]", JSON.stringify({
    releaseId: result.releaseId,
    identifier: result.primaryIdentifier,
    casting: result.castingName,
    includeFallbackQuery,
    queries: result.queries,
    rawByMarketplace: result.rawByMarketplace,
    uniqueListings: result.uniqueListings,
    accepted: result.accepted,
    review: result.review,
    rejected: result.rejected,
    lowestAcceptedDeliveredEUR: deliveredEuAccepted[0]?.effectiveCostEUR ?? null,
    acceptedDeliveredCount: deliveredEuAccepted.length,
    reasonCounts,
    detailLookupCounts,
    sample,
  }))
}

export async function listHotWheelsAuditProfilesAction(): Promise<HotWheelsAuditProfileOption[]> {
  await requireAdmin()

  const profiles = await listHotWheelsEbayAuditProfiles()
  return profiles
    .map((profile) => ({
      releaseId: profile.releaseId,
      castingName: profile.castingName,
      identifier: profile.primaryIdentifier,
      releaseYear: profile.releaseYear,
      lineName: profile.lineName,
      subseries: profile.subseries ?? null,
      chaseType: profile.chaseType ?? null,
    }))
    .sort((a, b) => {
      const casting = a.castingName.localeCompare(b.castingName)
      if (casting !== 0) return casting
      return (a.releaseYear ?? 0) - (b.releaseYear ?? 0) || a.identifier.localeCompare(b.identifier)
    })
}

export async function runHotWheelsAskAuditAction(input: {
  releaseId: string
  includeFallbackQuery?: boolean
}): Promise<HotWheelsAskAuditResult> {
  await requireAdmin()

  const releaseId = input.releaseId.trim()
  if (!releaseId) throw new Error("Release Hot Wheels mancante")

  // Read-only diagnostic: no market candidates, offers, queue or recompute writes.
  const includeFallbackQuery = input.includeFallbackQuery === true
  const result = await runHotWheelsEbayAskAuditForRelease(releaseId, {
    perQueryLimit: 10,
    includeFallbackQuery,
    maxDetailLookups: 15,
  })

  // Production-only observability for the controlled Hot Wheels pilot.
  // Public listing data only; no auth/session secrets and no database writes.
  logHotWheelsAuditSummary(result, includeFallbackQuery)

  return result
}


export async function runHcj81MarketSignalPreviewAction(): Promise<HotWheelsMarketSignalPreview> {
  await requireAdmin()

  const releaseId = "f16ed92f-34fb-5fd6-bd8b-c26ff3e831ee"
  const audit = await runHotWheelsEbayAskAuditForRelease(releaseId, {
    perQueryLimit: 10,
    includeFallbackQuery: false,
    maxDetailLookups: 15,
  })

  logHotWheelsAuditSummary(audit, false)

  const preview = await buildHcj81MarketSignalPreview(audit)
  await persistHcj81AskSnapshot(preview)

  console.info("[hotwheels-market-signal-preview]", JSON.stringify({
    releaseId: preview.releaseId,
    identifier: preview.identifier,
    marketStatus: preview.signal.marketStatus,
    marketValueEUR: preview.signal.marketValueEUR,
    askAnchorEUR: preview.signal.askAnchorEUR,
    startingEffectiveCostEUR: preview.signal.startingEffectiveCostEUR,
    sufficientForPreview: preview.readiness.sufficientForPreview,
    sufficientForPublishedMv: preview.readiness.sufficientForPublishedMv,
    evidenceCount: preview.evidence.length,
    askSnapshotCount: preview.askHistory.length,
  }))

  return preview
}
