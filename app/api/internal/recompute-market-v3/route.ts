import { createHash, timingSafeEqual } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { recomputeReleaseMarketSignal } from "@/lib/market/pipeline/market-r3-service"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// Temporary, GET-only migration surface. The plaintext token is never stored in
// the repository; only its SHA-256 digest is committed. Remove after v3 rollout.
const TOKEN_SHA256 = "1851ba7db4b133d6c588fe494bae597d7baa41b1fb20bd910f5d99f0483d7371"

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

  const offsetRaw = Number(request.nextUrl.searchParams.get("offset") ?? "0")
  const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? "10")
  const offset = Number.isFinite(offsetRaw) ? Math.max(0, Math.floor(offsetRaw)) : 0
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(10, Math.floor(limitRaw))) : 10

  const client = createAdminClient()
  const { data: rows, error } = await client
    .from("market_release_signals")
    .select("release_id")
    .eq("condition", "new_complete_unbuilt")
    .order("release_id", { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ ok: false, error: "LOAD_RELEASES_FAILED" }, { status: 500 })
  }

  const results = []
  for (const row of rows ?? []) {
    const signal = await recomputeReleaseMarketSignal(row.release_id, "new_complete_unbuilt")
    results.push({
      releaseId: row.release_id,
      valueEUR: signal.marketValueEUR,
      soldUnits: signal.soldUnits,
      soldSellerCount: signal.soldSellerCount,
      confidence: signal.confidenceLabel,
      trendPercent: signal.trendPercent,
    })
  }

  return NextResponse.json({ ok: true, offset, count: results.length, results })
}
