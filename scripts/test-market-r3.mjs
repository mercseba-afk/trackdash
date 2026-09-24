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
  assert.equal(signal.retailAnchorEUR, 19.5)
  assert.equal(signal.soldAnchorEUR, 16.85)
  assert.ok(signal.marketValueEUR > 15 && signal.marketValueEUR < 19)
  assert.notEqual(signal.marketValueEUR, 1.61)
})

ok("equal-weight SOLD evidence uses the midpoint instead of biasing to the lower sale", () => {
  const signal = computeCurrentMarketSignal({
    offers: [],
    soldEvidence: [
      {
        stableId: "yahoo-1989-a",
        sourceId: "yahoo",
        averagePriceEUR: 5.33,
        salesCount: 1,
        sellerCount: 1,
        periodStart: "2026-04-01",
        periodEnd: "2026-04-30",
        grain: "monthly",
        evidenceGrade: "indicative",
      },
      {
        stableId: "yahoo-1989-b",
        sourceId: "yahoo",
        averagePriceEUR: 12.62,
        salesCount: 1,
        sellerCount: 1,
        periodStart: "2026-05-01",
        periodEnd: "2026-05-31",
        grain: "monthly",
        evidenceGrade: "indicative",
      },
    ],
    asOfDate: "2026-09-24",
  })

  assert.equal(signal.soldAnchorEUR, 8.98)
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
  assert.equal(signal.activeAnchorEUR, 40.5)
  assert.equal(signal.soldAnchorEUR, 38)
  assert.ok(signal.marketValueEUR >= 38 && signal.marketValueEUR <= 41)
  assert.equal(signal.startingOffer.itemPriceEUR, 39)
})

ok("observed price follows the latest fresh observation instead of the cheapest older offer", () => {
  const signal = computeCurrentMarketSignal({
    offers: [
      { stableId: "rcjaz", sourceId: "rcjaz", channel: "retail", availability: "in_stock", itemPriceEUR: 13, shippingEUR: 9, observedAt: "2026-09-08T10:00:00Z" },
      { stableId: "local", sourceId: "local", channel: "retail", availability: "in_stock", itemPriceEUR: 18, shippingEUR: 0, observedAt: "2026-09-09T10:00:00Z" },
    ],
    soldEvidence: [],
    asOfDate: asOf,
  })

  assert.equal(signal.retailAnchorEUR, 20)
  assert.equal(signal.marketValueEUR, 20)
  assert.equal(signal.startingOffer.sourceId, "local")
  assert.equal(signal.startingOffer.itemPriceEUR, 18)
  assert.equal(signal.startingOffer.shippingEUR, 0)
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

ok("Europe-first observed price uses delivered acquisition cluster instead of aspirational tail", () => {
  const signal = computeCurrentMarketSignal({
    offers: [
      { stableId: "eu-1", sourceId: "ebay", channel: "marketplace", sellerFingerprint: "a", marketRegion: "europe", availability: "in_stock", itemPriceEUR: 17.21, shippingEUR: 15.77, observedAt: "2026-09-09T10:00:00Z" },
      { stableId: "eu-2", sourceId: "ebay", channel: "marketplace", sellerFingerprint: "b", marketRegion: "europe", availability: "in_stock", itemPriceEUR: 17.49, shippingEUR: 16.06, observedAt: "2026-09-09T10:00:00Z" },
      { stableId: "eu-3", sourceId: "ebay", channel: "marketplace", sellerFingerprint: "c", marketRegion: "europe", availability: "in_stock", itemPriceEUR: 21.96, shippingEUR: 12.20, observedAt: "2026-09-09T10:00:00Z" },
      { stableId: "eu-4", sourceId: "ebay", channel: "marketplace", sellerFingerprint: "d", marketRegion: "europe", availability: "in_stock", itemPriceEUR: 23.26, shippingEUR: 14.87, observedAt: "2026-09-09T10:00:00Z" },
      { stableId: "eu-5", sourceId: "ebay", channel: "marketplace", sellerFingerprint: "e", marketRegion: "europe", availability: "in_stock", itemPriceEUR: 31.86, shippingEUR: 28.21, observedAt: "2026-09-09T10:00:00Z" },
      { stableId: "eu-6", sourceId: "ebay", channel: "marketplace", sellerFingerprint: "f", marketRegion: "europe", availability: "in_stock", itemPriceEUR: 67.54, shippingEUR: 48.22, observedAt: "2026-09-09T10:00:00Z" },
    ],
    soldEvidence: [],
    asOfDate: asOf,
  })

  // The raw model can calculate an internal blended draft, but the public
  // publication policy still suppresses Market Value when evidence is only ASK.
  assert.ok(signal.marketValueEUR > 33 && signal.marketValueEUR < 34.5)
  assert.equal(signal.activeAnchorEUR, 33.85)
  assert.equal(signal.activeLowEUR, 32.98)
  assert.equal(signal.activeHighEUR, 38.13)
})

ok("Japan-local free shipping is context, not European delivered cost", () => {
  const signal = computeCurrentMarketSignal({
    offers: [
      {
        stableId: "mercari-jp",
        sourceId: "mercari-jp",
        channel: "marketplace",
        sellerFingerprint: "seller-jp",
        marketRegion: "japan",
        availability: "in_stock",
        itemPriceEUR: 27.12,
        shippingEUR: 0,
        observedAt: "2026-09-22T06:54:16Z",
      },
    ],
    soldEvidence: [],
    asOfDate: "2026-09-22",
  })

  assert.equal(signal.currentOfferCount, 1)
  assert.equal(signal.activeOfferCount, 1)
  assert.equal(signal.shippingKnownRatio, 0)
  assert.equal(signal.activeAnchorEUR, null)
  assert.equal(signal.startingOffer, null)
  assert.equal(signal.marketValueEUR, null)
})

ok("extra-EU retail with local shipping cannot define the European retail anchor", () => {
  const signal = computeCurrentMarketSignal({
    offers: [
      {
        stableId: "rcjaz",
        sourceId: "rcjaz",
        channel: "retail",
        merchantKey: "rcjaz",
        marketRegion: "asia_pacific",
        availability: "in_stock",
        itemPriceEUR: 13.3,
        shippingEUR: 15,
        observedAt: "2026-09-22T08:00:00Z",
      },
    ],
    soldEvidence: [],
    asOfDate: "2026-09-22",
  })

  assert.equal(signal.currentOfferCount, 1)
  assert.equal(signal.retailSourceCount, 1)
  assert.equal(signal.shippingKnownRatio, 0)
  assert.equal(signal.retailAnchorEUR, null)
  assert.equal(signal.startingOffer, null)
  assert.equal(signal.marketValueEUR, null)
})

ok("one European delivered offer outranks a cheaper Japan-local offer for public observed price", () => {
  const signal = computeCurrentMarketSignal({
    offers: [
      {
        stableId: "mercari-jp",
        sourceId: "mercari-jp",
        channel: "marketplace",
        sellerFingerprint: "seller-jp",
        marketRegion: "japan",
        availability: "in_stock",
        itemPriceEUR: 27.12,
        shippingEUR: 0,
        observedAt: "2026-09-22T06:54:16Z",
      },
      {
        stableId: "ebay-it",
        sourceId: "ebay",
        channel: "marketplace",
        sellerFingerprint: "seller-eu",
        marketRegion: "europe",
        availability: "in_stock",
        itemPriceEUR: 46.36,
        shippingEUR: 12.2,
        observedAt: "2026-09-22T07:00:00Z",
      },
    ],
    soldEvidence: [],
    asOfDate: "2026-09-22",
  })

  assert.equal(signal.activeAnchorEUR, 58.56)
  assert.equal(signal.activeLowEUR, 58.56)
  assert.equal(signal.activeHighEUR, 58.56)
  assert.equal(signal.startingOffer?.sourceId, "ebay")
  assert.equal(signal.startingOffer?.costBasis, "delivered")
  assert.equal(signal.startingOffer?.effectiveCostEUR, 58.56)
})

ok("starting offer is the lowest valid delivered acquisition cost, not the newest listing", () => {
  const signal = computeCurrentMarketSignal({
    offers: [
      {
        stableId: "older-cheaper",
        sourceId: "ebay",
        channel: "marketplace",
        sellerFingerprint: "seller-cheap",
        marketRegion: "europe",
        availability: "in_stock",
        itemPriceEUR: 17.5,
        shippingEUR: 7.9,
        observedAt: "2026-09-24T17:01:00Z",
      },
      {
        stableId: "newer-expensive",
        sourceId: "ebay",
        channel: "marketplace",
        sellerFingerprint: "seller-expensive",
        marketRegion: "europe",
        availability: "in_stock",
        itemPriceEUR: 15.12,
        shippingEUR: 11.44,
        observedAt: "2026-09-24T17:02:00Z",
      },
    ],
    soldEvidence: [],
    asOfDate: "2026-09-24",
  })

  assert.equal(signal.startingOffer?.stableId, "older-cheaper")
  assert.equal(signal.startingOffer?.costBasis, "delivered")
  assert.equal(signal.startingOffer?.effectiveCostEUR, 25.4)
})

ok("monthly sold trend uses complete recent consecutive months and 3-month smoothing", () => {
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

ok("stale monthly research remains history but does not emit a current trend", () => {
  const monthly = [
    { stableId: "old-a", sourceId: "ebay-pr", averagePriceEUR: 25, salesCount: 1, periodStart: "2024-11-01", periodEnd: "2024-11-30", grain: "monthly", evidenceGrade: "indicative" },
    { stableId: "old-b", sourceId: "ebay-pr", averagePriceEUR: 35, salesCount: 1, periodStart: "2024-12-01", periodEnd: "2024-12-31", grain: "monthly", evidenceGrade: "indicative" },
  ]
  const signal = computeCurrentMarketSignal({ offers: [], soldEvidence: monthly, monthlySoldEvidence: monthly, asOfDate: asOf })
  assert.equal(signal.trendPercent, null)
  assert.equal(signal.trendWindowMonths, null)
  assert.equal(signal.monthlyTrend.length, 2)
})

ok("gapped monthly research does not pretend to be a one-month trend", () => {
  const monthly = [
    { stableId: "gap-a", sourceId: "ebay-pr", averagePriceEUR: 25, salesCount: 1, periodStart: "2026-06-01", periodEnd: "2026-06-30", grain: "monthly", evidenceGrade: "indicative" },
    { stableId: "gap-b", sourceId: "ebay-pr", averagePriceEUR: 35, salesCount: 1, periodStart: "2026-08-01", periodEnd: "2026-08-31", grain: "monthly", evidenceGrade: "indicative" },
  ]
  const signal = computeCurrentMarketSignal({ offers: [], soldEvidence: monthly, monthlySoldEvidence: monthly, asOfDate: asOf })
  assert.equal(signal.trendPercent, null)
  assert.equal(signal.trendWindowMonths, null)
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

ok("scanner defaults are staggered for the slow Mini 4WD market", () => {
  assert.equal(nextScanSchedule({ scope: "retail", activityTier: "normal", now: "2026-09-09T12:00:00Z" }).intervalHours, 336)
  assert.equal(nextScanSchedule({ scope: "active_marketplace", activityTier: "normal", now: "2026-09-09T12:00:00Z" }).intervalHours, 168)
  assert.equal(nextScanSchedule({ scope: "sold_research", activityTier: "normal", now: "2026-09-09T12:00:00Z" }).intervalHours, 720)
  assert.equal(nextScanSchedule({ scope: "active_marketplace", activityTier: "hot", now: "2026-09-09T12:00:00Z" }).intervalHours, 72)
  assert.equal(nextScanSchedule({ scope: "retail", activityTier: "cold", now: "2026-09-09T12:00:00Z" }).intervalHours, 720)
  assert.equal(nextScanSchedule({ scope: "sold_research", activityTier: "cold", now: "2026-09-09T12:00:00Z" }).intervalHours, 1440)
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
