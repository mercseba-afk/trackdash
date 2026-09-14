import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { resolveHistoricalEurBasis } from "@/lib/fx/ecb"
import type { Currency } from "@/lib/types"
import { createAdminClient } from "@/lib/supabase/admin"
import { MarketR3Repository } from "@/lib/market/pipeline/market-r3-repository"
import { recomputeReleaseMarketSignal } from "@/lib/market/pipeline/market-r3-service"
import {
  classifyEbayActiveListing,
  dedupeEbayListings,
  ebayBrowseConfigured,
  searchEbayActiveListings,
  type EbayBrowseListing,
  type EbayMarketplaceId,
} from "./ebay-browse-adapter"
import { guardAutomatedPrice } from "./price-guard"

const MARKETPLACES: EbayMarketplaceId[] = ["EBAY_IT", "EBAY_DE", "EBAY_GB", "EBAY_US"]
const SUPPORTED_CURRENCIES = new Set<Currency>(["EUR", "USD", "JPY", "GBP"])

interface ClaimedEbayJob {
  job_id: string
  release_id: string
  source_id: string
  source_slug: string
  scan_scope: string
  activity_tier: string
  priority: number
}

interface ReleaseContext {
  id: string
  itemNumber: string
  editionName: string
  releaseYear: number | null
  sharedReleaseIds: string[]
}

interface ExistingOffer {
  candidateId: string
  availability: string
  itemPrice: number
  shippingPrice: number | null
  currency: string
  itemPriceEUR: number
  shippingEUR: number | null
  fxRateToEUR: number | null
  fxRateDate: string | null
}

export interface EbayJobResult {
  jobId: string
  releaseId: string
  status: "accepted" | "review" | "failed"
  found: number
  accepted: number
  review: number
  rejected: number
  materialChange: boolean
  reasonCodes: string[]
}

export interface EbayRunResult {
  configured: boolean
  runId: string | null
  attempted: number
  succeeded: number
  acceptedListings: number
  reviewListings: number
  rejectedListings: number
  failed: number
  results: EbayJobResult[]
}

function fail(error: { message?: string } | null, context: string): void {
  if (error) throw new Error(`${context}: ${error.message ?? "unknown Supabase error"}`)
}

function n(value: unknown): number | null {
  if (value == null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function shortError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.length > 900 ? `${message.slice(0, 900)}…` : message
}

async function loadReleaseContext(client: SupabaseClient, releaseId: string): Promise<ReleaseContext> {
  const { data: release, error } = await client
    .from("product_releases")
    .select("id,item_number,edition_name,release_year")
    .eq("id", releaseId)
    .single()
  fail(error, "load eBay Release")
  if (!release?.item_number) throw new Error("RELEASE_ITEM_NUMBER_MISSING")

  const { data: siblings, error: siblingsError } = await client
    .from("product_releases")
    .select("id")
    .eq("item_number", release.item_number)
  fail(siblingsError, "load same-item-number Releases")

  return {
    id: release.id,
    itemNumber: release.item_number,
    editionName: release.edition_name,
    releaseYear: release.release_year,
    sharedReleaseIds: (siblings ?? []).map((row: any) => row.id),
  }
}

async function loadExistingOffer(client: SupabaseClient, sourceId: string, sourceRecordKey: string): Promise<ExistingOffer | null> {
  const { data: candidate, error } = await client
    .from("market_candidates")
    .select("id")
    .eq("source_id", sourceId)
    .eq("source_record_key", sourceRecordKey)
    .maybeSingle()
  fail(error, "load eBay candidate")
  if (!candidate) return null

  const { data: offer, error: offerError } = await client
    .from("market_offer_states")
    .select("candidate_id,availability,item_price,shipping_price,currency,item_price_eur,shipping_eur,fx_rate_to_eur,fx_rate_date")
    .eq("candidate_id", candidate.id)
    .maybeSingle()
  fail(offerError, "load eBay offer state")
  if (!offer) return null
  return {
    candidateId: offer.candidate_id,
    availability: offer.availability,
    itemPrice: Number(offer.item_price),
    shippingPrice: n(offer.shipping_price),
    currency: offer.currency,
    itemPriceEUR: Number(offer.item_price_eur),
    shippingEUR: n(offer.shipping_eur),
    fxRateToEUR: n(offer.fx_rate_to_eur),
    fxRateDate: offer.fx_rate_date,
  }
}

async function independentReferences(client: SupabaseClient, releaseId: string, currentSourceId: string) {
  const [{ data: signal, error: signalError }, { data: offers, error: offersError }] = await Promise.all([
    client
      .from("market_release_signals")
      .select("market_value_eur,sold_anchor_eur,confidence_label")
      .eq("release_id", releaseId)
      .eq("condition", "new_complete_unbuilt")
      .maybeSingle(),
    client
      .from("market_offer_states")
      .select("source_id,item_price_eur,availability")
      .eq("release_id", releaseId)
      .eq("condition", "new_complete_unbuilt")
      .in("availability", ["in_stock", "low_stock"]),
  ])
  fail(signalError, "load eBay guard headline")
  fail(offersError, "load eBay guard offers")

  const bySource = new Map<string, number[]>()
  for (const row of offers ?? []) {
    if (row.source_id === currentSourceId) continue
    const value = n(row.item_price_eur)
    if (value == null || value <= 0) continue
    const bucket = bySource.get(row.source_id) ?? []
    bucket.push(value)
    bySource.set(row.source_id, bucket)
  }

  const values: number[] = []
  for (const bucket of bySource.values()) {
    bucket.sort((a, b) => a - b)
    const middle = Math.floor(bucket.length / 2)
    values.push(bucket.length % 2 ? bucket[middle] : (bucket[middle - 1] + bucket[middle]) / 2)
  }
  const sold = n(signal?.sold_anchor_eur)
  if (sold != null && sold > 0) values.push(sold)
  if (!values.length) {
    const mv = n(signal?.market_value_eur)
    if (mv != null && mv > 0) values.push(mv)
  }

  const label = signal?.confidence_label
  return {
    values,
    confidence: label === "low" || label === "medium" || label === "high" ? label : null,
  } as const
}

async function upsertCandidate(
  client: SupabaseClient,
  input: {
    job: ClaimedEbayJob
    release: ReleaseContext
    listing: EbayBrowseListing
    decision: "accepted" | "needs_review" | "rejected"
    reasonCodes: string[]
    observedAt: string
  },
): Promise<string> {
  const key = `ebay:${input.listing.itemId}`
  const { data: existing, error: existingError } = await client
    .from("market_candidates")
    .select("id,first_observed_at")
    .eq("source_id", input.job.source_id)
    .eq("source_record_key", key)
    .maybeSingle()
  fail(existingError, "load existing eBay candidate")

  const isAccepted = input.decision === "accepted"
  const payload = {
    source_id: input.job.source_id,
    source_record_key: key,
    external_listing_id: input.listing.itemId,
    original_source: input.listing.marketplace,
    original_record_id: input.listing.itemId,
    listing_url: input.listing.itemWebUrl,
    title_raw: input.listing.title,
    item_number_observed: input.release.itemNumber,
    possible_release_ids: input.release.sharedReleaseIds,
    resolved_release_id: isAccepted ? input.release.id : null,
    price: input.listing.price,
    currency: input.listing.currency,
    shipping_cost: input.listing.shipping,
    shipping_basis: input.listing.shipping == null ? "unknown" : input.listing.shipping === 0 ? "included_exact" : "buyer_paid",
    observation_type: "active_listing",
    condition_raw: input.listing.condition,
    condition: "new_complete_unbuilt",
    inner_bags_sealed: "unknown",
    box_condition: "unknown",
    is_complete: true,
    is_lot: false,
    quantity: 1,
    match_confidence: isAccepted ? "exact" : input.decision === "rejected" ? "rejected" : "ambiguous",
    match_evidence: ["item_number_exact"],
    seller_fingerprint: input.listing.seller ? `ebay:${input.listing.seller}` : null,
    evidence_group_key: null,
    sold_at: null,
    sold_on: null,
    listing_date: null,
    observed_at: input.observedAt,
    decision: input.decision,
    reason_codes: input.reasonCodes,
    review_notes: input.decision === "needs_review" ? "eBay active listing quarantined by exact-Release/price guard." : null,
    state_hash: null,
    needs_revalidation: input.decision === "needs_review",
    raw_payload: {
      adapter: "ebay-browse-v1",
      marketplace: input.listing.marketplace,
      itemEndDate: input.listing.itemEndDate,
    },
    first_observed_at: existing?.first_observed_at ?? input.observedAt,
    last_observed_at: input.observedAt,
    updated_at: input.observedAt,
  }

  const { data, error } = await client
    .from("market_candidates")
    .upsert(payload, { onConflict: "source_id,source_record_key" })
    .select("id")
    .single()
  fail(error, "upsert eBay candidate")
  if (!data) throw new Error("upsert eBay candidate returned no row")
  return data.id
}

async function finishJob(client: SupabaseClient, jobId: string, success: boolean, materialChange: boolean, errorMessage: string | null) {
  const { error } = await client.rpc("trackdash_finish_market_scan_job", {
    p_job_id: jobId,
    p_success: success,
    p_material_change: materialChange,
    p_error: errorMessage,
  })
  fail(error, "finish eBay scan job")
}

async function neutralizePrevious(repo: MarketR3Repository, job: ClaimedEbayJob, previous: ExistingOffer | null, observedAt: string) {
  if (!previous || previous.availability === "unknown") return false
  await repo.upsertOfferState({
    candidateId: previous.candidateId,
    releaseId: job.release_id,
    sourceId: job.source_id,
    condition: "new_complete_unbuilt",
    channel: "marketplace",
    availability: "unknown",
    sellerFingerprint: null,
    itemPrice: previous.itemPrice,
    shippingPrice: previous.shippingPrice,
    currency: previous.currency,
    itemPriceEUR: previous.itemPriceEUR,
    shippingEUR: previous.shippingEUR,
    fxRateToEUR: previous.fxRateToEUR,
    fxRateDate: previous.fxRateDate,
    observedAt,
  })
  return true
}

async function scanJob(client: SupabaseClient, repo: MarketR3Repository, job: ClaimedEbayJob): Promise<EbayJobResult> {
  const observedAt = new Date().toISOString()
  const release = await loadReleaseContext(client, job.release_id)
  const input = {
    itemNumber: release.itemNumber,
    editionName: release.editionName,
    releaseYear: release.releaseYear,
    itemNumberIsShared: release.sharedReleaseIds.length > 1,
  }

  const fetched: EbayBrowseListing[] = []
  const sourceErrors: string[] = []
  for (const marketplace of MARKETPLACES) {
    try {
      fetched.push(...await searchEbayActiveListings(input, marketplace, 50))
    } catch (error) {
      sourceErrors.push(`${marketplace}:${shortError(error)}`)
    }
  }
  if (!fetched.length && sourceErrors.length === MARKETPLACES.length) {
    throw new Error(`EBAY_ALL_MARKETPLACES_FAILED:${sourceErrors.join("|")}`)
  }

  const listings = dedupeEbayListings(fetched)
  let accepted = 0
  let review = 0
  let rejected = 0
  let materialChange = false

  for (const listing of listings) {
    const classification = classifyEbayActiveListing(listing, input, new Date(observedAt))
    const key = `ebay:${listing.itemId}`
    const previous = await loadExistingOffer(client, job.source_id, key)

    if (classification.decision !== "accepted") {
      await upsertCandidate(client, {
        job,
        release,
        listing,
        decision: classification.decision === "rejected" ? "rejected" : "needs_review",
        reasonCodes: classification.reasonCodes,
        observedAt,
      })
      if (classification.decision === "needs_review") {
        review += 1
        materialChange = (await neutralizePrevious(repo, job, previous, observedAt)) || materialChange
      } else {
        rejected += 1
      }
      continue
    }

    const currency = listing.currency.toUpperCase() as Currency
    if (!SUPPORTED_CURRENCIES.has(currency)) {
      await upsertCandidate(client, { job, release, listing, decision: "needs_review", reasonCodes: ["UNSUPPORTED_CURRENCY"], observedAt })
      review += 1
      materialChange = (await neutralizePrevious(repo, job, previous, observedAt)) || materialChange
      continue
    }

    const itemFx = await resolveHistoricalEurBasis(listing.price, currency, observedAt.slice(0, 10))
    const shippingFx = listing.shipping == null
      ? null
      : await resolveHistoricalEurBasis(listing.shipping || 0.000001, currency, observedAt.slice(0, 10))
    if (itemFx.amountEUR == null) {
      await upsertCandidate(client, { job, release, listing, decision: "needs_review", reasonCodes: ["FX_RATE_UNAVAILABLE"], observedAt })
      review += 1
      materialChange = (await neutralizePrevious(repo, job, previous, observedAt)) || materialChange
      continue
    }

    const refs = await independentReferences(client, job.release_id, job.source_id)
    const guard = guardAutomatedPrice({
      priceEUR: itemFx.amountEUR,
      availability: "in_stock",
      independentReferenceEUR: refs.values,
      previousSameSourceEUR: previous?.itemPriceEUR ?? null,
      headlineConfidence: refs.confidence,
    })
    if (guard.decision === "review") {
      await upsertCandidate(client, { job, release, listing, decision: "needs_review", reasonCodes: guard.reasonCodes, observedAt })
      review += 1
      materialChange = (await neutralizePrevious(repo, job, previous, observedAt)) || materialChange
      continue
    }

    const candidateId = await upsertCandidate(client, { job, release, listing, decision: "accepted", reasonCodes: [], observedAt })
    const shippingEUR = listing.shipping == null ? null : listing.shipping === 0 ? 0 : shippingFx?.amountEUR ?? null
    await repo.upsertOfferState({
      candidateId,
      releaseId: job.release_id,
      sourceId: job.source_id,
      condition: "new_complete_unbuilt",
      channel: "marketplace",
      availability: "in_stock",
      sellerFingerprint: listing.seller ? `ebay:${listing.seller}` : null,
      itemPrice: listing.price,
      shippingPrice: listing.shipping,
      currency,
      itemPriceEUR: itemFx.amountEUR,
      shippingEUR,
      fxRateToEUR: itemFx.fxRateToEUR,
      fxRateDate: itemFx.fxRateDate,
      observedAt,
    })
    accepted += 1
    if (!previous || Math.abs(previous.itemPriceEUR - itemFx.amountEUR) >= 0.01 || previous.availability !== "in_stock") {
      materialChange = true
    }
  }

  if (materialChange || accepted > 0) {
    await recomputeReleaseMarketSignal(job.release_id, "new_complete_unbuilt", new Date(observedAt), repo)
  }
  await finishJob(client, job.job_id, true, materialChange, null)

  return {
    jobId: job.job_id,
    releaseId: job.release_id,
    status: review > 0 && accepted === 0 ? "review" : "accepted",
    found: listings.length,
    accepted,
    review,
    rejected,
    materialChange,
    reasonCodes: sourceErrors,
  }
}

export async function runEbayActiveMarketScanBatch(limit = 2): Promise<EbayRunResult> {
  if (!ebayBrowseConfigured()) {
    return {
      configured: false,
      runId: null,
      attempted: 0,
      succeeded: 0,
      acceptedListings: 0,
      reviewListings: 0,
      rejectedListings: 0,
      failed: 0,
      results: [],
    }
  }

  const client = createAdminClient()
  const repo = new MarketR3Repository(client)
  const safeLimit = Math.max(1, Math.min(limit, 4))
  const { data: claimed, error: claimError } = await client.rpc("trackdash_claim_ebay_active_jobs", {
    p_limit: safeLimit,
    p_lock_minutes: 10,
  })
  fail(claimError, "claim eBay active scan jobs")
  const jobs = (claimed ?? []) as ClaimedEbayJob[]

  const { data: run, error: runError } = await client
    .from("market_scan_runs")
    .insert({ status: "running", targets_attempted: jobs.length })
    .select("id")
    .single()
  fail(runError, "create eBay scan run")
  const runId = run?.id ?? null

  const results: EbayJobResult[] = []
  for (const job of jobs) {
    try {
      results.push(await scanJob(client, repo, job))
    } catch (error) {
      const message = shortError(error)
      try { await finishJob(client, job.job_id, false, false, message) } catch {}
      results.push({
        jobId: job.job_id,
        releaseId: job.release_id,
        status: "failed",
        found: 0,
        accepted: 0,
        review: 0,
        rejected: 0,
        materialChange: false,
        reasonCodes: [message],
      })
    }
  }

  const failed = results.filter((row) => row.status === "failed").length
  const succeeded = results.length - failed
  const acceptedListings = results.reduce((sum, row) => sum + row.accepted, 0)
  const reviewListings = results.reduce((sum, row) => sum + row.review, 0)
  const rejectedListings = results.reduce((sum, row) => sum + row.rejected, 0)

  if (runId) {
    const { error } = await client
      .from("market_scan_runs")
      .update({
        status: failed === 0 ? "completed" : succeeded ? "partial" : jobs.length ? "failed" : "completed",
        finished_at: new Date().toISOString(),
        targets_succeeded: succeeded,
        candidates_found: acceptedListings + reviewListings + rejectedListings,
        accepted_count: acceptedListings,
        review_count: reviewListings,
        rejected_count: rejectedListings,
        error_summary: failed ? results.filter((row) => row.status === "failed").map((row) => row.reasonCodes.join(",")).join(" | ").slice(0, 1000) : null,
      })
      .eq("id", runId)
    fail(error, "finish eBay scan run")
  }

  return {
    configured: true,
    runId,
    attempted: jobs.length,
    succeeded,
    acceptedListings,
    reviewListings,
    rejectedListings,
    failed,
    results,
  }
}
