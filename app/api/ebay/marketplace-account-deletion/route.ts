import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { MarketR3Repository } from "@/lib/market/pipeline/market-r3-repository"
import { recomputeReleaseMarketSignal } from "@/lib/market/pipeline/market-r3-service"
import type { MarketCondition } from "@/lib/market/pipeline/types"
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
  try {
    const rawBody = await request.text()
    const signature = request.headers.get("x-ebay-signature") ?? ""
    const verified = await verifyEbayNotificationSignature(rawBody, signature)
    if (!verified) return new NextResponse(null, { status: 412 })

    const message = parseEbayDeletionNotification(JSON.parse(rawBody))
    const client = createAdminClient()
    const result = await eraseEbayUserData(client, message.identifiers)

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

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN"
    if (code.startsWith("EBAY_NOTIFICATION_") || code === "EBAY_SIGNATURE_INVALID") {
      return NextResponse.json({ error: "INVALID_NOTIFICATION" }, { status: 400 })
    }
    console.error("[ebay-account-deletion] processing_failed")
    return NextResponse.json({ error: "PROCESSING_FAILED" }, { status: 500 })
  }
}
