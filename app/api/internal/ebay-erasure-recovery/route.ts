import { createHash, timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { deadlineFetch, EbayRecoveryError } from "@/lib/ebay/account-deletion-recovery"
import { validateInboxKeys } from "@/lib/ebay/erasure-inbox"
import { runErasureRecoveryTick } from "@/lib/ebay/erasure-worker"
export const dynamic = "force-dynamic"
export const maxDuration = 60
export async function POST(request: Request) {
  if (process.env.EBAY_ERASURE_WORKER_ENABLED !== "true") return new NextResponse(null, { status: 503 })
  const secret = process.env.EBAY_ERASURE_RECOVERY_TOKEN
  const provided = request.headers.get("authorization") ?? ""
  if (!secret || secret.length < 32 || !timingSafeEqual(createHash("sha256").update(provided).digest(), createHash("sha256").update("Bearer " + secret).digest()))
    return new NextResponse(null, { status: 401 })
  const deadline = Date.now() + 45_000, boundedFetch = deadlineFetch(deadline)
  const report = (operation: string, code: string) => console.info(`[ebay-erasure-recovery] operation=${operation} code=${code}`)
  try {
    validateInboxKeys()
    const alertUrl = process.env.EBAY_ERASURE_ALERT_URL, alertToken = process.env.EBAY_ERASURE_ALERT_TOKEN
    if (!alertUrl || new URL(alertUrl).protocol !== "https:" || !alertToken) throw Error("ALERT_NOT_CONFIGURED")
    const result = await runErasureRecoveryTick(createAdminClient(boundedFetch), deadline, report, async alarm => {
      const response = await boundedFetch(alertUrl, { method: "POST", redirect: "error", headers: {
        "Content-Type": "application/json", Authorization: "Bearer " + alertToken,
      }, body: JSON.stringify(alarm) })
      if (!response.ok) throw Error("ALARM_FAILED")
    }, new URL(request.url).searchParams.get("mode") === "monitor")
    return NextResponse.json(result, { status: result.healthy ? 200 : 503 })
  } catch (error) {
    const code = error instanceof EbayRecoveryError && /^(?:[A-Z0-9]{5}|PGRST[0-9]{3}|DEADLINE)$/.test(error.sqlCode)
      ? error.sqlCode : "FAILED"
    report("tick", code)
    return new NextResponse(null, { status: 503 })
  }
}
