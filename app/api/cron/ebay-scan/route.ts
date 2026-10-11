import { NextRequest, NextResponse } from "next/server"
import { runEbayActiveMarketScanBatch } from "@/lib/market/automation/ebay-worker"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// Independent bounded dispatcher, secured by CRON_SECRET. Scheduling this
// route requires a separate approved scheduler: Vercel Hobby cannot run a
// three-hour native cron. Never treat a deployed route as an active schedule.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ ok: false, error: "CRON_SECRET_NOT_CONFIGURED" }, { status: 503 })
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 })
  }

  try {
    const result = await runEbayActiveMarketScanBatch(4)
    return NextResponse.json({ ok: result.failed === 0, result })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("[ebay-scan-cron]", message)
    return NextResponse.json({ ok: false, error: message.slice(0, 500) }, { status: 500 })
  }
}
