import { createHash, createVerify } from "node:crypto"
import type { SupabaseClient } from "@supabase/supabase-js"

const EBAY_SCOPE = "https://api.ebay.com/oauth/api_scope"
const EBAY_TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token"
const EBAY_PUBLIC_KEY_URL = "https://api.ebay.com/commerce/notification/v1/public_key/"
const PUBLIC_KEY_TTL_MS = 60 * 60 * 1000
const MAX_NOTIFICATION_BYTES = 256 * 1024
const PAGE_SIZE = 500

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

async function getApplicationToken(fetchImpl: FetchLike): Promise<string> {
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
  return accessToken
}

async function getEbayPublicKey(kid: string, fetchImpl: FetchLike): Promise<string> {
  const cached = publicKeyCache.get(kid)
  if (cached && cached.expiresAt > Date.now()) return cached.key

  const accessToken = await getApplicationToken(fetchImpl)
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
  return formatted
}

export async function verifyEbayNotificationSignature(
  rawBody: string,
  signatureHeader: string,
  fetchImpl: FetchLike = fetch,
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
  const publicKey = await getEbayPublicKey(kid, fetchImpl)
  const verifier = createVerify("ssl3-sha1")
  verifier.update(JSON.stringify(message))
  verifier.end()
  return verifier.verify(publicKey, signature, "base64")
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

async function loadEbaySourceIds(client: SupabaseClient): Promise<string[]> {
  const { data: policyData, error: policyError } = await client
    .from("market_source_policies")
    .select("source_id")
    .eq("source_family", "ebay")
  fail(policyError, "load_source_policies")

  // Include inactive/legacy eBay sources too: deletion obligations apply to
  // retained data even when a collector is no longer enabled for scanning.
  const { data: sourceData, error: sourceError } = await client
    .from("price_sources")
    .select("id")
    .like("slug", "ebay_%")
  fail(sourceError, "load_source_registry")

  return [...new Set([
    ...(policyData ?? []).map((row: any) => row.source_id),
    ...(sourceData ?? []).map((row: any) => row.id),
  ].filter(Boolean))]
}

async function loadAllSourceRows(
  client: SupabaseClient,
  table: string,
  columns: string,
  sourceIds: string[],
): Promise<any[]> {
  const rows: any[] = []
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await client
      .from(table)
      .select(columns)
      .in("source_id", sourceIds)
      .order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1)
    fail(error, `load_${table}`)
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) return rows
  }
}

function releaseConditionKey(releaseId: string, condition: string): string {
  return `${releaseId}|${condition}`
}

export async function eraseEbayUserData(
  client: SupabaseClient,
  identifiers: EbayDeletionIdentifiers,
): Promise<EbayErasureResult> {
  const sourceIds = await loadEbaySourceIds(client)
  const result: EbayErasureResult = {
    candidatesUpdated: 0,
    offersUpdated: 0,
    pricePointsUpdated: 0,
    aggregatePayloadsUpdated: 0,
    monthlyPayloadsUpdated: 0,
    affectedReleaseConditions: [],
  }
  if (sourceIds.length === 0) return result

  const affected = new Map<string, { releaseId: string; condition: string }>()
  const candidateIds = new Set<string>()
  const candidates = await loadAllSourceRows(
    client,
    "market_candidates",
    "id,resolved_release_id,condition,seller_fingerprint,evidence_group_key,raw_payload",
    sourceIds,
  )
  for (const row of candidates) {
    const sellerMatch = containsEbayIdentifier(row.seller_fingerprint, identifiers)
    const groupMatch = containsEbayIdentifier(row.evidence_group_key, identifiers)
    const redactedPayload = redactEbayIdentifiers(row.raw_payload, identifiers)
    const payloadChanged = !sameJson(row.raw_payload, redactedPayload)
    if (!sellerMatch && !groupMatch && !payloadChanged) continue

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (sellerMatch) update.seller_fingerprint = null
    if (sellerMatch || groupMatch) update.evidence_group_key = null
    if (payloadChanged) update.raw_payload = redactedPayload
    const { error } = await client.from("market_candidates").update(update).eq("id", row.id)
    fail(error, "update_market_candidates")
    result.candidatesUpdated += 1
    candidateIds.add(row.id)
    if (row.resolved_release_id) {
      affected.set(releaseConditionKey(row.resolved_release_id, row.condition), {
        releaseId: row.resolved_release_id,
        condition: row.condition,
      })
    }
  }

  const offers = await loadAllSourceRows(
    client,
    "market_offer_states",
    "id,release_id,condition,seller_fingerprint",
    sourceIds,
  )
  for (const row of offers) {
    if (!containsEbayIdentifier(row.seller_fingerprint, identifiers)) continue
    const { error } = await client
      .from("market_offer_states")
      .update({ seller_fingerprint: null, updated_at: new Date().toISOString() })
      .eq("id", row.id)
    fail(error, "update_market_offer_states")
    result.offersUpdated += 1
    affected.set(releaseConditionKey(row.release_id, row.condition), {
      releaseId: row.release_id,
      condition: row.condition,
    })
  }

  const points = await loadAllSourceRows(
    client,
    "price_points",
    "id,candidate_id,release_id,condition,evidence_group_key,quality_flags",
    sourceIds,
  )
  for (const row of points) {
    if (!candidateIds.has(row.candidate_id) && !containsEbayIdentifier(row.evidence_group_key, identifiers)) continue
    const qualityFlags = Array.isArray(row.quality_flags) ? row.quality_flags : []
    const { error } = await client
      .from("price_points")
      .update({
        evidence_group_key: null,
        valuation_eligible: false,
        evidence_grade: "indicative",
        quality_flags: qualityFlags.includes("seller_unknown") ? qualityFlags : [...qualityFlags, "seller_unknown"],
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id)
    fail(error, "update_price_points")
    result.pricePointsUpdated += 1
    affected.set(releaseConditionKey(row.release_id, row.condition), {
      releaseId: row.release_id,
      condition: row.condition,
    })
  }

  for (const [table, counter] of [
    ["market_aggregate_observations", "aggregatePayloadsUpdated"],
    ["market_monthly_source_stats", "monthlyPayloadsUpdated"],
  ] as const) {
    const rows = await loadAllSourceRows(client, table, "id,raw_payload", sourceIds)
    for (const row of rows) {
      const redactedPayload = redactEbayIdentifiers(row.raw_payload, identifiers)
      if (sameJson(row.raw_payload, redactedPayload)) continue
      const { error } = await client
        .from(table)
        .update({ raw_payload: redactedPayload, updated_at: new Date().toISOString() })
        .eq("id", row.id)
      fail(error, `update_${table}`)
      result[counter] += 1
    }
  }

  result.affectedReleaseConditions = [...affected.values()]
  return result
}
