import { register } from "node:module"
register("./ts-extension-loader.mjs", import.meta.url)

import assert from "node:assert/strict"

const {
  assignEvidenceGroups,
  buildPricePointDraft,
  classifyObservation,
  computeMarketEstimate,
  isPossibleOutlier,
} = await import("../lib/market/pipeline/index.ts")

const releases = [
  { id: "a-1988", productName: "Avante Jr.", itemNumber: "18014", editionName: "Avante Jr.", releaseYear: 1988, releaseType: "Original", editionType: "original", chassis: "Type 2", color: "Blue" },
  { id: "a-2024", productName: "Avante Jr.", itemNumber: "18014", editionName: "Avante Jr. (2024 Reissue)", releaseYear: 2024, releaseType: "Reissue", editionType: "reissue", chassis: "Type 2", color: "Blue" },
  { id: "d-2010", productName: "Dyna-Hawk GX", itemNumber: "94717", editionName: "Dyna-Hawk GX Super XX Special", releaseYear: 2010, releaseType: "Color Special", editionType: "color_special", chassis: "Super XX", color: null },
]

function test(name, fn) {
  try {
    fn()
    console.log(`ok: ${name}`)
  } catch (error) {
    console.error(`FAIL: ${name}`)
    throw error
  }
}

test("reused item number alone stays needs_review", () => {
  const result = classifyObservation({ sourceRecordKey: "1", itemNumberObserved: "18014", titleRaw: "Tamiya Avante Jr" }, releases)
  assert.equal(result.decision, "needs_review")
  assert.equal(result.resolvedReleaseId, null)
  assert.ok(result.reasonCodes.includes("REUSED_ITEM_NUMBER"))
})

test("reused item number + reissue/year disambiguates", () => {
  const result = classifyObservation({ sourceRecordKey: "2", itemNumberObserved: "18014", titleRaw: "Tamiya Avante Jr 2024 Reissue" }, releases)
  assert.equal(result.decision, "accepted")
  assert.equal(result.resolvedReleaseId, "a-2024")
  assert.ok(result.matchEvidence.includes("item_number_exact"))
  assert.ok(result.matchEvidence.includes("release_year_stated"))
})

test("unique item number still needs release-specific corroboration", () => {
  const result = classifyObservation({ sourceRecordKey: "3", itemNumberObserved: "94717", titleRaw: "Tamiya Mini 4WD 94717" }, releases)
  assert.equal(result.decision, "needs_review")
  assert.equal(result.resolvedReleaseId, null)
})

test("manual reviewed release is exact", () => {
  const result = classifyObservation({
    sourceRecordKey: "4",
    explicitReleaseId: "d-2010",
    identityReviewed: true,
    matchEvidence: ["manual_override"],
    observationType: "sold_confirmed",
    price: 50,
    currency: "EUR",
    shippingBasis: "excluded",
    condition: "new_complete_unbuilt",
    isComplete: true,
    isLot: false,
    quantity: 1,
    sellerFingerprint: "seller-1",
    soldOn: "2026-08-01",
  }, releases)
  assert.equal(result.decision, "accepted")
  assert.equal(result.matchConfidence, "exact")
})

test("ambiguous Japanese condition forces review", () => {
  const result = classifyObservation({
    sourceRecordKey: "5",
    explicitReleaseId: "d-2010",
    identityReviewed: true,
    matchEvidence: ["manual_override"],
    conditionRaw: "未組立 美品",
  }, releases)
  assert.equal(result.decision, "needs_review")
  assert.ok(result.reasonCodes.includes("AMBIGUOUS_CONDITION"))
})

test("unknown seller is conservatively grouped instead of discarded", () => {
  const map = assignEvidenceGroups([
    { stableId: "x", releaseId: "r", condition: "unknown", sourceId: "s", sellerFingerprint: null, soldOn: "2026-01-01" },
    { stableId: "y", releaseId: "r", condition: "unknown", sourceId: "s", sellerFingerprint: null, soldOn: "2026-01-05" },
    { stableId: "z", releaseId: "r", condition: "unknown", sourceId: "s", sellerFingerprint: null, soldOn: "2026-01-08" },
  ])
  assert.ok(map.get("x"))
  assert.equal(map.get("x"), map.get("y"))
  assert.notEqual(map.get("x"), map.get("z"))
})

test("7-day fixed anchor is not rolling chain", () => {
  const sales = [
    { stableId: "a", releaseId: "r", condition: "new_complete_unbuilt", sourceId: "s", sellerFingerprint: "seller", soldOn: "2026-01-01" },
    { stableId: "b", releaseId: "r", condition: "new_complete_unbuilt", sourceId: "s", sellerFingerprint: "seller", soldOn: "2026-01-07" },
    { stableId: "c", releaseId: "r", condition: "new_complete_unbuilt", sourceId: "s", sellerFingerprint: "seller", soldOn: "2026-01-08" },
  ]
  const map = assignEvidenceGroups(sales)
  assert.equal(map.get("a"), map.get("b"))
  assert.notEqual(map.get("a"), map.get("c"))
})

test("unknown shipping becomes indicative usable market evidence", () => {
  const candidate = classifyObservation({
    sourceRecordKey: "6",
    explicitReleaseId: "d-2010",
    identityReviewed: true,
    matchEvidence: ["manual_override"],
    observationType: "sold_confirmed",
    price: 40,
    currency: "EUR",
    shippingBasis: "unknown",
    condition: "new_complete_unbuilt",
    isComplete: true,
    isLot: false,
    quantity: 1,
    sellerFingerprint: "seller",
    soldOn: "2026-01-01",
  }, releases)
  candidate.evidenceGroupKey = "eg"
  const promotion = buildPricePointDraft(candidate)
  assert.equal(promotion.ok, true)
  if (promotion.ok) {
    assert.equal(promotion.point.valuationPrice, null)
    assert.equal(promotion.point.marketPriceEUR, 40)
    assert.equal(promotion.point.evidenceGrade, "indicative")
    assert.ok(promotion.point.qualityFlags.includes("shipping_unknown"))
    assert.equal(promotion.point.valuationEligible, true)
  }
})

test("unknown seller and completeness no longer block a real sale", () => {
  const candidate = classifyObservation({
    sourceRecordKey: "6b",
    explicitReleaseId: "d-2010",
    identityReviewed: true,
    matchEvidence: ["manual_override"],
    observationType: "auction_awarded",
    price: 55,
    currency: "EUR",
    shippingBasis: "buyer_paid",
    condition: "unknown",
    isComplete: null,
    isLot: false,
    quantity: 1,
    sellerFingerprint: null,
    soldOn: "2026-01-02",
  }, releases)
  candidate.evidenceGroupKey = "eg2"
  const promotion = buildPricePointDraft(candidate)
  assert.equal(promotion.ok, true)
  if (promotion.ok) {
    assert.equal(promotion.point.marketPriceEUR, 55)
    assert.equal(promotion.point.evidenceGrade, "indicative")
    assert.ok(promotion.point.qualityFlags.includes("seller_unknown"))
    assert.ok(promotion.point.qualityFlags.includes("completeness_unconfirmed"))
    assert.ok(promotion.point.qualityFlags.includes("condition_inferred"))
    assert.equal(promotion.point.valuationEligible, true)
  }
})

test("known incomplete sale remains a hard blocker", () => {
  const candidate = classifyObservation({
    sourceRecordKey: "6c",
    explicitReleaseId: "d-2010",
    identityReviewed: true,
    matchEvidence: ["manual_override"],
    observationType: "sold_confirmed",
    price: 25,
    currency: "EUR",
    shippingBasis: "excluded",
    condition: "incomplete_parts_custom",
    isComplete: false,
    isLot: false,
    quantity: 1,
    soldOn: "2026-01-03",
  }, releases)
  candidate.evidenceGroupKey = "eg3"
  const promotion = buildPricePointDraft(candidate)
  assert.equal(promotion.ok, false)
})

test("non-EUR comparable sale requires FX provenance", () => {
  const candidate = classifyObservation({
    sourceRecordKey: "7",
    explicitReleaseId: "d-2010",
    identityReviewed: true,
    matchEvidence: ["manual_override"],
    observationType: "sold_confirmed",
    price: 5000,
    currency: "JPY",
    shippingBasis: "unknown",
    condition: "unknown",
    isComplete: null,
    isLot: false,
    quantity: 1,
    sellerFingerprint: null,
    soldOn: "2026-01-01",
  }, releases)
  candidate.evidenceGroupKey = "eg"
  const promotion = buildPricePointDraft(candidate)
  assert.deepEqual(promotion, { ok: false, reason: "FX_PROVENANCE_REQUIRED" })
})

test("outlier requires at least three prior independent groups", () => {
  assert.equal(isPossibleOutlier(1000, [10, 11]), false)
  assert.equal(isPossibleOutlier(1000, [10, 11, 12]), true)
})

function points(count, startValue = 10) {
  return Array.from({ length: count }, (_, index) => ({
    stableId: `p-${index}`,
    sourceId: index % 2 === 0 ? "source-a" : "source-b",
    soldOn: `2026-08-${String(index + 1).padStart(2, "0")}`,
    normalizedPriceEUR: startValue + index,
    evidenceGroupKey: `g-${index}`,
    evidenceGrade: index < Math.ceil(count / 2) ? "verified" : "indicative",
  }))
}

test("valuation tier 1 = latest usable sale", () => {
  const estimate = computeMarketEstimate(points(1), "2026-09-01")
  assert.equal(estimate?.displayMode, "last_sale")
  assert.equal(estimate?.value, 10)
  assert.equal(estimate?.verifiedObservationCount, 1)
  assert.equal(estimate?.qualityMix, "verified_only")
})

test("valuation tier 2-4 = cleaned min/max range", () => {
  const estimate = computeMarketEstimate(points(4), "2026-09-01")
  assert.equal(estimate?.displayMode, "range")
  assert.equal(estimate?.low, 10)
  assert.equal(estimate?.high, 13)
  assert.equal(estimate?.value, null)
  assert.equal(estimate?.verifiedObservationCount, 2)
  assert.equal(estimate?.indicativeObservationCount, 2)
  assert.equal(estimate?.sourceCount, 2)
  assert.equal(estimate?.qualityMix, "mixed")
})

test("valuation tier 5-9 = median + cleaned min/max", () => {
  const estimate = computeMarketEstimate(points(5), "2026-09-01")
  assert.equal(estimate?.displayMode, "value")
  assert.equal(estimate?.rangeMethod, "cleaned_min_max")
  assert.equal(estimate?.value, 12)
})

test("valuation >=10 = median + percentile_cont Q1/Q3", () => {
  const estimate = computeMarketEstimate(points(10), "2026-09-01")
  assert.equal(estimate?.rangeMethod, "q1_q3")
  assert.equal(estimate?.value, 14.5)
  assert.equal(estimate?.low, 12.25)
  assert.equal(estimate?.high, 16.75)
  assert.equal(estimate?.algorithmVersion, "v2")
})

console.log("MARKET PIPELINE TEST PASSED")
