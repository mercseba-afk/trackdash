import "server-only"

import { unstable_cache } from "next/cache"
import { getPublicMarketSignalMap } from "./public"
import { expirePublicMarketSignals } from "./snapshot-expiry"
import type { ReleaseMarketSignalMap } from "./view-types"

// Public, identical for every visitor: only canonical Release-level evidence
// and safe aggregates leave the server. Never include user collections or
// private candidate payloads in this cross-request cache.
//
// Share five read-only datasets across pageviews/polls, with a 60s SWR target.
// Per-offer deadlines below remain authoritative even when revalidation fails.
// Never cache client-specific information.
export const PUBLIC_MARKET_MAP_REVALIDATE_SECONDS = 60

const readCachedPublicMarketSignalMap = unstable_cache(
  async () => getPublicMarketSignalMap(),
  ["trackdash-public-market-signal-map-v2-expiry"],
  { revalidate: PUBLIC_MARKET_MAP_REVALIDATE_SECONDS },
)

// Next revalidate:60 is stale-while-revalidate, not a maximum snapshot age.
// On an offer expiry, request the SAME canonical projection synchronously so
// surviving offers retain their exact median/counts. Deduplicate overlapping
// expiry reads in this process. Retain one recovery result (or failure) for at
// most the existing 60s cache interval, keyed by the stale public snapshot.
// Otherwise sequential requests bypass the shared cache during an outage.
let expiryRefresh: Promise<ReleaseMarketSignalMap> | null = null
let recovery: { key: string; at: number; signals: ReleaseMarketSignalMap | null } | null = null

export async function getCachedPublicMarketSignalMap(): Promise<ReleaseMarketSignalMap> {
  const cached = await readCachedPublicMarketSignalMap()
  const safe = expirePublicMarketSignals(cached)
  if (safe === cached) return cached
  // Historical-only expiry is pure removal; it needs no canonical DB reread.
  const now = Date.now()
  const expiredOffer = Object.values(cached).some((signal) => signal.offersValidUntil != null &&
    (!Number.isFinite(Date.parse(signal.offersValidUntil)) || now > Date.parse(signal.offersValidUntil)))
  if (!expiredOffer) return safe
  const key = JSON.stringify(cached)
  if (recovery?.key === key && now >= recovery.at &&
    now - recovery.at < PUBLIC_MARKET_MAP_REVALIDATE_SECONDS * 1000) {
    // Apply deadlines again: a retained recovery must never extend ASK TTL.
    return recovery.signals ? expirePublicMarketSignals(recovery.signals) : safe
  }
  try {
    expiryRefresh ??= getPublicMarketSignalMap().finally(() => { expiryRefresh = null })
    const signals = await expiryRefresh
    recovery = { key, at: Date.now(), signals }
    return expirePublicMarketSignals(signals)
  } catch {
    recovery = { key, at: Date.now(), signals: null }
    // Preserve known MV/SOLD/history during an outage; never extend ASK TTL.
    return safe
  }
}
