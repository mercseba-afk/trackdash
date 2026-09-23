import { NextRequest, NextResponse } from "next/server"
import { runHotWheelsEbayAskAuditForRelease } from "@/lib/market/automation/hotwheels-ebay-audit"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  // Temporary pilot diagnostic. It is deliberately unavailable in Production
  // and will be removed after the controlled Hot Wheels ASK audit.
  if (process.env.VERCEL_ENV !== "preview") {
    return NextResponse.json({ error: "NOT_AVAILABLE" }, { status: 404 })
  }

  const releaseId = request.nextUrl.searchParams.get("releaseId")?.trim()
  if (!releaseId) {
    return NextResponse.json({ error: "RELEASE_ID_REQUIRED" }, { status: 400 })
  }

  const includeFallbackQuery = request.nextUrl.searchParams.get("fallback") === "1"

  try {
    const result = await runHotWheelsEbayAskAuditForRelease(releaseId, {
      perQueryLimit: 10,
      includeFallbackQuery,
    })
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "HOTWHEELS_AUDIT_FAILED"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
