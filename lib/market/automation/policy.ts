import type { AvailabilityStatus, SoldMarketEvidence } from "../pipeline/market-model"

export const MARKET_AUTOMATION_POLICY_VERSION = "v1" as const

// Market Automation is designed to estimate the value of the Release today.
// Historical evidence is retained for context/trend, but it must not silently
// become the current headline merely because fresher evidence is unavailable.
export const CURRENT_SOLD_MAX_AGE_DAYS = 365
export const PREFERRED_SOLD_MAX_AGE_DAYS = 180

export type ScanScope = "retail" | "active_marketplace" | "sold_research"
export type SourceFamily = "ebay" | "mercari" | "trackdash" | `retail:${string}` | `other:${string}`
export type EvidenceRecency = "fresh" | "current" | "historical"

export interface AcquisitionSourcePolicy {
  slug: string
  family: SourceFamily
  scope: ScanScope
  independentKey: string
  currentOfferCapable: boolean
  completedSaleCapable: boolean
}

const SOURCE_POLICIES: Record<string, AcquisitionSourcePolicy> = {
  ebay_active_public: {
    slug: "ebay_active_public",
    family: "ebay",
    scope: "active_marketplace",
    independentKey: "marketplace:ebay",
    currentOfferCapable: true,
    completedSaleCapable: false,
  },
  ebay_product_research: {
    slug: "ebay_product_research",
    family: "ebay",
    scope: "sold_research",
    independentKey: "marketplace:ebay",
    currentOfferCapable: false,
    completedSaleCapable: true,
  },
  mercari_jp_public: {
    slug: "mercari_jp_public",
    family: "mercari",
    scope: "active_marketplace",
    independentKey: "marketplace:mercari",
    currentOfferCapable: true,
    completedSaleCapable: false,
  },
  trackdash_confirmed_sales: {
    slug: "trackdash_confirmed_sales",
    family: "trackdash",
    scope: "sold_research",
    independentKey: "marketplace:trackdash",
    currentOfferCapable: false,
    completedSaleCapable: true,
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
      currentOfferCapable: true,
      completedSaleCapable: false,
    }
  }

  return {
    slug,
    family: `other:${slug}`,
    scope: "active_marketplace",
    independentKey: `other:${slug}`,
    currentOfferCapable: true,
    completedSaleCapable: false,
  }
}

export function isCurrentPurchasableAvailability(availability: AvailabilityStatus): boolean {
  // Preorder/backorder are useful market context but are not a product a collector
  // can buy now. Sold-out/discontinued/unknown states must never become "Da" or a
  // current retail anchor.
  return availability === "in_stock" || availability === "low_stock"
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
  ebayOnly: boolean
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

  return {
    sourceCount: policies.length,
    independentSourceCount: independent.size,
    marketplaceFamilies,
    retailSources,
    hasEbay,
    hasNonEbay,
    ebayOnly: hasEbay && !hasNonEbay,
  }
}

export function coverageNeedsReview(coverage: SourceCoverage): boolean {
  // This does not invent or suppress prices by itself. It flags acquisition that
  // is overly concentrated, so the scanner can seek corroboration instead of
  // silently treating eBay as the entire market.
  return coverage.ebayOnly || coverage.independentSourceCount < 2
}
