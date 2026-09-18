import { createHash, timingSafeEqual } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { runEbayActiveMarketScanForRelease } from "@/lib/market/automation/ebay-worker"
import { runEbayPreviewDiagnostics } from "@/lib/market/automation/ebay-preview-diagnostics"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const RELEASE_ID = "5a123617-c84c-5012-ab20-1a9d493259e0"
const JOB_ID = "da542c92-acbd-48cd-9c61-8cb64eb6165a"
const TOKEN_SHA256 = "299560a26e05e2aa7a630943cee627e4afbb1f80808687b999349a458eb96ead"

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

  const mode = request.nextUrl.searchParams.get("mode") === "execute" ? "execute" : "preview"
  const expectedItemId = request.nextUrl.searchParams.get("expectedItemId") ?? undefined
  if (mode === "execute" && !expectedItemId) {
    return NextResponse.json({ ok: false, error: "EXPECTED_ITEM_ID_REQUIRED" }, { status: 400 })
  }

  try {
    const result = await runEbayActiveMarketScanForRelease({
      releaseId: RELEASE_ID,
      jobId: JOB_ID,
      mode,
      expectedItemId,
      allowTargetedPilotWrite: mode === "execute",
    })
    const diagnostics = mode === "preview"
      ? await runEbayPreviewDiagnostics(RELEASE_ID, JOB_ID)
      : undefined

    return NextResponse.json({ ok: true, mode, result, diagnostics })
  } catch (error) {
    const code = error instanceof Error ? error.message.split(":", 1)[0] : "EBAY_18614_PILOT_FAILED"
    console.error("[ebay-18614-pilot] failed", code)
    return NextResponse.json({ ok: false, error: code.slice(0, 120) }, { status: 500 })
  }
}
