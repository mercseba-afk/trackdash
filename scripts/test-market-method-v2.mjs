import assert from "node:assert/strict"
import { computeCurrentMarketSignal } from "../lib/market/pipeline/market-model.ts"
import { applyPublicMarketPublicationPolicy } from "../lib/market/pipeline/market-publication-policy.ts"
import { selectCurrentSoldEvidence } from "../lib/market/pipeline/sold-selection.ts"

let passed = 0
function ok(name, fn) {
  fn()
  passed += 1
  console.log(`ok: ${name}`)
}

const asOfDate = "2026-09-11"

function aggregate({ id, price, count, start, end, grain = "full_history", grade = "indicative", sourceId = "ebay-pr" }) {
  return {
    stableId: id,
    sourceId,
    averagePriceEUR: price,
    salesCount: count,
    periodStart: start,
    periodEnd: end,
    grain,
    evidenceGrade: grade,
  }
}

function publishedFromSelected(selected, offers = []) {
  const computed = computeCurrentMarketSignal({ offers, soldEvidence: selected, asOfDate })
  return applyPublicMarketPublicationPolicy(computed, selected, asOfDate)
}

ok("95467 shadow: qualifying recent 3m window supersedes 3y average", () => {
  const selected = selectCurrentSoldEvidence({
    granular: [],
    aggregate: [
      aggregate({ id: "95467-history", price: 13.25, count: 37, start: "2023-09-10", end: "2026-08-20" }),
      aggregate({ id: "95467-recent", price: 14.92, count: 5, start: "2026-06-12", end: "2026-08-20", grain: "rolling_window" }),
    ],
    asOfDate,
  })
  assert.equal(selected.length, 1)
  assert.equal(selected[0].stableId, "95467-recent")
  assert.equal(publishedFromSelected(selected).marketValueEUR, 14.92)
})

ok("95061 shadow: recent all-format sales replace historical average without deleting the EUR 72.26 sale from history", () => {
  const selected = selectCurrentSoldEvidence({
    granular: [],
    aggregate: [
      aggregate({ id: "95061-history", price: 34.76, count: 13, start: "2023-09-11", end: "2026-08-31" }),
      aggregate({ id: "95061-recent", price: 31.8242857143, count: 7, start: "2025-09-10", end: "2026-08-31", grain: "rolling_window" }),
    ],
    asOfDate,
  })
  assert.equal(selected[0].stableId, "95061-recent")
  assert.equal(publishedFromSelected(selected).marketValueEUR, 31.82)
})

ok("95525 shadow: three recent exact sales can define the current sparse-market anchor", () => {
  const selected = selectCurrentSoldEvidence({
    granular: [],
    aggregate: [
      aggregate({ id: "95525-history", price: 40.09, count: 18, start: "2023-09-11", end: "2026-04-06" }),
      aggregate({ id: "95525-recent", price: 48.7866666667, count: 3, start: "2025-09-10", end: "2026-04-06", grain: "rolling_window" }),
    ],
    asOfDate,
  })
  assert.equal(selected[0].stableId, "95525-recent")
  assert.equal(publishedFromSelected(selected).marketValueEUR, 48.79)
})

ok("18614 shadow: liquid regular kit follows its recent sold window instead of the 3y average", () => {
  const selected = selectCurrentSoldEvidence({
    granular: [],
    aggregate: [
      aggregate({ id: "18614-history", price: 15.34, count: 35, start: "2023-09-11", end: "2026-07-01" }),
      aggregate({ id: "18614-recent", price: 14.712, count: 10, start: "2025-09-10", end: "2026-07-01", grain: "rolling_window" }),
    ],
    asOfDate,
  })
  assert.equal(selected[0].stableId, "18614-recent")
  assert.equal(publishedFromSelected(selected).marketValueEUR, 14.71)
})

ok("94717 shadow: thin history remains the fallback when no qualified recent window exists", () => {
  const selected = selectCurrentSoldEvidence({
    granular: [],
    aggregate: [aggregate({ id: "94717-history", price: 36.4, count: 2, start: "2023-09-10", end: "2025-11-19" })],
    asOfDate,
  })
  assert.equal(selected[0].stableId, "94717-history")
  assert.equal(publishedFromSelected(selected).marketValueEUR, 36.4)
})

ok("95000 shadow: one indicative completed sale remains evidence but cannot publish Market Value", () => {
  const selected = selectCurrentSoldEvidence({
    granular: [],
    aggregate: [aggregate({ id: "95000-only", price: 29.66, count: 1, start: "2026-08-04", end: "2026-08-04" })],
    asOfDate,
  })
  const published = publishedFromSelected(selected)
  assert.equal(published.soldAnchorEUR, 29.66)
  assert.equal(published.marketValueEUR, null)
})

ok("one verified sale plus one corroborating retailer can publish the demonstrated sold value", () => {
  const selected = [aggregate({ id: "trackdash-confirmed", price: 18, count: 1, start: "2026-09-05", end: "2026-09-05", grain: "event", grade: "verified", sourceId: "trackdash-confirmed" })]
  const published = publishedFromSelected(selected, [
    { stableId: "shop", sourceId: "shop", channel: "retail", availability: "in_stock", itemPriceEUR: 20, shippingEUR: 8, observedAt: "2026-09-11T09:00:00Z" },
  ])
  assert.equal(published.marketValueEUR, 18)
})

ok("one verified sale is not enough when the only retailer is wildly inconsistent", () => {
  const selected = [aggregate({ id: "trackdash-confirmed", price: 18, count: 1, start: "2026-09-05", end: "2026-09-05", grain: "event", grade: "verified", sourceId: "trackdash-confirmed" })]
  const published = publishedFromSelected(selected, [
    { stableId: "shop", sourceId: "shop", channel: "retail", availability: "in_stock", itemPriceEUR: 40, shippingEUR: 0, observedAt: "2026-09-11T09:00:00Z" },
  ])
  assert.equal(published.marketValueEUR, null)
})

ok("two independent retailers still define a current retail headline", () => {
  const computed = computeCurrentMarketSignal({
    offers: [
      { stableId: "a", sourceId: "a", channel: "retail", availability: "in_stock", itemPriceEUR: 16, shippingEUR: 10, observedAt: "2026-09-11T09:00:00Z" },
      { stableId: "b", sourceId: "b", channel: "retail", availability: "in_stock", itemPriceEUR: 18, shippingEUR: 0, observedAt: "2026-09-11T09:00:00Z" },
    ],
    soldEvidence: [],
    asOfDate,
  })
  const published = applyPublicMarketPublicationPolicy(computed, [], asOfDate)
  assert.equal(published.marketValueEUR, 17)
})

ok("out-of-stock retail never becomes the public current price", () => {
  const computed = computeCurrentMarketSignal({
    offers: [
      { stableId: "sold-out", sourceId: "rcjaz", channel: "retail", availability: "out_of_stock", itemPriceEUR: 21.79, shippingEUR: 12, observedAt: "2026-09-11T09:00:00Z" },
    ],
    soldEvidence: [aggregate({ id: "recent", price: 14.92, count: 5, start: "2026-06-12", end: "2026-08-20", grain: "rolling_window" })],
    asOfDate,
  })
  const published = applyPublicMarketPublicationPolicy(computed, [aggregate({ id: "recent", price: 14.92, count: 5, start: "2026-06-12", end: "2026-08-20", grain: "rolling_window" })], asOfDate)
  assert.equal(published.retailAnchorEUR, null)
  assert.equal(published.marketValueEUR, 14.92)
})

console.log(`${passed} passed, 0 failed`)
console.log("MARKET METHOD V2 TEST PASSED")
