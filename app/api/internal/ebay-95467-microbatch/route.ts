import { createHash, timingSafeEqual } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { runEbayActiveMarketScanForRelease } from "@/lib/market/automation/ebay-worker"
import { runEbayPreviewDiagnostics } from "@/lib/market/automation/ebay-preview-diagnostics"

export const dynamic = "force-dynamic"
export const maxDuration = 60

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

const PREVIEW_TOKEN_SHA256 = "4717503c7d895ad2bba354198bde24030b3de8f21641c2292dea5dbbee9e3e82"

function previewAuthorized(request: NextRequest): boolean {
  const supplied = request.nextUrl.searchParams.get("token")
  if (!supplied) return false
  const digest = createHash("sha256").update(supplied).digest("hex")
  const expected = Buffer.from(PREVIEW_TOKEN_SHA256)
  const actual = Buffer.from(digest)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export async function GET(request: NextRequest) {
  if (!previewAuthorized(request)) {
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
    const code = error instanceof Error ? error.message.split(":", 1)[0] : "EBAY_MICROBATCH_PREVIEW_FAILED"
    console.error(`[ebay-95467-preview] failed code=${code.slice(0, 120)}`)
    return NextResponse.json({ ok: false, error: code.slice(0, 120) }, { status: 500 })
  }
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
