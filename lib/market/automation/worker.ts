import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { resolveHistoricalEurBasis } from "@/lib/fx/ecb"
import type { Currency } from "@/lib/types"
import { createAdminClient } from "@/lib/supabase/admin"
import { MarketR3Repository } from "@/lib/market/pipeline/market-r3-repository"
import { recomputeReleaseMarketSignal } from "@/lib/market/pipeline/market-r3-service"
import {
  isAutoPublishableSnapshot,
  parseExactRetailPage,
  type ExactPageSnapshot,
  type ParsedAvailability,
} from "./exact-page-adapter"
import { guardAutomatedPrice } from "./price-guard"

const SUPPORTED_CURRENCIES = new Set<Currency>(["EUR", "USD", "JPY", "GBP"])
const USER_AGENT = "TrackDashMarketBot/1.0 (+https://trackdash-dusky.vercel.app)"
const MAX_HTML_BYTES = 2_500_000

interface ClaimedJob {
  job_id: string
  release_id: string
  source_id: string
  source_slug: string
  scan_scope: string
  activity_tier: string
  priority: number
  adapter_status: string
  endpoint_id: string
  endpoint_url: string
  parser_kind: string
  exact_release_verified: boolean
}

interface ReleaseRow {
  id: string
  item_number: string | null
  edition_name: string
  release_year: number | null
}

interface PreviousOfferRow {
  id: string
  candidate_id: string
  availability: ParsedAvailability
  item_price: number
  shipping_price: number | null
  currency: string
  item_price_eur: number
  shipping_eur: number | null
  fx_rate_to_eur: number | null
  fx_rate_date: string | null
}

export interface MarketAdapterJobResult {
  jobId: string
  releaseId: string
  sourceSlug: string
  endpointUrl: string
  status: "accepted" | "review" | "failed"
  availability?: ParsedAvailability
  priceEUR?: number | null
  materialChange: boolean
  reasonCodes: string[]
}

export interface MarketAdapterRunResult {
  runId: string | null
  attempted: number
  succeeded: number
  accepted: number
  review: number
  failed: number
  results: MarketAdapterJobResult[]
}

function fail(error: { message?: string } | null, context: string): void {
  if (error) throw new Error(`${context}: ${error.message ?? "unknown Supabase error"}`)
}

function asNumber(value: unknown): number | null {
  if (value == null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function shortError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.length > 900 ? `${message.slice(0, 900)}…` : message
}

function candidateKey(endpointId: string): string {
  return `exact-page:${endpointId}`
}

function observationType(availability: ParsedAvailability): "retail_in_stock" | "retail_out_of_stock" | "unknown" {
  if (availability === "in_stock" || availability === "low_stock") return "retail_in_stock"
  if (availability === "out_of_stock" || availability === "discontinued") return "retail_out_of_stock"
  return "unknown"
}

async function fetchHtml(url: string): Promise<{ status: number; html: string }> {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      "User-Agent": USER_AGENT,
    },
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  })

  const contentType = response.headers.get("content-type") ?? ""
  if (!response.ok) throw new Error(`HTTP_${response.status}`)
  if (!contentType.toLowerCase().includes("text/html")) {
    throw new Error(`UNEXPECTED_CONTENT_TYPE:${contentType || "unknown"}`)
  }

  const html = await response.text()
  if (html.length > MAX_HTML_BYTES) throw new Error(`HTML_TOO_LARGE:${html.length}`)
  return { status: response.status, html }
}

async function endpointTelemetry(
  client: SupabaseClient,
  endpointId: string,
  input: {
    httpStatus?: number | null
    snapshot?: ExactPageSnapshot | null
    error?: string | null
    success?: boolean
  },
): Promise<void> {
  const now = new Date().toISOString()
  const payload: Record<string, unknown> = {
    last_checked_at: now,
    last_http_status: input.httpStatus ?? null,
    last_error: input.error ?? null,
    updated_at: now,
  }
  if (input.success) payload.last_success_at = now
  if (input.snapshot) {
    payload.last_extraction = {
      title: input.snapshot.title,
      itemNumberSeen: input.snapshot.itemNumberSeen,
      price: input.snapshot.price,
      currency: input.snapshot.currency,
      availability: input.snapshot.availability,
      confidence: input.snapshot.confidence,
      warnings: input.snapshot.warnings,
      rawAvailability: input.snapshot.rawAvailability,
    }
  }
  const { error } = await client.from("market_scan_endpoints").update(payload).eq("id", endpointId)
  fail(error, "update market scan endpoint telemetry")
}

async function loadRelease(client: SupabaseClient, releaseId: string): Promise<ReleaseRow> {
  const { data, error } = await client
    .from("product_releases")
    .select("id,item_number,edition_name,release_year")
    .eq("id", releaseId)
    .single()
  fail(error, "load adapter Release")
  if (!data) throw new Error("load adapter Release returned no row")
  return data as ReleaseRow
}

async function loadExistingCandidate(
  client: SupabaseClient,
  sourceId: string,
  sourceRecordKey: string,
): Promise<{ id: string; first_observed_at: string } | null> {
  const { data, error } = await client
    .from("market_candidates")
    .select("id,first_observed_at")
    .eq("source_id", sourceId)
    .eq("source_record_key", sourceRecordKey)
    .maybeSingle()
  fail(error, "load exact-page candidate")
  return data as { id: string; first_observed_at: string } | null
}

async function loadPreviousOffer(client: SupabaseClient, candidateId: string | null): Promise<PreviousOfferRow | null> {
  if (!candidateId) return null
  const { data, error } = await client
    .from("market_offer_states")
    .select("id,candidate_id,availability,item_price,shipping_price,currency,item_price_eur,shipping_eur,fx_rate_to_eur,fx_rate_date")
    .eq("candidate_id", candidateId)
    .maybeSingle()
  fail(error, "load previous exact-page offer")
  if (!data) return null
  return {
    ...data,
    item_price: Number(data.item_price),
    shipping_price: asNumber(data.shipping_price),
    item_price_eur: Number(data.item_price_eur),
    shipping_eur: asNumber(data.shipping_eur),
    fx_rate_to_eur: asNumber(data.fx_rate_to_eur),
  } as PreviousOfferRow
}

async function independentReferences(
  client: SupabaseClient,
  releaseId: string,
  currentSourceId: string,
): Promise<{ values: number[]; confidence: "low" | "medium" | "high" | null }> {
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
  fail(signalError, "load market headline for adapter guard")
  fail(offersError, "load independent offers for adapter guard")

  const bySource = new Map<string, number[]>()
  for (const row of offers ?? []) {
    if (row.source_id === currentSourceId) continue
    const price = asNumber(row.item_price_eur)
    if (price == null || price <= 0) continue
    const bucket = bySource.get(row.source_id) ?? []
    bucket.push(price)
    bySource.set(row.source_id, bucket)
  }

  const values: number[] = []
  for (const bucket of bySource.values()) {
    const sorted = bucket.sort((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)
    values.push(sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2)
  }

  const soldAnchor = asNumber(signal?.sold_anchor_eur)
  if (soldAnchor != null && soldAnchor > 0) values.push(soldAnchor)
  if (!values.length) {
    const marketValue = asNumber(signal?.market_value_eur)
    if (marketValue != null && marketValue > 0) values.push(marketValue)
  }

  const signalConfidence = signal?.confidence_label ?? null
  const confidence = signalConfidence && ["low", "medium", "high"].includes(signalConfidence)
    ? signalConfidence as "low" | "medium" | "high"
    : null
  return { values, confidence }
}

async function upsertCandidate(
  client: SupabaseClient,
  input: {
    job: ClaimedJob
    release: ReleaseRow
    snapshot: ExactPageSnapshot
    decision: "accepted" | "needs_review"
    reasonCodes: string[]
    observedAt: string
  },
): Promise<string> {
  const key = candidateKey(input.job.endpoint_id)
  const existing = await loadExistingCandidate(client, input.job.source_id, key)
  const payload = {
    source_id: input.job.source_id,
    source_record_key: key,
    external_listing_id: input.job.endpoint_id,
    original_source: input.job.source_slug,
    original_record_id: input.job.endpoint_url,
    listing_url: input.job.endpoint_url,
    title_raw: input.snapshot.title,
    item_number_observed: input.snapshot.itemNumberSeen ? input.release.item_number : null,
    possible_release_ids: [input.release.id],
    resolved_release_id: input.release.id,
    price: input.snapshot.price,
    currency: input.snapshot.currency,
    shipping_cost: null,
    shipping_basis: "unknown",
    observation_type: observationType(input.snapshot.availability),
    condition_raw: "new retail exact-page",
    condition: "new_complete_unbuilt",
    inner_bags_sealed: "unknown",
    box_condition: "unknown",
    is_complete: true,
    is_lot: false,
    quantity: 1,
    match_confidence: "exact",
    match_evidence: ["item_number_exact", "verified_endpoint_match"],
    seller_fingerprint: `retailer:${input.job.source_slug}`,
    evidence_group_key: null,
    sold_at: null,
    sold_on: null,
    listing_date: null,
    observed_at: input.observedAt,
    decision: input.decision,
    reason_codes: input.reasonCodes,
    review_notes: input.decision === "needs_review" ? "Automatic exact-page evidence quarantined for review." : null,
    state_hash: null,
    needs_revalidation: input.decision === "needs_review",
    raw_payload: {
      adapter: "exact-page-v1",
      endpointId: input.job.endpoint_id,
      endpointUrl: input.job.endpoint_url,
      sourceSlug: input.job.source_slug,
      extraction: {
        confidence: input.snapshot.confidence,
        availability: input.snapshot.availability,
        rawAvailability: input.snapshot.rawAvailability,
        warnings: input.snapshot.warnings,
      },
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
  fail(error, "upsert exact-page candidate")
  if (!data) throw new Error("upsert exact-page candidate returned no row")
  return data.id
}

async function neutralizePreviousOffer(
  repo: MarketR3Repository,
  job: ClaimedJob,
  previous: PreviousOfferRow | null,
  observedAt: string,
): Promise<boolean> {
  if (!previous || previous.availability === "unknown") return false
  await repo.upsertOfferState({
    candidateId: previous.candidate_id,
    releaseId: job.release_id,
    sourceId: job.source_id,
    condition: "new_complete_unbuilt",
    channel: "retail",
    availability: "unknown",
    sellerFingerprint: `retailer:${job.source_slug}`,
    itemPrice: previous.item_price,
    shippingPrice: previous.shipping_price,
    currency: previous.currency,
    itemPriceEUR: previous.item_price_eur,
    shippingEUR: previous.shipping_eur,
    fxRateToEUR: previous.fx_rate_to_eur,
    fxRateDate: previous.fx_rate_date,
    observedAt,
  })
  return true
}

async function finishJob(
  client: SupabaseClient,
  jobId: string,
  success: boolean,
  materialChange: boolean,
  errorMessage: string | null,
): Promise<void> {
  const { error } = await client.rpc("trackdash_finish_market_scan_job", {
    p_job_id: jobId,
    p_success: success,
    p_material_change: materialChange,
    p_error: errorMessage,
  })
  fail(error, "finish market scan job")
}

async function scanClaimedJob(
  client: SupabaseClient,
  repo: MarketR3Repository,
  job: ClaimedJob,
): Promise<MarketAdapterJobResult> {
  const observedAt = new Date().toISOString()
  const release = await loadRelease(client, job.release_id)
  if (!job.exact_release_verified || !release.item_number) {
    const reasonCodes = [!job.exact_release_verified ? "ENDPOINT_NOT_EXACT_RELEASE_VERIFIED" : "RELEASE_ITEM_NUMBER_MISSING"]
    await endpointTelemetry(client, job.endpoint_id, { error: reasonCodes.join(",") })
    await finishJob(client, job.job_id, false, false, reasonCodes.join(","))
    return { jobId: job.job_id, releaseId: job.release_id, sourceSlug: job.source_slug, endpointUrl: job.endpoint_url, status: "failed", materialChange: false, reasonCodes }
  }

  let fetched: { status: number; html: string }
  try {
    fetched = await fetchHtml(job.endpoint_url)
  } catch (error) {
    const message = shortError(error)
    await endpointTelemetry(client, job.endpoint_id, { error: message })
    await finishJob(client, job.job_id, false, false, message)
    return { jobId: job.job_id, releaseId: job.release_id, sourceSlug: job.source_slug, endpointUrl: job.endpoint_url, status: "failed", materialChange: false, reasonCodes: [message] }
  }

  const snapshot = parseExactRetailPage(fetched.html, {
    itemNumber: release.item_number,
    pageUrl: job.endpoint_url,
  })

  const key = candidateKey(job.endpoint_id)
  const existingCandidate = await loadExistingCandidate(client, job.source_id, key)
  const previous = await loadPreviousOffer(client, existingCandidate?.id ?? null)

  if (!isAutoPublishableSnapshot(snapshot)) {
    const reasons = [...new Set([...snapshot.warnings, "AUTOMATION_EXTRACTION_REVIEW"])]
    const candidateId = await upsertCandidate(client, {
      job,
      release,
      snapshot,
      decision: "needs_review",
      reasonCodes: reasons,
      observedAt,
    })
    const priorForNeutralize = previous ?? await loadPreviousOffer(client, candidateId)
    const materialChange = await neutralizePreviousOffer(repo, job, priorForNeutralize, observedAt)
    if (materialChange) await recomputeReleaseMarketSignal(job.release_id, "new_complete_unbuilt", new Date(observedAt), repo)
    await endpointTelemetry(client, job.endpoint_id, {
      httpStatus: fetched.status,
      snapshot,
      error: reasons.join(","),
      success: false,
    })
    await finishJob(client, job.job_id, false, materialChange, reasons.join(","))
    return {
      jobId: job.job_id,
      releaseId: job.release_id,
      sourceSlug: job.source_slug,
      endpointUrl: job.endpoint_url,
      status: "review",
      availability: snapshot.availability,
      priceEUR: null,
      materialChange,
      reasonCodes: reasons,
    }
  }

  const currency = snapshot.currency as Currency
  if (!SUPPORTED_CURRENCIES.has(currency)) {
    const reasons = ["UNSUPPORTED_CURRENCY"]
    await upsertCandidate(client, { job, release, snapshot, decision: "needs_review", reasonCodes: reasons, observedAt })
    await endpointTelemetry(client, job.endpoint_id, { httpStatus: fetched.status, snapshot, error: reasons[0], success: false })
    await finishJob(client, job.job_id, false, false, reasons[0])
    return { jobId: job.job_id, releaseId: job.release_id, sourceSlug: job.source_slug, endpointUrl: job.endpoint_url, status: "review", availability: snapshot.availability, priceEUR: null, materialChange: false, reasonCodes: reasons }
  }

  const eur = await resolveHistoricalEurBasis(snapshot.price!, currency, observedAt.slice(0, 10))
  if (eur.amountEUR == null) {
    const reasons = ["FX_RATE_UNAVAILABLE"]
    await upsertCandidate(client, { job, release, snapshot, decision: "needs_review", reasonCodes: reasons, observedAt })
    await endpointTelemetry(client, job.endpoint_id, { httpStatus: fetched.status, snapshot, error: reasons[0], success: false })
    await finishJob(client, job.job_id, false, false, reasons[0])
    return { jobId: job.job_id, releaseId: job.release_id, sourceSlug: job.source_slug, endpointUrl: job.endpoint_url, status: "review", availability: snapshot.availability, priceEUR: null, materialChange: false, reasonCodes: reasons }
  }

  const references = await independentReferences(client, job.release_id, job.source_id)
  const guard = guardAutomatedPrice({
    priceEUR: eur.amountEUR,
    availability: snapshot.availability,
    independentReferenceEUR: references.values,
    previousSameSourceEUR: previous?.item_price_eur ?? null,
    headlineConfidence: references.confidence,
  })

  if (guard.decision === "review") {
    const candidateId = await upsertCandidate(client, {
      job,
      release,
      snapshot,
      decision: "needs_review",
      reasonCodes: guard.reasonCodes,
      observedAt,
    })
    const priorForNeutralize = previous ?? await loadPreviousOffer(client, candidateId)
    const materialChange = await neutralizePreviousOffer(repo, job, priorForNeutralize, observedAt)
    if (materialChange) await recomputeReleaseMarketSignal(job.release_id, "new_complete_unbuilt", new Date(observedAt), repo)
    await endpointTelemetry(client, job.endpoint_id, {
      httpStatus: fetched.status,
      snapshot,
      error: `${guard.reasonCodes.join(",")} baseline=${guard.baselineEUR ?? "none"}`,
      success: true,
    })
    await finishJob(client, job.job_id, true, materialChange, null)
    return {
      jobId: job.job_id,
      releaseId: job.release_id,
      sourceSlug: job.source_slug,
      endpointUrl: job.endpoint_url,
      status: "review",
      availability: snapshot.availability,
      priceEUR: eur.amountEUR,
      materialChange,
      reasonCodes: guard.reasonCodes,
    }
  }

  const candidateId = await upsertCandidate(client, {
    job,
    release,
    snapshot,
    decision: "accepted",
    reasonCodes: snapshot.warnings,
    observedAt,
  })
  const previousAccepted = previous ?? await loadPreviousOffer(client, candidateId)
  await repo.upsertOfferState({
    candidateId,
    releaseId: job.release_id,
    sourceId: job.source_id,
    condition: "new_complete_unbuilt",
    channel: "retail",
    availability: snapshot.availability,
    sellerFingerprint: `retailer:${job.source_slug}`,
    itemPrice: snapshot.price!,
    shippingPrice: null,
    currency,
    itemPriceEUR: eur.amountEUR,
    shippingEUR: null,
    fxRateToEUR: eur.fxRateToEUR,
    fxRateDate: eur.fxRateDate,
    observedAt,
  })

  const materialChange = !previousAccepted ||
    previousAccepted.availability !== snapshot.availability ||
    Math.abs(previousAccepted.item_price_eur - eur.amountEUR) >= 0.01

  await recomputeReleaseMarketSignal(job.release_id, "new_complete_unbuilt", new Date(observedAt), repo)
  await endpointTelemetry(client, job.endpoint_id, { httpStatus: fetched.status, snapshot, error: null, success: true })
  await finishJob(client, job.job_id, true, materialChange, null)

  return {
    jobId: job.job_id,
    releaseId: job.release_id,
    sourceSlug: job.source_slug,
    endpointUrl: job.endpoint_url,
    status: "accepted",
    availability: snapshot.availability,
    priceEUR: eur.amountEUR,
    materialChange,
    reasonCodes: snapshot.warnings,
  }
}

export async function runExactPageMarketScanBatch(limit = 4): Promise<MarketAdapterRunResult> {
  const client = createAdminClient()
  const repo = new MarketR3Repository(client)
  const safeLimit = Math.max(1, Math.min(limit, 8))

  const { data: claimed, error: claimError } = await client.rpc("trackdash_claim_market_scan_jobs_v2", {
    p_limit: safeLimit,
    p_lock_minutes: 10,
  })
  fail(claimError, "claim exact-page market scan jobs")
  const jobs = (claimed ?? []) as ClaimedJob[]

  const { data: run, error: runError } = await client
    .from("market_scan_runs")
    .insert({ status: "running", targets_attempted: jobs.length })
    .select("id")
    .single()
  fail(runError, "create exact-page market scan run")
  if (!run) throw new Error("create exact-page market scan run returned no row")
  const runId = run.id

  const results: MarketAdapterJobResult[] = []
  for (const job of jobs) {
    try {
      results.push(await scanClaimedJob(client, repo, job))
    } catch (error) {
      const message = shortError(error)
      try {
        await endpointTelemetry(client, job.endpoint_id, { error: message })
        await finishJob(client, job.job_id, false, false, message)
      } catch {
        // Preserve the original adapter failure in the run result even if the
        // telemetry/finalization path itself also fails.
      }
      results.push({
        jobId: job.job_id,
        releaseId: job.release_id,
        sourceSlug: job.source_slug,
        endpointUrl: job.endpoint_url,
        status: "failed",
        materialChange: false,
        reasonCodes: [message],
      })
    }
  }

  const accepted = results.filter((row) => row.status === "accepted").length
  const review = results.filter((row) => row.status === "review").length
  const failed = results.filter((row) => row.status === "failed").length
  const succeeded = accepted + review
  const status = failed === 0 ? "completed" : succeeded > 0 ? "partial" : jobs.length ? "failed" : "completed"

  const { error: finishRunError } = await client
    .from("market_scan_runs")
    .update({
      status,
      finished_at: new Date().toISOString(),
      targets_succeeded: succeeded,
      candidates_found: accepted + review,
      accepted_count: accepted,
      review_count: review,
      rejected_count: 0,
      duplicate_count: 0,
      error_summary: failed ? results.filter((row) => row.status === "failed").map((row) => row.reasonCodes.join(",")).join(" | ").slice(0, 1000) : null,
    })
    .eq("id", runId)
  fail(finishRunError, "finish exact-page market scan run")

  return {
    runId,
    attempted: jobs.length,
    succeeded,
    accepted,
    review,
    failed,
    results,
  }
}
