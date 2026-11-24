import "server-only"
import { createHash } from "node:crypto"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { MarketR3Repository } from "@/lib/market/pipeline/market-r3-repository"
import { recomputeReleaseMarketSignal } from "@/lib/market/pipeline/market-r3-service"
import type { MarketAdapterJobResult } from "./worker"
import { AMAZON_SCAN_PILOT, parseAmazonOffers, unwrapAmazonJobResponse } from "./amazon-offers"

interface Job { job_id: string; release_id: string; source_id: string; source_slug: string; endpoint_id: string; endpoint_url: string; exact_release_verified: boolean }
interface PendingState { requestStartedAt?: string; nextSubmitAt?: string; providerJobId?: string; asin?: string; phase?: string; offerCount?: number }
const DAY = 86_400_000
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i

function checked(error: { message?: string } | null) {
  if (error) throw new Error("AMAZON_STATE_PERSIST_FAILED")
}

// Responses, URLs and thrown fetch errors are never logged: they can contain keys.
async function readJson(url: string, options: RequestInit = {}) {
  const response = await fetch(url, { ...options, redirect: "error", cache: "no-store", signal: AbortSignal.timeout(10_000) })
  if (!response.body) throw new Error("AMAZON_PROVIDER_EMPTY_RESPONSE")
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let text = "", bytes = 0
  try {
    while (true) {
      const next = await reader.read()
      if (next.done) break
      bytes += next.value.byteLength
      if (bytes > 750_000) { await reader.cancel(); throw new Error("AMAZON_RESPONSE_TOO_LARGE") }
      text += decoder.decode(next.value, { stream: true })
    }
    text += decoder.decode()
  } finally { reader.releaseLock() }
  if (!response.ok) {
    // Only fixed diagnostic labels can cross the boundary, never response text
    // (a provider validation error may echo a credential-bearing request).
    const field = /max_cost/i.test(text) ? "_COST_PARAMETER" : /condition/i.test(text) ? "_CONDITION_PARAMETER" : /api.?key/i.test(text) ? "_API_KEY" : /callback/i.test(text) ? "_CALLBACK_PARAMETER" : ""
    throw new Error(`AMAZON_PROVIDER_HTTP_${response.status}${field}`)
  }
  try { return JSON.parse(text) as Record<string, any> } catch { throw new Error("AMAZON_PROVIDER_INVALID_JSON") }
}

export async function scanClaimedAmazonJob(client: SupabaseClient, repo: MarketR3Repository, job: Job): Promise<MarketAdapterJobResult> {
  const now = new Date().toISOString()
  const base = { jobId: job.job_id, releaseId: job.release_id, sourceSlug: job.source_slug, endpointUrl: job.endpoint_url, materialChange: false }
  let state: PendingState = {}
  async function persistState(next: PendingState, error: string | null = null, success = false) {
    state = next
    const { error: dbError } = await client.from("market_scan_endpoints").update({
      last_extraction: { adapter: "amazon-offers-async-v1", ...state }, last_checked_at: now,
      last_error: error, ...(success ? { last_success_at: now, last_http_status: 200 } : {}), updated_at: now,
    }).eq("id", job.endpoint_id)
    checked(dbError)
  }
  async function releaseQueue(delayMs: number, error: string | null = null, success = false) {
    const { error: dbError } = await client.from("market_scan_queue").update({
      locked_until: null, next_scan_at: new Date(Date.now() + delayMs).toISOString(),
      scan_interval_hours: 24, last_error: error, ...(success ? { last_success_at: now, consecutive_failures: 0 } : {}), updated_at: now,
    }).eq("id", job.job_id)
    checked(dbError)
  }
  try {
    const pilot = AMAZON_SCAN_PILOT[job.release_id]
    if (!pilot || job.source_slug !== "amazon_it_public" || !job.exact_release_verified || job.endpoint_url !== `https://www.amazon.it/dp/${pilot.asin}`) throw new Error("AMAZON_ENDPOINT_NOT_ALLOWLISTED")
    const key = process.env.TRACKDASH_SCRAPERAPI_KEY
    if (!key) throw new Error("AMAZON_PROVIDER_KEY_NOT_CONFIGURED")
    const { data: release, error: releaseError } = await client.from("product_releases").select("item_number").eq("id", job.release_id).single()
    checked(releaseError)
    if (release?.item_number !== pilot.item) throw new Error("AMAZON_RELEASE_BINDING_CHANGED")
    const { data: endpoint, error: endpointError } = await client.from("market_scan_endpoints").select("last_extraction").eq("id", job.endpoint_id).single()
    checked(endpointError)
    state = endpoint?.last_extraction ?? {}

    if (!state.providerJobId) {
      const cooldown = Date.parse(state.nextSubmitAt ?? "")
      if (Number.isFinite(cooldown) && cooldown > Date.now()) {
        await releaseQueue(cooldown - Date.now())
        return { ...base, status: "review", reasonCodes: ["AMAZON_DAILY_BUDGET_HOLD"] }
      }
      // Persist the 24h reservation BEFORE the chargeable request. Even a lost
      // response/process crash cannot cause repeated submissions the same day.
      await persistState({ asin: pilot.asin, phase: "submitting", requestStartedAt: now, nextSubmitAt: new Date(Date.now() + DAY).toISOString() })
      const submitted = await readJson("https://async.scraperapi.com/structured/amazon/offers", {
        method: "POST", headers: { "Content-Type": "application/json" },
        // SDE async's documented request contract differs from synchronous
        // playground filters and generic /jobs apiParams. Send ONLY its fields.
        // New-only filtering still happens on every returned seller offer.
        body: JSON.stringify({ apiKey: key, asin: pilot.asin, country_code: "it", tld: "it" }),
      })
      if (!UUID.test(String(submitted.id ?? "")) || (submitted.asin && submitted.asin !== pilot.asin)) throw new Error("AMAZON_PROVIDER_JOB_INVALID")
      await persistState({ ...state, phase: "pending", providerJobId: submitted.id })
      await releaseQueue(15 * 60_000)
      return { ...base, status: "review", reasonCodes: ["AMAZON_ASYNC_PENDING"] }
    }

    if (!UUID.test(state.providerJobId) || state.asin !== pilot.asin) throw new Error("AMAZON_PROVIDER_STATE_INVALID")
    // Construct a fixed provider URL; never follow a response-supplied statusUrl.
    const result = await readJson(`https://async.scraperapi.com/structured/amazon/offers/${state.providerJobId}`)
    if (result.status === "running" || result.status === "pending") {
      if (Date.now() - Date.parse(state.requestStartedAt ?? "") > DAY) throw new Error("AMAZON_ASYNC_EXPIRED")
      await releaseQueue(15 * 60_000)
      return { ...base, status: "review", reasonCodes: ["AMAZON_ASYNC_PENDING"] }
    }
    if (result.status !== "finished") throw new Error("AMAZON_ASYNC_FAILED")
    if (result.asin && result.asin !== pilot.asin) throw new Error("AMAZON_ASIN_RESPONSE_MISMATCH")
    const { title, offers } = parseAmazonOffers(unwrapAmazonJobResponse(result.response), pilot.item)
    const old = await repo.listCurrentOffers(job.release_id, "new_complete_unbuilt")
    const oldAmazon = old.filter(o => o.sourceId === job.source_id)
    const seen = new Set<string>()
    let changed = false
    for (const offer of offers) {
      const seller = `amazon:${createHash("sha256").update(offer.sellerId).digest("hex")}`
      seen.add(seller)
      const record = `amazon:it:${pilot.asin}:${offer.sellerId}`
      const { data: existing, error: existingError } = await client.from("market_candidates").select("id,first_observed_at").eq("source_id", job.source_id).eq("source_record_key", record).maybeSingle()
      checked(existingError)
      const { data: candidate, error: candidateError } = await client.from("market_candidates").upsert({
        source_id: job.source_id, source_record_key: record, external_listing_id: record,
        original_source: "AMAZON_IT", original_record_id: record, listing_url: job.endpoint_url,
        title_raw: title, item_number_observed: pilot.item, possible_release_ids: [job.release_id], resolved_release_id: job.release_id,
        price: offer.price, currency: "EUR", shipping_cost: offer.shipping, shipping_basis: offer.shipping == null ? "unknown" : "included_exact",
        observation_type: "active_listing", condition_raw: offer.condition, condition: "new_complete_unbuilt", is_complete: true, is_lot: false,
        match_confidence: "exact", match_evidence: ["item_number_exact", "verified_endpoint_match"], seller_fingerprint: seller,
        decision: "accepted", needs_revalidation: false, reason_codes: ["AMAZON_VERIFIED_ASIN_NEW_OFFER"],
        // Store only necessary offer evidence. No customer reviews, addresses,
        // profile URLs, provider API response, credentials or cookies.
        raw_payload: { adapter: "amazon-offers-async-v1", asin: pilot.asin, sellerName: offer.sellerName, sellerId: offer.sellerId, condition: offer.condition, marketplace: "IT", shippingEstimateCountry: "IT", itemLocationCountry: null, importChargesVerified: false },
        observed_at: now, first_observed_at: existing?.first_observed_at ?? now, last_observed_at: now, updated_at: now,
      }, { onConflict: "source_id,source_record_key" }).select("id").single()
      checked(candidateError)
      if (!candidate) throw new Error("AMAZON_CANDIDATE_NOT_SAVED")
      const prior = oldAmazon.find(o => o.sellerFingerprint === seller)
      changed ||= !prior || prior.itemPriceEUR !== offer.price || prior.shippingEUR !== offer.shipping || prior.availability !== "in_stock"
      await repo.upsertOfferState({ candidateId: candidate.id, releaseId: job.release_id, sourceId: job.source_id,
        condition: "new_complete_unbuilt", channel: "marketplace", availability: "in_stock", sellerFingerprint: seller,
        itemPrice: offer.price, shippingPrice: offer.shipping, currency: "EUR", itemPriceEUR: offer.price,
        shippingEUR: offer.shipping, fxRateToEUR: 1, fxRateDate: now.slice(0, 10), observedAt: now })
    }
    // A missing seller is not a completed sale or proof of stock exhaustion.
    // Retire the stale purchase claim; retain the old evidence in the audit.
    for (const previous of oldAmazon) {
      if (previous.sellerFingerprint && seen.has(previous.sellerFingerprint)) continue
      if (previous.availability === "unknown") continue
      await repo.upsertOfferState({ candidateId: previous.candidateId!, releaseId: job.release_id, sourceId: job.source_id,
        condition: "new_complete_unbuilt", channel: "marketplace", availability: "unknown", sellerFingerprint: previous.sellerFingerprint,
        itemPrice: previous.itemPrice, shippingPrice: previous.shippingPrice, currency: previous.currency,
        itemPriceEUR: previous.itemPriceEUR, shippingEUR: previous.shippingEUR, fxRateToEUR: previous.fxRateToEUR, fxRateDate: previous.fxRateDate, observedAt: now })
      changed = true
    }
    await recomputeReleaseMarketSignal(job.release_id, "new_complete_unbuilt", new Date(now), repo)
    await persistState({ ...state, phase: "completed", providerJobId: undefined, offerCount: offers.length }, null, true)
    // Polling is free; only a fresh submission waits for its saved daily slot.
    await releaseQueue(Math.max(60_000, Date.parse(state.nextSubmitAt ?? "") - Date.now()) || DAY, null, true)
    return { ...base, status: "accepted", materialChange: changed, reasonCodes: ["AMAZON_NEW_OFFERS_UPDATED"], priceEUR: offers[0]?.price ?? null }
  } catch (error) {
    const message = error instanceof Error && /^AMAZON_[A-Z0-9_]+$/.test(error.message) ? error.message : "AMAZON_SCAN_FAILED"
    // No failed/partial response can erase existing prices or manufacture SOLD.
    await persistState({ ...state, phase: "failed", providerJobId: undefined }, message)
    await releaseQueue(DAY, message)
    return { ...base, status: "failed", reasonCodes: [message] }
  }
}
