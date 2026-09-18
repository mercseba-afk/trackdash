import { createHash, timingSafeEqual } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { runEbayActiveMarketScanForRelease } from "@/lib/market/automation/ebay-worker"
import { runEbayPreviewDiagnostics } from "@/lib/market/automation/ebay-preview-diagnostics"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const RELEASE_ID = "ace0d1b1-aaf3-589a-977c-a3df07c83c73"
const JOB_ID = "c4e0e98c-3c88-43d2-a405-9a33bdee0a8f"
const TOKEN_SHA256 = "b263e5d7c81c3972dde24fba190dcd673043977f5a74763b426d39adb72f2307"

function authorized(request: NextRequest): boolean {
  const supplied = request.nextUrl.searchParams.get("token")
  if (!supplied) return false
  const actual = Buffer.from(createHash("sha256").update(supplied).digest("hex"))
  const expected = Buffer.from(TOKEN_SHA256)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 })
  }

  try {
    const result = await runEbayActiveMarketScanForRelease({
      releaseId: RELEASE_ID,
      jobId: JOB_ID,
      mode: "preview",
    })
    const diagnostics = await runEbayPreviewDiagnostics(RELEASE_ID, JOB_ID)
    return NextResponse.json({ ok: true, result, diagnostics })
  } catch (error) {
    const code = error instanceof Error ? error.message.split(":", 1)[0] : "EBAY_95467_PREVIEW_FAILED"
    console.error("[ebay-95467-preview] failed", code)
    return NextResponse.json({ ok: false, error: code.slice(0, 120) }, { status: 500 })
  }
}
