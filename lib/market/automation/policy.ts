import type { AvailabilityStatus, SoldMarketEvidence } from "../pipeline/market-model"

export const MARKET_AUTOMATION_POLICY_VERSION = "v1" as const

// Market Automation estimates the value of the exact Release today.
// Historical evidence is retained for context/trend, but it must not silently
// become the current headline merely because fresher evidence is unavailable.
export const CURRENT_SOLD_MAX_AGE_DAYS = 365
export const PREFERRED_SOLD_MAX_AGE_DAYS = 180

export type ScanScope = "retail" | "active_marketplace" | "sold_research"
export type SourceFamily = "ebay" | "mercari" | "trackdash" | `retail:${string}` | `other:${string}`
export type EvidenceRecency = "fresh" | "current" | "historical"
export type SourceRole =
  | "structural_reference"
  | "primary_marketplace"
  | "secondary_marketplace"
  | "retail_reference"
  | "supporting_retail"
  | "internal_sales"
  | "other"

export interface AcquisitionSourcePolicy {
  slug: string
  family: SourceFamily
  scope: ScanScope
  independentKey: string
  role: SourceRole
  includeByDefault: boolean
  currentOfferCapable: boolean
  completedSaleCapable: boolean
  unavailableProvidesContext: boolean
  defaultPriority: number
}

// RCJAZ is intentionally explicit rather than falling through the generic
// retail rule. Even when an exact kit is sold out, its page/price is valuable
// historical/reference context. Sold-out RCJAZ must NEVER become the current
// retail anchor or "Da", but the scanner should still seek and retain it.
const SOURCE_POLICIES: Record<string, AcquisitionSourcePolicy> = {
  rcjaz_public: {
    slug: "rcjaz_public",
    family: "retail:rcjaz_public",
    scope: "retail",
    independentKey: "retail:rcjaz_public",
    role: "structural_reference",
    includeByDefault: true,
    currentOfferCapable: true,
    completedSaleCapable: false,
    unavailableProvidesContext: true,
    defaultPriority: 100,
  },
  ebay_active_public: {
    slug: "ebay_active_public",
    family: "ebay",
    scope: "active_marketplace",
    independentKey: "marketplace:ebay",
    role: "primary_marketplace",
    includeByDefault: true,
    currentOfferCapable: true,
    completedSaleCapable: false,
    unavailableProvidesContext: false,
    defaultPriority: 95,
  },
  ebay_product_research: {
    slug: "ebay_product_research",
    family: "ebay",
    scope: "sold_research",
    independentKey: "marketplace:ebay",
    role: "primary_marketplace",
    includeByDefault: true,
    currentOfferCapable: false,
    completedSaleCapable: true,
    unavailableProvidesContext: false,
    defaultPriority: 100,
  },
  mercari_jp_public: {
    slug: "mercari_jp_public",
    family: "mercari",
    scope: "active_marketplace",
    independentKey: "marketplace:mercari",
    role: "secondary_marketplace",
    includeByDefault: true,
    currentOfferCapable: true,
    completedSaleCapable: false,
    unavailableProvidesContext: false,
    defaultPriority: 95,
  },
  tamiya_shop_public: {
    slug: "tamiya_shop_public",
    family: "retail:tamiya_shop_public",
    scope: "retail",
    independentKey: "retail:tamiya_shop_public",
    role: "retail_reference",
    includeByDefault: true,
    currentOfferCapable: true,
    completedSaleCapable: false,
    unavailableProvidesContext: true,
    defaultPriority: 90,
  },
  joshin_public: {
    slug: "joshin_public",
    family: "retail:joshin_public",
    scope: "retail",
    independentKey: "retail:joshin_public",
    role: "retail_reference",
    includeByDefault: true,
    currentOfferCapable: true,
    completedSaleCapable: false,
    unavailableProvidesContext: true,
    defaultPriority: 85,
  },
  plamoya_public: {
    slug: "plamoya_public",
    family: "retail:plamoya_public",
    scope: "retail",
    independentKey: "retail:plamoya_public",
    role: "supporting_retail",
    includeByDefault: true,
    currentOfferCapable: true,
    completedSaleCapable: false,
    unavailableProvidesContext: true,
    defaultPriority: 75,
  },
  pieroni_public: {
    slug: "pieroni_public",
    family: "retail:pieroni_public",
    scope: "retail",
    independentKey: "retail:pieroni_public",
    role: "supporting_retail",
    includeByDefault: true,
    currentOfferCapable: true,
    completedSaleCapable: false,
    unavailableProvidesContext: true,
    defaultPriority: 75,
  },
  trackdash_confirmed_sales: {
    slug: "trackdash_confirmed_sales",
    family: "trackdash",
    scope: "sold_research",
    independentKey: "marketplace:trackdash",
    role: "internal_sales",
    includeByDefault: false,
    currentOfferCapable: false,
    completedSaleCapable: true,
    unavailableProvidesContext: false,
    defaultPriority: 100,
  },
}

export function sourcePolicyForSlug(slug: string, sourceType?: string | null): AcquisitionSourcePolicy {
  const known = SOURCE_POLICIES[slug]
  if (known) return known

  if (sourceType === "retail") {
    return {
      slug,
      family: `retail:${slug}`,
      scope: "retail",
      independentKey: `retail:${slug}`,
      role: "supporting_retail",
      includeByDefault: false,
      currentOfferCapable: true,
      completedSaleCapable: false,
      unavailableProvidesContext: true,
      defaultPriority: 50,
    }
  }

  return {
    slug,
    family: `other:${slug}`,
    scope: "active_marketplace",
    independentKey: `other:${slug}`,
    role: "other",
    includeByDefault: false,
    currentOfferCapable: true,
    completedSaleCapable: false,
    unavailableProvidesContext: false,
    defaultPriority: 40,
  }
}

export function isCurrentPurchasableAvailability(availability: AvailabilityStatus): boolean {
  // Preorder/backorder are useful market context but are not a product a collector
  // can buy now. Sold-out/discontinued/unknown states must never become "Da" or a
  // current retail anchor.
  return availability === "in_stock" || availability === "low_stock"
}

export function shouldRetainUnavailableReference(slug: string, availability: AvailabilityStatus): boolean {
  if (isCurrentPurchasableAvailability(availability)) return true
  return sourcePolicyForSlug(slug).unavailableProvidesContext
}

function dateMs(value: string): number {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value
  const parsed = Date.parse(normalized)
  if (!Number.isFinite(parsed)) throw new Error(`Invalid date: ${value}`)
  return parsed
}

export function evidenceRecency(periodEnd: string, asOfDate: string): EvidenceRecency {
  const ageDays = Math.max(0, (dateMs(asOfDate) - dateMs(periodEnd)) / 86_400_000)
  if (ageDays <= PREFERRED_SOLD_MAX_AGE_DAYS) return "fresh"
  if (ageDays <= CURRENT_SOLD_MAX_AGE_DAYS) return "current"
  return "historical"
}

export function canFeedCurrentSoldAnchor(evidence: SoldMarketEvidence, asOfDate: string): boolean {
  if (evidenceRecency(evidence.periodEnd, asOfDate) === "historical") return false

  // A 3-year/full-history average remains valuable provenance, but it is not a
  // snapshot of today's market. Current headline evidence must be an event,
  // recent monthly data or a qualified recent rolling window.
  if (evidence.grain === "full_history") return false

  return evidence.salesCount > 0 && evidence.averagePriceEUR > 0
}

export interface SourceCoverage {
  sourceCount: number
  independentSourceCount: number
  marketplaceFamilies: string[]
  retailSources: string[]
  hasEbay: boolean
  hasNonEbay: boolean
  hasNonEbayMarketplace: boolean
  hasRcjaz: boolean
  hasCompletedSaleSource: boolean
  ebayOnly: boolean
  missingStrategicSources: string[]
}

export function summarizeSourceCoverage(
  sources: Array<{ slug: string; sourceType?: string | null }>,
): SourceCoverage {
  const policies = sources.map((source) => sourcePolicyForSlug(source.slug, source.sourceType))
  const independent = new Set(policies.map((policy) => policy.independentKey))
  const marketplaceFamilies = [...new Set(
    policies
      .filter((policy) => policy.family === "ebay" || policy.family === "mercari" || policy.family === "trackdash")
      .map((policy) => policy.family),
  )]
  const retailSources = [...new Set(
    policies.filter((policy) => policy.scope === "retail").map((policy) => policy.slug),
  )]
  const hasEbay = policies.some((policy) => policy.family === "ebay")
  const hasNonEbay = policies.some((policy) => policy.family !== "ebay")
  const hasNonEbayMarketplace = policies.some(
    (policy) => policy.family === "mercari" || policy.family === "trackdash" || (policy.scope === "active_marketplace" && policy.family !== "ebay"),
  )
  const hasRcjaz = policies.some((policy) => policy.slug === "rcjaz_public")
  const hasCompletedSaleSource = policies.some((policy) => policy.completedSaleCapable)
  const missingStrategicSources: string[] = []

  if (!hasRcjaz) missingStrategicSources.push("rcjaz_public")
  if (!hasEbay) missingStrategicSources.push("ebay")
  if (!hasNonEbayMarketplace) missingStrategicSources.push("non_ebay_marketplace")
  if (!hasCompletedSaleSource) missingStrategicSources.push("completed_sales")

  return {
    sourceCount: policies.length,
    independentSourceCount: independent.size,
    marketplaceFamilies,
    retailSources,
    hasEbay,
    hasNonEbay,
    hasNonEbayMarketplace,
    hasRcjaz,
    hasCompletedSaleSource,
    ebayOnly: hasEbay && !hasNonEbay,
    missingStrategicSources,
  }
}

export function coverageNeedsReview(coverage: SourceCoverage): boolean {
  // This does not invent or suppress prices by itself. It flags acquisition that
  // is overly concentrated, so the scanner can seek corroboration instead of
  // silently treating eBay as the entire market.
  return (
    coverage.ebayOnly ||
    coverage.independentSourceCount < 2 ||
    !coverage.hasRcjaz ||
    !coverage.hasNonEbayMarketplace ||
    !coverage.hasCompletedSaleSource
  )
}

export function defaultPilotSourcePolicies(
  sources: Array<{ slug: string; sourceType?: string | null; isActive?: boolean }>,
): AcquisitionSourcePolicy[] {
  return sources
    .filter((source) => source.isActive !== false)
    .map((source) => sourcePolicyForSlug(source.slug, source.sourceType))
    .filter((policy) => policy.includeByDefault && policy.role !== "internal_sales")
    .sort((a, b) => {
      if (a.defaultPriority !== b.defaultPriority) return b.defaultPriority - a.defaultPriority
      return a.slug.localeCompare(b.slug)
    })
}
