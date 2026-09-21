import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { buildMarketAudit } from "../lib/market/audit.ts"
import { computeCurrentMarketSignal } from "../lib/market/pipeline/market-model.ts"
import { applyPublicMarketPublicationPolicy } from "../lib/market/pipeline/market-publication-policy.ts"

let passed = 0
function ok(name, fn) {
  fn()
  passed += 1
  console.log(`ok: ${name}`)
}

ok("18069 shadow: region-balanced retail plus sold context gives a sane current band", () => {
  const audit = buildMarketAudit({
    retailOffers: [
      { stableId: "rcjaz", sourceId: "rcjaz", merchantKey: "rcjaz", region: "asia_pacific", availability: "in_stock", itemPriceEUR: 11.4 },
      { stableId: "tamiya-usa", sourceId: "tamiya-usa", merchantKey: "tamiya-usa", region: "north_america", availability: "in_stock", itemPriceEUR: 15.8 },
      { stableId: "pieroni", sourceId: "pieroni", merchantKey: "pieroni", region: "europe", availability: "in_stock", itemPriceEUR: 18 },
      { stableId: "mini4wdstore", sourceId: "mini4wdstore", merchantKey: "imodellini-group", region: "europe", availability: "out_of_stock", itemPriceEUR: 17.9 },
    ],
    currentSoldEvidence: [],
    historicalSoldEvidence: [
      { stableId: "ebay-history", sourceId: "ebay-pr", averagePriceEUR: 16.85, salesCount: 53, sellerCount: null, evidenceGrade: "indicative" },
    ],
    activeAsks: [
      { stableId: "ebay-ask", sourceId: "ebay", sellerFingerprint: "seller-a", itemPriceEUR: 21.99 },
    ],
  })

  assert.equal(audit.status, "ready")
  assert.equal(audit.confidence, "medium")
  assert.equal(audit.retailMerchantCount, 3)
  assert.equal(audit.retailRegionCount, 3)
  assert.equal(audit.retailAnchorEUR, 15.8)
  assert.equal(audit.suggestedValueEUR, 15.8)
  assert.equal(audit.historicalSoldAnchorEUR, 16.85)
  assert.equal(audit.reasons.includes("HISTORICAL_SOLD_CORROBORATES_RETAIL"), true)
})


ok("two strongly split retail regions do not manufacture a global midpoint", () => {
  const audit = buildMarketAudit({
    retailOffers: [
      { stableId: "jp-a", sourceId: "jp-a", merchantKey: "jp-a", region: "japan", availability: "in_stock", itemPriceEUR: 5.5 },
      { stableId: "eu-a", sourceId: "eu-a", merchantKey: "eu-a", region: "europe", availability: "in_stock", itemPriceEUR: 17.7 },
    ],
    currentSoldEvidence: [],
  })
  assert.equal(audit.retailMerchantCount, 2)
  assert.equal(audit.retailRegionCount, 2)
  assert.ok(audit.regionalRetailSpreadRatio >= 3)
  assert.equal(audit.reasons.includes("REGIONAL_RETAIL_SPLIT"), true)
  assert.equal(audit.suggestedValueEUR, null)
  assert.equal(audit.status, "thin")
})

ok("three regions use the regional median instead of letting one cheap region dominate", () => {
  const audit = buildMarketAudit({
    retailOffers: [
      { stableId: "jp-a", sourceId: "jp-a", merchantKey: "jp-a", region: "japan", availability: "in_stock", itemPriceEUR: 5.5 },
      { stableId: "eu-a", sourceId: "eu-a", merchantKey: "eu-a", region: "europe", availability: "in_stock", itemPriceEUR: 17.7 },
      { stableId: "us-a", sourceId: "us-a", merchantKey: "us-a", region: "north_america", availability: "in_stock", itemPriceEUR: 16.2 },
    ],
    currentSoldEvidence: [],
  })
  assert.equal(audit.status, "ready")
  assert.equal(audit.suggestedValueEUR, 16.2)
  assert.equal(audit.reasons.includes("REGIONAL_RETAIL_SPLIT"), true)
})

ok("same merchant on two storefronts gets one retail vote", () => {
  const audit = buildMarketAudit({
    retailOffers: [
      { stableId: "store-a", sourceId: "mini4wdstore", merchantKey: "imodellini-group", region: "europe", availability: "in_stock", itemPriceEUR: 17.9 },
      { stableId: "store-b", sourceId: "imodellini", merchantKey: "imodellini-group", region: "europe", availability: "in_stock", itemPriceEUR: 18.1 },
    ],
    currentSoldEvidence: [],
  })
  assert.equal(audit.retailMerchantCount, 1)
  assert.equal(audit.retailAnchorEUR, 18)
  assert.equal(audit.suggestedValueEUR, null)
  assert.equal(audit.status, "thin")
})

ok("95467 shadow: one seller plus one retailer remains thin, not a fake global headline", () => {
  const audit = buildMarketAudit({
    retailOffers: [
      { stableId: "rcjaz", sourceId: "rcjaz", merchantKey: "rcjaz", region: "asia_pacific", availability: "in_stock", itemPriceEUR: 21.5 },
      { stableId: "eu-old", sourceId: "mini4wdstore", merchantKey: "imodellini-group", region: "europe", availability: "out_of_stock", itemPriceEUR: 14.4 },
    ],
    currentSoldEvidence: [
      { stableId: "ebay-recent", sourceId: "ebay-pr", averagePriceEUR: 14.92, salesCount: 5, sellerCount: 1, evidenceGrade: "indicative" },
    ],
    activeAsks: [
      { stableId: "ebay-current", sourceId: "ebay", sellerFingerprint: "seller-x", itemPriceEUR: 46.36 },
    ],
  })

  assert.equal(audit.status, "thin")
  assert.equal(audit.confidence, "low")
  assert.equal(audit.suggestedValueEUR, null)
  assert.equal(audit.knownSoldSellerCount, 1)
  assert.equal(audit.reasons.includes("SOLD_SINGLE_SELLER_CONCENTRATION"), true)
  assert.equal(audit.reasons.includes("RETAIL_SINGLE_MERCHANT"), true)
  assert.equal(audit.activeAskAnchorEUR, 46.36)
})

ok("single-seller five-sale cluster publishes cautiously instead of disappearing", () => {
  const sold = [
    {
      stableId: "single-seller-window",
      sourceId: "ebay-pr",
      averagePriceEUR: 14.92,
      salesCount: 5,
      sellerCount: 1,
      periodStart: "2026-06-12",
      periodEnd: "2026-08-20",
      grain: "rolling_window",
      evidenceGrade: "indicative",
    },
  ]
  const computed = computeCurrentMarketSignal({ offers: [], soldEvidence: sold, asOfDate: "2026-09-18" })
  const published = applyPublicMarketPublicationPolicy(computed, sold, "2026-09-18")
  assert.equal(published.soldAnchorEUR, 14.92)
  assert.equal(published.marketValueEUR, 14.92)
  assert.equal(published.confidenceLabel, "low")
  assert.ok(published.confidenceScore <= 49)
})


ok("single exact current offer stays public as observed price even when Market Value is null", () => {
  const computed = computeCurrentMarketSignal({
    offers: [{
      stableId: "exact-current-offer",
      candidateId: "candidate-current-offer",
      sourceId: "manual-marketplace",
      channel: "marketplace",
      sellerFingerprint: "seller-a",
      marketRegion: "japan",
      availability: "in_stock",
      itemPriceEUR: 24.5,
      shippingEUR: null,
      observedAt: "2026-09-21T12:00:00Z",
    }],
    soldEvidence: [],
    asOfDate: "2026-09-21",
  })
  const published = applyPublicMarketPublicationPolicy(computed, [], "2026-09-21")

  assert.equal(published.marketValueEUR, null)
  assert.equal(published.activeAnchorEUR, 24.5)
  assert.equal(published.startingOffer?.itemPriceEUR, 24.5)
  assert.equal(published.currentOfferCount, 1)
})

ok("R3 repository explicitly excludes valuation-ineligible price points", () => {
  const source = readFileSync(new URL("../lib/market/pipeline/market-r3-repository.ts", import.meta.url), "utf8")
  assert.equal(source.includes('.eq("valuation_eligible", true)'), true)
})

console.log(`${passed} passed, 0 failed`)
console.log("MARKET AUDIT V1 TEST PASSED")
