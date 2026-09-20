import "server-only"

import { unstable_cache } from "next/cache"
import {
  getMarketMonthlySignalsForRelease,
  getMarketSignalForRelease,
  listCurrentObservedOfferStates,
  listMarketMonthlySignals,
  listMarketSignals,
  type MarketOfferState,
  type MarketReleaseMonthlySignal,
  type MarketReleaseSignal,
} from "@/lib/db/queries/market"
import {
  MARKETPLACE_OFFER_MAX_AGE_HOURS,
  RETAIL_OFFER_MAX_AGE_HOURS,
} from "@/lib/market/pipeline/market-publication-policy"
import type {
  ReleaseMarketConfidence,
  ReleaseMarketRegime,
  ReleaseMarketSignalMap,
  ReleaseMarketSignalView,
} from "@/lib/market/view-types"

const DAY_MS = 86_400_000
const HOUR_MS = 3_600_000

async function loadPublicMarketBundle(releaseIds?: string[]) {
  const rows = await listMarketSignals(releaseIds)
  const ids = rows.map((row) => row.releaseId)

  const [monthlyRows, offerRows] = await Promise.all([
    listMarketMonthlySignals(ids),
    listCurrentObservedOfferStates(ids),
  ])

  return { rows, monthlyRows, offerRows }
}

const listCachedPublicMarketBundle = unstable_cache(
  async () => loadPublicMarketBundle(),
  ["trackdash-public-market-signals-v5-observed-price"],
  { revalidate: 60 },
)

interface RecentSoldActivity {
  units: number
  periodStart: string
  periodEnd: string
}

interface CurrentObservedActivity {
  priceEUR: number | null
  shippingEUR: number | null
  observedAt: string | null
  channel: "retail" | "marketplace" | null
  currentOfferCount: number
  activeOfferCount: number
  retailSourceCount: number
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

function iso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : String(value)
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

  return {
    units,
    periodStart: `${keys[0]}-01`,
    periodEnd: `${keys[2]}-01`,
  }
}

function deriveCurrentObservedActivity(
  rows: MarketOfferState[],
  asOf = new Date(),
): CurrentObservedActivity {
  const fresh = rows
    .filter((row) => {
      const checkedAt = Date.parse(iso(row.lastCheckedAt))
      if (!Number.isFinite(checkedAt)) return false
      const maxAgeHours = row.channel === "marketplace"
        ? MARKETPLACE_OFFER_MAX_AGE_HOURS
        : RETAIL_OFFER_MAX_AGE_HOURS
      return Math.max(0, asOf.getTime() - checkedAt) <= maxAgeHours * HOUR_MS
    })
    .filter((row) => {
      const price = numberOrNull(row.itemPriceEUR)
      return price != null && price > 0
    })

  const latest = [...fresh].sort((a, b) => {
    const byTime = Date.parse(iso(b.lastCheckedAt)) - Date.parse(iso(a.lastCheckedAt))
    if (byTime !== 0) return byTime
    return Number(a.itemPriceEUR) - Number(b.itemPriceEUR)
  })[0]

  return {
    priceEUR: latest ? numberOrNull(latest.itemPriceEUR) : null,
    shippingEUR: latest ? numberOrNull(latest.shippingEUR) : null,
    observedAt: latest ? iso(latest.lastCheckedAt) : null,
    channel: latest?.channel === "retail" || latest?.channel === "marketplace" ? latest.channel : null,
    currentOfferCount: fresh.length,
    activeOfferCount: fresh.filter((row) => row.channel === "marketplace").length,
    retailSourceCount: new Set(
      fresh.filter((row) => row.channel === "retail").map((row) => row.sourceId),
    ).size,
  }
}

export function toPublicMarketSignalView(
  signal: MarketReleaseSignal | null | undefined,
  recentSoldActivity: RecentSoldActivity | null = null,
  observedActivity: CurrentObservedActivity = {
    priceEUR: null,
    shippingEUR: null,
    observedAt: null,
    channel: null,
    currentOfferCount: 0,
    activeOfferCount: 0,
    retailSourceCount: 0,
  },
): ReleaseMarketSignalView | null {
  if (!signal) return null

  const storedValueEUR = numberOrNull(signal.marketValueEUR)
  const soldAnchorEUR = numberOrNull(signal.soldAnchorEUR)
  const hasSoldBasis = (soldAnchorEUR != null && soldAnchorEUR > 0) || signal.soldUnits > 0

  // A retail-only Market Value must not outlive the current retail evidence that
  // justified it. This is a read-time safety net for delayed recompute queues.
  const valueEUR =
    !hasSoldBasis && storedValueEUR != null && observedActivity.retailSourceCount < 2
      ? null
      : storedValueEUR

  const retailAnchorEUR =
    observedActivity.retailSourceCount > 0 ? numberOrNull(signal.retailAnchorEUR) : null
  const activeAnchorEUR =
    observedActivity.activeOfferCount > 0 ? numberOrNull(signal.activeAnchorEUR) : null

  const hasMarketEvidence =
    (valueEUR != null && valueEUR > 0) ||
    (retailAnchorEUR != null && retailAnchorEUR > 0) ||
    (activeAnchorEUR != null && activeAnchorEUR > 0) ||
    (soldAnchorEUR != null && soldAnchorEUR > 0) ||
    observedActivity.currentOfferCount > 0 ||
    signal.soldUnits > 0

  if (!hasMarketEvidence) return null

  return {
    marketRegime: signal.marketRegime as ReleaseMarketRegime,
    valueEUR: valueEUR != null && valueEUR > 0 ? valueEUR : null,
    lowEUR: valueEUR != null ? numberOrNull(signal.lowEUR) : null,
    highEUR: valueEUR != null ? numberOrNull(signal.highEUR) : null,
    confidenceScore: signal.confidenceScore,
    confidenceLabel: signal.confidenceLabel as ReleaseMarketConfidence,
    retailAnchorEUR,
    activeAnchorEUR,
    activeLowEUR: observedActivity.activeOfferCount > 0 ? numberOrNull(signal.activeLowEUR) : null,
    activeHighEUR: observedActivity.activeOfferCount > 0 ? numberOrNull(signal.activeHighEUR) : null,
    soldAnchorEUR,
    startingItemPriceEUR: observedActivity.priceEUR,
    observedPriceEUR: observedActivity.priceEUR,
    observedShippingEUR: observedActivity.shippingEUR,
    observedAt: observedActivity.observedAt,
    observedChannel: observedActivity.channel,
    retailSourceCount: observedActivity.retailSourceCount,
    activeOfferCount: observedActivity.activeOfferCount,
    currentOfferCount: observedActivity.currentOfferCount,
    soldUnits: signal.soldUnits,
    soldSellerCount: signal.soldSellerCount ?? null,
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
    askTrendPercent: observedActivity.activeOfferCount > 0 ? numberOrNull(signal.askTrendPercent) : null,
    askTrendWindowDays:
      observedActivity.activeOfferCount > 0 &&
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
  const [row, monthlyRows, offerRows] = await Promise.all([
    getMarketSignalForRelease(releaseId),
    getMarketMonthlySignalsForRelease(releaseId, undefined, 6),
    listCurrentObservedOfferStates([releaseId]),
  ])
  return toPublicMarketSignalView(
    row,
    deriveRecentSoldActivity(monthlyRows),
    deriveCurrentObservedActivity(offerRows),
  )
}

export async function getPublicMarketSignalMap(
  releaseIds?: string[],
): Promise<ReleaseMarketSignalMap> {
  const { rows, monthlyRows, offerRows } = releaseIds?.length
    ? await loadPublicMarketBundle(releaseIds)
    : await listCachedPublicMarketBundle()

  const monthlyByRelease = new Map<string, MarketReleaseMonthlySignal[]>()
  for (const row of monthlyRows) {
    const bucket = monthlyByRelease.get(row.releaseId) ?? []
    bucket.push(row)
    monthlyByRelease.set(row.releaseId, bucket)
  }

  const offersByRelease = new Map<string, MarketOfferState[]>()
  for (const row of offerRows) {
    const bucket = offersByRelease.get(row.releaseId) ?? []
    bucket.push(row)
    offersByRelease.set(row.releaseId, bucket)
  }

  const result: ReleaseMarketSignalMap = {}

  for (const row of rows) {
    const recentSoldActivity = deriveRecentSoldActivity(monthlyByRelease.get(row.releaseId) ?? [])
    const observedActivity = deriveCurrentObservedActivity(offersByRelease.get(row.releaseId) ?? [])
    const view = toPublicMarketSignalView(row, recentSoldActivity, observedActivity)
    if (view) result[row.releaseId] = view
  }

  return result
}
