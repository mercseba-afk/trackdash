import { createHash } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { runMarketRecomputeBatch } from "@/lib/market/automation/recompute-worker"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")
  if (!token) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 })

  const hash = createHash("sha256").update(token).digest("hex")
  const admin = createAdminClient()
  const now = new Date().toISOString()

  const { data: authorization, error } = await admin
    .from("ops_one_time_authorizations")
    .update({ used_at: now })
    .eq("operation", "avante-master-recompute")
    .eq("token_hash", hash)
    .is("used_at", null)
    .gt("expires_at", now)
    .select("id")
    .maybeSingle()

  if (error || !authorization) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 })
  }

  try {
    const result = await runMarketRecomputeBatch(25)
    return NextResponse.json({ ok: result.failed === 0, result })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ ok: false, error: message.slice(0, 500) }, { status: 500 })
  }
}
