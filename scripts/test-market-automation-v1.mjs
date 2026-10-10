import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import {
  canFeedCurrentSoldAnchor,
  coverageNeedsReview,
  defaultPilotSourcePolicies,
  isCurrentPurchasableAvailability,
  shouldRetainUnavailableReference,
  sourcePolicyForSlug,
  summarizeSourceCoverage,
} from "../lib/market/automation/policy.ts"
import { collectorScanIntervalHours, ebayCollectorScanIntervalHours, marketActivityMateriallyChanged, materialPriceChange } from "../lib/market/automation/market-activity.ts"
import { isObservedRetailSellThrough } from "../lib/market/automation/retail-sell-through.ts"
import { classifySoldRecovery, hasThinSoldHistoricalCorroboration } from "../lib/market/automation/sold-recovery-classifier.ts"

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

ok("collector-market cadence ignores listing-count churn when availability remains present", () => {
  const before = {
    marketValueEUR: null,
    soldAnchorEUR: null,
    activeAnchorEUR: 40,
    startingEffectiveCostEUR: 45,
    currentOfferCount: 2,
  }
  const after = { ...before, currentOfferCount: 5 }
  assert.equal(marketActivityMateriallyChanged(before, after), false)
})

ok("collector-market cadence reacts to meaningful ASK moves and market availability", () => {
  const base = {
    marketValueEUR: null,
    soldAnchorEUR: null,
    activeAnchorEUR: 40,
    startingEffectiveCostEUR: 45,
    currentOfferCount: 2,
  }
  assert.equal(marketActivityMateriallyChanged(base, { ...base, activeAnchorEUR: 41 }), false)
  assert.equal(marketActivityMateriallyChanged(base, { ...base, activeAnchorEUR: 42 }), true)
  assert.equal(marketActivityMateriallyChanged(base, { ...base, currentOfferCount: 0 }), true)
})

ok("eBay collector cadence stays sparse even for materially active Releases", () => {
  assert.equal(ebayCollectorScanIntervalHours("hot"), 28 * 24)
  assert.equal(ebayCollectorScanIntervalHours("normal"), 42 * 24)
  assert.equal(ebayCollectorScanIntervalHours("cold"), 84 * 24)
  assert.equal(ebayCollectorScanIntervalHours("unknown"), 42 * 24)
})

ok("exact retail uses the same sparse collector cadence", () => {
  assert.equal(collectorScanIntervalHours("hot"), 28 * 24)
  assert.equal(collectorScanIntervalHours("normal"), 42 * 24)
  assert.equal(collectorScanIntervalHours("cold"), 84 * 24)
})

ok("retail price cadence ignores sub-5-percent noise", () => {
  assert.equal(materialPriceChange(20, 20.99), false)
  assert.equal(materialPriceChange(20, 21), true)
  assert.equal(materialPriceChange(20, 19), true)
})

ok("retail sell-through requires an observed available-to-unavailable transition", () => {
  assert.equal(isObservedRetailSellThrough("in_stock", "out_of_stock"), true)
  assert.equal(isObservedRetailSellThrough("low_stock", "discontinued"), true)
  assert.equal(isObservedRetailSellThrough(null, "out_of_stock"), false)
  assert.equal(isObservedRetailSellThrough("unknown", "out_of_stock"), false)
  assert.equal(isObservedRetailSellThrough("out_of_stock", "out_of_stock"), false)
  assert.equal(isObservedRetailSellThrough("preorder", "out_of_stock"), false)
})

// DB-trigger regression contract for new/old public Release first-signal enrollment.
// The production migration is the single authority for the SQL trigger semantics.
const initialCoverageSql = readFileSync(
  new URL("../supabase/migrations/0223_market_first_public_recompute_dynamic_coverage.sql", import.meta.url),
  "utf8",
)

ok("new verified public Releases get canonical first-signal enrollment dynamically", () => {
  assert.match(initialCoverageSql, /after insert or update of catalog_visibility, verification_status, product_id/i)
  assert.match(initialCoverageSql, /c\.slug = 'mini4wd'/)
  assert.match(initialCoverageSql, /r\.catalog_visibility = 'public'/)
  assert.match(initialCoverageSql, /r\.verification_status = 'verified'/)
  assert.match(initialCoverageSql, /p\.metadata->>'launch_status' = 'available'/)
})

ok("coming-soon to available family transitions also enroll existing public Releases", () => {
  assert.match(initialCoverageSql, /after update of metadata on public\.products/i)
  assert.match(initialCoverageSql, /old\.metadata->>'launch_status' is distinct from 'available'/)
  assert.match(initialCoverageSql, /select r\.id[\s\S]*?where r\.product_id = new\.id/)
})

ok("initial recompute never resets existing signals or in-flight jobs", () => {
  assert.match(initialCoverageSql, /exists \([\s\S]*?public\.market_release_signals/)
  assert.match(initialCoverageSql, /exists \([\s\S]*?public\.market_recompute_queue/)
  assert.match(initialCoverageSql, /perform public\.trackdash_enqueue_market_recompute\(/)
  assert.match(initialCoverageSql, /'new_complete_unbuilt'/)
})

ok("dynamic missing-signal backfill cannot alter Price Engine, scans or send notifications", () => {
  assert.match(initialCoverageSql, /not exists \([\s\S]*?public\.market_release_signals/)
  assert.match(initialCoverageSql, /not exists \([\s\S]*?public\.market_recompute_queue/)
  assert.doesNotMatch(initialCoverageSql, /\b(insert|update|delete)\s+(?:into\s+|from\s+)?public\.(?:market_release_signals|price_points|market_candidates|market_offer_states|notifications)\b/i)
  assert.doesNotMatch(initialCoverageSql, /\b(?:item_number|barcode_jan)\s*=/i)
})

const current95525 = {
  sourceId: "ebay-research", attributionStatus: "release_exact", grain: "rolling_window",
  periodStart: "2025-09-10", periodEnd: "2026-04-06", salesCount: 3, sellerCount: null,
  averageEUR: 48.79, evidenceGrade: "indicative",
}
const history95525 = {
  sourceId: "ebay-research", attributionStatus: "release_exact", grain: "full_history",
  periodStart: "2023-09-11", periodEnd: "2026-04-06", salesCount: 18, sellerCount: 6,
  averageEUR: 40.09, evidenceGrade: "indicative",
}

ok("SOLD recovery is dynamic, only recognizes corroboration without creating a numeric MV", () => {
  const input = { marketValueEUR: null, soldUnits: 3, soldAnchorEUR: 48.79,
    aggregates: [current95525, history95525], asOfDate: "2026-10-10" }
  assert.equal(hasThinSoldHistoricalCorroboration(input), true)
  assert.equal(classifySoldRecovery(input), "corroboration_candidate")
  assert.equal(classifySoldRecovery({ ...input, marketValueEUR: 48.79 }), "valued")
  assert.equal(classifySoldRecovery({ ...input, soldUnits: 1 }), "single_sold")
  assert.equal(classifySoldRecovery({ ...input, soldUnits: 2 }), "thin_sold")
  assert.equal(classifySoldRecovery({ ...input, soldUnits: 0, soldAnchorEUR: null }), "no_sold")
})

ok("SOLD recovery cannot treat historic single-seller, foreign-source or ambiguous editions as valid", () => {
  const input = { marketValueEUR: null, soldUnits: 3, soldAnchorEUR: 48.79,
    aggregates: [current95525, history95525], asOfDate: "2026-10-10" }
  for (const changed of [
    { ...history95525, sellerCount: 1 },
    { ...history95525, sourceId: "other" },
    { ...history95525, attributionStatus: "release_matched" },
    { ...history95525, salesCount: 7 },
    { ...history95525, averageEUR: 130 },
    { ...history95525, periodStart: "2026-05-01" },
  ]) {
    assert.equal(classifySoldRecovery({ ...input, aggregates: [current95525, changed] }), "thin_sold")
  }
  assert.equal(classifySoldRecovery({ ...input, aggregates: [{ ...current95525, attributionStatus: "release_matched" }, history95525] }), "thin_sold")
  assert.equal(classifySoldRecovery({ ...input, soldAnchorEUR: 48.0 }), "thin_sold")
  assert.equal(classifySoldRecovery({ ...input, asOfDate: "2027-11-01" }), "thin_sold")
})

ok("SOLD recovery Admin is authenticated and diagnostic-only; canonical worker remains authoritative", () => {
  const action = readFileSync(new URL("../lib/actions/admin.ts", import.meta.url), "utf8")
  const report = readFileSync(new URL("../lib/market/automation/sold-recovery-report.ts", import.meta.url), "utf8")
  const admin = readFileSync(new URL("../components/screens/admin-screen.tsx", import.meta.url), "utf8")
  assert.match(action, /export async function getAdminMini4wdSoldRecoveryAction\(\)\s*\{\s*await requireAdmin\(\)/)
  assert.match(action, /return getMini4wdSoldRecoveryReport\(\)/)
  assert.match(admin, /Mini4wdSoldRecoveryAudit refreshKey=\{marketAuditRefreshKey\}/)
  assert.match(report, /classifySoldRecovery\(/)
  assert.match(report, /market_aggregate_observations/)
  assert.match(report, /market_release_signals/)
  assert.match(report, /market_recompute_queue/)
  assert.doesNotMatch(report, /\.(?:insert|update|upsert|delete|rpc)\(/)
})

console.log(`${passed} passed, 0 failed`)
console.log("MARKET AUTOMATION V1 TEST PASSED")
