// Presentation-only, fail-closed source geography.
// An eBay marketplace ID (e.g. EBAY_IT) is NOT the seller's shipping origin.
// The eBay Browse worker already persists itemLocationCountry when provided.
export type OfferOrigin = "eu" | "extra_eu" | "unknown"

const EU_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE",
  "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT",
  "RO", "SK", "SI", "ES", "SE",
])

export function classifyOfferOrigin(
  itemLocationCountry: string | null | undefined,
  sourceMarketRegion: string | null | undefined,
): OfferOrigin {
  const country = itemLocationCountry?.trim().toUpperCase() ?? ""
  // Only actual item location, not browsing marketplace or customer's ship-to
  // estimate, can assert a specific shipping origin.
  if (/^[A-Z]{2}$/.test(country)) return EU_COUNTRIES.has(country) ? "eu" : "extra_eu"

  // Provider-specific regional sources establish extra-EU origin context.
  // "europe" includes non-EU states, and "global" includes the whole world:
  // neither establishes customs status. Keep the banner absent.
  if (sourceMarketRegion === "japan" || sourceMarketRegion === "asia_pacific" ||
      sourceMarketRegion === "north_america") return "extra_eu"
  if (sourceMarketRegion === "internal") return "eu"
  return "unknown"
}
