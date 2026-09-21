import { NextRequest, NextResponse } from "next/server"
import { runExactPageMarketScanBatch } from "@/lib/market/automation/worker"
import { runEbayActiveMarketScanBatch } from "@/lib/market/automation/ebay-worker"
import { runMarketRecomputeBatch } from "@/lib/market/automation/recompute-worker"

export const dynamic = "force-dynamic"
// Keep sold-driven recomputes on the same protected market cron so ingestion\n// and public signals converge without requiring an unrelated ASK/retail change.\nexport const maxDuration = 60

function summarizeSettled<T>(result: PromiseSettledResult<T>) {
  if (result.status === "fulfilled") return { ok: true as const, result: result.value }
  const error = result.reason instanceof Error ? result.reason.message : String(result.reason)
  return { ok: false as const, error: error.slice(0, 500) }
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET_NOT_CONFIGURED" }, { status: 503 })
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 })
  }

  try {
    const [exactPagesResult, ebayActiveResult, recomputeResult] = await Promise.allSettled([
      runExactPageMarketScanBatch(4),
      runEbayActiveMarketScanBatch(4),
      runMarketRecomputeBatch(8),
    ])

    const exactPages = summarizeSettled(exactPagesResult)
    const ebayActive = summarizeSettled(ebayActiveResult)
    const recompute = summarizeSettled(recomputeResult)

    const failedLanes = [
      ["exactPages", exactPages],
      ["ebayActive", ebayActive],
      ["recompute", recompute],
    ].filter(([, lane]) => !lane.ok)

    for (const [laneName, lane] of failedLanes) {
      console.error(`[market-scan-cron:${laneName}]`, lane.ok ? "" : lane.error)
    }

    return NextResponse.json({
      ok: failedLanes.length === 0,
      partial: failedLanes.length > 0,
      exactPages,
      ebayActive,
      recompute,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("[market-scan-cron]", message)
    return NextResponse.json({ ok: false, error: message.slice(0, 500) }, { status: 500 })
  }
}
