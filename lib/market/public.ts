import "server-only"

import {
  getMarketMonthlySignalsForRelease,
  getMarketSignalForRelease,
  listCurrentObservedOffers,
  listMarketMonthlySignals,
  listMarketSignals,
  type CurrentObservedOfferRow,
  type MarketReleaseMonthlySignal,
  type MarketReleaseSignal,
} from "@/lib/db/queries/market"
import {
  MARKETPLACE_OFFER_MAX_AGE_HOURS,
  RETAIL_OFFER_MAX_AGE_HOURS,
  currentOfferExpiryAtMs,
} from "@/lib/market/pipeline/market-publication-policy"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCollectorSoldTrendComparison, type CollectorSoldTrendComparison } from "@/lib/market/collector-sold-trend-comparison"
import { classifyOfferOrigin } from "@/lib/market/offer-origin"
import { representativeAskingMedian, collectionAskingMedian } from "@/lib/market/representative-asking"
import type {
  ReleaseMarketConfidence,
  ReleaseMarketRegime,
  ReleaseMarketSignalMap,
  ReleaseMarketSignalView,
} from "@/lib/market/view-types"

const DAY_MS = 86_400_000


interface SafeMarketContextEvidenceRow {
  releaseId: string
  evidenceCount: number
}

// market_candidates and market_aggregate_observations intentionally have no
// public RLS policies. Read them only with the trusted server client and return
// an aggregate count; raw private audit evidence never crosses this boundary.
async function listSafeMarketContextEvidence(
  releaseIds?: string[],
): Promise<SafeMarketContextEvidenceRow[]> {
  if (releaseIds && releaseIds.length === 0) return []

  const client = createAdminClient()
  let candidateQuery = client
    .from("market_candidates")
    .select("resolved_release_id,possible_release_ids")
    .eq("decision", "accepted")
    .in("match_confidence", ["exact", "strong"])

  let aggregateQuery = client
    .from("market_aggregate_observations")
    .select("release_id")
    .in("attribution_status", ["release_exact", "release_matched"])
    .not("release_id", "is", null)

  if (releaseIds?.length) {
    // Keep unresolved exact multi-Release evidence (for example an unsplittable
    // two-kit lot) available as context. Filtering candidates only by
    // resolved_release_id would hide that evidence from every possible Release.
    aggregateQuery = aggregateQuery.in("release_id", releaseIds)
  }

  const [
    { data: candidates, error: candidateError },
    { data: aggregates, error: aggregateError },
  ] = await Promise.all([candidateQuery, aggregateQuery])

  if (candidateError) throw new Error(`load safe market candidate context: ${candidateError.message}`)
  if (aggregateError) throw new Error(`load safe aggregate market context: ${aggregateError.message}`)

  const wanted = releaseIds?.length ? new Set(releaseIds) : null
  const counts = new Map<string, number>()

  for (const row of candidates ?? []) {
    const candidateReleaseIds = row.resolved_release_id
      ? [row.resolved_release_id]
      : (row.possible_release_ids ?? [])

    for (const releaseId of candidateReleaseIds) {
      if (!releaseId || (wanted && !wanted.has(releaseId))) continue
      counts.set(releaseId, (counts.get(releaseId) ?? 0) + 1)
    }
  }

  for (const row of aggregates ?? []) {
    const releaseId = row.release_id
    if (!releaseId || (wanted && !wanted.has(releaseId))) continue
    counts.set(releaseId, (counts.get(releaseId) ?? 0) + 1)
  }

  return [...counts.entries()].map(([releaseId, evidenceCount]) => ({ releaseId, evidenceCount }))
}


interface StoredTrendAuditRow {
  release_id: string
  captured_at: string
  raw_payload: unknown
}

// Source-owned, read-only provenance. Never disclose raw audit payloads to the
// client; project only two verified sold-window averages and sample sizes.
// This filters to explicitly documented trends instead of guessing baselines
// from a current Market Value or an unrelated active asking price.
async function listCollectorTrendAuditRows(releaseIds?: string[]): Promise<StoredTrendAuditRow[]> {
  if (releaseIds && !releaseIds.length) return []
  const client = createAdminClient()
  let query = client
    .from("market_aggregate_observations")
    .select("release_id,captured_at,raw_payload")
    .eq("condition", "new_complete_unbuilt")
    .eq("attribution_status", "release_exact")
    .not("raw_payload->trend_evidence", "is", null)
  if (releaseIds?.length) query = query.in("release_id", releaseIds)
  const { data, error } = await query
  if (error) throw new Error(`load verified collector-trend provenance: ${error.message}`)
  return (data ?? []) as StoredTrendAuditRow[]
}

function publishedSoldTrendComparison(
  signal: MarketReleaseSignal | null | undefined,
  audits: StoredTrendAuditRow[],
): CollectorSoldTrendComparison | null {
  if (!signal || signal.trendBasis !== "sold" || signal.trendPercent == null) return null
  const trend = {
    percent: numberOrNull(signal.trendPercent),
    windowMonths: signal.trendWindowMonths,
    basis: signal.trendBasis,
    updatedAt: signal.trendUpdatedAt instanceof Date
      ? signal.trendUpdatedAt.toISOString()
      : signal.trendUpdatedAt ? String(signal.trendUpdatedAt) : null,
  } as const

  for (const row of audits) {
    const valid = getCollectorSoldTrendComparison(row.raw_payload, row.captured_at, trend)
    if (valid) return valid
  }
  return null
}

interface RecentSoldActivity {
  units: number
  periodStart: string
  periodEnd: string
}

function numberOrNull(value: string | number | null | undefined): number | null {
  if (value == null) return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function monthKey(value: string | Date): string {
  return (value instanceof Date ? value.toISOString() : String(value)).slice(0, 7)
}

function monthIndex(key: string): number {
  const [year, month] = key.split("-").map(Number)
  return year * 12 + month - 1
}

function monthEndMs(key: string): number {
  const [year, month] = key.split("-").map(Number)
  return Date.UTC(year, month, 0, 23, 59, 59, 999)
}

function freshObservedOffers(
  rows: CurrentObservedOfferRow[],
  asOf = new Date(),
): CurrentObservedOfferRow[] {
  return rows.filter((row) => {
    const checkedAt = row.lastCheckedAt instanceof Date ? row.lastCheckedAt.getTime() : Date.parse(String(row.lastCheckedAt))
    if (!Number.isFinite(checkedAt)) return false
    const maxAgeHours = row.channel === "marketplace"
      ? MARKETPLACE_OFFER_MAX_AGE_HOURS
      : RETAIL_OFFER_MAX_AGE_HOURS
    return Math.max(0, asOf.getTime() - checkedAt) <= maxAgeHours * 3_600_000
  })
}

function startingFreshObservedOffer(
  rows: CurrentObservedOfferRow[],
  startingCandidateId: string | null,
  asOf = new Date(),
): CurrentObservedOfferRow | null {
  const fresh = freshObservedOffers(rows, asOf)

  // Fail closed: only the Europe-first candidate explicitly selected by
  // the canonical Market Method is allowed as public current ASK.
  // A random fresh extra-EU offer may quote only local shipping and must
  // NEVER be presented as a European purchasable price.
  if (!startingCandidateId) return null
  return fresh.find((row) => row.candidateId === startingCandidateId) ?? null
}

function deriveRecentSoldActivity(
  rows: MarketReleaseMonthlySignal[],
  asOf = new Date(),
): RecentSoldActivity | null {
  if (rows.length < 3) return null

  const sorted = [...rows].sort((a, b) => monthKey(a.month).localeCompare(monthKey(b.month)))
  const latestThree = sorted.slice(-3)
  const keys = latestThree.map((row) => monthKey(row.month))

  if (monthIndex(keys[1]) !== monthIndex(keys[0]) + 1) return null
  if (monthIndex(keys[2]) !== monthIndex(keys[1]) + 1) return null

  const latestAgeDays = Math.max(0, (asOf.getTime() - monthEndMs(keys[2])) / DAY_MS)
  if (latestAgeDays > 90) return null

  const units = latestThree.reduce((sum, row) => sum + Math.max(0, row.soldUnits), 0)

  // A validated recent window with zero completed sales is meaningful evidence:
  // it indicates very low observed liquidity rather than missing data.
  return {
    units,
    periodStart: `${keys[0]}-01`,
    periodEnd: `${keys[2]}-01`,
  }
}

export function toPublicMarketSignalView(
  signal: MarketReleaseSignal | null | undefined,
  recentSoldActivity: RecentSoldActivity | null = null,
  observedOffers: CurrentObservedOfferRow[] = [],
  marketContextEvidenceCount = 0,
  soldTrendComparison: CollectorSoldTrendComparison | null = null,
): ReleaseMarketSignalView | null {
  if (!signal) return null

  const valueEUR = numberOrNull(signal.marketValueEUR)
  const rawRetailAnchorEUR = numberOrNull(signal.retailAnchorEUR)
  const rawActiveAnchorEUR = numberOrNull(signal.activeAnchorEUR)
  const soldAnchorEUR = numberOrNull(signal.soldAnchorEUR)
  const asOf = new Date()
  const freshOffers = freshObservedOffers(observedOffers, asOf)
  const observedOffer = startingFreshObservedOffer(freshOffers, signal.startingOfferCandidateId, asOf)
  // Presentation-only median from current exact-Release listing evidence.
  // This cannot change the canonically selected shopping offer or Market Value.
  const askingCandidates = freshOffers.map((offer) => {
    const itemPriceEUR = numberOrNull(offer.itemPriceEUR)
    const shippingEUR = numberOrNull(offer.shippingEUR)
    const effectiveCostEUR = numberOrNull(offer.effectiveCostEUR)
    const deliveredToItaly = offer.costBasis === "delivered" &&
      itemPriceEUR != null && itemPriceEUR > 0 &&
      shippingEUR != null && shippingEUR >= 0 &&
      effectiveCostEUR != null && effectiveCostEUR > 0 &&
      Math.abs(itemPriceEUR + shippingEUR - effectiveCostEUR) <= 0.025
    return {
      originCountry: offer.originCountry,
      sourceSlug: offer.sourceSlug,
      sourceMarketRegion: offer.sourceMarketRegion,
      listingKey: offer.listingKey,
      sellerFingerprint: offer.sellerFingerprint,
      itemPriceEUR,
      origin: classifyOfferOrigin(offer.originCountry, offer.sourceMarketRegion),
      deliveredToItaly,
      checkedAt: offer.lastCheckedAt instanceof Date ? offer.lastCheckedAt.toISOString() : String(offer.lastCheckedAt),
      acceptedExactKit: offer.acceptedExactKit,
    }
  })
  const representativeAsk = representativeAskingMedian(askingCandidates, asOf)
  // The collection may keep a dated quote when current offers are sparse.
  // observedOffers already excludes unavailable states; retain exact/source
  // checks while allowing a longer clearly dated ASK reference.
  const collectionCandidates = observedOffers.map((offer) => ({
    listingKey: offer.listingKey, sellerFingerprint: offer.sellerFingerprint,
    itemPriceEUR: numberOrNull(offer.itemPriceEUR),
    origin: classifyOfferOrigin(offer.originCountry, offer.sourceMarketRegion),
    originCountry: offer.originCountry, sourceSlug: offer.sourceSlug,
    sourceMarketRegion: offer.sourceMarketRegion, deliveredToItaly: false,
    checkedAt: new Date(offer.lastCheckedAt).toISOString(),
    acceptedExactKit: offer.acceptedExactKit,
  }))
  const collectionAsk = collectionAskingMedian(collectionCandidates, asOf)
  // A formerly observed ASK is valuable historical evidence, NOT proof that
  // its listing is still purchasable. Preserve its dated KIT-ONLY component
  // separately, without feeding stale quotes into the current-offer pipeline.
  const nowMs = asOf.getTime()
  // Counts/anchors can change at ANY offer expiry, not only the selected ASK's
  // expiry. The representative median also retains its existing 15-day window
  // for retail quotes. Publish deadlines only; never candidate/seller identities.
  const offerDeadlines = freshOffers.flatMap((offer) => {
    const observedAt = new Date(offer.lastCheckedAt).toISOString()
    return [
      currentOfferExpiryAtMs({ channel: offer.channel === "marketplace" ? "marketplace" : "retail", observedAt }),
      Date.parse(observedAt) + MARKETPLACE_OFFER_MAX_AGE_HOURS * 3_600_000,
    ].filter((deadline): deadline is number => deadline != null && deadline >= nowMs)
  })
  const historicalOffer = observedOffer ? null : [...observedOffers]
    .filter((offer) => {
      const price = numberOrNull(offer.itemPriceEUR)
      const checkedMs = offer.lastCheckedAt instanceof Date
        ? offer.lastCheckedAt.getTime()
        : Date.parse(String(offer.lastCheckedAt))
      return price != null && price > 0 &&
        Number.isFinite(checkedMs) && checkedMs <= nowMs &&
        nowMs - checkedMs <= 180 * DAY_MS
    })
    .sort((left, right) => {
      const a = new Date(left.lastCheckedAt).getTime()
      const b = new Date(right.lastCheckedAt).getTime()
      return b - a || Number(left.itemPriceEUR) - Number(right.itemPriceEUR)
    })[0] ?? null
  const histItem = numberOrNull(historicalOffer?.itemPriceEUR)
  const histShipping = numberOrNull(historicalOffer?.shippingEUR)
  const histSubtotal = numberOrNull(historicalOffer?.effectiveCostEUR)
  const verifiedHistSubtotal = histItem != null && histShipping != null &&
    histShipping >= 0 && histSubtotal != null &&
    Math.abs(histSubtotal - histItem - histShipping) < 0.025
      ? histSubtotal : null
  const startingItemPriceEUR = numberOrNull(observedOffer?.itemPriceEUR)
  const startingEffectiveCostEUR = numberOrNull(observedOffer?.effectiveCostEUR)
  const currentOfferCount = freshOffers.length
  const freshMarketplaceOffers = freshOffers.filter((offer) => offer.channel === "marketplace")
  const freshRetailOffers = freshOffers.filter((offer) => offer.channel === "retail")
  const activeOfferCount = freshMarketplaceOffers.length
  const retailSourceCount = new Set(freshRetailOffers.map((offer) => offer.sourceId)).size
  const retailAnchorEUR = freshRetailOffers.length > 0 ? rawRetailAnchorEUR : null
  const activeAnchorEUR = freshMarketplaceOffers.length > 0 ? rawActiveAnchorEUR : null
  const hasMarketEvidence =
    (valueEUR != null && valueEUR > 0) ||
    (retailAnchorEUR != null && retailAnchorEUR > 0) ||
    (activeAnchorEUR != null && activeAnchorEUR > 0) ||
    (soldAnchorEUR != null && soldAnchorEUR > 0) ||
    (histItem != null && histItem > 0) ||
    currentOfferCount > 0 ||
    signal.soldUnits > 0 ||
    marketContextEvidenceCount > 0

  if (!hasMarketEvidence) return null

  return {
    offersValidUntil: offerDeadlines.length ? new Date(Math.min(...offerDeadlines)).toISOString() : null,
    marketRegime: signal.marketRegime as ReleaseMarketRegime,
    collectionAskItemEUR: collectionAsk?.itemPriceEUR ?? null,
    collectionAskSellerCount: collectionAsk?.sellerCount ?? 0,
    collectionAskObservedAt: collectionAsk?.observedAt ?? null,
    collectionAskOrigin: collectionAsk?.origin ?? "unknown",
    collectionAskIsHistorical: collectionAsk?.isHistorical ?? false,
    collectionAskValidUntil: collectionAsk?.validUntil ?? null,
    valueEUR: valueEUR != null && valueEUR > 0 ? valueEUR : null,
    lowEUR: numberOrNull(signal.lowEUR),
    highEUR: numberOrNull(signal.highEUR),
    confidenceScore: signal.confidenceScore,
    confidenceLabel: signal.confidenceLabel as ReleaseMarketConfidence,
    retailAnchorEUR,
    activeAnchorEUR,
    activeLowEUR: activeOfferCount > 0 ? numberOrNull(signal.activeLowEUR) : null,
    activeHighEUR: activeOfferCount > 0 ? numberOrNull(signal.activeHighEUR) : null,
    soldAnchorEUR,
    startingItemPriceEUR: startingItemPriceEUR != null && startingItemPriceEUR > 0 ? startingItemPriceEUR : null,
    representativeAskItemEUR: representativeAsk?.itemPriceEUR ?? null,
    representativeAskSellerCount: representativeAsk?.sellerCount ?? 0,
    representativeAskOrigin: representativeAsk?.origin ?? "unknown",
    representativeAskObservedAt: representativeAsk?.observedAt ?? null,
    startingEffectiveCostEUR: startingEffectiveCostEUR != null && startingEffectiveCostEUR > 0 ? startingEffectiveCostEUR : null,
    startingCostBasis:
      observedOffer?.costBasis === "delivered" || observedOffer?.costBasis === "item_only"
        ? observedOffer.costBasis
        : null,
    observedPriceAt: observedOffer
      ? (observedOffer.lastCheckedAt instanceof Date ? observedOffer.lastCheckedAt.toISOString() : String(observedOffer.lastCheckedAt))
      : null,
    observedPriceChannel:
      observedOffer?.channel === "retail" || observedOffer?.channel === "marketplace"
        ? observedOffer.channel
        : null,
    observedShippingEUR: numberOrNull(observedOffer?.shippingEUR),
    currentAskOrigin: classifyOfferOrigin(observedOffer?.originCountry, observedOffer?.sourceMarketRegion),
    historicalAskOrigin: classifyOfferOrigin(historicalOffer?.originCountry, historicalOffer?.sourceMarketRegion),
    historicalAskItemEUR: histItem != null && histItem > 0 ? histItem : null,
    historicalAskShippingEUR: histShipping != null && histShipping >= 0 ? histShipping : null,
    historicalAskObservedAt: historicalOffer
      ? (historicalOffer.lastCheckedAt instanceof Date
        ? historicalOffer.lastCheckedAt.toISOString() : String(historicalOffer.lastCheckedAt))
      : null,
    historicalAskItemPlusShippingEUR: verifiedHistSubtotal,
    retailSourceCount,
    activeOfferCount,
    currentOfferCount,
    soldUnits: signal.soldUnits,
    soldSellerCount: signal.soldSellerCount ?? null,
    marketContextEvidenceCount,
    recentSoldUnits3m: recentSoldActivity?.units ?? null,
    recentSoldPeriodStart: recentSoldActivity?.periodStart ?? null,
    recentSoldPeriodEnd: recentSoldActivity?.periodEnd ?? null,
    trendPercent: numberOrNull(signal.trendPercent),
    trendWindowMonths:
      signal.trendWindowMonths === 1 ||
      signal.trendWindowMonths === 3 ||
      signal.trendWindowMonths === 6 ||
      signal.trendWindowMonths === 12
        ? signal.trendWindowMonths
        : null,
    trendBasis:
      signal.trendBasis === "sold" || signal.trendBasis === "market_value"
        ? signal.trendBasis
        : null,
    trendUpdatedAt: signal.trendUpdatedAt instanceof Date
      ? signal.trendUpdatedAt.toISOString()
      : signal.trendUpdatedAt
        ? String(signal.trendUpdatedAt)
        : null,
    soldTrendComparison,
    askTrendPercent: numberOrNull(signal.askTrendPercent),
    askTrendWindowDays:
      signal.askTrendWindowDays != null &&
      signal.askTrendWindowDays >= 3 &&
      signal.askTrendWindowDays <= 30
        ? signal.askTrendWindowDays
        : null,
    computedAt: signal.computedAt instanceof Date ? signal.computedAt.toISOString() : String(signal.computedAt),
  }
}

export async function getPublicMarketSignalForRelease(
  releaseId: string,
): Promise<ReleaseMarketSignalView | null> {
  const [row, monthlyRows, observedOffers, contextRows, trendAuditRows] = await Promise.all([
    getMarketSignalForRelease(releaseId),
    getMarketMonthlySignalsForRelease(releaseId, undefined, 6),
    listCurrentObservedOffers([releaseId]),
    listSafeMarketContextEvidence([releaseId]),
    listCollectorTrendAuditRows([releaseId]),
  ])
  return toPublicMarketSignalView(
    row,
    deriveRecentSoldActivity(monthlyRows),
    observedOffers,
    contextRows[0]?.evidenceCount ?? 0,
    publishedSoldTrendComparison(row, trendAuditRows),
  )
}

export async function getPublicMarketSignalMap(
  releaseIds?: string[],
): Promise<ReleaseMarketSignalMap> {
  // Public market surfaces must share one current canonical snapshot. Do not
  // cache the full map independently from exact Release views: after a market
  // recompute, Catalog, Collection, Dashboard, Scanner and Release detail must
  // all resolve the same market_release_signals state.
  const [rows, monthlyRows, observedOffers, contextRows, trendAuditRows] = await Promise.all([
    listMarketSignals(releaseIds),
    listMarketMonthlySignals(releaseIds),
    listCurrentObservedOffers(releaseIds),
    listSafeMarketContextEvidence(releaseIds),
    listCollectorTrendAuditRows(releaseIds),
  ])

  const monthlyByRelease = new Map<string, MarketReleaseMonthlySignal[]>()
  for (const row of monthlyRows) {
    const bucket = monthlyByRelease.get(row.releaseId) ?? []
    bucket.push(row)
    monthlyByRelease.set(row.releaseId, bucket)
  }

  const observedByRelease = new Map<string, CurrentObservedOfferRow[]>()
  for (const offer of observedOffers) {
    const bucket = observedByRelease.get(offer.releaseId) ?? []
    bucket.push(offer)
    observedByRelease.set(offer.releaseId, bucket)
  }

  const contextByRelease = new Map(contextRows.map((row) => [row.releaseId, row.evidenceCount]))
  const trendsByRelease = new Map<string, StoredTrendAuditRow[]>()
  for (const row of trendAuditRows) {
    const bucket = trendsByRelease.get(row.release_id) ?? []
    bucket.push(row)
    trendsByRelease.set(row.release_id, bucket)
  }
  const result: ReleaseMarketSignalMap = {}

  for (const row of rows) {
    const recentSoldActivity = deriveRecentSoldActivity(monthlyByRelease.get(row.releaseId) ?? [])
    const releaseObservedOffers = observedByRelease.get(row.releaseId) ?? []
    const view = toPublicMarketSignalView(
      row,
      recentSoldActivity,
      releaseObservedOffers,
      contextByRelease.get(row.releaseId) ?? 0,
      publishedSoldTrendComparison(row, trendsByRelease.get(row.releaseId) ?? []),
    )
    if (view) result[row.releaseId] = view
  }

  return result
}
