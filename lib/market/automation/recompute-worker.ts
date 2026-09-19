import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { MarketR3Repository } from "@/lib/market/pipeline/market-r3-repository"
import { recomputeReleaseMarketSignal } from "@/lib/market/pipeline/market-r3-service"
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
