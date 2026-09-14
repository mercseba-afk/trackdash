import assert from "node:assert/strict"
import {
  canFeedCurrentSoldAnchor,
  coverageNeedsReview,
  defaultPilotSourcePolicies,
  isCurrentPurchasableAvailability,
  shouldRetainUnavailableReference,
  sourcePolicyForSlug,
  summarizeSourceCoverage,
} from "../lib/market/automation/policy.ts"

let passed = 0
function ok(name, fn) {
  fn()
  passed += 1
  console.log(`ok: ${name}`)
}

ok("RCJAZ is a structural default source and sold-out pages remain context", () => {
  const policy = sourcePolicyForSlug("rcjaz_public", "retail")
  assert.equal(policy.role, "structural_reference")
  assert.equal(policy.includeByDefault, true)
  assert.equal(policy.unavailableProvidesContext, true)
  assert.equal(isCurrentPurchasableAvailability("out_of_stock"), false)
  assert.equal(shouldRetainUnavailableReference("rcjaz_public", "out_of_stock"), true)
})

ok("sold-out retail context can never masquerade as current purchasable stock", () => {
  assert.equal(isCurrentPurchasableAvailability("in_stock"), true)
  assert.equal(isCurrentPurchasableAvailability("low_stock"), true)
  assert.equal(isCurrentPurchasableAvailability("preorder"), false)
  assert.equal(isCurrentPurchasableAvailability("backorder"), false)
  assert.equal(isCurrentPurchasableAvailability("discontinued"), false)
})

ok("eBay active and Product Research are one independent market family", () => {
  const coverage = summarizeSourceCoverage([
    { slug: "ebay_active_public", sourceType: "marketplace" },
    { slug: "ebay_product_research", sourceType: "market_research" },
  ])
  assert.equal(coverage.independentSourceCount, 1)
  assert.equal(coverage.ebayOnly, true)
  assert.equal(coverageNeedsReview(coverage), true)
})

ok("pilot strategic coverage requires RCJAZ, eBay, completed sales and a non-eBay marketplace", () => {
  const coverage = summarizeSourceCoverage([
    { slug: "rcjaz_public", sourceType: "retail" },
    { slug: "ebay_active_public", sourceType: "marketplace" },
    { slug: "ebay_product_research", sourceType: "market_research" },
    { slug: "mercari_jp_public", sourceType: "marketplace" },
    { slug: "joshin_public", sourceType: "retail" },
  ])
  assert.equal(coverage.hasRcjaz, true)
  assert.equal(coverage.hasEbay, true)
  assert.equal(coverage.hasNonEbayMarketplace, true)
  assert.equal(coverage.hasCompletedSaleSource, true)
  assert.deepEqual(coverage.missingStrategicSources, [])
  assert.equal(coverageNeedsReview(coverage), false)
})

ok("missing RCJAZ is a coverage defect even with multiple other sources", () => {
  const coverage = summarizeSourceCoverage([
    { slug: "ebay_active_public", sourceType: "marketplace" },
    { slug: "ebay_product_research", sourceType: "market_research" },
    { slug: "mercari_jp_public", sourceType: "marketplace" },
    { slug: "joshin_public", sourceType: "retail" },
  ])
  assert.equal(coverage.hasRcjaz, false)
  assert.equal(coverage.missingStrategicSources.includes("rcjaz_public"), true)
  assert.equal(coverageNeedsReview(coverage), true)
})

ok("full-history and stale sold evidence stay historical, not current value", () => {
  const fullHistory = {
    stableId: "history",
    sourceId: "ebay-pr",
    averagePriceEUR: 15,
    salesCount: 20,
    periodStart: "2023-09-14",
    periodEnd: "2026-09-14",
    grain: "full_history",
    evidenceGrade: "indicative",
  }
  const staleEvent = {
    ...fullHistory,
    stableId: "stale",
    periodStart: "2024-01-01",
    periodEnd: "2024-01-01",
    grain: "event",
  }
  const recentWindow = {
    ...fullHistory,
    stableId: "recent",
    salesCount: 5,
    periodStart: "2026-06-01",
    periodEnd: "2026-09-01",
    grain: "rolling_window",
  }
  assert.equal(canFeedCurrentSoldAnchor(fullHistory, "2026-09-14"), false)
  assert.equal(canFeedCurrentSoldAnchor(staleEvent, "2026-09-14"), false)
  assert.equal(canFeedCurrentSoldAnchor(recentWindow, "2026-09-14"), true)
})

ok("default pilot plan always includes RCJAZ and excludes internal TrackDash scanning", () => {
  const policies = defaultPilotSourcePolicies([
    { slug: "trackdash_confirmed_sales", sourceType: "marketplace", isActive: true },
    { slug: "rcjaz_public", sourceType: "retail", isActive: true },
    { slug: "ebay_active_public", sourceType: "marketplace", isActive: true },
    { slug: "ebay_product_research", sourceType: "market_research", isActive: true },
    { slug: "mercari_jp_public", sourceType: "marketplace", isActive: true },
    { slug: "joshin_public", sourceType: "retail", isActive: true },
  ])
  const slugs = policies.map((policy) => policy.slug)
  assert.equal(slugs.includes("rcjaz_public"), true)
  assert.equal(slugs.includes("trackdash_confirmed_sales"), false)
  assert.equal(slugs.includes("mercari_jp_public"), true)
})

console.log(`${passed} passed, 0 failed`)
console.log("MARKET AUTOMATION V1 TEST PASSED")
