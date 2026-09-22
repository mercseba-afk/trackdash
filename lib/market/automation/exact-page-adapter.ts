export type ParsedAvailability =
  | "in_stock"
  | "low_stock"
  | "preorder"
  | "backorder"
  | "out_of_stock"
  | "discontinued"
  | "unknown"

export type ExtractionConfidence = "structured" | "meta" | "source_specific" | "none"

export interface ExactPageSnapshot {
  title: string | null
  itemNumberSeen: boolean
  price: number | null
  currency: string | null
  availability: ParsedAvailability
  confidence: ExtractionConfidence
  warnings: string[]
  rawAvailability: string | null
}

interface ParseOptions {
  itemNumber: string
  pageUrl: string
}

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/gi, '"')
    .replace(/&#34;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, " ")
}

function stripTags(value: string): string {
  return decodeHtml(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim()
}

function normalizeCurrency(value: unknown): string | null {
  if (typeof value !== "string") return null
  const upper = value.trim().toUpperCase()
  if (["EUR", "USD", "JPY", "GBP"].includes(upper)) return upper
  return null
}

function parseMoney(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : null
  if (typeof value !== "string") return null
  const raw = value.trim().replace(/\s/g, "")
  if (!raw) return null

  let normalized = raw.replace(/[^0-9.,-]/g, "")
  if (!normalized) return null

  const comma = normalized.lastIndexOf(",")
  const dot = normalized.lastIndexOf(".")
  if (comma >= 0 && dot >= 0) {
    if (comma > dot) normalized = normalized.replace(/\./g, "").replace(",", ".")
    else normalized = normalized.replace(/,/g, "")
  } else if (comma >= 0) {
    const decimalDigits = normalized.length - comma - 1
    normalized = decimalDigits > 0 && decimalDigits <= 2
      ? normalized.replace(/\./g, "").replace(",", ".")
      : normalized.replace(/,/g, "")
  } else {
    normalized = normalized.replace(/,/g, "")
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function mapAvailability(value: unknown): ParsedAvailability {
  if (typeof value !== "string") return "unknown"
  const compact = value.toLowerCase().replace(/[^a-z]/g, "")
  if (compact.includes("instock")) return "in_stock"
  if (compact.includes("limitedavailability") || compact.includes("lowstock")) return "low_stock"
  if (compact.includes("preorder") || compact.includes("presale")) return "preorder"
  if (compact.includes("backorder")) return "backorder"
  if (compact.includes("outofstock") || compact.includes("soldout")) return "out_of_stock"
  if (compact.includes("discontinued")) return "discontinued"
  return "unknown"
}

function attrValue(tag: string, attr: string): string | null {
  const match = new RegExp(`${attr}\\s*=\\s*["']([^"']+)["']`, "i").exec(tag)
  return match ? decodeHtml(match[1]) : null
}

function metaContent(html: string, keys: string[]): string | null {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? []
  const wanted = new Set(keys.map((key) => key.toLowerCase()))
  for (const tag of tags) {
    const key = attrValue(tag, "property") ?? attrValue(tag, "name") ?? attrValue(tag, "itemprop")
    if (!key || !wanted.has(key.toLowerCase())) continue
    const content = attrValue(tag, "content")
    if (content) return content
  }
  return null
}

function pageTitle(html: string): string | null {
  const og = metaContent(html, ["og:title", "twitter:title"])
  if (og) return stripTags(og)
  const match = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)
  return match ? stripTags(match[1]) : null
}

function jsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = []
  const re = /<script\b[^>]*type\s*=\s*["']application\/ld\+json[^"']*["'][^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(html))) {
    const raw = decodeHtml(match[1]).trim()
    if (!raw) continue
    try {
      blocks.push(JSON.parse(raw))
    } catch {
      // Malformed merchant JSON-LD is common. We deliberately do not guess a
      // price from broken structured data; lower-confidence meta tags may still
      // provide a safe fallback.
    }
  }
  return blocks
}

function walk(value: unknown, visit: (node: Record<string, unknown>) => void): void {
  if (Array.isArray(value)) {
    for (const child of value) walk(child, visit)
    return
  }
  if (!value || typeof value !== "object") return
  const node = value as Record<string, unknown>
  visit(node)
  for (const child of Object.values(node)) walk(child, visit)
}

function hasType(node: Record<string, unknown>, type: string): boolean {
  const current = node["@type"]
  if (typeof current === "string") return current.toLowerCase() === type.toLowerCase()
  if (Array.isArray(current)) return current.some((item) => typeof item === "string" && item.toLowerCase() === type.toLowerCase())
  return false
}

interface StructuredOffer {
  title: string | null
  price: number
  currency: string
  availability: ParsedAvailability
  rawAvailability: string | null
  aggregate: boolean
}

function extractStructuredOffers(html: string): StructuredOffer[] {
  const offers: StructuredOffer[] = []
  for (const block of jsonLdBlocks(html)) {
    walk(block, (node) => {
      if (!hasType(node, "Product")) return
      const title = typeof node.name === "string" ? stripTags(node.name) : null
      const productOffers = Array.isArray(node.offers) ? node.offers : node.offers ? [node.offers] : []
      for (const rawOffer of productOffers) {
        if (!rawOffer || typeof rawOffer !== "object") continue
        const offer = rawOffer as Record<string, unknown>
        const aggregate = hasType(offer, "AggregateOffer")
        const specification = offer.priceSpecification && typeof offer.priceSpecification === "object"
          ? offer.priceSpecification as Record<string, unknown>
          : null
        const price = parseMoney(offer.price ?? (aggregate ? offer.lowPrice : null) ?? specification?.price)
        const currency = normalizeCurrency(offer.priceCurrency ?? specification?.priceCurrency)
        if (price == null || currency == null) continue
        const rawAvailability = typeof offer.availability === "string" ? offer.availability : null
        offers.push({
          title,
          price,
          currency,
          availability: mapAvailability(rawAvailability),
          rawAvailability,
          aggregate,
        })
      }
    })
  }
  return offers
}

function containsItemNumber(html: string, itemNumber: string): boolean {
  const escaped = itemNumber.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const text = stripTags(html)
  return new RegExp(`(^|[^0-9])${escaped}([^0-9]|$)`, "i").test(text)
}


function rcjazAvailability(text: string): { availability: ParsedAvailability; raw: string | null } {
  const normalized = text.toLowerCase()
  if (/\bnot\s+available\b/.test(normalized) || /\bout\s+of\s+stock\b/.test(normalized) || /\bsold\s+out\b/.test(normalized)) {
    return { availability: "out_of_stock", raw: "Not Available" }
  }
  if (/\bavailable\s+in\s+shop\b/.test(normalized) || /\badd\s+to\s+cart\b/.test(normalized)) {
    return { availability: "in_stock", raw: "Available in shop" }
  }
  return { availability: "unknown", raw: null }
}

function rcjazPrice(text: string): { price: number | null; currency: string | null } {
  // RCJAZ exact product pages render the product price as:
  // "Price: USD$25.30" (currency can vary with storefront preference).
  // Scope the match to the Price label so unrelated accessory prices cannot leak in.
  const match = /\bPrice\s*:\s*(USD|EUR|JPY|GBP|AUD|CAD|NZD|HKD)\s*\$?\s*([0-9][0-9.,]*)/i.exec(text)
  if (!match) return { price: null, currency: null }
  return {
    price: parseMoney(match[2]),
    currency: normalizeCurrency(match[1]),
  }
}

export function parseRcjazRetailPage(html: string, options: ParseOptions): ExactPageSnapshot {
  const generic = parseExactRetailPage(html, options)
  if (generic.confidence !== "none" && generic.price != null && generic.currency) {
    return generic
  }

  const warnings = [...generic.warnings]
  const text = stripTags(html)

  if (
    /\bjust\s+a\s+moment\b/i.test(text) ||
    /cf-chl-|challenge-platform|cdn-cgi\/challenge-platform|id=["']challenge-form["']/i.test(html)
  ) {
    return {
      title: generic.title,
      itemNumberSeen: false,
      price: null,
      currency: null,
      availability: "unknown",
      confidence: "none",
      warnings: [...new Set([...warnings, "RCJAZ_CHALLENGE_PAGE"])],
      rawAvailability: null,
    }
  }

  const itemNumberSeen = containsItemNumber(html, options.itemNumber)
  if (!itemNumberSeen && !warnings.includes("ITEM_NUMBER_NOT_FOUND_ON_PAGE")) {
    warnings.push("ITEM_NUMBER_NOT_FOUND_ON_PAGE")
  }

  const parsedPrice = rcjazPrice(text)
  const availability = rcjazAvailability(text)

  if (parsedPrice.price == null || parsedPrice.currency == null) {
    if (!warnings.includes("NO_RELIABLE_STRUCTURED_PRICE")) warnings.push("NO_RELIABLE_STRUCTURED_PRICE")
    warnings.push("RCJAZ_PRICE_NOT_FOUND")
    return {
      title: generic.title,
      itemNumberSeen,
      price: null,
      currency: null,
      availability: availability.availability,
      confidence: "none",
      warnings: [...new Set(warnings)],
      rawAvailability: availability.raw,
    }
  }

  return {
    title: generic.title,
    itemNumberSeen,
    price: parsedPrice.price,
    currency: parsedPrice.currency,
    availability: availability.availability,
    confidence: "source_specific",
    warnings: [...new Set(warnings.filter((warning) => warning !== "NO_RELIABLE_STRUCTURED_PRICE"))],
    rawAvailability: availability.raw,
  }
}

export function parseExactRetailPage(html: string, options: ParseOptions): ExactPageSnapshot {
  const warnings: string[] = []
  const title = pageTitle(html)
  const itemNumberSeen = containsItemNumber(html, options.itemNumber)
  if (!itemNumberSeen) warnings.push("ITEM_NUMBER_NOT_FOUND_ON_PAGE")

  const structured = extractStructuredOffers(html)
    .sort((a, b) => Number(a.aggregate) - Number(b.aggregate) || a.price - b.price)
  const direct = structured.find((offer) => !offer.aggregate)
  if (direct) {
    return {
      title: direct.title ?? title,
      itemNumberSeen,
      price: direct.price,
      currency: direct.currency,
      availability: direct.availability,
      confidence: "structured",
      warnings,
      rawAvailability: direct.rawAvailability,
    }
  }

  if (structured.length) {
    warnings.push("AGGREGATE_OFFER_ONLY")
    // AggregateOffer lowPrice may be a marketplace/variant floor, not the exact
    // boxed kit. Keep it out of automatic valuation until a direct Offer exists.
    return {
      title: structured[0].title ?? title,
      itemNumberSeen,
      price: null,
      currency: null,
      availability: structured[0].availability,
      confidence: "none",
      warnings,
      rawAvailability: structured[0].rawAvailability,
    }
  }

  const metaPrice = parseMoney(metaContent(html, ["product:price:amount", "og:price:amount", "price"]))
  const metaCurrency = normalizeCurrency(metaContent(html, ["product:price:currency", "og:price:currency", "pricecurrency"]))
  const rawAvailability = metaContent(html, ["product:availability", "og:availability", "availability"])
  const availability = mapAvailability(rawAvailability)

  if (metaPrice != null && metaCurrency != null) {
    return {
      title,
      itemNumberSeen,
      price: metaPrice,
      currency: metaCurrency,
      availability,
      confidence: "meta",
      warnings,
      rawAvailability,
    }
  }

  warnings.push("NO_RELIABLE_STRUCTURED_PRICE")
  return {
    title,
    itemNumberSeen,
    price: null,
    currency: null,
    availability,
    confidence: "none",
    warnings,
    rawAvailability,
  }
}

export function isAutoPublishableSnapshot(snapshot: ExactPageSnapshot): boolean {
  return Boolean(
    snapshot.itemNumberSeen &&
    snapshot.price != null &&
    snapshot.price > 0 &&
    snapshot.currency &&
    snapshot.confidence !== "none",
  )
}
