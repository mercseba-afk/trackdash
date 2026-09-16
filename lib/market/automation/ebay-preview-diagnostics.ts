import "server-only"

import { resolveHistoricalEurBasis } from "@/lib/fx/ecb"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Currency } from "@/lib/types"
import {
  classifyEbayActiveListing,
  dedupeEbayListings,
  searchEbayActiveListings,
  type EbayMarketplaceId,
} from "./ebay-browse-adapter"
import { guardAutomatedPrice } from "./price-guard"

const MARKETPLACES: EbayMarketplaceId[] = ["EBAY_IT", "EBAY_DE", "EBAY_GB", "EBAY_US"]
const SUPPORTED_CURRENCIES = new Set<Currency>(["EUR", "USD", "JPY", "GBP"])

function n(value: unknown): number | null {
  if (value == null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function median(values: number[]): number | null {
  const clean = values.filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b)
  if (!clean.length) return null
  const middle = Math.floor(clean.length / 2)
  return clean.length % 2 ? clean[middle] : (clean[middle - 1] + clean[middle]) / 2
}

export async function runEbayPreviewDiagnostics(releaseId: string, jobId: string) {
  const client = createAdminClient()
  const [{ data: release, error: releaseError }, { data: job, error: jobError }] = await Promise.all([
    client.from("product_releases").select("id,item_number,edition_name,release_year").eq("id", releaseId).single(),
    client.from("market_scan_queue").select("id,source_id").eq("id", jobId).eq("release_id", releaseId).single(),
  ])
  if (releaseError || !release?.item_number) throw new Error("EBAY_PREVIEW_DIAGNOSTIC_RELEASE_LOAD_FAILED")
  if (jobError || !job?.source_id) throw new Error("EBAY_PREVIEW_DIAGNOSTIC_JOB_LOAD_FAILED")

  const [{ data: siblings, error: siblingsError }, { data: signal, error: signalError }, { data: offers, error: offersError }] = await Promise.all([
    client.from("product_releases").select("id").eq("item_number", release.item_number),
    client.from("market_release_signals").select("market_value_eur,sold_anchor_eur,confidence_label").eq("release_id", releaseId).eq("condition", "new_complete_unbuilt").maybeSingle(),
    client.from("market_offer_states").select("source_id,item_price_eur,availability").eq("release_id", releaseId).eq("condition", "new_complete_unbuilt").in("availability", ["in_stock", "low_stock"]),
  ])
  if (siblingsError) throw new Error("EBAY_PREVIEW_DIAGNOSTIC_SIBLINGS_LOAD_FAILED")
  if (signalError) throw new Error("EBAY_PREVIEW_DIAGNOSTIC_SIGNAL_LOAD_FAILED")
  if (offersError) throw new Error("EBAY_PREVIEW_DIAGNOSTIC_OFFERS_LOAD_FAILED")

  const bySource = new Map<string, number[]>()
  for (const row of offers ?? []) {
    if (row.source_id === job.source_id) continue
    const value = n(row.item_price_eur)
    if (value == null || value <= 0) continue
    const bucket = bySource.get(row.source_id) ?? []
    bucket.push(value)
    bySource.set(row.source_id, bucket)
  }

  const referenceValues: number[] = []
  for (const bucket of bySource.values()) {
    const value = median(bucket)
    if (value != null) referenceValues.push(value)
  }
  const sold = n(signal?.sold_anchor_eur)
  if (sold != null && sold > 0) referenceValues.push(sold)
  if (!referenceValues.length) {
    const mv = n(signal?.market_value_eur)
    if (mv != null && mv > 0) referenceValues.push(mv)
  }

  const confidence = signal?.confidence_label === "low" || signal?.confidence_label === "medium" || signal?.confidence_label === "high"
    ? signal.confidence_label
    : null
  const input = {
    itemNumber: release.item_number,
    editionName: release.edition_name,
    releaseYear: release.release_year,
    itemNumberIsShared: (siblings ?? []).length > 1,
  }

  const rows = [] as Awaited<ReturnType<typeof searchEbayActiveListings>>
  const marketplaceCounts: Partial<Record<EbayMarketplaceId, number>> = {}
  const marketplaceErrors: Partial<Record<EbayMarketplaceId, string>> = {}
  for (const marketplace of MARKETPLACES) {
    try {
      const found = await searchEbayActiveListings(input, marketplace, 5)
      marketplaceCounts[marketplace] = found.length
      rows.push(...found)
    } catch (error) {
      marketplaceErrors[marketplace] = error instanceof Error ? error.message.split(":", 1)[0] : "EBAY_PREVIEW_DIAGNOSTIC_FETCH_FAILED"
    }
  }

  const unique = dedupeEbayListings(rows)
  const observedOn = new Date().toISOString().slice(0, 10)
  const listings = []
  for (const listing of unique) {
    const classification = classifyEbayActiveListing(listing, input)
    let decision = classification.decision
    let reasonCodes = [...classification.reasonCodes]
    let priceEUR: number | null = null
    let guardBaselineEUR: number | null = null

    if (decision === "accepted") {
      const currency = listing.currency.toUpperCase() as Currency
      if (!SUPPORTED_CURRENCIES.has(currency)) {
        decision = "needs_review"
        reasonCodes = ["UNSUPPORTED_CURRENCY"]
      } else {
        const fx = await resolveHistoricalEurBasis(listing.price, currency, observedOn)
        priceEUR = fx.amountEUR
        if (priceEUR == null) {
          decision = "needs_review"
          reasonCodes = ["FX_RATE_UNAVAILABLE"]
        } else {
          const guard = guardAutomatedPrice({
            priceEUR,
            availability: "in_stock",
            independentReferenceEUR: referenceValues,
            headlineConfidence: confidence,
          })
          guardBaselineEUR = guard.baselineEUR
          if (guard.decision === "review") {
            decision = "needs_review"
            reasonCodes = guard.reasonCodes
          }
        }
      }
    }

    listings.push({
      itemId: listing.itemId,
      title: listing.title,
      url: listing.itemWebUrl,
      marketplace: listing.marketplace,
      price: listing.price,
      currency: listing.currency,
      shipping: listing.shipping,
      conditionId: listing.conditionId,
      condition: listing.condition,
      decision,
      reasonCodes,
      priceEUR,
      guardBaselineEUR,
    })
  }

  return {
    marketplaceCounts,
    marketplaceErrors,
    uniqueListings: unique.length,
    referenceValuesEUR: referenceValues,
    headlineConfidence: confidence,
    listings,
  }
}
