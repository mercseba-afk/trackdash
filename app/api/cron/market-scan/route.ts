import { NextRequest, NextResponse } from "next/server"
import { runExactPageMarketScanBatch } from "@/lib/market/automation/worker"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET_NOT_CONFIGURED" }, { status: 503 })
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 })
  }

  try {
    const result = await runExactPageMarketScanBatch(4)
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("[market-scan-cron]", message)
    return NextResponse.json({ ok: false, error: message.slice(0, 500) }, { status: 500 })
  }
}
