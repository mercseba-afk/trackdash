import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { sealedCollectionReference } from "../lib/market/collection-valuation.ts"

// Snapshot changes must propagate through one shared client market-signal map.
// No DB writes or fake canonical SOLD/MV are needed for this regression.
const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8")
const provider = read("lib/market/context.tsx")
const analytics = read("lib/analytics.ts")
const dashboard = read("components/screens/dashboard-screen.tsx")
const collection = read("components/screens/collection-screen.tsx")
const market = read("components/screens/market-screen.tsx")
const release = read("components/screens/release-detail-screen.tsx")
const catalog = read("components/screens/product-detail-screen.tsx")
const wishlist = read("components/screens/wishlist-screen.tsx")
const publicMarket = read("lib/market/public.ts")
const cachedPublicMarket = read("lib/market/public-cached.ts")
const rootLayout = read("app/layout.tsx")
const marketAction = read("lib/actions/market.ts")

assert.match(provider, /getPublicMarketSignalsAction\(\)/)
assert.match(provider, /setInterval\(requestRefresh, PUBLIC_MARKET_ACTIVE_POLL_MS\)/)
assert.match(provider, /addEventListener\("focus", requestRefresh\)/)
assert.match(provider, /addEventListener\("visibilitychange", requestRefresh\)/)
assert.match(provider, /requestId === latestRequest\.current/)
assert.match(publicMarket, /getPublicMarketSignalMap\(/)
assert.match(publicMarket, /toPublicMarketSignalView\(/)
assert.match(cachedPublicMarket, /unstable_cache\(/)
assert.match(rootLayout, /getCachedPublicMarketSignalMap\(\)/)
assert.match(marketAction, /getCachedPublicMarketSignalMap\(\)/)
assert.doesNotMatch(rootLayout, /await getPublicMarketSignalMap\(\)/)
assert.doesNotMatch(marketAction, /return getPublicMarketSignalMap\(\)/)

for (const [name, source] of [["Catalog", catalog], ["Market", market], ["Collection", collection], ["Dashboard", dashboard], ["Wishlist", wishlist]]) {
  assert.match(source, /useMarketSignals\(\)/, name + " must consume the shared canonical signal map")
}
assert.match(release, /useReleaseMarketSignal\(release\.id\)/)
assert.match(collection, /enrichCollection\(collection, marketSignals, catalogProducts\)/)
assert.match(collection, /portfolioSummary\(enriched\)/)
assert.match(dashboard, /enrichCollection\(collection, marketSignals, catalogProducts\)/)
assert.match(dashboard, /portfolioSummary\(enriched\)/)
assert.match(dashboard, /summary\.marketReferenceValue/)
assert.match(dashboard, /summary\.marketReferenceCount/)
assert.match(dashboard, /entry\.marketReferenceValue/)
assert.match(analytics, /filter\(\(entry\) => entry\.marketReferenceValue != null\)/)
assert.match(analytics, /sort\(\(a, b\) => \(b\.marketReferenceValue \?\? 0\) - \(a\.marketReferenceValue \?\? 0\)\)/)

const s = (extra = {}) => ({
  valueEUR: null, soldAnchorEUR: null, soldUnits: 0,
  startingItemPriceEUR: null, startingEffectiveCostEUR: null,
  startingCostBasis: null, currentAskOrigin: "unknown", observedShippingEUR: null,
  historicalAskItemEUR: null, ...extra,
})
const clock = Date.parse("2026-10-30T08:00:00Z")
const quote = (value) => s({collectionAskItemEUR:value,collectionAskSellerCount:2,collectionAskObservedAt:new Date(clock).toISOString(),offersValidUntil:"2026-11-01T00:00:00Z"})
const portfolio = (snapshot) => Object.values(snapshot).reduce((total, signal) => total + (sealedCollectionReference(signal, clock)?.valueEUR ?? 0), 0)
const initial = {dyna:quote(25),manta:quote(30),avante:quote(20)}
assert.equal(portfolio(initial),75)
const changedSold = {...initial,dyna:{...initial.dyna,valueEUR:999,soldAnchorEUR:999,soldUnits:50}}
assert.equal(portfolio(changedSold),75,"SOLD/MV updates cannot change an ASK-only total")
const refreshed = {...initial,dyna:quote(28)}
assert.equal(portfolio(refreshed),78,"New external asking medians update the collection")
const expired = {...refreshed,avante:{...refreshed.avante,offersValidUntil:"2026-10-29T00:00:00Z"}}
assert.equal(portfolio(expired),58,"Expired quotes leave a partial total, never a SOLD fallback")
assert.equal(sealedCollectionReference(s({valueEUR:14.92,soldAnchorEUR:16.13,soldUnits:5}),clock),null)
console.log("Cross-surface contract passed: shared refresh, ASK-only totals/ranking, no SOLD fallback and TTL expiry")
