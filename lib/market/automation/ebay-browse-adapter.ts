export type EbayMarketplaceId = "EBAY_IT" | "EBAY_DE" | "EBAY_GB" | "EBAY_US"

export interface EbayReleaseSearchInput {
  itemNumber: string
  editionName: string
  releaseYear: number | null
  itemNumberIsShared: boolean
}

export interface EbayBrowseListing {
  itemId: string
  title: string
  itemWebUrl: string | null
  price: number
  currency: string
  shipping: number | null
  condition: string | null
  seller: string | null
  marketplace: EbayMarketplaceId
  itemEndDate: string | null
}

export interface EbayListingDecision {
  decision: "accepted" | "needs_review" | "rejected"
  reasonCodes: string[]
}

const PART_ONLY_TERMS = [
  "body only",
  "body set",
  "clear body",
  "spare body",
  "parts only",
  "replacement part",
  "sticker",
  "stickers",
  "decal",
  "decals",
  "chassis only",
  "motor only",
  "wheel set",
  "tire set",
  "tyre set",
]

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function containsToken(title: string, token: string): boolean {
  return new RegExp(`(^|[^0-9])${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^0-9]|$)`, "i").test(title)
}

export function buildEbayBrowseQuery(input: EbayReleaseSearchInput): string {
  // Item number is the strongest universal key. Edition name is included to
  // improve eBay relevance, but matching remains fail-closed after retrieval.
  const edition = input.editionName
    .replace(/[—–]/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(tamiya|mini\s*4wd|jr\.?|chassis)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
  return `Tamiya ${input.itemNumber}${edition ? ` ${edition}` : ""}`.trim()
}

export function classifyEbayActiveListing(
  listing: Pick<EbayBrowseListing, "title" | "condition" | "itemEndDate">,
  release: EbayReleaseSearchInput,
  now = new Date(),
): EbayListingDecision {
  const reasons: string[] = []
  const normalized = normalizeText(listing.title)

  if (!containsToken(listing.title, release.itemNumber)) {
    return { decision: "rejected", reasonCodes: ["ITEM_NUMBER_NOT_IN_TITLE"] }
  }

  if (PART_ONLY_TERMS.some((term) => normalized.includes(term))) {
    return { decision: "rejected", reasonCodes: ["PART_OR_BODY_ONLY"] }
  }

  const condition = normalizeText(listing.condition ?? "")
  if (condition && !condition.includes("new")) {
    return { decision: "rejected", reasonCodes: ["NOT_NEW_CONDITION"] }
  }

  if (listing.itemEndDate) {
    const end = Date.parse(listing.itemEndDate)
    if (Number.isFinite(end) && end <= now.getTime()) {
      return { decision: "rejected", reasonCodes: ["LISTING_ENDED"] }
    }
  }

  // Same item number can identify multiple commercial Releases (e.g. 18038
  // Original/Reissue or 18074 standard/Sanfrecce). Until explicit edition
  // discriminators are configured, never auto-assign these listings.
  if (release.itemNumberIsShared) {
    reasons.push("SHARED_ITEM_NUMBER_REQUIRES_RELEASE_REVIEW")
    return { decision: "needs_review", reasonCodes: reasons }
  }

  return { decision: "accepted", reasonCodes: reasons }
}

interface EbayTokenResponse {
  access_token: string
  expires_in: number
}

interface EbaySearchResponse {
  itemSummaries?: Array<{
    itemId?: string
    title?: string
    itemWebUrl?: string
    price?: { value?: string; currency?: string }
    shippingOptions?: Array<{ shippingCost?: { value?: string; currency?: string } }>
    condition?: string
    seller?: { username?: string }
    itemEndDate?: string
  }>
}

export type EbayEnvironment = "sandbox" | "production"

export function ebayEnvironment(): EbayEnvironment {
  const value = process.env.EBAY_ENV ?? "sandbox"
  if (value !== "sandbox" && value !== "production") throw new Error("EBAY_ENV_INVALID")
  return value
}

export function ebayMarketWritesAllowed(): boolean {
  return ebayEnvironment() === "production"
}

function apiOrigin(environment: EbayEnvironment): string {
  return environment === "sandbox" ? "https://api.sandbox.ebay.com" : "https://api.ebay.com"
}

let cachedToken: { value: string; expiresAt: number; environment: EbayEnvironment; clientId: string; clientSecret: string } | null = null

export function ebayBrowseConfigured(): boolean {
  return Boolean(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET)
}

async function getApplicationToken(environment: EbayEnvironment): Promise<string> {
  const clientId = process.env.EBAY_CLIENT_ID
  const clientSecret = process.env.EBAY_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error("EBAY_BROWSE_CREDENTIALS_NOT_CONFIGURED")
  // Recognizable eBay keyset markers provide an extra guard against a wrong environment.
  if ((environment === "production" && /-SBX-/i.test(clientId)) ||
      (environment === "sandbox" && /-PRD-/i.test(clientId))) {
    throw new Error("EBAY_CREDENTIAL_ENV_MISMATCH")
  }
  if (cachedToken && cachedToken.environment === environment && cachedToken.clientId === clientId &&
      cachedToken.clientSecret === clientSecret && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "https://api.ebay.com/oauth/api_scope",
  })
  const response = await fetch(`${apiOrigin(environment)}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(12_000),
  }).catch(() => { throw new Error("EBAY_OAUTH_NETWORK_ERROR") })
  if (!response.ok) throw new Error(`EBAY_OAUTH_HTTP_${response.status}`)
  const json = await response.json().catch(() => { throw new Error("EBAY_OAUTH_INVALID_RESPONSE") }) as EbayTokenResponse
  if (typeof json.access_token !== "string" || !json.access_token || !Number.isFinite(json.expires_in) || json.expires_in <= 0) throw new Error("EBAY_OAUTH_INVALID_RESPONSE")
  cachedToken = {
    environment,
    clientId,
    clientSecret,
    value: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  }
  return cachedToken.value
}

function toNumber(value: string | undefined, allowZero = false): number | null {
  const parsed = value == null || value.trim() === "" ? NaN : Number(value)
  return Number.isFinite(parsed) && (allowZero ? parsed >= 0 : parsed > 0) ? parsed : null
}

export async function searchEbayActiveListings(
  input: EbayReleaseSearchInput,
  marketplace: EbayMarketplaceId,
  limit = 50,
): Promise<EbayBrowseListing[]> {
  const environment = ebayEnvironment()
  const token = await getApplicationToken(environment)
  const params = new URLSearchParams({
    q: buildEbayBrowseQuery(input),
    limit: String(Math.max(1, Math.min(limit, 100))),
    filter: "conditions:{NEW}",
  })
  const response = await fetch(`${apiOrigin(environment)}/buy/browse/v1/item_summary/search?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": marketplace,
      Accept: "application/json",
    },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  }).catch(() => { throw new Error("EBAY_BROWSE_NETWORK_ERROR") })
  if (!response.ok) throw new Error(`EBAY_BROWSE_HTTP_${response.status}`)
  const json = await response.json().catch(() => { throw new Error("EBAY_BROWSE_INVALID_RESPONSE") }) as EbaySearchResponse

  const results: EbayBrowseListing[] = []
  for (const row of json.itemSummaries ?? []) {
    const price = toNumber(row.price?.value)
    const currency = row.price?.currency?.toUpperCase()
    if (!row.itemId || !row.title || price == null || !currency) continue
    const shippingCost = row.shippingOptions?.[0]?.shippingCost
    const shipping = shippingCost?.currency?.toUpperCase() === currency ? toNumber(shippingCost.value, true) : null
    results.push({
      itemId: row.itemId,
      title: row.title,
      itemWebUrl: row.itemWebUrl ?? null,
      price,
      currency,
      shipping,
      condition: row.condition ?? null,
      seller: row.seller?.username ?? null,
      marketplace,
      itemEndDate: row.itemEndDate ?? null,
    })
  }
  return results
}

export function dedupeEbayListings(rows: EbayBrowseListing[]): EbayBrowseListing[] {
  const byId = new Map<string, EbayBrowseListing>()
  for (const row of rows) if (!byId.has(row.itemId)) byId.set(row.itemId, row)
  return [...byId.values()]
}
