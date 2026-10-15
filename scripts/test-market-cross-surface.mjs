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

assert.match(provider, /getPublicMarketSignalsAction\(\)/)
assert.match(provider, /setInterval\(\(\) => void refresh\(\), 60_000\)/)
assert.match(provider, /addEventListener\("focus", onFocus\)/)
assert.match(provider, /addEventListener\("visibilitychange", onVisibilityChange\)/)
assert.match(provider, /requestId === latestRequest\.current\) setSignals\(next\)/)
assert.match(publicMarket, /getPublicMarketSignalMap\(/)
assert.match(publicMarket, /toPublicMarketSignalView\(/)

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
const portfolio = (snapshot) => Object.values(snapshot).reduce((total, signal) => {
  return total + (sealedCollectionReference(signal)?.valueEUR ?? 0)
}, 0)
const initial = {
  dyna: s({ valueEUR: 14.92, soldAnchorEUR: 14.92, soldUnits: 5 }),
  proto: s({ valueEUR: 12.72, soldAnchorEUR: 12.72, soldUnits: 7 }),
  manta: s({ soldAnchorEUR: 16.13, soldUnits: 1, historicalAskItemEUR: 13.39 }),
  avante: s({ startingItemPriceEUR: 16.05, startingEffectiveCostEUR: 27.36, startingCostBasis: "delivered", observedShippingEUR: 11.31 }),
}
assert.equal(Math.round(portfolio(initial) * 100), 5982)
const refreshed = {
  ...initial,
  dyna: { ...initial.dyna, valueEUR: 22.42, soldAnchorEUR: 22.42 },
  manta: { ...initial.manta, soldAnchorEUR: 19.13 },
}
assert.equal(Math.round(portfolio(refreshed) * 100), 7032, "New MV and SOLD change the indicative collection total")
const expiredAsk = { ...refreshed, avante: s({ historicalAskItemEUR: 16.05 }) }
assert.equal(Math.round(portfolio(expiredAsk) * 100), 5427, "Expired ASK cannot keep an owned-kit valuation")
assert.equal(sealedCollectionReference(s({ startingItemPriceEUR: 13.39, currentAskOrigin: "extra_eu" })), null)
assert.equal(sealedCollectionReference(s({ soldAnchorEUR: 16.13, soldUnits: 0 })), null)

console.log("Cross-surface market contract passed: shared polling, mobile refresh, live total/ranking, MV/SOLD/ASK updates and TTL expiry")
