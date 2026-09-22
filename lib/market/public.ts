import "server-only"

import { unstable_cache } from "next/cache"
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
} from "@/lib/market/pipeline/market-publication-policy"
import { createAdminClient } from "@/lib/supabase/admin"
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


const listCachedPublicMarketBundle = unstable_cache(
  async () => Promise.all([
    listMarketSignals(),
    listMarketMonthlySignals(),
    listCurrentObservedOffers(),
    listSafeMarketContextEvidence(),
  ]),
  ["trackdash-public-market-signals-v7"],
  { revalidate: 60 },
)

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

function latestFreshObservedOffer(
  rows: CurrentObservedOfferRow[],
  asOf = new Date(),
): CurrentObservedOfferRow | null {
  return freshObservedOffers(rows, asOf).sort((a, b) => {
    const aTime = a.lastCheckedAt instanceof Date ? a.lastCheckedAt.getTime() : Date.parse(String(a.lastCheckedAt))
    const bTime = b.lastCheckedAt instanceof Date ? b.lastCheckedAt.getTime() : Date.parse(String(b.lastCheckedAt))
    if (aTime !== bTime) return bTime - aTime
    return Number(a.itemPriceEUR) - Number(b.itemPriceEUR)
  })[0] ?? null
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
): ReleaseMarketSignalView | null {
  if (!signal) return null

  const valueEUR = numberOrNull(signal.marketValueEUR)
  const retailAnchorEUR = numberOrNull(signal.retailAnchorEUR)
  const activeAnchorEUR = numberOrNull(signal.activeAnchorEUR)
  const soldAnchorEUR = numberOrNull(signal.soldAnchorEUR)
  const freshOffers = freshObservedOffers(observedOffers)
  const observedOffer = latestFreshObservedOffer(freshOffers)
  const observedPriceEUR = numberOrNull(observedOffer?.itemPriceEUR)
  const currentOfferCount = freshOffers.length
  const activeOfferCount = freshOffers.filter((offer) => offer.channel === "marketplace").length
  const retailSourceCount = new Set(
    freshOffers.filter((offer) => offer.channel === "retail").map((offer) => offer.sourceId),
  ).size
  const hasMarketEvidence =
    (valueEUR != null && valueEUR > 0) ||
    (retailAnchorEUR != null && retailAnchorEUR > 0) ||
    (activeAnchorEUR != null && activeAnchorEUR > 0) ||
    (soldAnchorEUR != null && soldAnchorEUR > 0) ||
    signal.currentOfferCount > 0 ||
    signal.soldUnits > 0 ||
    marketContextEvidenceCount > 0

  if (!hasMarketEvidence) return null

  return {
    marketRegime: signal.marketRegime as ReleaseMarketRegime,
    valueEUR: valueEUR != null && valueEUR > 0 ? valueEUR : null,
    lowEUR: numberOrNull(signal.lowEUR),
    highEUR: numberOrNull(signal.highEUR),
    confidenceScore: signal.confidenceScore,
    confidenceLabel: signal.confidenceLabel as ReleaseMarketConfidence,
    retailAnchorEUR,
    activeAnchorEUR,
    activeLowEUR: numberOrNull(signal.activeLowEUR),
    activeHighEUR: numberOrNull(signal.activeHighEUR),
    soldAnchorEUR,
    startingItemPriceEUR: observedPriceEUR != null && observedPriceEUR > 0 ? observedPriceEUR : null,
    observedPriceAt: observedOffer
      ? (observedOffer.lastCheckedAt instanceof Date ? observedOffer.lastCheckedAt.toISOString() : String(observedOffer.lastCheckedAt))
      : null,
    observedPriceChannel:
      observedOffer?.channel === "retail" || observedOffer?.channel === "marketplace"
        ? observedOffer.channel
        : null,
    observedShippingEUR: numberOrNull(observedOffer?.shippingEUR),
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
  const [row, monthlyRows, observedOffers, contextRows] = await Promise.all([
    getMarketSignalForRelease(releaseId),
    getMarketMonthlySignalsForRelease(releaseId, undefined, 6),
    listCurrentObservedOffers([releaseId]),
    listSafeMarketContextEvidence([releaseId]),
  ])
  return toPublicMarketSignalView(
    row,
    deriveRecentSoldActivity(monthlyRows),
    observedOffers,
    contextRows[0]?.evidenceCount ?? 0,
  )
}

export async function getPublicMarketSignalMap(
  releaseIds?: string[],
): Promise<ReleaseMarketSignalMap> {
  // The full public map is identical for every visitor and is requested by
  // the root layout on first load. Keep that bootstrap hot for one minute
  // instead of paying database round trips on every fresh dashboard load.
  // Targeted release lookups remain uncached so exact-detail requests stay
  // immediately current.
  const [rows, monthlyRows, observedOffers, contextRows] = releaseIds?.length
    ? await Promise.all([
        listMarketSignals(releaseIds),
        listMarketMonthlySignals(releaseIds),
        listCurrentObservedOffers(releaseIds),
        listSafeMarketContextEvidence(releaseIds),
      ])
    : await listCachedPublicMarketBundle()

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
  const result: ReleaseMarketSignalMap = {}

  for (const row of rows) {
    const recentSoldActivity = deriveRecentSoldActivity(monthlyByRelease.get(row.releaseId) ?? [])
    const releaseObservedOffers = observedByRelease.get(row.releaseId) ?? []
    const view = toPublicMarketSignalView(
      row,
      recentSoldActivity,
      releaseObservedOffers,
      contextByRelease.get(row.releaseId) ?? 0,
    )
    if (view) result[row.releaseId] = view
  }

  return result
}
