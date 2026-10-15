import { NextRequest, NextResponse } from "next/server"
import { runExactPageMarketScanBatch } from "@/lib/market/automation/worker"
import { runEbayActiveMarketScanBatch } from "@/lib/market/automation/ebay-worker"
import { runMarketRecomputeBatch } from "@/lib/market/automation/recompute-worker"
import { summarizeCronCycle, summarizeCronWorker } from "@/lib/market/automation/cron-outcome"

export const dynamic = "force-dynamic"
// Keep sold-driven recomputes on the same protected market cron so ingestion
// and public signals converge without requiring an unrelated ASK/retail change.
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ ok: false, status: "not_configured", partial: false, error: "CRON_SECRET_NOT_CONFIGURED" }, { status: 503 })
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 })
  }

  try {
    const [exactPagesResult, ebayActiveResult, recomputeResult] = await Promise.allSettled([
      runExactPageMarketScanBatch(4),
      runEbayActiveMarketScanBatch(1),
      runMarketRecomputeBatch(8),
    ])

    const exactPages = {
      ...summarizeCronWorker(exactPagesResult),
      ...(exactPagesResult.status === "fulfilled" ? { result: exactPagesResult.value } : {}),
    }
    const ebayActive = {
      ...summarizeCronWorker(ebayActiveResult),
      ...(ebayActiveResult.status === "fulfilled" ? { result: ebayActiveResult.value } : {}),
    }
    const recompute = {
      ...summarizeCronWorker(recomputeResult),
      ...(recomputeResult.status === "fulfilled" ? { result: recomputeResult.value } : {}),
    }
    const { httpStatus, ...outcome } = summarizeCronCycle([exactPages, ebayActive, recompute])
    for (const [lane, report] of Object.entries({ exactPages, ebayActive, recompute })) {
      if (!report.ok) console.error(`[market-scan-cron:${lane}]`, { status: report.status, error: report.error, summary: report.summary })
    }

    return NextResponse.json({
      ...outcome,
      exactPages,
      ebayActive,
      recompute,
    }, { status: httpStatus })
  } catch {
    console.error("[market-scan-cron]", "CRON_EXECUTION_FAILED")
    return NextResponse.json({ ok: false, status: "failed", partial: false, error: "CRON_EXECUTION_FAILED" }, { status: 500 })
  }
}
