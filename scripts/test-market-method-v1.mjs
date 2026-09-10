import assert from "node:assert/strict"
import {
  applyPublicMarketPublicationPolicy,
  filterFreshCurrentOffers,
} from "../lib/market/pipeline/market-publication-policy.ts"
import { nextScanSchedule } from "../lib/market/pipeline/scheduler.ts"

let passed = 0
function ok(name, fn) {
  fn()
  passed += 1
  console.log(`ok: ${name}`)
}

function signal(overrides = {}) {
  return {
    marketRegime: "secondary_market_driven",
    marketValueEUR: 40,
    lowEUR: 40,
    highEUR: 40,
    confidenceScore: 15,
    confidenceLabel: "low",
    retailAnchorEUR: null,
    activeAnchorEUR: 40,
    soldAnchorEUR: null,
    startingOffer: null,
    retailSourceCount: 0,
    activeOfferCount: 1,
    currentOfferCount: 1,
    soldUnits: 0,
    soldSourceCount: 0,
    soldEvidenceCount: 0,
    shippingKnownRatio: 1,
    trendPercent: null,
    trendWindowMonths: null,
    monthlyTrend: [],
    algorithmVersion: "r3",
    ...overrides,
  }
}

ok("one secondary asking price is evidence but not a public Market Value", () => {
  const result = applyPublicMarketPublicationPolicy(signal())
  assert.equal(result.marketRegime, "insufficient")
  assert.equal(result.marketValueEUR, null)
  assert.equal(result.lowEUR, null)
  assert.equal(result.highEUR, null)
  assert.equal(result.activeAnchorEUR, 40)
})

ok("multiple secondary asks remain asking evidence, not demonstrated Market Value", () => {
  const result = applyPublicMarketPublicationPolicy(signal({
    marketValueEUR: 41,
    lowEUR: 40,
    highEUR: 42,
    activeAnchorEUR: 41,
    activeOfferCount: 2,
    currentOfferCount: 2,
  }))
  assert.equal(result.marketRegime, "insufficient")
  assert.equal(result.marketValueEUR, null)
  assert.equal(result.activeAnchorEUR, 41)
})

ok("secondary Market Value equals completed-sale anchor while active asks stay separate", () => {
  const result = applyPublicMarketPublicationPolicy(signal({
    marketValueEUR: 48,
    lowEUR: 38,
    highEUR: 60,
    activeAnchorEUR: 60,
    soldAnchorEUR: 38,
    soldUnits: 8,
    soldSourceCount: 1,
    soldEvidenceCount: 1,
    activeOfferCount: 2,
  }))
  assert.equal(result.marketRegime, "secondary_market_driven")
  assert.equal(result.marketValueEUR, 38)
  assert.equal(result.lowEUR, 38)
  assert.equal(result.highEUR, 38)
  assert.equal(result.activeAnchorEUR, 60)
})

ok("one genuine retail source may publish a low-confidence observable retail signal", () => {
  const result = applyPublicMarketPublicationPolicy(signal({
    marketRegime: "retail_driven",
    retailAnchorEUR: 18,
    activeAnchorEUR: null,
    marketValueEUR: 18,
    lowEUR: 18,
    highEUR: 18,
    retailSourceCount: 1,
    activeOfferCount: 0,
  }))
  assert.equal(result.marketRegime, "retail_driven")
  assert.equal(result.marketValueEUR, 18)
})

ok("marketplace and retail offer freshness is bounded", () => {
  const now = new Date("2026-09-10T12:00:00Z")
  const offers = [
    { stableId: "m-fresh", sourceId: "ebay", channel: "marketplace", availability: "in_stock", itemPriceEUR: 20, observedAt: "2026-09-07T12:00:00Z" },
    { stableId: "m-stale", sourceId: "ebay", channel: "marketplace", availability: "in_stock", itemPriceEUR: 21, observedAt: "2026-09-05T12:00:00Z" },
    { stableId: "r-fresh", sourceId: "shop", channel: "retail", availability: "in_stock", itemPriceEUR: 18, observedAt: "2026-09-03T12:00:00Z" },
    { stableId: "r-stale", sourceId: "shop2", channel: "retail", availability: "in_stock", itemPriceEUR: 19, observedAt: "2026-09-01T12:00:00Z" },
  ]
  const fresh = filterFreshCurrentOffers(offers, now).map((offer) => offer.stableId)
  assert.deepEqual(fresh.sort(), ["m-fresh", "r-fresh"])
})

ok("scan cadence stays inside freshness windows", () => {
  const now = "2026-09-10T12:00:00Z"
  assert.equal(nextScanSchedule({ scope: "active_marketplace", activityTier: "hot", now }).intervalHours, 24)
  assert.equal(nextScanSchedule({ scope: "active_marketplace", activityTier: "normal", now }).intervalHours, 72)
  assert.equal(nextScanSchedule({ scope: "active_marketplace", activityTier: "cold", now }).intervalHours, 72)
  assert.equal(nextScanSchedule({ scope: "retail", activityTier: "normal", now }).intervalHours, 168)
  assert.equal(nextScanSchedule({ scope: "retail", activityTier: "cold", now }).intervalHours, 168)
  assert.equal(nextScanSchedule({ scope: "sold_research", activityTier: "normal", now }).intervalHours, 336)
})

console.log(`${passed} passed, 0 failed`)
console.log("MARKET METHOD V1 TEST PASSED")