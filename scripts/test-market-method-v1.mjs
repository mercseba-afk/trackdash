import assert from "node:assert/strict"
import {
  applyPublicMarketPublicationPolicy,
  filterFreshCurrentOffers,
  publicRetailConfidence,
  publicSoldConfidence,
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
  assert.equal(result.activeAnchorEUR, 40)
})

ok("multiple secondary asks remain asking evidence, not demonstrated Market Value", () => {
  const result = applyPublicMarketPublicationPolicy(signal({
    activeAnchorEUR: 41,
    activeOfferCount: 2,
    currentOfferCount: 2,
  }))
  assert.equal(result.marketRegime, "insufficient")
  assert.equal(result.marketValueEUR, null)
  assert.equal(result.activeAnchorEUR, 41)
})

ok("secondary Market Value equals completed-sale anchor while active asks stay separate", () => {
  const soldEvidence = [{
    stableId: "ebay-pr",
    sourceId: "ebay-pr",
    averagePriceEUR: 38,
    salesCount: 8,
    periodStart: "2026-06-01",
    periodEnd: "2026-08-31",
    grain: "rolling_window",
    evidenceGrade: "indicative",
  }]
  const result = applyPublicMarketPublicationPolicy(signal({
    activeAnchorEUR: 60,
    soldAnchorEUR: 38,
    soldUnits: 8,
    soldSourceCount: 1,
    soldEvidenceCount: 1,
    activeOfferCount: 2,
  }), soldEvidence, "2026-09-10")
  assert.equal(result.marketValueEUR, 38)
  assert.equal(result.activeAnchorEUR, 60)
})

ok("one verified retailer is visible evidence but not enough to consolidate Market Value", () => {
  const result = applyPublicMarketPublicationPolicy(signal({
    marketRegime: "retail_driven",
    retailAnchorEUR: 18,
    activeAnchorEUR: null,
    marketValueEUR: 18,
    lowEUR: 18,
    highEUR: 18,
    retailSourceCount: 1,
    activeOfferCount: 0,
    currentOfferCount: 1,
  }))
  assert.equal(result.marketRegime, "retail_driven")
  assert.equal(result.marketValueEUR, null)
  assert.equal(result.retailAnchorEUR, 18)
})

ok("two independent fresh retailers publish the retail median as Market Value", () => {
  const result = applyPublicMarketPublicationPolicy(signal({
    marketRegime: "retail_driven",
    retailAnchorEUR: 14.57,
    activeAnchorEUR: 21.99,
    marketValueEUR: 16.09,
    lowEUR: 14.57,
    highEUR: 21.99,
    retailSourceCount: 2,
    activeOfferCount: 1,
    currentOfferCount: 3,
  }), [], "2026-09-10")
  assert.equal(result.marketValueEUR, 14.57)
  assert.equal(result.lowEUR, 14.57)
  assert.equal(result.highEUR, 14.57)
  assert.equal(result.activeAnchorEUR, 21.99)
  assert.equal(result.confidenceLabel, "medium")
})

ok("liquid retail takes the headline while completed sales remain confirmation", () => {
  const soldEvidence = [{
    stableId: "ebay-pr",
    sourceId: "ebay-pr",
    averagePriceEUR: 16.85,
    salesCount: 53,
    periodStart: "2023-09-10",
    periodEnd: "2026-09-09",
    grain: "full_history",
    evidenceGrade: "indicative",
  }]
  const result = applyPublicMarketPublicationPolicy(signal({
    marketRegime: "retail_driven",
    retailAnchorEUR: 14.57,
    activeAnchorEUR: 21.99,
    soldAnchorEUR: 16.85,
    retailSourceCount: 2,
    activeOfferCount: 1,
    currentOfferCount: 3,
    soldUnits: 53,
    soldSourceCount: 1,
    soldEvidenceCount: 1,
  }), soldEvidence, "2026-09-10")
  assert.equal(result.marketRegime, "retail_driven")
  assert.equal(result.marketValueEUR, 14.57)
  assert.equal(result.soldAnchorEUR, 16.85)
  assert.equal(result.activeAnchorEUR, 21.99)
})

ok("one retailer plus sold evidence uses demonstrated sold value, not the lone retail ask", () => {
  const soldEvidence = [{
    stableId: "sold",
    sourceId: "ebay-pr",
    averagePriceEUR: 30,
    salesCount: 4,
    periodStart: "2026-01-01",
    periodEnd: "2026-07-01",
    grain: "rolling_window",
    evidenceGrade: "indicative",
  }]
  const result = applyPublicMarketPublicationPolicy(signal({
    marketRegime: "mixed_scarce",
    retailAnchorEUR: 19,
    activeAnchorEUR: 45,
    soldAnchorEUR: 30,
    retailSourceCount: 1,
    activeOfferCount: 1,
    currentOfferCount: 2,
    soldUnits: 4,
    soldSourceCount: 1,
    soldEvidenceCount: 1,
  }), soldEvidence, "2026-09-10")
  assert.equal(result.marketValueEUR, 30)
  assert.equal(result.retailAnchorEUR, 19)
  assert.equal(result.activeAnchorEUR, 45)
})

ok("indicative-only Product Research confidence can reach Medium but never High", () => {
  const soldEvidence = [{
    stableId: "ebay-pr",
    sourceId: "ebay-pr",
    averagePriceEUR: 17,
    salesCount: 80,
    periodStart: "2023-09-10",
    periodEnd: "2026-09-09",
    grain: "full_history",
    evidenceGrade: "indicative",
  }]
  const confidence = publicSoldConfidence(signal({
    soldUnits: 80,
    soldSourceCount: 1,
  }), soldEvidence, "2026-09-10")
  assert.equal(confidence.label, "medium")
  assert.ok(confidence.score <= 70)
})

ok("thin old sold evidence remains low confidence", () => {
  const soldEvidence = [{
    stableId: "old-pr",
    sourceId: "ebay-pr",
    averagePriceEUR: 36.4,
    salesCount: 2,
    periodStart: "2023-09-10",
    periodEnd: "2025-11-19",
    grain: "full_history",
    evidenceGrade: "indicative",
  }]
  const confidence = publicSoldConfidence(signal({ soldUnits: 2, soldSourceCount: 1 }), soldEvidence, "2026-09-10")
  assert.equal(confidence.label, "low")
  assert.ok(confidence.score < 50)
})

ok("two-source retail confidence is Medium without being inflated by marketplace asks", () => {
  const confidence = publicRetailConfidence(signal({
    retailAnchorEUR: 15,
    activeAnchorEUR: 70,
    retailSourceCount: 2,
    activeOfferCount: 5,
    currentOfferCount: 7,
  }), [], "2026-09-10")
  assert.equal(confidence.label, "medium")
  assert.equal(confidence.score, 50)
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