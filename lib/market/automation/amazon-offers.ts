// Small, explicit rollout. Expanding this list requires reviewing the free budget.
// Two ASINs, one paid request each per 24h: at most 310 base credits / 31 days.
export const AMAZON_SCAN_PILOT: Record<string, { asin: string; item: string }> = {
  "01e1ea1d-0513-5562-8e55-63c11f24fbe5": { asin: "B083JYP59Y", item: "18094" },
  "51267c3e-03cc-54c4-8b9b-1c4e413d75b8": { asin: "B08KR2LXCV", item: "95598" },
}

export interface AmazonOffer {
  sellerId: string
  sellerName: string
  price: number
  shipping: number | null
  condition: string
}

export function parseAmazonOffers(payload: unknown, item: string) {
  const data = payload as Record<string, any> | null
  const title = typeof data?.item?.name === "string" ? data.item.name : ""
  if (!/^\d{5}$/.test(item) || !new RegExp(`(^|[^0-9])${item}([^0-9]|$)`).test(title) || !/tamiya/i.test(title)) {
    throw new Error("AMAZON_EXACT_KIT_IDENTITY_MISMATCH")
  }
  if (/\b(body\s+set|spare\s+parts|carrozzeria|ricambi|lotto)\b/i.test(title)) throw new Error("AMAZON_NOT_COMPLETE_KIT")
  if (!Array.isArray(data?.listings)) throw new Error("AMAZON_OFFERS_SCHEMA_INVALID")
  const offers = new Map<string, AmazonOffer>()
  for (const row of data.listings) {
    if (!row || !/^(new|nuovo)$/i.test(String(row.condition ?? "").trim())) continue
    if (row.price_symbol !== "€" || typeof row.price !== "number" || !Number.isFinite(row.price) || row.price <= 0) continue
    if (typeof row.seller_id !== "string" || !/^[A-Z0-9]{5,30}$/.test(row.seller_id)) continue
    const shippingLabel = String(row.shipping_price ?? "").trim()
    let shipping: number | null = /^(FREE|GRATUITA|GRATIS)$/i.test(shippingLabel) ? 0 : null
    if (shipping == null && /^€\s*\d+(?:[.,]\d{1,2})?$/.test(shippingLabel)) shipping = Number(shippingLabel.replace(/[€\s]/g, "").replace(",", "."))
    const offer: AmazonOffer = { sellerId: row.seller_id, sellerName: String(row.seller_name ?? "").slice(0, 200), price: row.price, shipping, condition: row.condition }
    // A duplicated seller is one independent asking price, not multiple votes.
    const previous = offers.get(offer.sellerId)
    if (!previous || offer.price < previous.price) offers.set(offer.sellerId, offer)
  }
  return { title, offers: [...offers.values()] }
}

export function unwrapAmazonJobResponse(value: unknown): unknown {
  const response = value as Record<string, any> | null
  const body = response?.body ?? response
  if (typeof body === "string") return JSON.parse(body)
  return body
}
