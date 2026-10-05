import type { CurrentOfferEvidence } from "./market-model"

const EU_COUNTRY_CODES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR",
  "GR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO",
  "SE", "SI", "SK",
])

const NORTH_AMERICA_COUNTRY_CODES = new Set(["US", "CA", "MX"])
const ASIA_PACIFIC_COUNTRY_CODES = new Set([
  "AU", "CN", "HK", "ID", "JP", "KR", "MY", "NZ", "PH", "SG", "TH", "TW", "VN",
])

function normalizedCode(value: unknown): string | null {
  if (typeof value !== "string") return null
  const code = value.trim().toUpperCase()
  return /^[A-Z]{2}$/.test(code) ? code : null
}

export function marketRegionFromCountryCode(
  value: unknown,
): CurrentOfferEvidence["marketRegion"] | null {
  const code = normalizedCode(value)
  if (!code) return null
  if (EU_COUNTRY_CODES.has(code)) return "europe"
  if (code === "JP") return "japan"
  if (NORTH_AMERICA_COUNTRY_CODES.has(code)) return "north_america"
  if (ASIA_PACIFIC_COUNTRY_CODES.has(code)) return "asia_pacific"

  // Europe-first is EU-first for acquisition intelligence. Countries such as
  // GB, CH and NO remain extra-EU context unless a delivered-to-Italy cost is
  // explicitly observed.
  return "global"
}

export function marketplaceRegionFromOriginalSource(
  value: unknown,
): CurrentOfferEvidence["marketRegion"] | null {
  if (typeof value !== "string") return null
  const source = value.toUpperCase()

  // This mapping is retained for legacy/source-only evidence. Persisted eBay
  // candidates should prefer marketplaceRegionFromCandidateContext(), because
  // the marketplace domain does not tell us where the physical item is.
  if (["EBAY_IT", "EBAY_DE", "EBAY_FR", "EBAY_ES", "EBAY_NL", "EBAY_BE", "EBAY_IE", "EBAY_AT"].includes(source)) {
    return "europe"
  }
  if (["EBAY_GB", "EBAY_CH"].includes(source)) return "global"
  if (["EBAY_US", "EBAY_CA"].includes(source)) return "north_america"
  if (source === "EBAY_JP") return "japan"
  if (["EBAY_AU", "EBAY_SG"].includes(source)) return "asia_pacific"
  return null
}

export function marketplaceRegionFromCandidateContext(input: {
  originalSource: unknown
  rawPayload: unknown
  shippingKnownToItaly: boolean
}): CurrentOfferEvidence["marketRegion"] | null {
  const source = typeof input.originalSource === "string"
    ? input.originalSource.toUpperCase()
    : null

  if (!source?.startsWith("EBAY_")) {
    return marketplaceRegionFromOriginalSource(input.originalSource)
  }

  const payload = input.rawPayload && typeof input.rawPayload === "object" && !Array.isArray(input.rawPayload)
    ? input.rawPayload as Record<string, unknown>
    : null
  const itemLocationCountry = normalizedCode(payload?.itemLocationCountry)
  const shippingEstimateCountry = normalizedCode(payload?.shippingEstimateCountry)

  // An explicit shipping quote to Italy is the one case where a physically
  // extra-EU eBay item can participate in European acquisition intelligence:
  // the worker persisted shipping only when the estimate itself was for IT.
  if (shippingEstimateCountry === "IT" && input.shippingKnownToItaly) {
    return "europe"
  }

  // Otherwise classify by the physical item location. An eBay.it discovery is
  // not a European offer when the item is actually in Japan, Hong Kong or the
  // United States and no delivered-to-Italy shipping was observed.
  const locationRegion = marketRegionFromCountryCode(itemLocationCountry)
  if (locationRegion) return locationRegion

  // Fail closed when eBay does not expose a usable location. Do not infer EU
  // comparability from the marketplace domain alone.
  return "global"
}
