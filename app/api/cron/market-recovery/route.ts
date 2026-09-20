import { NextRequest, NextResponse } from "next/server"

import { runEbayActiveMarketScanBatch } from "@/lib/market/automation/ebay-worker"
import { runMarketRecomputeBatch } from "@/lib/market/automation/recompute-worker"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(request: NextRequest) {
  if (
    process.env.VERCEL_ENV !== "preview" ||
    process.env.VERCEL_GIT_COMMIT_REF !== "fix/market-recompute-service-role"
  ) {
    return NextResponse.json({ ok: false, error: "NOT_AVAILABLE" }, { status: 404 })
  }

  const kind = request.nextUrl.searchParams.get("kind") ?? "recompute"

  try {
    if (kind === "recompute") {
      const recompute = await runMarketRecomputeBatch(8)
      return NextResponse.json({ ok: true, kind, recompute })
    }

    if (kind === "ebay") {
      const ebayActive = await runEbayActiveMarketScanBatch(4)
      return NextResponse.json({ ok: true, kind, ebayActive })
    }

    return NextResponse.json({ ok: false, error: "INVALID_KIND" }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ ok: false, error: message.slice(0, 500) }, { status: 500 })
  }
}
