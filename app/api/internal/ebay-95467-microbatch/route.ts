import { timingSafeEqual } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { runEbayActiveMarketScanForRelease } from "@/lib/market/automation/ebay-worker"
import { runEbayPreviewDiagnostics } from "@/lib/market/automation/ebay-preview-diagnostics"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// Production surface remains POST-only and protected by EBAY_MICROBATCH_SECRET.

const RELEASE_ID = "ace0d1b1-aaf3-589a-977c-a3df07c83c73"
const JOB_ID = "c4e0e98c-3c88-43d2-a405-9a33bdee0a8f"

function authorized(request: NextRequest): boolean {
  const configured = process.env.EBAY_MICROBATCH_SECRET
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (!configured || !supplied) return false
  const expected = Buffer.from(configured)
  const actual = Buffer.from(supplied)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 })
  }

  let body: { mode?: unknown; expectedItemId?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_REQUEST" }, { status: 400 })
  }

  if (body.mode !== "preview" && body.mode !== "execute") {
    return NextResponse.json({ ok: false, error: "INVALID_MODE" }, { status: 400 })
  }
  const expectedItemId = typeof body.expectedItemId === "string" ? body.expectedItemId : undefined

  try {
    const result = await runEbayActiveMarketScanForRelease({
      releaseId: RELEASE_ID,
      jobId: JOB_ID,
      mode: body.mode,
      expectedItemId,
    })
    const diagnostics = body.mode === "preview"
      ? await runEbayPreviewDiagnostics(RELEASE_ID, JOB_ID)
      : undefined
    return NextResponse.json({ ok: true, result, diagnostics })
  } catch (error) {
    const code = error instanceof Error ? error.message.split(":", 1)[0] : "EBAY_MICROBATCH_FAILED"
    console.error(`[ebay-95467-microbatch] failed code=${code.slice(0, 120)}`)
    return NextResponse.json({ ok: false, error: code.slice(0, 120) }, { status: 500 })
  }
}
