import assert from "node:assert/strict"
import { computeCurrentMarketSignal } from "../lib/market/pipeline/market-model.ts"
import {
  DEFAULT_SCAN_BATCH_LIMITS,
  nextScanSchedule,
  selectDueScanBatch,
  shouldEscalateHot,
} from "../lib/market/pipeline/scheduler.ts"
import { selectCurrentSoldEvidence } from "../lib/market/pipeline/sold-selection.ts"

let passed = 0

function ok(name, fn) {
  fn()
  passed += 1
  console.log(`ok: ${name}`)
}

const asOf = "2026-09-09"

ok("18069: broad eBay sold evidence defeats a one-off 300 JPY anomaly", () => {
  const signal = computeCurrentMarketSignal({
    offers: [
      { stableId: "rcjaz", sourceId: "rcjaz", channel: "retail", availability: "in_stock", itemPriceEUR: 13, shippingEUR: 8, observedAt: "2026-09-09T10:00:00Z" },
      { stableId: "italian-shop", sourceId: "italian-shop", channel: "retail", availability: "in_stock", itemPriceEUR: 18, shippingEUR: 0, observedAt: "2026-09-09T10:00:00Z" },
      { stableId: "ebay-active", sourceId: "ebay", channel: "marketplace", sellerFingerprint: "seller-a", availability: "in_stock", itemPriceEUR: 18, shippingEUR: 0, observedAt: "2026-09-09T10:00:00Z" },
    ],
    soldEvidence: [
      { stableId: "ebay-pr-3y", sourceId: "ebay-pr", averagePriceEUR: 16.85, salesCount: 53, periodStart: "2023-09-10", periodEnd: "2026-09-09", grain: "full_history", evidenceGrade: "indicative" },
      { stableId: "yahoo-300", sourceId: "yahoo", averagePriceEUR: 1.61, salesCount: 1, periodStart: "2026-06-17", periodEnd: "2026-06-17", grain: "event", evidenceGrade: "indicative" },
    ],
    asOfDate: asOf,
  })

  assert.equal(signal.marketRegime, "retail_driven")
  assert.equal(signal.soldAnchorEUR, 16.85)
  assert.ok(signal.marketValueEUR > 16 && signal.marketValueEUR < 20)
  assert.notEqual(signal.marketValueEUR, 1.61)
})

ok("94717: two Product Research units can outweigh one isolated recent event", () => {
  const signal = computeCurrentMarketSignal({
    offers: [],
    soldEvidence: [
      { stableId: "ebay-pr", sourceId: "ebay-pr", averagePriceEUR: 36.4, salesCount: 2, periodStart: "2023-09-10", periodEnd: "2026-09-09", grain: "full_history", evidenceGrade: "indicative" },
      { stableId: "yahoo", sourceId: "yahoo", averagePriceEUR: 10.81, salesCount: 1, periodStart: "2026-07-12", periodEnd: "2026-07-12", grain: "event", evidenceGrade: "indicative" },
    ],
    asOfDate: asOf,
  })

  assert.equal(signal.marketRegime, "secondary_market_driven")
  assert.equal(signal.soldAnchorEUR, 36.4)
})

ok("out-of-stock retail is historical only and cannot anchor current value", () => {
  const signal = computeCurrentMarketSignal({
    offers: [
      { stableId: "old-shop", sourceId: "old-shop", channel: "retail", availability: "out_of_stock", itemPriceEUR: 15, shippingEUR: 0, observedAt: "2026-09-09T10:00:00Z" },
      { stableId: "ebay-a", sourceId: "ebay", channel: "marketplace", sellerFingerprint: "a", availability: "in_stock", itemPriceEUR: 39, shippingEUR: 0, observedAt: "2026-09-09T10:00:00Z" },
      { stableId: "ebay-b", sourceId: "ebay", channel: "marketplace", sellerFingerprint: "b", availability: "in_stock", itemPriceEUR: 42, shippingEUR: 0, observedAt: "2026-09-09T10:00:00Z" },
    ],
    soldEvidence: [
      { stableId: "sold-a", sourceId: "ebay-sold", averagePriceEUR: 38, salesCount: 8, periodStart: "2026-07-01", periodEnd: "2026-08-31", grain: "rolling_window", evidenceGrade: "verified" },
    ],
    asOfDate: asOf,
  })

  assert.equal(signal.marketRegime, "secondary_market_driven")
  assert.equal(signal.retailAnchorEUR, null)
  assert.equal(signal.activeAnchorEUR, 39)
  assert.equal(signal.soldAnchorEUR, 38)
  assert.ok(signal.marketValueEUR >= 38 && signal.marketValueEUR <= 40)
  assert.equal(signal.startingOffer.itemPriceEUR, 39)
})

ok("shipping-aware starting price prefers known delivered acquisition cost", () => {
  const signal = computeCurrentMarketSignal({
    offers: [
      { stableId: "rcjaz", sourceId: "rcjaz", channel: "retail", availability: "in_stock", itemPriceEUR: 13, shippingEUR: 9, observedAt: "2026-09-09T10:00:00Z" },
      { stableId: "local", sourceId: "local", channel: "retail", availability: "in_stock", itemPriceEUR: 18, shippingEUR: 0, observedAt: "2026-09-09T10:00:00Z" },
    ],
    soldEvidence: [],
    asOfDate: asOf,
  })

  assert.equal(signal.startingOffer.sourceId, "local")
  assert.equal(signal.startingOffer.effectiveCostEUR, 18)
  assert.equal(signal.marketRegime, "retail_driven")
})

ok("unknown shipping remains usable but lower-confidence and item-only", () => {
  const signal = computeCurrentMarketSignal({
    offers: [
      { stableId: "shop", sourceId: "shop", channel: "retail", availability: "in_stock", itemPriceEUR: 20, shippingEUR: null, observedAt: "2026-09-09T10:00:00Z" },
    ],
    soldEvidence: [],
    asOfDate: asOf,
  })

  assert.equal(signal.marketValueEUR, 20)
  assert.equal(signal.startingOffer.costBasis, "item_only")
  assert.equal(signal.startingOffer.effectiveCostEUR, null)
  assert.equal(signal.shippingKnownRatio, 0)
  assert.equal(signal.confidenceLabel, "low")
})

ok("no artificial minimum: one real current source can still produce a market signal", () => {
  const signal = computeCurrentMarketSignal({
    offers: [
      { stableId: "official", sourceId: "official", channel: "retail", availability: "in_stock", itemPriceEUR: 24, shippingEUR: 0, observedAt: "2026-09-09T10:00:00Z" },
    ],
    soldEvidence: [],
    asOfDate: asOf,
  })

  assert.equal(signal.marketValueEUR, 24)
  assert.equal(signal.marketRegime, "retail_driven")
})

ok("monthly sold trend uses complete months and 3-month smoothing when available", () => {
  const monthly = [
    ["2026-01-01", "2026-01-31", 25, 5],
    ["2026-02-01", "2026-02-28", 25, 5],
    ["2026-03-01", "2026-03-31", 25, 5],
    ["2026-04-01", "2026-04-30", 35, 5],
    ["2026-05-01", "2026-05-31", 35, 5],
    ["2026-06-01", "2026-06-30", 35, 5],
  ].map(([start, end, price, count], index) => ({
    stableId: `m-${index}`,
    sourceId: "ebay-pr",
    averagePriceEUR: price,
    salesCount: count,
    periodStart: start,
    periodEnd: end,
    grain: "monthly",
    evidenceGrade: "indicative",
  }))

  const signal = computeCurrentMarketSignal({ offers: [], soldEvidence: monthly, monthlySoldEvidence: monthly, asOfDate: asOf })
  assert.equal(signal.trendWindowMonths, 3)
  assert.equal(signal.trendPercent, 40)
})

ok("aggregate Product Research supersedes granular rows from the same source", () => {
  const selected = selectCurrentSoldEvidence({
    granular: [
      { stableId: "event-1", sourceId: "ebay-pr", averagePriceEUR: 10, salesCount: 1, periodStart: "2026-08-01", periodEnd: "2026-08-01", grain: "event", evidenceGrade: "verified" },
      { stableId: "yahoo-1", sourceId: "yahoo", averagePriceEUR: 20, salesCount: 1, periodStart: "2026-08-02", periodEnd: "2026-08-02", grain: "event", evidenceGrade: "verified" },
    ],
    aggregate: [
      { stableId: "ebay-aug", sourceId: "ebay-pr", averagePriceEUR: 30, salesCount: 10, periodStart: "2026-08-01", periodEnd: "2026-08-31", grain: "monthly", evidenceGrade: "indicative" },
    ],
    asOfDate: asOf,
  })

  assert.equal(selected.some((row) => row.stableId === "event-1"), false)
  assert.equal(selected.some((row) => row.stableId === "ebay-aug"), true)
  assert.equal(selected.some((row) => row.stableId === "yahoo-1"), true)
})

ok("scanner defaults are staggered: 7d retail/active, 14d sold", () => {
  assert.equal(nextScanSchedule({ scope: "retail", activityTier: "normal", now: "2026-09-09T12:00:00Z" }).intervalHours, 168)
  assert.equal(nextScanSchedule({ scope: "active_marketplace", activityTier: "normal", now: "2026-09-09T12:00:00Z" }).intervalHours, 168)
  assert.equal(nextScanSchedule({ scope: "sold_research", activityTier: "normal", now: "2026-09-09T12:00:00Z" }).intervalHours, 336)
})

ok("Product Research batch is capped independently", () => {
  const targets = Array.from({ length: 20 }, (_, index) => ({
    id: `sold-${index}`,
    releaseId: `r-${index}`,
    sourceId: "ebay-pr",
    scanScope: "sold_research",
    activityTier: "normal",
    priority: 0,
    nextScanAt: "2026-09-01T00:00:00Z",
    enabled: true,
  }))

  const selected = selectDueScanBatch(targets, "2026-09-09T12:00:00Z", DEFAULT_SCAN_BATCH_LIMITS)
  assert.equal(selected.length, 6)
})

ok("10% price jump or availability change escalates a Release to hot", () => {
  assert.equal(shouldEscalateHot({ priceBefore: 20, priceAfter: 22 }), true)
  assert.equal(shouldEscalateHot({ availabilityBefore: "in_stock", availabilityAfter: "out_of_stock" }), true)
  assert.equal(shouldEscalateHot({ priceBefore: 20, priceAfter: 20.5 }), false)
})

console.log(`${passed} passed, 0 failed`)
console.log("MARKET R3 TEST PASSED")
