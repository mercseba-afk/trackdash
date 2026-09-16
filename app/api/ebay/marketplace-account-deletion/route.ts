import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { MarketR3Repository } from "@/lib/market/pipeline/market-r3-repository"
import { recomputeReleaseMarketSignal } from "@/lib/market/pipeline/market-r3-service"
import type { MarketCondition } from "@/lib/market/pipeline/types"
import {
  formatEbayDeletionFailure,
  type EbayDeletionRouteStage,
} from "@/lib/ebay/account-deletion-diagnostics"
import {
  eraseEbayUserData,
  generateEbayDeletionChallenge,
  parseEbayDeletionNotification,
  verifyEbayNotificationSignature,
} from "@/lib/ebay/account-deletion"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(request: NextRequest) {
  try {
    const challengeCode = request.nextUrl.searchParams.get("challenge_code")
    if (!challengeCode) {
      return NextResponse.json({ error: "CHALLENGE_CODE_REQUIRED" }, { status: 400 })
    }
    return NextResponse.json({ challengeResponse: generateEbayDeletionChallenge(challengeCode) })
  } catch {
    return NextResponse.json({ error: "ENDPOINT_NOT_CONFIGURED" }, { status: 503 })
  }
}

export async function POST(request: NextRequest) {
  let stage: EbayDeletionRouteStage = "request_received"
  const markStage = (nextStage: EbayDeletionRouteStage) => {
    stage = nextStage
    console.info(`[ebay-account-deletion] stage=${nextStage}`)
  }

  try {
    const rawBody = await request.text()
    const signature = request.headers.get("x-ebay-signature") ?? ""
    const verified = await verifyEbayNotificationSignature(rawBody, signature, fetch, markStage)
    if (!verified) {
      console.warn(formatEbayDeletionFailure(stage, new Error("EBAY_SIGNATURE_VERIFY_FAILED")))
      return new NextResponse(null, { status: 412 })
    }

    const message = parseEbayDeletionNotification(JSON.parse(rawBody))
    markStage("payload_parsed")
    const client = createAdminClient()
    markStage("supabase_client_ok")
    const result = await eraseEbayUserData(client, message.identifiers)
    stage = "erasure_completed"
    console.info(
      `[ebay-account-deletion] stage=erasure_completed candidates=${result.candidatesUpdated} offers=${result.offersUpdated} price_points=${result.pricePointsUpdated} aggregates=${result.aggregatePayloadsUpdated} monthly=${result.monthlyPayloadsUpdated} affected_release_conditions=${result.affectedReleaseConditions.length}`,
    )

    try {
      if (result.affectedReleaseConditions.length > 0) {
        const repo = new MarketR3Repository(client)
        for (const affected of result.affectedReleaseConditions) {
          await recomputeReleaseMarketSignal(
            affected.releaseId,
            affected.condition as MarketCondition,
            new Date(),
            repo,
          )
        }
      }
    } catch {
      throw new Error("EBAY_RECOMPUTE_FAILED")
    }
    stage = "recompute_completed"
    console.info(
      `[ebay-account-deletion] stage=recompute_completed count=${result.affectedReleaseConditions.length}`,
    )

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN"
    const failure = formatEbayDeletionFailure(stage, error)
    if (code.startsWith("EBAY_NOTIFICATION_") || code === "EBAY_SIGNATURE_INVALID") {
      console.warn(failure)
      return NextResponse.json({ error: "INVALID_NOTIFICATION" }, { status: 400 })
    }
    console.error(failure)
    return NextResponse.json({ error: "PROCESSING_FAILED" }, { status: 500 })
  }
}
