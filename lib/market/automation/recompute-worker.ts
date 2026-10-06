import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { MarketR3Repository } from "@/lib/market/pipeline/market-r3-repository"
import { recomputeReleaseMarketSignal } from "@/lib/market/pipeline/market-r3-service"
import {
  MARKETPLACE_OFFER_MAX_AGE_HOURS,
  RETAIL_OFFER_MAX_AGE_HOURS,
  didOfferExpireSinceSignalComputed,
} from "@/lib/market/pipeline/market-publication-policy"
import type { MarketCondition } from "@/lib/market/pipeline/types"

interface ClaimedRecomputeJob {
  release_id: string
  condition: MarketCondition
  claimed_dirty_at: string
}

export interface MarketRecomputeJobResult {
  releaseId: string
  condition: MarketCondition
  status: "completed" | "failed"
  marketValueEUR: number | null
  soldUnits: number | null
  error: string | null
}

export interface MarketRecomputeRunResult {
  attempted: number
  succeeded: number
  failed: number
  results: MarketRecomputeJobResult[]
}

interface MaterializedCurrentSignalRow {
  release_id: string
  condition: MarketCondition
  computed_at: string
  current_offer_count: number | null
  retail_anchor_eur: number | string | null
  active_anchor_eur: number | string | null
  starting_offer_candidate_id: string | null
}

interface OfferExpiryRow {
  release_id: string
  condition: MarketCondition
  channel: "retail" | "marketplace"
  last_checked_at: string
}

function signalKey(releaseId: string, condition: string): string {
  return `${releaseId}|${condition}`
}

function hasMaterializedCurrentMarket(row: MaterializedCurrentSignalRow): boolean {
  return (
    Number(row.current_offer_count ?? 0) > 0 ||
    row.retail_anchor_eur != null ||
    row.active_anchor_eur != null ||
    row.starting_offer_candidate_id != null
  )
}

async function enqueueExpiredOfferRecomputes(
  limit: number,
  now = new Date(),
): Promise<number> {
  const client = createAdminClient()
  const safeLimit = Math.max(1, Math.min(limit, 25))
  const minTtlHours = Math.min(
    MARKETPLACE_OFFER_MAX_AGE_HOURS,
    RETAIL_OFFER_MAX_AGE_HOURS,
  )
  const signalCutoff = new Date(now.getTime() - minTtlHours * 3_600_000).toISOString()

  const { data: rawSignals, error: signalError } = await client
    .from("market_release_signals")
    .select("release_id,condition,computed_at,current_offer_count,retail_anchor_eur,active_anchor_eur,starting_offer_candidate_id")
    .lt("computed_at", signalCutoff)
    .or("current_offer_count.gt.0,retail_anchor_eur.not.is.null,active_anchor_eur.not.is.null,starting_offer_candidate_id.not.is.null")
    .order("computed_at", { ascending: true })
    .limit(safeLimit * 8)
  fail(signalError, "load signals eligible for offer-expiry maintenance")

  const signals = ((rawSignals ?? []) as MaterializedCurrentSignalRow[])
    .filter(hasMaterializedCurrentMarket)
  if (!signals.length) return 0

  const releaseIds = [...new Set(signals.map((row) => row.release_id))]
  const marketplaceCutoff = new Date(
    now.getTime() - MARKETPLACE_OFFER_MAX_AGE_HOURS * 3_600_000,
  ).toISOString()
  const retailCutoff = new Date(
    now.getTime() - RETAIL_OFFER_MAX_AGE_HOURS * 3_600_000,
  ).toISOString()

  const [
    { data: marketplaceRows, error: marketplaceError },
    { data: retailRows, error: retailError },
    { data: queuedRows, error: queueError },
  ] = await Promise.all([
    client
      .from("market_offer_states")
      .select("release_id,condition,channel,last_checked_at")
      .in("release_id", releaseIds)
      .eq("channel", "marketplace")
      .lte("last_checked_at", marketplaceCutoff),
    client
      .from("market_offer_states")
      .select("release_id,condition,channel,last_checked_at")
      .in("release_id", releaseIds)
      .eq("channel", "retail")
      .lte("last_checked_at", retailCutoff),
    client
      .from("market_recompute_queue")
      .select("release_id,condition")
      .in("release_id", releaseIds),
  ])
  fail(marketplaceError, "load expired marketplace offers")
  fail(retailError, "load expired retail offers")
  fail(queueError, "load existing market recompute queue")

  const queued = new Set(
    (queuedRows ?? []).map((row: any) => signalKey(row.release_id, row.condition)),
  )
  const expiredBySignal = new Map<string, OfferExpiryRow[]>()

  for (const row of [...(marketplaceRows ?? []), ...(retailRows ?? [])] as OfferExpiryRow[]) {
    const key = signalKey(row.release_id, row.condition)
    const bucket = expiredBySignal.get(key) ?? []
    bucket.push(row)
    expiredBySignal.set(key, bucket)
  }

  const due = signals.filter((signal) => {
    const key = signalKey(signal.release_id, signal.condition)
    if (queued.has(key)) return false

    const expiredOffers = expiredBySignal.get(key) ?? []
    return expiredOffers.some((offer) =>
      didOfferExpireSinceSignalComputed(
        { channel: offer.channel, observedAt: offer.last_checked_at },
        signal.computed_at,
        now,
      ),
    )
  }).slice(0, safeLimit)

  let enqueued = 0
  for (const signal of due) {
    const { error } = await client.rpc("trackdash_enqueue_market_recompute", {
      p_release_id: signal.release_id,
      p_condition: signal.condition,
    })
    fail(error, "enqueue offer-expiry market recompute")
    enqueued += 1
  }

  return enqueued
}

function fail(error: { message?: string } | null, context: string): void {
  if (error) throw new Error(`${context}: ${error.message ?? "unknown Supabase error"}`)
}

function shortError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.length > 900 ? `${message.slice(0, 900)}…` : message
}

export async function runMarketRecomputeBatch(limit = 8): Promise<MarketRecomputeRunResult> {
  const client = createAdminClient()
  const repo = new MarketR3Repository(client)
  const safeLimit = Math.max(1, Math.min(limit, 25))

  // Time passing is itself a market event: an offer that was fresh when the
  // canonical signal was computed can later expire without any new scan/write.
  // Enqueue those Releases before claiming work so the same Admin/cron cycle
  // removes stale starting offers, anchors and counts.
  await enqueueExpiredOfferRecomputes(safeLimit, new Date())

  const { data: claimed, error: claimError } = await client.rpc("trackdash_claim_market_recompute_jobs", {
    p_limit: safeLimit,
    p_lock_minutes: 10,
  })
  fail(claimError, "claim market recompute jobs")
  const jobs = (claimed ?? []) as ClaimedRecomputeJob[]

  const results: MarketRecomputeJobResult[] = []
  for (const job of jobs) {
    try {
      const signal = await recomputeReleaseMarketSignal(
        job.release_id,
        job.condition,
        new Date(),
        repo,
      )

      const { error } = await client.rpc("trackdash_finish_market_recompute_job", {
        p_release_id: job.release_id,
        p_condition: job.condition,
        p_claimed_dirty_at: job.claimed_dirty_at,
        p_success: true,
        p_error: null,
      })
      fail(error, "finish market recompute job")

      results.push({
        releaseId: job.release_id,
        condition: job.condition,
        status: "completed",
        marketValueEUR: signal.marketValueEUR,
        soldUnits: signal.soldUnits,
        error: null,
      })
    } catch (error) {
      const message = shortError(error)
      try {
        await client.rpc("trackdash_finish_market_recompute_job", {
          p_release_id: job.release_id,
          p_condition: job.condition,
          p_claimed_dirty_at: job.claimed_dirty_at,
          p_success: false,
          p_error: message,
        })
      } catch {
        // Keep the original recompute failure as the primary result.
      }

      results.push({
        releaseId: job.release_id,
        condition: job.condition,
        status: "failed",
        marketValueEUR: null,
        soldUnits: null,
        error: message,
      })
    }
  }

  const failed = results.filter((row) => row.status === "failed").length
  return {
    attempted: jobs.length,
    succeeded: jobs.length - failed,
    failed,
    results,
  }
}
