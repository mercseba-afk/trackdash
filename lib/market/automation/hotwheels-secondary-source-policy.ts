export type HotWheelsSecondarySourceStatus = "active" | "sold" | "unavailable" | "unknown"
export type HotWheelsSecondaryPackaging = "acceptable" | "damaged" | "unknown"
export type HotWheelsSecondaryMarketUse = "ask" | "mv_candidate" | "context_only" | "rejected"

export interface HotWheelsSecondaryObservation {
  source: string
  sourceRecordKey: string
  title: string
  description?: string | null
  status: HotWheelsSecondarySourceStatus
  structuredCondition?: "new" | "used" | "unknown"
  exactReleaseMatch: boolean
  isLot?: boolean
  quantity?: number | null
  price?: number | null
  currency?: string | null
  shipping?: number | null
  originCountry?: string | null
  deliveryCountry?: string | null
  soldOn?: string | null
}

export interface HotWheelsSecondaryAssessment {
  source: string
  sourceRecordKey: string
  marketUse: HotWheelsSecondaryMarketUse
  packaging: HotWheelsSecondaryPackaging
  reasonCodes: string[]
  visibleAcquisitionSubtotal: number | null
  deliveredCost: number | null
  costBasis: "delivered_eu" | "extra_eu_import_unknown" | "shipping_unknown" | "origin_unknown" | "destination_unknown"
}

const DAMAGE_TERMS = [
  "soft corner",
  "soft corners",
  "small bend",
  "small bends",
  "bent card",
  "card bend",
  "card bends",
  "card damage",
  "damaged card",
  "card not mint",
  "cracked blister",
  "blister crack",
  "damaged blister",
  "crease",
  "creased",
  "edge wear",
  "scuff",
  "torn card",
  "tear in card",
]

const ACCEPTABLE_PACKAGING_TERMS = [
  "mint card",
  "mint packaging",
  "near mint",
  "brand new sealed",
  "brand new & sealed",
  "factory sealed",
  "new in package",
  "new in packaging",
  "unopened",
]

const EU_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR",
  "GR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO",
  "SE", "SI", "SK",
])

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function containsAny(value: string, terms: string[]): boolean {
  return terms.some((term) => value.includes(normalize(term)))
}

export function inferHotWheelsSecondaryPackaging(
  observation: Pick<HotWheelsSecondaryObservation, "title" | "description" | "structuredCondition">,
): HotWheelsSecondaryPackaging {
  const text = normalize(`${observation.title} ${observation.description ?? ""}`)

  if (containsAny(text, DAMAGE_TERMS)) return "damaged"
  if (containsAny(text, ACCEPTABLE_PACKAGING_TERMS)) return "acceptable"

  // Buyer-intent rule for marketplace listings: when the marketplace itself
  // marks the item as New and there is no contradictory damage language, we
  // treat packaging as acceptable for audit purposes. This is intentionally
  // narrower than assuming every "new" listing is perfect.
  if (observation.structuredCondition === "new") return "acceptable"

  return "unknown"
}

function visibleSubtotal(observation: HotWheelsSecondaryObservation): number | null {
  if (observation.price == null || !Number.isFinite(observation.price) || observation.price < 0) return null
  if (observation.shipping == null || !Number.isFinite(observation.shipping) || observation.shipping < 0) {
    return Math.round((observation.price + Number.EPSILON) * 100) / 100
  }
  return Math.round((observation.price + observation.shipping + Number.EPSILON) * 100) / 100
}

function acquisitionCost(observation: HotWheelsSecondaryObservation): Pick<
  HotWheelsSecondaryAssessment,
  "visibleAcquisitionSubtotal" | "deliveredCost" | "costBasis"
> {
  const visibleAcquisitionSubtotal = visibleSubtotal(observation)
  const origin = observation.originCountry?.trim().toUpperCase() || null
  const destination = observation.deliveryCountry?.trim().toUpperCase() || null

  if (observation.shipping == null || !Number.isFinite(observation.shipping) || observation.shipping < 0) {
    return { visibleAcquisitionSubtotal, deliveredCost: null, costBasis: "shipping_unknown" }
  }
  if (!origin) {
    return { visibleAcquisitionSubtotal, deliveredCost: null, costBasis: "origin_unknown" }
  }
  if (!destination) {
    return { visibleAcquisitionSubtotal, deliveredCost: null, costBasis: "destination_unknown" }
  }
  if (!EU_COUNTRIES.has(origin) || !EU_COUNTRIES.has(destination)) {
    return { visibleAcquisitionSubtotal, deliveredCost: null, costBasis: "extra_eu_import_unknown" }
  }

  return { visibleAcquisitionSubtotal, deliveredCost: visibleAcquisitionSubtotal, costBasis: "delivered_eu" }
}

export function assessHotWheelsSecondaryObservation(
  observation: HotWheelsSecondaryObservation,
): HotWheelsSecondaryAssessment {
  const reasonCodes: string[] = []
  const packaging = inferHotWheelsSecondaryPackaging(observation)
  const quantity = observation.quantity ?? 1
  const cost = acquisitionCost(observation)

  if (!observation.exactReleaseMatch) {
    return {
      source: observation.source,
      sourceRecordKey: observation.sourceRecordKey,
      marketUse: "rejected",
      packaging,
      reasonCodes: ["RELEASE_NOT_CONFIRMED"],
      ...cost,
    }
  }

  if (observation.isLot === true || quantity !== 1) {
    return {
      source: observation.source,
      sourceRecordKey: observation.sourceRecordKey,
      marketUse: "rejected",
      packaging,
      reasonCodes: ["MULTI_ITEM_NOT_COMPARABLE"],
      ...cost,
    }
  }

  if (observation.structuredCondition === "used") {
    return {
      source: observation.source,
      sourceRecordKey: observation.sourceRecordKey,
      marketUse: "context_only",
      packaging,
      reasonCodes: ["USED_NOT_CANONICAL_NEW_CARDED"],
      ...cost,
    }
  }

  if (observation.status === "active") {
    return {
      source: observation.source,
      sourceRecordKey: observation.sourceRecordKey,
      marketUse: "ask",
      packaging,
      reasonCodes: packaging === "damaged" ? ["ACTIVE_PACKAGING_DAMAGED"] : [],
      ...cost,
    }
  }

  if (observation.status === "unavailable" || observation.status === "unknown") {
    return {
      source: observation.source,
      sourceRecordKey: observation.sourceRecordKey,
      marketUse: "context_only",
      packaging,
      reasonCodes: [observation.status === "unavailable" ? "UNAVAILABLE_NOT_PROVEN_SOLD" : "SALE_STATUS_UNKNOWN"],
      ...cost,
    }
  }

  if (observation.status === "sold") {
    if (packaging === "damaged") reasonCodes.push("PACKAGING_DAMAGED")
    if (packaging === "unknown") reasonCodes.push("PACKAGING_UNVERIFIED")
    if (!observation.soldOn) reasonCodes.push("SOLD_DATE_MISSING")

    return {
      source: observation.source,
      sourceRecordKey: observation.sourceRecordKey,
      marketUse: reasonCodes.length === 0 ? "mv_candidate" : "context_only",
      packaging,
      reasonCodes,
      ...cost,
    }
  }

  return {
    source: observation.source,
    sourceRecordKey: observation.sourceRecordKey,
    marketUse: "context_only",
    packaging,
    reasonCodes: ["SALE_STATUS_UNKNOWN"],
    ...cost,
  }
}
