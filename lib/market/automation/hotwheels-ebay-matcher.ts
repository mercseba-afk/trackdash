import type { EbayBrowseItemDetails, EbayBrowseListing, EbayListingDecision } from "./ebay-browse-adapter"

export type HotWheelsCommercialForm = "single" | "team_transport" | "two_pack" | "club_exclusive"

export interface HotWheelsEbayReleaseProfile {
  releaseId: string
  castingName: string
  releaseYear: number | null
  primaryIdentifier: string
  lineName: string
  subseries?: string | null
  collectorNumber?: string | null
  seriesPosition?: string | null
  chaseType?: string | null
  commercialForm?: HotWheelsCommercialForm
  castingAliases?: string[]
  siblingIdentifiers?: string[]
  extraRequiredTerms?: string[]
  extraForbiddenTerms?: string[]
}

const UNIVERSAL_REJECT_TERMS = [
  "loose",
  "opened",
  "open blister",
  "opened blister",
  "unsealed",
  "damaged card",
  "card damaged",
  "card damage",
  "damaged blister",
  "blister damaged",
  "blister damage",
  "cracked blister",
  "no card",
  "without card",
  "custom",
  "customized",
  "wheel swap",
  "wheel swapped",
  "wheels only",
  "wheel set",
  "empty card",
  "card only",
  "blister only",
  "protector only",
  "display case only",
  "replacement",
  "repro",
  "reproduction",
  "decal",
  "decals",
]

const MULTI_ITEM_TERMS = [
  " lot ",
  " bundle ",
  " set of ",
  " x2 ",
  " x3 ",
  " x4 ",
  " x5 ",
  " x6 ",
  " x10 ",
  " 2pcs ",
  " 3pcs ",
  " 4pcs ",
  " 5pcs ",
  " 10pcs ",
]

const CHASE_MARKERS = [
  " chase ",
  " super treasure hunt ",
  " super treasure ",
  " sth ",
  " 0 5 ",
  " 0/5 ",
]

const SUBVARIANT_REVIEW_TERMS = [
  "factory sealed set",
  "factory set",
  "from factory set",
  "short card",
  "international card",
  "long card",
  "regional card",
]

function normalizeText(value: string): string {
  return ` ${value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `
}

function normalizeCompact(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "")
}

function hasExactIdentifier(title: string, identifier: string): boolean {
  if (!identifier.trim()) return false
  return normalizeCompact(title).includes(normalizeCompact(identifier))
}

function hasAnyTerm(normalizedTitle: string, terms: string[]): boolean {
  return terms.some((term) => {
    const normalizedTerm = normalizeText(term)
    return normalizedTerm.trim() !== "" && normalizedTitle.includes(normalizedTerm)
  })
}

function significantCastingTokens(value: string): string[] {
  const stop = new Set([
    "hot", "wheels", "hotwheels", "the", "and", "with", "super", "silhouette",
    "edition", "premium", "car", "culture",
  ])
  return normalizeText(value)
    .trim()
    .split(" ")
    .filter((token) => token.length >= 3 && !stop.has(token))
}

function containsWordVariant(normalizedTitle: string, token: string): boolean {
  return normalizedTitle.includes(` ${token} `) ||
    normalizedTitle.includes(` ${token}s `) ||
    (token.endsWith("s") && normalizedTitle.includes(` ${token.slice(0, -1)} `))
}

function matchesCasting(title: string, profile: HotWheelsEbayReleaseProfile): boolean {
  const normalizedTitle = normalizeText(title)
  const aliases = [profile.castingName, ...(profile.castingAliases ?? [])]
  return aliases.some((alias) => {
    const tokens = significantCastingTokens(alias)
    if (!tokens.length) return false
    const required = tokens.length <= 2 ? tokens.length : Math.min(3, tokens.length)
    return tokens.filter((token) => containsWordVariant(normalizedTitle, token)).length >= required
  })
}

function hasChaseMarker(normalizedTitle: string): boolean {
  return CHASE_MARKERS.some((term) => normalizedTitle.includes(term))
}

function isChaseRelease(profile: HotWheelsEbayReleaseProfile): boolean {
  return Boolean(profile.chaseType?.trim())
}

function permitsMultiItemWording(profile: HotWheelsEbayReleaseProfile): boolean {
  return profile.commercialForm === "team_transport" || profile.commercialForm === "two_pack"
}

export function buildHotWheelsEbayQueries(profile: HotWheelsEbayReleaseProfile): string[] {
  const casting = profile.castingName
    .replace(/[—–]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  const exact = `Hot Wheels ${profile.primaryIdentifier} ${casting}`.replace(/\s+/g, " ").trim()

  const contextParts = [
    "Hot Wheels",
    casting,
    profile.lineName,
    profile.subseries ?? "",
    profile.chaseType ?? "",
    profile.collectorNumber ?? "",
    profile.seriesPosition ?? "",
  ].filter(Boolean)

  const fallback = contextParts.join(" ").replace(/\s+/g, " ").trim()
  return exact === fallback ? [exact] : [exact, fallback]
}

export function classifyHotWheelsEbayListing(
  listing: Pick<EbayBrowseListing, "title" | "condition" | "conditionId" | "itemEndDate">,
  profile: HotWheelsEbayReleaseProfile,
  now = new Date(),
): EbayListingDecision {
  const normalized = normalizeText(listing.title)

  if (listing.conditionId != null && listing.conditionId !== "1000") {
    return { decision: "rejected", reasonCodes: ["NOT_NEW_CONDITION"] }
  }

  if (listing.itemEndDate) {
    const end = Date.parse(listing.itemEndDate)
    if (Number.isFinite(end) && end <= now.getTime()) {
      return { decision: "rejected", reasonCodes: ["LISTING_ENDED"] }
    }
  }

  if (hasAnyTerm(normalized, UNIVERSAL_REJECT_TERMS)) {
    return { decision: "rejected", reasonCodes: ["LOOSE_CUSTOM_OR_ACCESSORY"] }
  }

  if (!permitsMultiItemWording(profile) && MULTI_ITEM_TERMS.some((term) => normalized.includes(term))) {
    return { decision: "rejected", reasonCodes: ["MULTI_ITEM_LOT"] }
  }

  if ((profile.extraForbiddenTerms ?? []).some((term) => normalized.includes(normalizeText(term)))) {
    return { decision: "rejected", reasonCodes: ["RELEASE_SPECIFIC_EXCLUSION"] }
  }

  for (const siblingIdentifier of profile.siblingIdentifiers ?? []) {
    if (siblingIdentifier !== profile.primaryIdentifier && hasExactIdentifier(listing.title, siblingIdentifier)) {
      return { decision: "rejected", reasonCodes: ["SIBLING_RELEASE_IDENTIFIER"] }
    }
  }

  if (!matchesCasting(listing.title, profile)) {
    return { decision: "rejected", reasonCodes: ["CASTING_NOT_CONFIRMED"] }
  }

  const exactIdentifier = hasExactIdentifier(listing.title, profile.primaryIdentifier)
  const titleHasChaseMarker = hasChaseMarker(normalized)
  const targetIsChase = isChaseRelease(profile)

  if (!targetIsChase && titleHasChaseMarker) {
    return { decision: "rejected", reasonCodes: ["CHASE_MISMATCH"] }
  }

  if (targetIsChase && !exactIdentifier && !titleHasChaseMarker) {
    return { decision: "needs_review", reasonCodes: ["CHASE_NOT_CONFIRMED", "IDENTIFIER_NOT_IN_TITLE"] }
  }

  if (exactIdentifier && hasAnyTerm(normalized, SUBVARIANT_REVIEW_TERMS)) {
    return { decision: "needs_review", reasonCodes: ["PACKAGE_SUBVARIANT_REVIEW"] }
  }

  for (const term of profile.extraRequiredTerms ?? []) {
    if (!normalized.includes(normalizeText(term))) {
      return {
        decision: exactIdentifier ? "needs_review" : "rejected",
        reasonCodes: ["RELEASE_DISCRIMINATOR_MISSING"],
      }
    }
  }

  // Pilot policy: exact Mattel identifier is required for automatic acceptance.
  // Context-only matches are deliberately review-only until measured precision
  // proves that a specific Hot Wheels rule can be safely promoted.
  if (!exactIdentifier) {
    const reasons = ["IDENTIFIER_NOT_IN_TITLE"]
    if (targetIsChase && titleHasChaseMarker) reasons.push("CHASE_CONTEXT_MATCH")
    return { decision: "needs_review", reasonCodes: reasons }
  }

  return { decision: "accepted", reasonCodes: ["MATTEL_IDENTIFIER_EXACT"] }
}


function itemIdentityValues(details: EbayBrowseItemDetails): string[] {
  const values = [
    details.mpn,
    details.gtin,
    ...details.localizedAspects.map((aspect) => aspect.value),
  ]
  return values.flatMap((value) => value?.trim() ? [value] : [])
}

function valuesContainIdentifier(values: string[], identifier: string): boolean {
  const target = normalizeCompact(identifier)
  if (!target) return false
  return values.some((value) => normalizeCompact(value).includes(target))
}

export function refineHotWheelsEbayListingWithItemDetails(
  initial: EbayListingDecision,
  details: EbayBrowseItemDetails,
  profile: HotWheelsEbayReleaseProfile,
): EbayListingDecision {
  if (initial.decision === "rejected" || initial.decision === "accepted") return initial

  const values = itemIdentityValues(details)

  for (const siblingIdentifier of profile.siblingIdentifiers ?? []) {
    if (
      siblingIdentifier !== profile.primaryIdentifier &&
      valuesContainIdentifier(values, siblingIdentifier)
    ) {
      return {
        decision: "rejected",
        reasonCodes: ["SIBLING_RELEASE_IDENTIFIER_ITEM_DETAILS"],
      }
    }
  }

  if (valuesContainIdentifier(values, profile.primaryIdentifier)) {
    return {
      decision: "accepted",
      reasonCodes: ["MATTEL_IDENTIFIER_ITEM_DETAILS"],
    }
  }

  return initial
}
