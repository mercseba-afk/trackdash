import "server-only"

import { unstable_cache } from "next/cache"
import { getPublicMarketSignalMap } from "./public"

// Public, identical for every visitor: only canonical Release-level evidence
// and safe aggregates leave the server. Never include user collections or
// private candidate payloads in this cross-request cache.
//
// A short bounded cache avoids rebuilding five large read-only datasets for
// every pageview or tab poll. ASK eligibility is calculated when the cache is
// generated, so keep the revalidation window short relative to publication TTL
// (15d marketplace / 31d retail) and never cache client-specific information.
export const PUBLIC_MARKET_MAP_REVALIDATE_SECONDS = 60

export const getCachedPublicMarketSignalMap = unstable_cache(
  async () => getPublicMarketSignalMap(),
  ["trackdash-public-market-signal-map-v1"],
  { revalidate: PUBLIC_MARKET_MAP_REVALIDATE_SECONDS },
)
