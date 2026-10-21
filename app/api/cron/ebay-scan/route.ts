import { NextRequest, NextResponse } from "next/server"
import { createPublicKey, timingSafeEqual, verify as verifySignature } from "node:crypto"
import { runEbayActiveMarketScanBatch } from "@/lib/market/automation/ebay-worker"
import { runExactPageMarketScanBatch } from "@/lib/market/automation/worker"
import { runMarketRecomputeBatch } from "@/lib/market/automation/recompute-worker"
import { summarizeCronCycle, summarizeCronWorker } from "@/lib/market/automation/cron-outcome"
import { retailCanarySource, probeRetailSource } from "@/lib/market/automation/retail-source-canary"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const OIDC_ISSUER = "https://token.actions.githubusercontent.com"
const OIDC_JWKS = "https://token.actions.githubusercontent.com/.well-known/jwks"
const OIDC_AUDIENCE = "trackdash-ebay-scan"
const TRUSTED_REPO_ID = "1351337497"
const TRUSTED_REF = "refs/heads/main"
const TRUSTED_WORKFLOW = "mercseba-afk/trackdash/.github/workflows/ebay-market-watch.yml@refs/heads/main"

function asObject(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : null
}

function isCronSecret(token: string): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const a = Buffer.from(token)
  const b = Buffer.from(secret)
  return a.length === b.length && timingSafeEqual(a, b)
}

// GitHub Actions OIDC is verified cryptographically, not merely decoded.
// Trust only the precise scheduled workflow on the canonical main branch.
async function isTrustedGithubAction(token: string): Promise<boolean> {
  try {
    if (token.length > 8192) return false
    const parts = token.split(".")
    if (parts.length !== 3) return false
    const [encodedHeader, encodedClaims, encodedSignature] = parts
    const header = asObject(JSON.parse(Buffer.from(encodedHeader, "base64url").toString("utf8")))
    const claims = asObject(JSON.parse(Buffer.from(encodedClaims, "base64url").toString("utf8")))
    if (!header || !claims || header.alg !== "RS256" || typeof header.kid !== "string") return false
    const now = Math.floor(Date.now() / 1000)
    if (
      claims.iss !== OIDC_ISSUER ||
      claims.aud !== OIDC_AUDIENCE ||
      claims.repository_id !== TRUSTED_REPO_ID ||
      claims.ref !== TRUSTED_REF ||
      claims.workflow_ref !== TRUSTED_WORKFLOW ||
      (claims.event_name !== "schedule" && claims.event_name !== "push") ||
      typeof claims.exp !== "number" ||
      typeof claims.iat !== "number" ||
      claims.exp < now - 60 ||
      claims.iat > now + 60 ||
      claims.exp - claims.iat > 600 ||
      (typeof claims.nbf === "number" && claims.nbf > now + 60)
    ) return false

    const response = await fetch(OIDC_JWKS, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) return false
    const jwks = asObject(await response.json())
    const keys = Array.isArray(jwks?.keys) ? jwks.keys : []
    const jwk = keys.find((value: unknown) => {
      const key = asObject(value)
      return !!key && key.kid === header.kid && key.kty === "RSA" && (!key.alg || key.alg === "RS256")
    })
    if (!jwk) return false
    const publicKey = createPublicKey({ key: jwk as import("node:crypto").JsonWebKey, format: "jwk" })
    return verifySignature(
      "RSA-SHA256",
      Buffer.from(`${encodedHeader}.${encodedClaims}`),
      publicKey,
      Buffer.from(encodedSignature, "base64url"),
    )
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? ""
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : ""
  if (!token || !(isCronSecret(token) || await isTrustedGithubAction(token))) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 })
  }

  // Explicit operator-only, one-request source preflight. Retains the SAME
  // authentication above and never claims work, persists evidence or enables a
  // source. Clear the deployment flag after the single canary invocation.
  const canarySource = retailCanarySource(process.env.TRACKDASH_RETAIL_SOURCE_CANARY)
  if (canarySource) {
    const report = await probeRetailSource(canarySource)
    console.info("[retail-source-canary]", report)
    return NextResponse.json({
      ok: report.ok,
      status: report.ok ? "success" : "failed",
      result: { attempted: 1, succeeded: report.ok ? 1 : 0, failed: report.ok ? 0 : 1 },
      retailCanary: report,
    }, { status: report.ok ? 200 : 502 })
  }

  // Reuse the existing, exactly-scoped GitHub clock. Keep Vercel's daily
  // scheduler disabled when enabling this mode; no extra trigger is created.
  // Two retail requests keep this bounded below the 60-second function budget.
  if (process.env.TRACKDASH_HOURLY_MARKET_ENABLED === "true") {
    const settled = await Promise.allSettled([
      runExactPageMarketScanBatch(2),
      runEbayActiveMarketScanBatch(1),
      runMarketRecomputeBatch(4),
    ])
    const reports = settled.map(summarizeCronWorker)
    const { httpStatus, ...outcome } = summarizeCronCycle(reports)
    const names = ["exactPages", "ebayActive", "recompute"] as const
    const lanes = Object.fromEntries(names.map((name, index) => [name, reports[index]]))
    for (const [name, report] of Object.entries(lanes)) {
      if (!report.ok) console.error(`[market-hourly:${name}]`, { status: report.status, error: report.error, summary: report.summary })
    }
    // Existing GitHub diagnostics consume result counters. Aggregate all lanes
    // so successful retail work with no due eBay job is still reported correctly.
    // Rejected lanes remain a non-200 outcome, never a false successful cycle.
    const result = reports.reduce((total, report) => ({
      attempted: total.attempted + report.summary.attempted,
      succeeded: total.succeeded + report.summary.succeeded,
      failed: total.failed + report.summary.failed,
    }), { attempted: 0, succeeded: 0, failed: 0 })
    return NextResponse.json({ ...outcome, result, lanes }, { status: httpStatus })
  }

  const [settled] = await Promise.allSettled([runEbayActiveMarketScanBatch(1)])
  const report = summarizeCronWorker(settled)
  const { httpStatus, ...outcome } = summarizeCronCycle([report])
  if (!report.ok) console.error("[ebay-scan-cron]", { status: report.status, error: report.error, summary: report.summary })
  return NextResponse.json({
    ...outcome,
    ...(report.error ? { error: report.error } : {}),
    ...(settled.status === "fulfilled" ? { result: settled.value } : {}),
  }, { status: httpStatus })
}
