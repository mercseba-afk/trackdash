"use server"

import { requireAdmin } from "@/lib/admin/access"
import {
  listHotWheelsEbayAuditProfiles,
  runHotWheelsEbayAskAuditForRelease,
  type HotWheelsAskAuditResult,
} from "@/lib/market/automation/hotwheels-ebay-audit"
import {
  buildHotWheelsSharedMarketPreview,
  type HotWheelsSharedMarketPreview,
} from "@/lib/market/automation/hotwheels-shared-market-preview"
import { MarketR3Repository } from "@/lib/market/pipeline/market-r3-repository"
import { selectCurrentSoldEvidence } from "@/lib/market/pipeline/sold-selection"
import { loadConfirmedTrackDashSales } from "@/lib/market/pipeline/trackdash-sales"

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

export async function runHotWheelsSharedMarketPreviewAction(input: {
  releaseId: string
  includeFallbackQuery?: boolean
}): Promise<HotWheelsSharedMarketPreview> {
  await requireAdmin()

  const releaseId = input.releaseId.trim()
  if (!releaseId) throw new Error("Release Hot Wheels mancante")

  const includeFallbackQuery = input.includeFallbackQuery === true
  const audit = await runHotWheelsEbayAskAuditForRelease(releaseId, {
    perQueryLimit: 10,
    includeFallbackQuery,
    maxDetailLookups: 15,
  })

  logHotWheelsAuditSummary(audit, includeFallbackQuery)

  // The preview remains read-only, but it now reads the same canonical SOLD
  // evidence lanes used by the normal R3 recompute. This lets verified Hot
  // Wheels SOLD observations exercise Market Method v4 without creating a
  // second valuation path.
  const repo = new MarketR3Repository()
  const condition = "new_complete_unbuilt" as const
  const asOfDate = new Date().toISOString().slice(0, 10)
  const [granularExternal, aggregate, trackDashSales, askSnapshots] = await Promise.all([
    repo.listGranularSoldEvidence(releaseId, condition),
    repo.listAggregateSoldEvidence(releaseId, condition),
    loadConfirmedTrackDashSales(releaseId, condition),
    repo.listAskSnapshots(releaseId, condition),
  ])
  const soldEvidence = selectCurrentSoldEvidence({
    granular: [...granularExternal, ...trackDashSales],
    aggregate,
    asOfDate,
  })

  // Read-only preview through the exact same valuation/publication core used by
  // Mini 4WD. Hot Wheels has its own identity/source adapters, not a parallel
  // price engine. ASK alone cannot manufacture a Market Value.
  const preview = buildHotWheelsSharedMarketPreview({
    audit,
    soldEvidence,
    askSnapshots,
  })

  console.info("[hotwheels-shared-market-preview]", JSON.stringify({
    releaseId: preview.releaseId,
    identifier: preview.identifier,
    engine: preview.engine,
    marketValueEUR: preview.signal.marketValueEUR,
    soldAnchorEUR: preview.signal.soldAnchorEUR,
    activeAnchorEUR: preview.signal.activeAnchorEUR,
    startingEffectiveCostEUR: preview.signal.startingOffer?.effectiveCostEUR ?? null,
    confidence: preview.signal.confidenceLabel,
    acceptedAskCount: preview.inputs.acceptedAskCount,
    deliveredAskCount: preview.inputs.deliveredAskCount,
    soldEvidenceCount: preview.inputs.soldEvidenceCount,
    soldUnits: preview.signal.soldUnits,
    soldSourceCount: preview.signal.soldSourceCount,
  }))

  return preview
}
