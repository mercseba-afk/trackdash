import { createHash, timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { createErasureClient } from "@/lib/ebay/erasure-client"
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
    const client=createErasureClient("WORKER",boundedFetch)
    let processed=0,failed=0,result
    for(let n=0;n<4&&Date.now()<deadline-12000;n++){
      // Persistent alarms stay unacknowledged. The direct GitHub DB monitor
      // reports them via a failing check, not an unverified external webhook.
      result=await runErasureRecoveryTick(client,deadline,report,async()=>{throw Error("MONITOR_REQUIRED")})
      processed+=result.processed;failed+=result.failed
      if(result.failed||!result.processed)break
    }
    if(!result)throw Error("DEADLINE")
    result={...result,processed,failed,healthy:result.healthy&&!failed}
    return NextResponse.json(result, { status: result.healthy ? 200 : 503 })
  } catch (error) {
    const code = error instanceof EbayRecoveryError && /^(?:[A-Z0-9]{5}|PGRST[0-9]{3}|DEADLINE)$/.test(error.sqlCode)
      ? error.sqlCode : "FAILED"
    report("tick", code)
    return new NextResponse(null, { status: 503 })
  }
}
