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
// expiry reads in this process. This promise is not a second snapshot cache.
let expiryRefresh: Promise<ReleaseMarketSignalMap> | null = null

export async function getCachedPublicMarketSignalMap(): Promise<ReleaseMarketSignalMap> {
  const cached = await readCachedPublicMarketSignalMap()
  const safe = expirePublicMarketSignals(cached)
  if (safe === cached) return cached
  try {
    expiryRefresh ??= getPublicMarketSignalMap().finally(() => { expiryRefresh = null })
    return expirePublicMarketSignals(await expiryRefresh)
  } catch {
    // Preserve known MV/SOLD/history during an outage; never extend ASK TTL.
    return safe
  }
}
