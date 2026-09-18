import { createHash, timingSafeEqual } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { runEbayActiveMarketScanForRelease } from "@/lib/market/automation/ebay-worker"
import { runEbayPreviewDiagnostics } from "@/lib/market/automation/ebay-preview-diagnostics"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// 18069 one-time production pilot.
const RELEASE_ID = "f576fa21-8e57-5fa0-953e-f468653e3767"
const JOB_ID = "0f89b056-3740-462b-b3b2-7c32f4db2476"
const TOKEN_SHA256 = "609dfe58051cfda678b7a6d880f89f28f27852ace44d76e05cc7953ab464b56f"

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
    const code = error instanceof Error ? error.message.split(":", 1)[0] : "EBAY_18069_PILOT_FAILED"
    console.error("[ebay-18069-pilot] failed", code)
    return NextResponse.json({ ok: false, error: code.slice(0, 120) }, { status: 500 })
  }
}
