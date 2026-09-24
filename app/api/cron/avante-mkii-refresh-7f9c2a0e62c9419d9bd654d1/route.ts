import { NextResponse } from "next/server"
import { runExactPageMarketScanBatch } from "@/lib/market/automation/worker"
import { runEbayActiveMarketScanBatch } from "@/lib/market/automation/ebay-worker"
import { runMarketRecomputeBatch } from "@/lib/market/automation/recompute-worker"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const EXPIRES_AT = Date.parse("2026-09-24T11:00:00Z")

function summarizeSettled<T>(result: PromiseSettledResult<T>) {
  if (result.status === "fulfilled") return { ok: true as const, result: result.value }
  const error = result.reason instanceof Error ? result.reason.message : String(result.reason)
  return { ok: false as const, error: error.slice(0, 500) }
}

export async function GET() {
  if (process.env.VERCEL_ENV !== "production" && process.env.VERCEL_ENV !== "preview") {
    return NextResponse.json({ ok: false, error: "VERCEL_ENV_ONLY" }, { status: 403 })
  }

  if (Date.now() > EXPIRES_AT) {
    return NextResponse.json({ ok: false, error: "EXPIRED" }, { status: 410 })
  }

  const [exactPagesResult, ebayActiveResult, recomputeResult] = await Promise.allSettled([
    runExactPageMarketScanBatch(4),
    runEbayActiveMarketScanBatch(4),
    runMarketRecomputeBatch(8),
  ])

  const exactPages = summarizeSettled(exactPagesResult)
  const ebayActive = summarizeSettled(ebayActiveResult)
  const recompute = summarizeSettled(recomputeResult)

  return NextResponse.json({
    ok: exactPages.ok && ebayActive.ok && recompute.ok,
    environment: process.env.VERCEL_ENV,
    exactPages,
    ebayActive,
    recompute,
  })
}
