import "server-only"

import { unstable_cache } from "next/cache"
import {
  getMarketMonthlySignalsForRelease,
  getMarketSignalForRelease,
  listMarketMonthlySignals,
  listMarketSignals,
  type MarketReleaseMonthlySignal,
  type MarketReleaseSignal,
} from "@/lib/db/queries/market"
import type {
  ReleaseMarketConfidence,
  ReleaseMarketRegime,
  ReleaseMarketSignalMap,
  ReleaseMarketSignalView,
} from "@/lib/market/view-types"

const DAY_MS = 86_400_000

const listCachedPublicMarketBundle = unstable_cache(
  async () => Promise.all([listMarketSignals(), listMarketMonthlySignals()]),
  ["trackdash-public-market-signals-v4"],
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
): ReleaseMarketSignalView | null {
  if (!signal) return null

  const valueEUR = numberOrNull(signal.marketValueEUR)
  const retailAnchorEUR = numberOrNull(signal.retailAnchorEUR)
  const activeAnchorEUR = numberOrNull(signal.activeAnchorEUR)
  const soldAnchorEUR = numberOrNull(signal.soldAnchorEUR)
  const hasMarketEvidence =
    (valueEUR != null && valueEUR > 0) ||
    (retailAnchorEUR != null && retailAnchorEUR > 0) ||
    (activeAnchorEUR != null && activeAnchorEUR > 0) ||
    (soldAnchorEUR != null && soldAnchorEUR > 0) ||
    signal.currentOfferCount > 0 ||
    signal.soldUnits > 0

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
    startingItemPriceEUR: numberOrNull(signal.startingItemPriceEUR),
    retailSourceCount: signal.retailSourceCount,
    activeOfferCount: signal.activeOfferCount,
    currentOfferCount: signal.currentOfferCount,
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
  const [row, monthlyRows] = await Promise.all([
    getMarketSignalForRelease(releaseId),
    getMarketMonthlySignalsForRelease(releaseId, undefined, 6),
  ])
  return toPublicMarketSignalView(row, deriveRecentSoldActivity(monthlyRows))
}

export async function getPublicMarketSignalMap(
  releaseIds?: string[],
): Promise<ReleaseMarketSignalMap> {
  // The full public map is identical for every visitor and is requested by
  // the root layout on first load. Keep that bootstrap hot for one minute
  // instead of paying database round trips on every fresh dashboard load.
  // Targeted release lookups remain uncached so exact-detail requests stay
  // immediately current.
  const [rows, monthlyRows] = releaseIds?.length
    ? await Promise.all([listMarketSignals(releaseIds), listMarketMonthlySignals(releaseIds)])
    : await listCachedPublicMarketBundle()

  const monthlyByRelease = new Map<string, MarketReleaseMonthlySignal[]>()
  for (const row of monthlyRows) {
    const bucket = monthlyByRelease.get(row.releaseId) ?? []
    bucket.push(row)
    monthlyByRelease.set(row.releaseId, bucket)
  }

  const result: ReleaseMarketSignalMap = {}

  for (const row of rows) {
    const recentSoldActivity = deriveRecentSoldActivity(monthlyByRelease.get(row.releaseId) ?? [])
    const view = toPublicMarketSignalView(row, recentSoldActivity)
    if (view) result[row.releaseId] = view
  }

  return result
}
