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

let cachedToken: { value: string; expiresAt: number } | null = null

export function ebayBrowseConfigured(): boolean {
  return Boolean(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET)
}

async function getApplicationToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value

  const clientId = process.env.EBAY_CLIENT_ID
  const clientSecret = process.env.EBAY_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error("EBAY_BROWSE_CREDENTIALS_NOT_CONFIGURED")

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "https://api.ebay.com/oauth/api_scope",
  })
  const response = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  })
  if (!response.ok) throw new Error(`EBAY_OAUTH_HTTP_${response.status}`)
  const json = await response.json() as EbayTokenResponse
  if (!json.access_token || !json.expires_in) throw new Error("EBAY_OAUTH_INVALID_RESPONSE")
  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + Math.max(60, json.expires_in - 120) * 1000,
  }
  return cachedToken.value
}

function toNumber(value: string | undefined): number | null {
  const parsed = value == null ? NaN : Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export async function searchEbayActiveListings(
  input: EbayReleaseSearchInput,
  marketplace: EbayMarketplaceId,
  limit = 50,
): Promise<EbayBrowseListing[]> {
  const token = await getApplicationToken()
  const params = new URLSearchParams({
    q: buildEbayBrowseQuery(input),
    limit: String(Math.max(1, Math.min(limit, 100))),
    filter: "conditions:{NEW}",
  })
  const response = await fetch(`https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": marketplace,
      Accept: "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) throw new Error(`EBAY_BROWSE_HTTP_${response.status}`)
  const json = await response.json() as EbaySearchResponse

  const results: EbayBrowseListing[] = []
  for (const row of json.itemSummaries ?? []) {
    const price = toNumber(row.price?.value)
    const currency = row.price?.currency?.toUpperCase()
    if (!row.itemId || !row.title || price == null || !currency) continue
    const shipping = toNumber(row.shippingOptions?.[0]?.shippingCost?.value)
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
