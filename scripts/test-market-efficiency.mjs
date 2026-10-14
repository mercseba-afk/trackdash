import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import {
  PUBLIC_MARKET_ACTIVE_POLL_MS,
  PUBLIC_MARKET_MIN_REFRESH_GAP_MS,
  shouldRefreshPublicMarket,
  samePublicMarketSignals,
} from "../lib/market/refresh-policy.ts"

// No background polling, no duplicate focus+resume call, periodic visible
// refresh after 2 minutes. The first SSR map already provides initial data.
assert.equal(PUBLIC_MARKET_ACTIVE_POLL_MS, 120_000)
assert.equal(PUBLIC_MARKET_MIN_REFRESH_GAP_MS, 60_000)
assert.equal(shouldRefreshPublicMarket(0, 60_000, false), true)
assert.equal(shouldRefreshPublicMarket(0, 59_999, false), false)
assert.equal(shouldRefreshPublicMarket(0, 120_000, true), false)
assert.equal(shouldRefreshPublicMarket(120_000, 120_001, false), false)
assert.equal(shouldRefreshPublicMarket(120_000, 180_000, false), true)
assert.equal(shouldRefreshPublicMarket(120_000, Number.NaN, false), false)

const mv = { valueEUR: 14.92, soldAnchorEUR: 14.92, soldUnits: 5, startingItemPriceEUR: null, trendPercent: 19.86, computedAt: "2026-10-11" }
const sold = { valueEUR: null, soldAnchorEUR: 16.13, soldUnits: 1, startingItemPriceEUR: 13.39, trendPercent: null, computedAt: "2026-10-11" }
const original = { dyna: mv, manta: sold }
assert.equal(samePublicMarketSignals(original, original), true)
assert.equal(samePublicMarketSignals(original, { dyna: { ...mv }, manta: { ...sold } }), true)
assert.equal(samePublicMarketSignals(original, { dyna: { ...mv, valueEUR: 15.20 }, manta: sold }), false, "MV change propagates")
assert.equal(samePublicMarketSignals(original, { dyna: mv, manta: { ...sold, soldAnchorEUR: 20.00 } }), false, "SOLD change propagates")
assert.equal(samePublicMarketSignals(original, { dyna: mv, manta: { ...sold, startingItemPriceEUR: null } }), false, "ASK disappearance/TTL propagates")
assert.equal(samePublicMarketSignals(original, { dyna: { ...mv, trendPercent: 24.11 }, manta: sold }), false, "Trend change propagates")
assert.equal(samePublicMarketSignals(original, { dyna: mv }), false, "Release removal propagates")
assert.equal(samePublicMarketSignals(original, { ...original, newRelease: mv }), false, "New Release propagates")

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8")
const cache = read("lib/market/public-cached.ts")
const root = read("app/layout.tsx")
const action = read("lib/actions/market.ts")
const provider = read("lib/market/context.tsx")
assert.match(cache, /unstable_cache\(/)
assert.match(cache, /getPublicMarketSignalMap\(\)/)
assert.match(cache, /PUBLIC_MARKET_MAP_REVALIDATE_SECONDS = 60/)
assert.match(root, /getCachedPublicMarketSignalMap\(\)/)
assert.match(action, /getCachedPublicMarketSignalMap\(\)/)
assert.match(provider, /shouldRefreshPublicMarket\(lastAttemptAt.current, now, document.hidden\)/)
assert.match(provider, /samePublicMarketSignals\(current, next\)/)
assert.match(provider, /requestId === latestRequest.current/)
assert.match(provider, /document.addEventListener\("visibilitychange", requestRefresh\)/)
assert.doesNotMatch(provider, /setInterval\(\(\) => void refresh\(\), 60_000\)/)
assert.doesNotMatch(root, /await getPublicMarketSignalMap\(\)/)
assert.doesNotMatch(action, /return getPublicMarketSignalMap\(\)/)

console.log("Market CPU guard: shared 60s cache, visible-only 2m polling, MV/SOLD/ASK/trend parity, resume, and stale-response guards passed")
