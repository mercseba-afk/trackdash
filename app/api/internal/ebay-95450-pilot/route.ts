import { createHash, timingSafeEqual } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { runEbayActiveMarketScanForRelease } from "@/lib/market/automation/ebay-worker"
import { runEbayPreviewDiagnostics } from "@/lib/market/automation/ebay-preview-diagnostics"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const RELEASE_ID = "6168c423-9f3e-5495-9a1d-06185ea7fa34"
const JOB_ID = "4301ec3d-0293-4b42-8994-ae161d038b0a"
const TOKEN_SHA256 = "7aa001f9dc4182c494427c38b35bf888bc05ee2974bec7943a96b8075fd2fe38"

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
    const code = error instanceof Error ? error.message.split(":", 1)[0] : "EBAY_95450_PILOT_FAILED"
    console.error("[ebay-95450-pilot] failed", code)
    return NextResponse.json({ ok: false, error: code.slice(0, 120) }, { status: 500 })
  }
}
