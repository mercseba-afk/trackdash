import { NextRequest, NextResponse } from "next/server"
import { createErasureClient } from "@/lib/ebay/erasure-client"
import {
  formatEbayDeletionFailure,
  type EbayDeletionRouteStage,
} from "@/lib/ebay/account-deletion-diagnostics"
import {
  generateEbayDeletionChallenge,
  parseEbayDeletionNotification,
  verifyEbayNotificationSignature,
} from "@/lib/ebay/account-deletion"

import { beforeDeadline, deadlineFetch, EbayRecoveryError } from "@/lib/ebay/account-deletion-recovery"

import { acceptEbayErasure } from "@/lib/ebay/erasure-acceptance"

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
  if (process.env.EBAY_ERASURE_ENABLED !== "true") return new NextResponse(null, { status: 503 })
  const deadline = Date.now() + 45_000
  const fetchWithDeadline = deadlineFetch(deadline, fetch, (operation, code, elapsed) => {
    console.info(`[ebay-account-deletion] operation=${operation} code=${code} elapsed_ms=${elapsed}`)
  })
  let stage: EbayDeletionRouteStage = "request_received"
  const markStage = (nextStage: EbayDeletionRouteStage) => {
    stage = nextStage
    console.info(`[ebay-account-deletion] stage=${nextStage}`)
  }

  try {
    const rawBody = await beforeDeadline(request.text(), deadline)
    const signature = request.headers.get("x-ebay-signature") ?? ""
    const verified = await verifyEbayNotificationSignature(rawBody, signature, fetchWithDeadline, markStage)
    if (!verified) {
      console.warn(formatEbayDeletionFailure(stage, new Error("EBAY_SIGNATURE_VERIFY_FAILED")))
      return new NextResponse(null, { status: 412 })
    }

    const message = parseEbayDeletionNotification(JSON.parse(rawBody))
    markStage("payload_parsed")
    const client = createErasureClient("INGRESS",fetchWithDeadline)
    markStage("supabase_client_ok")
    await acceptEbayErasure(client, message, deadline)
    return new NextResponse(null, { status: 202 })
  } catch (error) {
    if (error instanceof EbayRecoveryError) {
      console.error(`[ebay-account-deletion] failed operation=${error.operation} sql_code=${error.sqlCode}`)
      return new NextResponse(null, { status: 503, headers: { "Retry-After": "30" } })
    }
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
