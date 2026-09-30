import type { CurrentOfferEvidence } from "./market-model"

export function marketplaceRegionFromOriginalSource(
  value: unknown,
): CurrentOfferEvidence["marketRegion"] | null {
  if (typeof value !== "string") return null
  const source = value.toUpperCase()

  // TrackDash's public acquisition reference is EU-first, not geographic-Europe-first.
  // GB and CH are therefore extra-EU: local marketplace shipping must remain
  // contextual/item-only rather than being treated as European delivered cost.
  if (["EBAY_IT", "EBAY_DE", "EBAY_FR", "EBAY_ES", "EBAY_NL", "EBAY_BE", "EBAY_IE", "EBAY_AT"].includes(source)) {
    return "europe"
  }
  if (["EBAY_GB", "EBAY_CH"].includes(source)) return "global"
  if (["EBAY_US", "EBAY_CA"].includes(source)) return "north_america"
  if (source === "EBAY_JP") return "japan"
  if (["EBAY_AU", "EBAY_SG"].includes(source)) return "asia_pacific"
  return null
}
