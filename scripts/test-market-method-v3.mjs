import assert from "node:assert/strict"
import { applyAskTrend, computeCurrentMarketSignal } from "../lib/market/pipeline/market-model.ts"
import { applyPublicMarketPublicationPolicy } from "../lib/market/pipeline/market-publication-policy.ts"
import { selectCurrentSoldEvidence } from "../lib/market/pipeline/sold-selection.ts"

let passed = 0
function ok(name, fn) {
  fn()
  passed += 1
  console.log(`ok: ${name}`)
}

const asOfDate = "2026-09-18"

function sold({ id, price, count, start, end, grain = "full_history", grade = "indicative", sourceId = "ebay-pr", sellerCount = null }) {
  return {
    stableId: id,
    sourceId,
    averagePriceEUR: price,
    salesCount: count,
    sellerCount,
    periodStart: start,
    periodEnd: end,
    grain,
    evidenceGrade: grade,
  }
}

function publish(selected, offers = [], monthlySoldEvidence = undefined) {
  const computed = computeCurrentMarketSignal({ offers, soldEvidence: selected, monthlySoldEvidence, asOfDate })
  return applyPublicMarketPublicationPolicy(computed, selected, asOfDate)
}

ok("18069: recent broad history is a conservative fallback instead of disappearing", () => {
  const selected = selectCurrentSoldEvidence({
    granular: [],
    aggregate: [
      sold({ id: "18069-history", price: 16.85, count: 53, start: "2023-09-10", end: "2026-09-09" }),
    ],
    asOfDate,
  })
  assert.equal(selected.length, 1)
  assert.equal(selected[0].grain, "full_history")
  const result = publish(selected)
  assert.equal(result.marketValueEUR, 16.85)
  assert.equal(result.soldUnits, 53)
  assert.equal(result.confidenceLabel, "medium")
})

ok("95087: older but still current broad history can publish at deliberately low confidence", () => {
  const selected = selectCurrentSoldEvidence({
    granular: [],
    aggregate: [
      sold({ id: "95087-history", price: 34.91, count: 10, start: "2023-09-10", end: "2026-04-05" }),
    ],
    asOfDate,
  })
  const result = publish(selected)
  assert.equal(result.marketValueEUR, 34.91)
  assert.equal(result.confidenceLabel, "low")
})

ok("18074: current rolling window with eight sellers publishes the sold value", () => {
  const selected = selectCurrentSoldEvidence({
    granular: [],
    aggregate: [
      sold({ id: "18074-history", price: 16.64, count: 60, sellerCount: 17, start: "2023-09-14", end: "2026-08-30" }),
      sold({ id: "18074-current", price: 17.49, count: 19, sellerCount: 8, start: "2025-09-14", end: "2026-08-30", grain: "rolling_window" }),
    ],
    asOfDate,
  })
  assert.equal(selected.length, 1)
  assert.equal(selected[0].stableId, "18074-current")
  const result = publish(selected)
  assert.equal(result.marketValueEUR, 17.49)
  assert.equal(result.soldSellerCount, 8)
  assert.equal(result.confidenceLabel, "medium")
})

ok("18614: liquid standard kit follows the recent 10-sale window", () => {
  const selected = selectCurrentSoldEvidence({
    granular: [],
    aggregate: [
      sold({ id: "18614-history", price: 15.34, count: 35, sellerCount: 11, start: "2023-09-11", end: "2026-07-01" }),
      sold({ id: "18614-current", price: 14.71, count: 10, start: "2025-09-10", end: "2026-07-01", grain: "rolling_window" }),
    ],
    asOfDate,
  })
  const result = publish(selected)
  assert.equal(result.marketValueEUR, 14.71)
  assert.equal(result.confidenceLabel, "medium")
})

ok("95467: five observed sales from one known seller remain evidence but do not alone define Market Value", () => {
  const selected = selectCurrentSoldEvidence({
    granular: [],
    aggregate: [
      sold({ id: "95467-history", price: 13.25, count: 37, sellerCount: 1, start: "2023-09-10", end: "2026-08-20" }),
      sold({ id: "95467-current", price: 14.92, count: 5, sellerCount: null, start: "2026-06-12", end: "2026-08-20", grain: "rolling_window" }),
    ],
    asOfDate,
  })
  assert.equal(selected[0].sellerCount, 1)
  const result = publish(selected)
  assert.equal(result.soldAnchorEUR, 14.92)
  assert.equal(result.marketValueEUR, null)
  assert.equal(result.confidenceLabel, "low")
})

ok("seven sales from one seller remain sell-through evidence without independent corroboration", () => {
  const selected = [
    sold({ id: "single-seller-seven", price: 15, count: 7, sellerCount: 1, start: "2026-07-01", end: "2026-09-10", grain: "rolling_window" }),
  ]
  const result = publish(selected)
  assert.equal(result.marketValueEUR, null)
  assert.equal(result.soldUnits, 7)
  assert.equal(result.soldSellerCount, 1)
  assert.equal(result.soldAnchorEUR, 15)
  assert.equal(result.confidenceLabel, "low")
})

ok("one known seller can publish only when independent current retail corroborates it", () => {
  const selected = [
    sold({ id: "single-seller", price: 14.92, count: 5, sellerCount: 1, start: "2026-06-12", end: "2026-08-20", grain: "rolling_window" }),
  ]
  const result = publish(selected, [
    { stableId: "shop", sourceId: "shop", merchantKey: "shop", marketRegion: "europe", channel: "retail", availability: "in_stock", itemPriceEUR: 16, shippingEUR: null, observedAt: "2026-09-18T10:00:00Z" },
  ])
  assert.equal(result.marketValueEUR, 14.92)
  assert.equal(result.confidenceLabel, "low")
})

ok("two strongly split retail regions do not manufacture a global midpoint", () => {
  const result = publish([], [
    { stableId: "jp", sourceId: "jp", merchantKey: "jp-shop", marketRegion: "japan", channel: "retail", availability: "in_stock", itemPriceEUR: 5.5, shippingEUR: null, observedAt: "2026-09-18T10:00:00Z" },
    { stableId: "eu", sourceId: "eu", merchantKey: "eu-shop", marketRegion: "europe", channel: "retail", availability: "in_stock", itemPriceEUR: 17.7, shippingEUR: null, observedAt: "2026-09-18T10:00:00Z" },
  ])
  assert.equal(result.retailRegionCount, 2)
  assert.ok(result.retailRegionalSpreadRatio >= 3)
  assert.equal(result.marketValueEUR, null)
})

ok("European item-only retail remains the observed reference while extra-EU lanes stay context", () => {
  const result = publish([], [
    { stableId: "jp", sourceId: "jp", merchantKey: "jp-shop", marketRegion: "japan", channel: "retail", availability: "in_stock", itemPriceEUR: 5.5, shippingEUR: null, observedAt: "2026-09-18T10:00:00Z" },
    { stableId: "eu", sourceId: "eu", merchantKey: "eu-shop", marketRegion: "europe", channel: "retail", availability: "in_stock", itemPriceEUR: 17.7, shippingEUR: null, observedAt: "2026-09-18T10:00:00Z" },
    { stableId: "us", sourceId: "us", merchantKey: "us-shop", marketRegion: "north_america", channel: "retail", availability: "in_stock", itemPriceEUR: 16.2, shippingEUR: null, observedAt: "2026-09-18T10:00:00Z" },
  ])
  assert.equal(result.retailAnchorEUR, 17.7)
  assert.equal(result.marketValueEUR, null)
})

ok("same merchant across two storefronts counts as one retail vote", () => {
  const result = publish([], [
    { stableId: "a", sourceId: "store-a", merchantKey: "same-merchant", marketRegion: "europe", channel: "retail", availability: "in_stock", itemPriceEUR: 17.9, shippingEUR: null, observedAt: "2026-09-18T10:00:00Z" },
    { stableId: "b", sourceId: "store-b", merchantKey: "same-merchant", marketRegion: "europe", channel: "retail", availability: "in_stock", itemPriceEUR: 18.1, shippingEUR: null, observedAt: "2026-09-18T10:00:00Z" },
  ])
  assert.equal(result.retailSourceCount, 1)
  assert.equal(result.marketValueEUR, null)
})

ok("completed sales remain the headline when corroborating retail is available", () => {
  const selected = [
    sold({ id: "sold", price: 17.49, count: 19, sellerCount: 8, start: "2025-09-14", end: "2026-08-30", grain: "rolling_window" }),
  ]
  const result = publish(selected, [
    { stableId: "shop-a", sourceId: "shop-a", merchantKey: "shop-a", marketRegion: "europe", channel: "retail", availability: "in_stock", itemPriceEUR: 16.5, shippingEUR: null, observedAt: "2026-09-18T10:00:00Z" },
    { stableId: "shop-b", sourceId: "shop-b", merchantKey: "shop-b", marketRegion: "europe", channel: "retail", availability: "in_stock", itemPriceEUR: 17.5, shippingEUR: null, observedAt: "2026-09-18T10:00:00Z" },
  ])
  assert.equal(result.marketValueEUR, 17.49)
  assert.equal(result.lowEUR, 17.49)
  assert.equal(result.highEUR, 17.49)
})

ok("active ASK prices never manufacture Market Value", () => {
  const result = publish([], [
    { stableId: "ask-a", sourceId: "ebay", sellerFingerprint: "seller-a", marketRegion: "europe", channel: "marketplace", availability: "in_stock", itemPriceEUR: 35, shippingEUR: 10, observedAt: "2026-09-18T10:00:00Z" },
    { stableId: "ask-b", sourceId: "ebay", sellerFingerprint: "seller-b", marketRegion: "europe", channel: "marketplace", availability: "in_stock", itemPriceEUR: 75, shippingEUR: 0, observedAt: "2026-09-18T10:00:00Z" },
  ])
  assert.equal(result.activeOfferCount, 2)
  assert.equal(result.activeAnchorEUR, 60)
  assert.equal(result.marketValueEUR, null)
})

ok("fantasy ASK outlier is excluded from typical ask and public ask range", () => {
  const result = publish([], [
    { stableId: "ask-25", sourceId: "ebay", sellerFingerprint: "seller-25", marketRegion: "europe", channel: "marketplace", availability: "in_stock", itemPriceEUR: 25, observedAt: "2026-09-18T10:00:00Z" },
    { stableId: "ask-29", sourceId: "ebay", sellerFingerprint: "seller-29", marketRegion: "europe", channel: "marketplace", availability: "in_stock", itemPriceEUR: 29, observedAt: "2026-09-18T10:00:00Z" },
    { stableId: "ask-30", sourceId: "ebay", sellerFingerprint: "seller-30", marketRegion: "europe", channel: "marketplace", availability: "in_stock", itemPriceEUR: 30, observedAt: "2026-09-18T10:00:00Z" },
    { stableId: "ask-35", sourceId: "ebay", sellerFingerprint: "seller-35", marketRegion: "europe", channel: "marketplace", availability: "in_stock", itemPriceEUR: 35, observedAt: "2026-09-18T10:00:00Z" },
    { stableId: "ask-100", sourceId: "ebay", sellerFingerprint: "seller-100", marketRegion: "europe", channel: "marketplace", availability: "in_stock", itemPriceEUR: 100, observedAt: "2026-09-18T10:00:00Z" },
  ])
  assert.equal(result.activeOfferCount, 5)
  assert.equal(result.activeAnchorEUR, 29.5)
  assert.equal(result.activeLowEUR, 25)
  assert.equal(result.activeHighEUR, 35)
  assert.equal(result.marketValueEUR, null)
})

ok("ASK trend compares today's typical ask with a recent historical snapshot", () => {
  const current = publish([], [
    { stableId: "ask-current-a", sourceId: "ebay", sellerFingerprint: "seller-a", marketRegion: "europe", channel: "marketplace", availability: "in_stock", itemPriceEUR: 29, observedAt: "2026-09-18T10:00:00Z" },
    { stableId: "ask-current-b", sourceId: "ebay", sellerFingerprint: "seller-b", marketRegion: "europe", channel: "marketplace", availability: "in_stock", itemPriceEUR: 31, observedAt: "2026-09-18T10:00:00Z" },
  ])
  const trended = applyAskTrend(current, [
    { snapshotDate: "2026-09-10", typicalEUR: 25, lowEUR: 22, highEUR: 28, offerCount: 4 },
  ], asOfDate)
  assert.equal(trended.askTrendPercent, 20)
  assert.equal(trended.askTrendWindowDays, 8)
})

ok("out-of-stock retail remains context and cannot become current value", () => {
  const result = publish([], [
    { stableId: "oos", sourceId: "shop", merchantKey: "shop", marketRegion: "europe", channel: "retail", availability: "out_of_stock", itemPriceEUR: 18, shippingEUR: null, observedAt: "2026-09-18T10:00:00Z" },
  ])
  assert.equal(result.retailAnchorEUR, null)
  assert.equal(result.marketValueEUR, null)
})

console.log(`${passed} passed, 0 failed`)
console.log("MARKET METHOD V4 TEST PASSED")
