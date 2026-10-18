import { createHash, createVerify } from "node:crypto"
import type { SupabaseClient } from "@supabase/supabase-js"

const EBAY_SCOPE = "https://api.ebay.com/oauth/api_scope"
const EBAY_TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token"
const EBAY_PUBLIC_KEY_URL = "https://api.ebay.com/commerce/notification/v1/public_key/"
const PUBLIC_KEY_TTL_MS = 60 * 60 * 1000
const MAX_NOTIFICATION_BYTES = 256 * 1024

interface CachedPublicKey {
  key: string
  expiresAt: number
}

const publicKeyCache = new Map<string, CachedPublicKey>()

export interface EbayDeletionIdentifiers {
  username: string
  userId?: string
  eiasToken?: string
}

export interface EbayDeletionNotification {
  notificationId: string
  identifiers: EbayDeletionIdentifiers
}

export interface EbayErasureResult {
  candidatesUpdated: number
  offersUpdated: number
  pricePointsUpdated: number
  aggregatePayloadsUpdated: number
  monthlyPayloadsUpdated: number
  affectedReleaseConditions: Array<{ releaseId: string; condition: string }>
}

type FetchLike = typeof fetch

export type EbayDeletionVerificationStage =
  | "signature_header_parsed"
  | "oauth_token_ok"
  | "public_key_ok"
  | "signature_verified"

export type EbayDeletionStageObserver = (stage: EbayDeletionVerificationStage) => void

function requiredProductionConfig() {
  if (process.env.EBAY_ENV !== "production") throw new Error("EBAY_DELETION_REQUIRES_PRODUCTION")

  const clientId = process.env.EBAY_CLIENT_ID
  const clientSecret = process.env.EBAY_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error("EBAY_PRODUCTION_CREDENTIALS_NOT_CONFIGURED")
  return { clientId, clientSecret }
}

function deletionEndpointConfig() {
  const endpoint = process.env.EBAY_MARKETPLACE_DELETION_ENDPOINT
  const verificationToken = process.env.EBAY_MARKETPLACE_DELETION_TOKEN
  if (!endpoint || !verificationToken) throw new Error("EBAY_DELETION_ENDPOINT_NOT_CONFIGURED")
  if (!endpoint.startsWith("https://")) throw new Error("EBAY_DELETION_ENDPOINT_MUST_USE_HTTPS")
  if (!/^[A-Za-z0-9_-]{32,80}$/.test(verificationToken)) {
    throw new Error("EBAY_DELETION_TOKEN_INVALID")
  }
  return { endpoint, verificationToken }
}

export function generateEbayDeletionChallenge(challengeCode: string): string {
  if (!challengeCode || challengeCode.length > 500) throw new Error("EBAY_CHALLENGE_INVALID")
  const { endpoint, verificationToken } = deletionEndpointConfig()
  return createHash("sha256")
    .update(challengeCode)
    .update(verificationToken)
    .update(endpoint)
    .digest("hex")
}

function nonEmptyString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > maxLength) return undefined
  return trimmed
}

export function parseEbayDeletionNotification(input: unknown): EbayDeletionNotification {
  if (!input || typeof input !== "object") throw new Error("EBAY_NOTIFICATION_INVALID")
  const message = input as Record<string, any>
  if (message.metadata?.topic !== "MARKETPLACE_ACCOUNT_DELETION") {
    throw new Error("EBAY_NOTIFICATION_TOPIC_INVALID")
  }

  const notificationId = nonEmptyString(message.notification?.notificationId, 200)
  const username = nonEmptyString(message.notification?.data?.username, 300)
  const userId = nonEmptyString(message.notification?.data?.userId, 300)
  const eiasToken = nonEmptyString(message.notification?.data?.eiasToken, 1000)
  if (!notificationId || !username) throw new Error("EBAY_NOTIFICATION_DATA_INVALID")

  return {
    notificationId,
    identifiers: { username, userId, eiasToken },
  }
}

function parseSignatureHeader(signatureHeader: string): { kid: string; signature: string } {
  if (!signatureHeader || signatureHeader.length > 10_000) throw new Error("EBAY_SIGNATURE_INVALID")
  let parsed: unknown
  try {
    parsed = JSON.parse(Buffer.from(signatureHeader, "base64").toString("ascii"))
  } catch {
    throw new Error("EBAY_SIGNATURE_INVALID")
  }

  const value = parsed as Record<string, unknown>
  const kid = nonEmptyString(value?.kid, 300)
  const signature = nonEmptyString(value?.signature, 9000)
  if (!kid || !signature || !/^[A-Za-z0-9._-]+$/.test(kid)) throw new Error("EBAY_SIGNATURE_INVALID")
  return { kid, signature }
}

async function getApplicationToken(
  fetchImpl: FetchLike,
  onStage?: EbayDeletionStageObserver,
): Promise<string> {
  const { clientId, clientSecret } = requiredProductionConfig()
  const body = new URLSearchParams({ grant_type: "client_credentials", scope: EBAY_SCOPE })
  const response = await fetchImpl(EBAY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  })
  if (!response.ok) throw new Error("EBAY_NOTIFICATION_OAUTH_FAILED")

  const payload = await response.json() as { access_token?: unknown }
  const accessToken = nonEmptyString(payload.access_token, 10_000)
  if (!accessToken) throw new Error("EBAY_NOTIFICATION_OAUTH_INVALID")
  onStage?.("oauth_token_ok")
  return accessToken
}

async function getEbayPublicKey(
  kid: string,
  fetchImpl: FetchLike,
  onStage?: EbayDeletionStageObserver,
): Promise<string> {
  const cached = publicKeyCache.get(kid)
  if (cached && cached.expiresAt > Date.now()) {
    onStage?.("public_key_ok")
    return cached.key
  }

  const accessToken = await getApplicationToken(fetchImpl, onStage)
  const response = await fetchImpl(`${EBAY_PUBLIC_KEY_URL}${encodeURIComponent(kid)}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  })
  if (!response.ok) throw new Error("EBAY_PUBLIC_KEY_FETCH_FAILED")

  const payload = await response.json() as { key?: unknown }
  const key = nonEmptyString(payload.key, 20_000)
  if (!key) throw new Error("EBAY_PUBLIC_KEY_INVALID")
  const formatted = key
    .replace(/-----BEGIN PUBLIC KEY-----\s*/, "-----BEGIN PUBLIC KEY-----\n")
    .replace(/\s*-----END PUBLIC KEY-----/, "\n-----END PUBLIC KEY-----")
  publicKeyCache.set(kid, { key: formatted, expiresAt: Date.now() + PUBLIC_KEY_TTL_MS })
  onStage?.("public_key_ok")
  return formatted
}

export async function verifyEbayNotificationSignature(
  rawBody: string,
  signatureHeader: string,
  fetchImpl: FetchLike = fetch,
  onStage?: EbayDeletionStageObserver,
): Promise<boolean> {
  if (Buffer.byteLength(rawBody, "utf8") > MAX_NOTIFICATION_BYTES) {
    throw new Error("EBAY_NOTIFICATION_TOO_LARGE")
  }

  let message: unknown
  try {
    message = JSON.parse(rawBody)
  } catch {
    throw new Error("EBAY_NOTIFICATION_INVALID_JSON")
  }

  const { kid, signature } = parseSignatureHeader(signatureHeader)
  onStage?.("signature_header_parsed")
  const publicKey = await getEbayPublicKey(kid, fetchImpl, onStage)
  const verifier = createVerify("ssl3-sha1")
  verifier.update(JSON.stringify(message))
  verifier.end()
  const verified = verifier.verify(publicKey, signature, "base64")
  if (verified) onStage?.("signature_verified")
  return verified
}

function identifierVariants(identifiers: EbayDeletionIdentifiers): string[] {
  return [identifiers.username, identifiers.userId, identifiers.eiasToken]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLocaleLowerCase("en-US"))
}

export function containsEbayIdentifier(text: string | null | undefined, identifiers: EbayDeletionIdentifiers): boolean {
  if (!text) return false
  const normalized = text.toLocaleLowerCase("en-US")
  return identifierVariants(identifiers).some((identifier) =>
    normalized === identifier ||
    normalized === `ebay:${identifier}` ||
    normalized.includes(`|${identifier}|`) ||
    normalized.endsWith(`|${identifier}`) ||
    normalized.startsWith(`${identifier}|`),
  )
}

export function redactEbayIdentifiers(value: unknown, identifiers: EbayDeletionIdentifiers): unknown {
  if (typeof value === "string") return containsEbayIdentifier(value, identifiers) ? null : value
  if (Array.isArray(value)) return value.map((entry) => redactEbayIdentifiers(entry, identifiers))
  if (!value || typeof value !== "object") return value

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      redactEbayIdentifiers(entry, identifiers),
    ]),
  )
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function fail(error: { message?: string } | null, operation: string): void {
  if (error) throw new Error(`EBAY_USER_ERASURE_FAILED:${operation}`)
}

async function eraseEbayUserDataPass(
  client: SupabaseClient,
  identifiers: EbayDeletionIdentifiers,
  deadline: AbortSignal,
): Promise<EbayErasureResult> {
  // Targeted reads of matching rows. SQL uses a conservative indexed superset;
  // the original JS matcher remains authoritative (including Unicode).
  const { data: plan, error: planError } = await client.rpc("trackdash_plan_ebay_erasure", {
    p_identifiers: identifierVariants(identifiers),
  }).abortSignal(AbortSignal.any([deadline, AbortSignal.timeout(18_000)]))
  fail(planError, "plan_erasure")
  if (!plan || typeof plan !== "object") throw new Error("EBAY_USER_ERASURE_FAILED:plan_erasure")
  const changes: Array<{ table: string; id: string; version: string; patch: Record<string, unknown> }> = []
  const change = (table: string, row: any, patch: Record<string, unknown>) => {
    changes.push({ table, id: row.id, version: row.version, patch })
  }
  const result: EbayErasureResult = {
    candidatesUpdated: 0,
    offersUpdated: 0,
    pricePointsUpdated: 0,
    aggregatePayloadsUpdated: 0,
    monthlyPayloadsUpdated: 0,
    affectedReleaseConditions: [],
  }

  const candidateIds = new Set<string>()
  const candidates = plan.market_candidates
  for (const row of candidates) {
    const sellerMatch = containsEbayIdentifier(row.seller_fingerprint, identifiers)
    const groupMatch = containsEbayIdentifier(row.evidence_group_key, identifiers)
    const redactedPayload = redactEbayIdentifiers(row.raw_payload, identifiers)
    const payloadChanged = !sameJson(row.raw_payload, redactedPayload)
    if (!sellerMatch && !groupMatch && !payloadChanged) continue

    const update: Record<string, unknown> = {}
    if (sellerMatch) update.seller_fingerprint = null
    if (sellerMatch || groupMatch) update.evidence_group_key = null
    if (payloadChanged) update.raw_payload = redactedPayload
    change("market_candidates", row, update)
    candidateIds.add(row.id)
  }

  const offers = plan.market_offer_states
  for (const row of offers) {
    if (!containsEbayIdentifier(row.seller_fingerprint, identifiers)) continue
    change("market_offer_states", row, { seller_fingerprint: null })
  }

  const points = plan.price_points
  for (const row of points) {
    if (!candidateIds.has(row.candidate_id) && !containsEbayIdentifier(row.evidence_group_key, identifiers)) continue
    const qualityFlags = Array.isArray(row.quality_flags) ? row.quality_flags : []
    change("price_points", row, {
      evidence_group_key: null,
      valuation_eligible: false,
      evidence_grade: "indicative",
      quality_flags: qualityFlags.includes("seller_unknown") ? qualityFlags : [...qualityFlags, "seller_unknown"],
    })
  }

  for (const table of ["market_aggregate_observations", "market_monthly_source_stats"] as const) {
    const rows = plan[table]
    for (const row of rows) {
      const redactedPayload = redactEbayIdentifiers(row.raw_payload, identifiers)
      if (sameJson(row.raw_payload, redactedPayload)) continue
      change(table, row, { raw_payload: redactedPayload })
    }
  }

  // No writes at all on the common no-match path. Matched mutations and their
  // canonical recompute jobs commit together, or all roll back. xmin rejects
  // stale plans; retry re-reads current state instead of overwriting new evidence.
  if (changes.length > 0) {
    const { data, error } = await client.rpc("trackdash_apply_ebay_erasure", { p_changes: changes })
      .abortSignal(AbortSignal.any([deadline, AbortSignal.timeout(22_000)]))
    fail(error, "apply_erasure")
    if (!data || typeof data !== "object") throw new Error("EBAY_USER_ERASURE_FAILED:apply_erasure")
    return data as EbayErasureResult
  }
  return result
}

export async function eraseEbayUserData(
  client: SupabaseClient,
  identifiers: EbayDeletionIdentifiers,
): Promise<EbayErasureResult> {
  // The common initial no-match still costs one RPC. After a mutation, revisit
  // the targeted search: unlike main's later reads, the first plan preloads
  // offers/JSON before candidates are changed. Never acknowledge late matches.
  const total: EbayErasureResult = {
    candidatesUpdated: 0, offersUpdated: 0, pricePointsUpdated: 0,
    aggregatePayloadsUpdated: 0, monthlyPayloadsUpdated: 0,
    affectedReleaseConditions: [],
  }
  const deadline = AbortSignal.timeout(40_000)
  const affected = new Map<string, { releaseId: string; condition: string }>()
  for (let pass = 0; pass < 3; pass++) {
    const result = await eraseEbayUserDataPass(client, identifiers, deadline)
    const fields = ["candidatesUpdated", "offersUpdated", "pricePointsUpdated", "aggregatePayloadsUpdated", "monthlyPayloadsUpdated"] as const
    let changed = 0
    for (const field of fields) { changed += result[field]; total[field] += result[field] }
    for (const row of result.affectedReleaseConditions) affected.set(`${row.releaseId}|${row.condition}`, row)
    total.affectedReleaseConditions = [...affected.values()]
    if (changed === 0) return total
  }
  // Bound in-request work, not intake or data coverage. The already committed
  // redactions and recompute jobs remain durable; eBay gets a retryable failure.
  throw new Error("EBAY_USER_ERASURE_FAILED:concurrent_writes")
}
