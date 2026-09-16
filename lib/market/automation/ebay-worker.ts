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
  ebayMarketWritesAllowed,
  searchEbayActiveListings,
  type EbayBrowseListing,
  type EbayMarketplaceId,
} from "./ebay-browse-adapter"
import { guardAutomatedPrice } from "./price-guard"
import { ebaySourceRecordKey, planMissingEbayOffers, type EbayMarketplaceFetchState, type ExistingEbayOfferIdentity } from "./ebay-lifecycle"

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

interface EbayScanJobOptions {
  marketplaceLimit?: number
  maxAcceptedListings?: number
  persistNonAccepted?: boolean
  dryRun?: boolean
  allowedAcceptedItemId?: string
}

export interface EbaySelectedListing {
  itemId: string
  title: string
  url: string | null
  marketplace: EbayMarketplaceId
  price: number
  currency: string
  shipping: number | null
  conditionId: string | null
  condition: string | null
  sellerFingerprint: string | null
  decision: "accepted"
  reasonCodes: string[]
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
  rawByMarketplace: Partial<Record<EbayMarketplaceId, number>>
  uniqueListings: number
  lifecycleNeutralized: number
  selectedListings: EbaySelectedListing[]
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

export interface TargetedEbayScanInput {
  jobId: string
  releaseId: string
  mode: "preview" | "execute"
  expectedItemId?: string
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

async function loadReleaseEbayOffers(
  client: SupabaseClient,
  releaseId: string,
  sourceId: string,
): Promise<Array<ExistingOffer & ExistingEbayOfferIdentity>> {
  const { data: candidates, error: candidateError } = await client
    .from("market_candidates")
    .select("id,original_source,original_record_id")
    .eq("source_id", sourceId)
    .eq("resolved_release_id", releaseId)
  fail(candidateError, "load Release eBay candidates")
  if (!(candidates ?? []).length) return []

  const candidateById = new Map((candidates ?? []).map((row: any) => [row.id, row]))
  const { data: offers, error: offerError } = await client
    .from("market_offer_states")
    .select("candidate_id,release_id,availability,item_price,shipping_price,currency,item_price_eur,shipping_eur,fx_rate_to_eur,fx_rate_date")
    .eq("release_id", releaseId)
    .eq("source_id", sourceId)
    .in("candidate_id", [...candidateById.keys()])
  fail(offerError, "load Release eBay offer states")

  return (offers ?? []).flatMap((row: any) => {
    const candidate: any = candidateById.get(row.candidate_id)
    if (!candidate?.original_record_id) return []
    const originalMarketplace = MARKETPLACES.includes(candidate.original_source as EbayMarketplaceId)
      ? candidate.original_source as EbayMarketplaceId
      : null
    return [{
      candidateId: row.candidate_id,
      releaseId: row.release_id,
      itemId: candidate.original_record_id,
      originalMarketplace,
      availability: row.availability,
      itemPrice: Number(row.item_price),
      shippingPrice: n(row.shipping_price),
      currency: row.currency,
      itemPriceEUR: Number(row.item_price_eur),
      shippingEUR: n(row.shipping_eur),
      fxRateToEUR: n(row.fx_rate_to_eur),
      fxRateDate: row.fx_rate_date,
    }]
  })
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
  const key = ebaySourceRecordKey(input.listing.itemId)
  const { data: existing, error: existingError } = await client
    .from("market_candidates")
    .select("id,first_observed_at,resolved_release_id")
    .eq("source_id", input.job.source_id)
    .eq("source_record_key", key)
    .maybeSingle()
  fail(existingError, "load existing eBay candidate")
  if (existing?.resolved_release_id && existing.resolved_release_id !== input.release.id) {
    throw new Error("EBAY_ITEM_ALREADY_ASSIGNED_TO_OTHER_RELEASE")
  }

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

async function scanJob(
  client: SupabaseClient,
  repo: MarketR3Repository,
  job: ClaimedEbayJob,
  options: EbayScanJobOptions = {},
): Promise<EbayJobResult> {
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
  const rawByMarketplace: Partial<Record<EbayMarketplaceId, number>> = {}
  const fetchStates: EbayMarketplaceFetchState[] = []
  const marketplaceLimit = Math.max(1, Math.min(options.marketplaceLimit ?? 50, 200))
  for (const marketplace of MARKETPLACES) {
    try {
      const rows = await searchEbayActiveListings(input, marketplace, marketplaceLimit)
      rawByMarketplace[marketplace] = rows.length
      fetched.push(...rows)
      fetchStates.push({
        marketplace,
        succeeded: true,
        // A full page can be truncated; absence is authoritative only when the
        // response proves that this page exhausted the query.
        complete: rows.length < marketplaceLimit,
        itemIds: new Set(rows.map((row) => row.itemId)),
      })
    } catch (error) {
      sourceErrors.push(`${marketplace}:${shortError(error)}`)
      fetchStates.push({ marketplace, succeeded: false, complete: false, itemIds: new Set() })
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
  const selectedListings: EbaySelectedListing[] = []
  const maxAcceptedListings = options.maxAcceptedListings ?? Number.POSITIVE_INFINITY
  const persistNonAccepted = options.persistNonAccepted ?? true

  for (const listing of listings) {
    const classification = classifyEbayActiveListing(listing, input, new Date(observedAt))
    const key = ebaySourceRecordKey(listing.itemId)
    const previous = await loadExistingOffer(client, job.source_id, key)

    if (classification.decision !== "accepted") {
      if (persistNonAccepted) {
        await upsertCandidate(client, {
          job,
          release,
          listing,
          decision: classification.decision === "rejected" ? "rejected" : "needs_review",
          reasonCodes: classification.reasonCodes,
          observedAt,
        })
      }
      if (classification.decision === "needs_review") {
        review += 1
        if (!options.dryRun) materialChange = (await neutralizePrevious(repo, job, previous, observedAt)) || materialChange
      } else {
        rejected += 1
        if (!options.dryRun) materialChange = (await neutralizePrevious(repo, job, previous, observedAt)) || materialChange
      }
      continue
    }

    const currency = listing.currency.toUpperCase() as Currency
    if (!SUPPORTED_CURRENCIES.has(currency)) {
      if (persistNonAccepted) {
        await upsertCandidate(client, { job, release, listing, decision: "needs_review", reasonCodes: ["UNSUPPORTED_CURRENCY"], observedAt })
      }
      review += 1
      if (!options.dryRun) materialChange = (await neutralizePrevious(repo, job, previous, observedAt)) || materialChange
      continue
    }

    const itemFx = await resolveHistoricalEurBasis(listing.price, currency, observedAt.slice(0, 10))
    const shippingFx = listing.shipping == null
      ? null
      : await resolveHistoricalEurBasis(listing.shipping || 0.000001, currency, observedAt.slice(0, 10))
    if (itemFx.amountEUR == null) {
      if (persistNonAccepted) {
        await upsertCandidate(client, { job, release, listing, decision: "needs_review", reasonCodes: ["FX_RATE_UNAVAILABLE"], observedAt })
      }
      review += 1
      if (!options.dryRun) materialChange = (await neutralizePrevious(repo, job, previous, observedAt)) || materialChange
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
      if (persistNonAccepted) {
        await upsertCandidate(client, { job, release, listing, decision: "needs_review", reasonCodes: guard.reasonCodes, observedAt })
      }
      review += 1
      if (!options.dryRun) materialChange = (await neutralizePrevious(repo, job, previous, observedAt)) || materialChange
      continue
    }

    if (options.allowedAcceptedItemId && listing.itemId !== options.allowedAcceptedItemId) continue
    if (selectedListings.length >= maxAcceptedListings) continue
    selectedListings.push({
      itemId: listing.itemId,
      title: listing.title,
      url: listing.itemWebUrl,
      marketplace: listing.marketplace,
      price: listing.price,
      currency: listing.currency,
      shipping: listing.shipping,
      conditionId: listing.conditionId,
      condition: listing.condition,
      sellerFingerprint: listing.seller ? `ebay:${listing.seller}` : null,
      decision: "accepted",
      reasonCodes: [],
    })
    if (options.dryRun) continue

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

  let lifecycleNeutralized = 0
  if (!options.dryRun) {
    const existingOffers = await loadReleaseEbayOffers(client, job.release_id, job.source_id)
    const missingCandidateIds = new Set(planMissingEbayOffers(job.release_id, existingOffers, fetchStates))
    for (const offer of existingOffers) {
      if (!missingCandidateIds.has(offer.candidateId)) continue
      if (await neutralizePrevious(repo, job, offer, observedAt)) {
        lifecycleNeutralized += 1
        materialChange = true
      }
    }
  }

  if (!options.dryRun && (materialChange || accepted > 0)) {
    await recomputeReleaseMarketSignal(job.release_id, "new_complete_unbuilt", new Date(observedAt), repo)
  }
  if (!options.dryRun) await finishJob(client, job.job_id, true, materialChange, null)

  return {
    jobId: job.job_id,
    releaseId: job.release_id,
    status: review > 0 && selectedListings.length === 0 ? "review" : "accepted",
    found: listings.length,
    accepted,
    review,
    rejected,
    materialChange,
    reasonCodes: sourceErrors,
    rawByMarketplace,
    uniqueListings: listings.length,
    lifecycleNeutralized,
    selectedListings,
  }
}

async function loadTargetJob(client: SupabaseClient, jobId: string, releaseId: string): Promise<ClaimedEbayJob> {
  const { data: queue, error: queueError } = await client
    .from("market_scan_queue")
    .select("id,release_id,source_id,scan_scope,activity_tier,priority,enabled")
    .eq("id", jobId)
    .eq("release_id", releaseId)
    .single()
  fail(queueError, "load exact eBay scan job")
  if (!queue?.enabled || queue.scan_scope !== "active_marketplace") throw new Error("EBAY_TARGET_JOB_NOT_ELIGIBLE")

  const [{ data: source, error: sourceError }, { data: policy, error: policyError }] = await Promise.all([
    client.from("price_sources").select("slug").eq("id", queue.source_id).single(),
    client.from("market_source_policies").select("adapter_status").eq("source_id", queue.source_id).single(),
  ])
  fail(sourceError, "load exact eBay source")
  fail(policyError, "load exact eBay policy")
  if (source?.slug !== "ebay_active_public" || policy?.adapter_status !== "ready") {
    throw new Error("EBAY_TARGET_JOB_NOT_ELIGIBLE")
  }

  return {
    job_id: queue.id,
    release_id: queue.release_id,
    source_id: queue.source_id,
    source_slug: source.slug,
    scan_scope: queue.scan_scope,
    activity_tier: queue.activity_tier,
    priority: queue.priority,
  }
}

export async function runEbayActiveMarketScanForRelease(input: TargetedEbayScanInput): Promise<EbayRunResult> {
  if (!ebayBrowseConfigured()) throw new Error("EBAY_BROWSE_NOT_CONFIGURED")
  if (input.mode === "execute" && !ebayMarketWritesAllowed()) throw new Error("EBAY_MARKET_WRITES_DISABLED")
  if (input.mode === "execute" && !input.expectedItemId) throw new Error("EBAY_EXPECTED_ITEM_ID_REQUIRED")

  const client = createAdminClient()
  const repo = new MarketR3Repository(client)
  let job: ClaimedEbayJob

  if (input.mode === "preview") {
    job = await loadTargetJob(client, input.jobId, input.releaseId)
  } else {
    const { data, error } = await client.rpc("trackdash_claim_ebay_active_job", {
      p_job_id: input.jobId,
      p_release_id: input.releaseId,
      p_lock_minutes: 10,
    })
    fail(error, "claim exact eBay active scan job")
    const jobs = (data ?? []) as ClaimedEbayJob[]
    if (jobs.length !== 1) throw new Error("EBAY_TARGET_JOB_NOT_CLAIMED")
    job = jobs[0]
  }

  let runId: string | null = null
  if (input.mode === "execute") {
    const { data: run, error: runError } = await client
      .from("market_scan_runs")
      .insert({ status: "running", targets_attempted: 1 })
      .select("id")
      .single()
    fail(runError, "create targeted eBay scan run")
    runId = run?.id ?? null
  }

  let result: EbayJobResult
  try {
    result = await scanJob(client, repo, job, {
      marketplaceLimit: 5,
      maxAcceptedListings: 1,
      persistNonAccepted: false,
      dryRun: input.mode === "preview",
      allowedAcceptedItemId: input.expectedItemId,
    })
  } catch (error) {
    const message = shortError(error)
    if (input.mode === "execute") {
      try { await finishJob(client, job.job_id, false, false, message) } catch {}
    }
    if (runId) {
      await client.from("market_scan_runs").update({
        status: "failed",
        finished_at: new Date().toISOString(),
        targets_succeeded: 0,
        candidates_found: 0,
        accepted_count: 0,
        review_count: 0,
        rejected_count: 0,
        error_summary: message.slice(0, 1000),
      }).eq("id", runId)
    }
    throw error
  }

  if (runId) {
    const { error } = await client.from("market_scan_runs").update({
      status: "completed",
      finished_at: new Date().toISOString(),
      targets_succeeded: 1,
      candidates_found: result.accepted + result.review + result.rejected,
      accepted_count: result.accepted,
      review_count: result.review,
      rejected_count: result.rejected,
      error_summary: result.reasonCodes.length ? result.reasonCodes.join(" | ").slice(0, 1000) : null,
    }).eq("id", runId)
    fail(error, "finish targeted eBay scan run")
  }

  return {
    configured: true,
    runId,
    attempted: 1,
    succeeded: 1,
    acceptedListings: result.accepted,
    reviewListings: result.review,
    rejectedListings: result.rejected,
    failed: 0,
    results: [result],
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

  // Sandbox is for standalone technical tests only. Stop before creating a DB
  // client, claiming jobs, persisting candidates or recomputing any R3 signal.
  if (!ebayMarketWritesAllowed()) throw new Error("EBAY_SANDBOX_MARKET_WRITES_DISABLED")
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
        rawByMarketplace: {},
        uniqueListings: 0,
        lifecycleNeutralized: 0,
        selectedListings: [],
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
