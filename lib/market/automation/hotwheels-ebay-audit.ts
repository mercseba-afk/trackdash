import "server-only"

import { createClient } from "@supabase/supabase-js"
import {
  dedupeEbayListings,
  fetchEbayActiveItemDetails,
  searchEbayActiveListingsByQuery,
  type EbayBrowseListing,
  type EbayMarketplaceId,
} from "./ebay-browse-adapter"
import {
  buildHotWheelsEbayQueries,
  classifyHotWheelsEbayListing,
  refineHotWheelsEbayListingWithItemDetails,
  type HotWheelsCommercialForm,
  type HotWheelsEbayReleaseProfile,
} from "./hotwheels-ebay-matcher"
import { COLLECTIBLE_VERTICALS } from "@/lib/verticals"

const EU_MARKETPLACES: EbayMarketplaceId[] = ["EBAY_IT", "EBAY_DE", "EBAY_FR", "EBAY_ES", "EBAY_GB"]

type CatalogProductRow = {
  id: string
  name: string
}

type CatalogReleaseRow = {
  id: string
  product_id: string
  release_year: number | null
}

type IdentifierRow = {
  release_id: string
  value: string
  is_primary: boolean
}

type DetailRow = {
  release_id: string
  line_name: string
  subseries: string | null
  collector_number: string | null
  series_position: string | null
  chase_type: string | null
  packaging_variant: string | null
}

export type HotWheelsAskAuditListing = EbayBrowseListing & {
  queryIndex: number
  decision: "accepted" | "needs_review" | "rejected"
  reasonCodes: string[]
  detailLookup: "not_needed" | "matched" | "no_match" | "failed" | "limit_reached"
}

export type HotWheelsAskAuditResult = {
  releaseId: string
  castingName: string
  primaryIdentifier: string
  queries: string[]
  rawByMarketplace: Partial<Record<EbayMarketplaceId, number>>
  uniqueListings: number
  accepted: number
  review: number
  rejected: number
  listings: HotWheelsAskAuditListing[]
}

function publicCatalogClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error("HOTWHEELS_AUDIT_SUPABASE_PUBLIC_CONFIG_MISSING")

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}

function commercialForm(detail: DetailRow): HotWheelsCommercialForm {
  const line = detail.line_name.toLowerCase()
  const packaging = (detail.packaging_variant ?? "").toLowerCase()

  if (line.includes("team transport") || packaging.includes("two-vehicle")) return "team_transport"
  if (line.includes("2-pack") || packaging.includes("2-pack")) return "two_pack"
  if (line.includes("red line club") || line === "rlc") return "club_exclusive"
  return "single"
}

async function loadHotWheelsAuditProfiles(): Promise<HotWheelsEbayReleaseProfile[]> {
  const client = publicCatalogClient()

  const { data: products, error: productsError } = await client
    .from("products")
    .select("id,name")
    .eq("category_id", COLLECTIBLE_VERTICALS.hotwheels.categoryId)
  if (productsError) throw new Error(`HOTWHEELS_AUDIT_PRODUCTS_READ_FAILED: ${productsError.message}`)

  const typedProducts = (products ?? []) as CatalogProductRow[]
  if (!typedProducts.length) return []
  const productIds = typedProducts.map((row) => row.id)
  const productById = new Map(typedProducts.map((row) => [row.id, row]))

  const { data: releases, error: releasesError } = await client
    .from("product_releases")
    .select("id,product_id,release_year")
    .in("product_id", productIds)
  if (releasesError) throw new Error(`HOTWHEELS_AUDIT_RELEASES_READ_FAILED: ${releasesError.message}`)

  const typedReleases = (releases ?? []) as CatalogReleaseRow[]
  if (!typedReleases.length) return []
  const releaseIds = typedReleases.map((row) => row.id)

  const [{ data: identifiers, error: identifiersError }, { data: details, error: detailsError }] = await Promise.all([
    client
      .from("release_identifiers")
      .select("release_id,value,is_primary")
      .in("release_id", releaseIds),
    client
      .from("hotwheels_release_details")
      .select("release_id,line_name,subseries,collector_number,series_position,chase_type,packaging_variant")
      .in("release_id", releaseIds),
  ])
  if (identifiersError) throw new Error(`HOTWHEELS_AUDIT_IDENTIFIERS_READ_FAILED: ${identifiersError.message}`)
  if (detailsError) throw new Error(`HOTWHEELS_AUDIT_DETAILS_READ_FAILED: ${detailsError.message}`)

  const identifiersByRelease = new Map<string, IdentifierRow[]>()
  for (const row of (identifiers ?? []) as IdentifierRow[]) {
    const bucket = identifiersByRelease.get(row.release_id) ?? []
    bucket.push(row)
    identifiersByRelease.set(row.release_id, bucket)
  }

  const detailsByRelease = new Map(
    ((details ?? []) as DetailRow[]).map((row) => [row.release_id, row]),
  )

  const identifiersByProduct = new Map<string, string[]>()
  for (const release of typedReleases) {
    const codes = identifiersByRelease.get(release.id) ?? []
    const bucket = identifiersByProduct.get(release.product_id) ?? []
    for (const code of codes) if (!bucket.includes(code.value)) bucket.push(code.value)
    identifiersByProduct.set(release.product_id, bucket)
  }

  return typedReleases.flatMap((release) => {
    const product = productById.get(release.product_id)
    const detail = detailsByRelease.get(release.id)
    const codes = identifiersByRelease.get(release.id) ?? []
    const primary = codes.find((row) => row.is_primary) ?? codes[0]

    if (!product || !detail || !primary?.value) return []

    return [{
      releaseId: release.id,
      castingName: product.name,
      releaseYear: release.release_year,
      primaryIdentifier: primary.value,
      lineName: detail.line_name,
      subseries: detail.subseries,
      collectorNumber: detail.collector_number,
      seriesPosition: detail.series_position,
      chaseType: detail.chase_type,
      commercialForm: commercialForm(detail),
      siblingIdentifiers: (identifiersByProduct.get(release.product_id) ?? [])
        .filter((value) => value !== primary.value),
    }]
  })
}

export async function listHotWheelsEbayAuditProfiles(): Promise<HotWheelsEbayReleaseProfile[]> {
  return loadHotWheelsAuditProfiles()
}

export async function runHotWheelsEbayAskAuditForRelease(
  releaseId: string,
  options: {
    marketplaces?: EbayMarketplaceId[]
    perQueryLimit?: number
    includeFallbackQuery?: boolean
    maxDetailLookups?: number
  } = {},
): Promise<HotWheelsAskAuditResult> {
  const profiles = await loadHotWheelsAuditProfiles()
  const profile = profiles.find((candidate) => candidate.releaseId === releaseId)
  if (!profile) throw new Error("HOTWHEELS_AUDIT_RELEASE_NOT_FOUND")

  const marketplaces = options.marketplaces ?? EU_MARKETPLACES
  const perQueryLimit = Math.max(1, Math.min(options.perQueryLimit ?? 10, 25))
  const allQueries = buildHotWheelsEbayQueries(profile)
  const queries = options.includeFallbackQuery ? allQueries : allQueries.slice(0, 1)
  const maxDetailLookups = Math.max(0, Math.min(options.maxDetailLookups ?? 8, 20))

  const rows: Array<EbayBrowseListing & { queryIndex: number }> = []
  const rawByMarketplace: Partial<Record<EbayMarketplaceId, number>> = {}

  for (const marketplace of marketplaces) {
    let count = 0
    for (const [queryIndex, query] of queries.entries()) {
      const found = await searchEbayActiveListingsByQuery(query, marketplace, perQueryLimit)
      count += found.length
      rows.push(...found.map((listing) => ({ ...listing, queryIndex })))
    }
    rawByMarketplace[marketplace] = count
  }

  const queryIndexByItem = new Map<string, number>()
  for (const row of rows) {
    if (!queryIndexByItem.has(row.itemId)) queryIndexByItem.set(row.itemId, row.queryIndex)
  }

  const unique = dedupeEbayListings(rows)
  const listings: HotWheelsAskAuditListing[] = []
  let detailLookups = 0

  for (const listing of unique) {
    const initial = classifyHotWheelsEbayListing(listing, profile)
    let classification = initial
    let detailLookup: HotWheelsAskAuditListing["detailLookup"] = "not_needed"

    const canEnrichIdentity = initial.decision === "needs_review" &&
      initial.reasonCodes.includes("IDENTIFIER_NOT_IN_TITLE")

    if (canEnrichIdentity) {
      if (detailLookups >= maxDetailLookups) {
        detailLookup = "limit_reached"
      } else {
        detailLookups += 1
        try {
          const details = await fetchEbayActiveItemDetails(listing.itemId, listing.marketplace)
          if (details) {
            classification = refineHotWheelsEbayListingWithItemDetails(initial, details, profile)
            detailLookup = classification.decision === "accepted" || classification.decision === "rejected"
              ? "matched"
              : "no_match"
          } else {
            detailLookup = "no_match"
          }
        } catch {
          detailLookup = "failed"
          classification = {
            decision: initial.decision,
            reasonCodes: [...initial.reasonCodes, "ITEM_DETAILS_LOOKUP_FAILED"],
          }
        }
      }
    }

    listings.push({
      ...listing,
      queryIndex: queryIndexByItem.get(listing.itemId) ?? 0,
      decision: classification.decision,
      reasonCodes: classification.reasonCodes,
      detailLookup,
    })
  }

  return {
    releaseId,
    castingName: profile.castingName,
    primaryIdentifier: profile.primaryIdentifier,
    queries,
    rawByMarketplace,
    uniqueListings: listings.length,
    accepted: listings.filter((row) => row.decision === "accepted").length,
    review: listings.filter((row) => row.decision === "needs_review").length,
    rejected: listings.filter((row) => row.decision === "rejected").length,
    listings,
  }
}
