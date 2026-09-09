import type {
  CatalogReleaseIdentity,
  ClassifiedCandidate,
  MarketCondition,
  MatchEvidence,
  SourceObservation,
} from "./types"

const JAPANESE_POSITIVE = ["未組立", "未使用", "新品", "内袋未開封", "欠品なし"] as const
const JAPANESE_BUILT = ["組立済", "完成品"] as const
const JAPANESE_INCOMPLETE = ["欠品あり"] as const
const JAPANESE_ALWAYS_REVIEW = ["美品", "確認のため開封", "ジャンク扱い", "カスタム", "専用"] as const

function uniq<T>(values: T[]): T[] {
  return [...new Set(values)]
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[\s\-_–—()[\]{}.,/\\:;]+/g, " ")
    .trim()
}

function normalizeItemNumber(value: string | null | undefined): string | null {
  if (!value) return null
  const digits = value.replace(/\D/g, "")
  return digits.length ? digits : null
}

function containsNormalized(haystack: string, needle: string | null | undefined): boolean {
  const normalizedNeedle = normalizeText(needle)
  return normalizedNeedle.length >= 3 && haystack.includes(normalizedNeedle)
}

function deriveJapaneseCondition(raw: string): {
  condition: MarketCondition | null
  forceReview: boolean
  reasonCodes: string[]
} {
  if (!raw) return { condition: null, forceReview: false, reasonCodes: [] }

  const forceReview = JAPANESE_ALWAYS_REVIEW.some((token) => raw.includes(token))
  const reasonCodes = forceReview ? ["AMBIGUOUS_CONDITION"] : []

  if (JAPANESE_INCOMPLETE.some((token) => raw.includes(token))) {
    return { condition: "incomplete_parts_custom", forceReview, reasonCodes }
  }
  if (JAPANESE_BUILT.some((token) => raw.includes(token))) {
    return { condition: "built_complete", forceReview, reasonCodes }
  }

  const positiveHits = JAPANESE_POSITIVE.filter((token) => raw.includes(token))
  if (positiveHits.length >= 2 && raw.includes("未組立") && (raw.includes("未使用") || raw.includes("新品"))) {
    return { condition: "new_complete_unbuilt", forceReview, reasonCodes }
  }

  return { condition: null, forceReview, reasonCodes }
}

function releaseSpecificEvidence(
  observation: SourceObservation,
  release: CatalogReleaseIdentity,
  titleNormalized: string,
): MatchEvidence[] {
  const evidence: MatchEvidence[] = []

  if (containsNormalized(titleNormalized, release.editionName)) evidence.push("edition_name_exact")

  if (release.releaseYear != null && new RegExp(`(^|\\D)${release.releaseYear}(\\D|$)`).test(observation.titleRaw ?? "")) {
    evidence.push("release_year_stated")
  }

  if (
    release.releaseType?.toLocaleLowerCase("en").includes("reissue") &&
    /(reissue|復刻版|再販)/i.test(observation.titleRaw ?? "")
  ) {
    evidence.push("reissue_stated")
  }

  if (containsNormalized(titleNormalized, release.chassis)) evidence.push("chassis_stated")
  if (containsNormalized(titleNormalized, release.color)) evidence.push("color_variant_match")

  return evidence
}

export function classifyObservation(
  observation: SourceObservation,
  catalog: CatalogReleaseIdentity[],
): ClassifiedCandidate {
  const observedAt = observation.observedAt ?? new Date().toISOString()
  const titleRaw = observation.titleRaw ?? null
  const titleNormalized = normalizeText(titleRaw)
  const itemNumberObserved = normalizeItemNumber(observation.itemNumberObserved)
  const reasonCodes: string[] = []

  const jpCondition = deriveJapaneseCondition(`${observation.titleRaw ?? ""} ${observation.conditionRaw ?? ""}`)
  const condition = observation.condition ?? jpCondition.condition ?? "unknown"

  let possibleReleaseIds: string[] = []
  let resolvedReleaseId: string | null = null
  let matchConfidence: ClassifiedCandidate["matchConfidence"] = null
  let matchEvidence = uniq(observation.matchEvidence ?? [])
  let decision: ClassifiedCandidate["decision"] = "needs_review"

  if (observation.explicitReleaseId) {
    const release = catalog.find((row) => row.id === observation.explicitReleaseId)
    possibleReleaseIds = release ? [release.id] : []

    if (!release) {
      matchConfidence = "rejected"
      decision = "rejected"
      reasonCodes.push("UNKNOWN_RELEASE_ID")
    } else if (observation.identityReviewed && matchEvidence.includes("manual_override")) {
      resolvedReleaseId = release.id
      matchConfidence = "exact"
      decision = "accepted"
    } else {
      matchConfidence = "ambiguous"
      reasonCodes.push("MANUAL_IDENTITY_NOT_REVIEWED")
    }
  } else {
    const numberMatches = itemNumberObserved
      ? catalog.filter((release) => normalizeItemNumber(release.itemNumber) === itemNumberObserved)
      : []

    possibleReleaseIds = numberMatches.map((release) => release.id)

    if (numberMatches.length > 1) reasonCodes.push("REUSED_ITEM_NUMBER")

    if (numberMatches.length === 1) {
      const release = numberMatches[0]
      const specificEvidence = releaseSpecificEvidence(observation, release, titleNormalized)
      matchEvidence = uniq(["item_number_exact", ...specificEvidence, ...matchEvidence])

      if (specificEvidence.length > 0) {
        resolvedReleaseId = release.id
        matchConfidence = "strong"
        decision = "accepted"
      } else {
        matchConfidence = "ambiguous"
        reasonCodes.push("ITEM_NUMBER_NEEDS_CORROBORATION")
      }
    } else if (numberMatches.length > 1) {
      const scoreEvidence = (release: CatalogReleaseIdentity, evidence: MatchEvidence[]): number =>
        evidence.reduce((score, code) => {
          if (code === "release_year_stated" || code === "reissue_stated") return score + 3

          if (code === "edition_name_exact") {
            const edition = normalizeText(release.editionName)
            const isGenericWithinReuseSet = numberMatches.some(
              (other) => other.id !== release.id && normalizeText(other.editionName).includes(edition),
            )
            return score + (isGenericWithinReuseSet ? 0 : 2)
          }

          if (code === "chassis_stated") {
            const chassis = normalizeText(release.chassis)
            const isDistinct = chassis.length > 0 && numberMatches.some(
              (other) => other.id !== release.id && normalizeText(other.chassis) !== chassis,
            )
            return score + (isDistinct ? 1 : 0)
          }

          if (code === "color_variant_match") {
            const color = normalizeText(release.color)
            const isDistinct = color.length > 0 && numberMatches.some(
              (other) => other.id !== release.id && normalizeText(other.color) !== color,
            )
            return score + (isDistinct ? 1 : 0)
          }

          return score
        }, 0)

      const ranked = numberMatches
        .map((release) => {
          const evidence = releaseSpecificEvidence(observation, release, titleNormalized)
          return { release, evidence, score: scoreEvidence(release, evidence) }
        })
        .sort((a, b) => b.score - a.score)

      const best = ranked[0]
      const second = ranked[1]
      const uniquelyBest = best && best.score >= 2 && (!second || best.score > second.score)

      if (uniquelyBest) {
        resolvedReleaseId = best.release.id
        matchEvidence = uniq(["item_number_exact", ...best.evidence, ...matchEvidence])
        matchConfidence = "strong"
        decision = "accepted"
      } else {
        matchConfidence = "ambiguous"
        reasonCodes.push("RELEASE_DISAMBIGUATION_REQUIRED")
      }
    } else {
      const editionMatches = catalog.filter((release) => containsNormalized(titleNormalized, release.editionName))
      possibleReleaseIds = editionMatches.map((release) => release.id)
      if (editionMatches.length === 1) {
        matchEvidence = uniq(["edition_name_exact", ...matchEvidence])
        matchConfidence = "ambiguous"
        reasonCodes.push("ITEM_NUMBER_NOT_CONFIRMED")
      } else {
        reasonCodes.push("RELEASE_IDENTITY_UNRESOLVED")
      }
    }
  }

  if (jpCondition.forceReview && decision === "accepted") {
    decision = "needs_review"
    reasonCodes.push(...jpCondition.reasonCodes)
  } else {
    reasonCodes.push(...jpCondition.reasonCodes)
  }

  if ((observation.titleRaw ?? "").includes("専用") && decision === "accepted") {
    decision = "needs_review"
    reasonCodes.push("RESERVED_LISTING")
  }

  if (decision === "accepted" && (!resolvedReleaseId || !matchConfidence || !["exact", "strong"].includes(matchConfidence) || matchEvidence.length === 0)) {
    decision = "needs_review"
    reasonCodes.push("ACCEPTED_AUDIT_GUARD")
  }

  return {
    sourceRecordKey: observation.sourceRecordKey,
    externalListingId: observation.externalListingId ?? null,
    originalSource: observation.originalSource ?? null,
    originalRecordId: observation.originalRecordId ?? null,
    listingUrl: observation.listingUrl ?? null,
    titleRaw,
    itemNumberObserved,
    possibleReleaseIds: uniq(possibleReleaseIds),
    resolvedReleaseId,
    price: observation.price ?? null,
    currency: observation.currency?.toUpperCase() ?? null,
    shippingCost: observation.shippingCost ?? null,
    shippingBasis: observation.shippingBasis ?? "unknown",
    observationType: observation.observationType ?? "unknown",
    conditionRaw: observation.conditionRaw ?? null,
    condition,
    innerBagsSealed: observation.innerBagsSealed ?? "unknown",
    boxCondition: observation.boxCondition ?? "unknown",
    isComplete: observation.isComplete ?? null,
    isLot: observation.isLot ?? null,
    quantity: observation.quantity ?? null,
    matchConfidence,
    matchEvidence: uniq(matchEvidence),
    sellerFingerprint: observation.sellerFingerprint ?? null,
    evidenceGroupKey: null,
    soldAt: observation.soldAt ?? null,
    soldOn: observation.soldOn ?? null,
    listingDate: observation.listingDate ?? null,
    observedAt,
    decision,
    reasonCodes: uniq(reasonCodes),
    reviewNotes: null,
    needsRevalidation: false,
    rawPayload: observation.rawPayload ?? null,
    fxRateToEUR: observation.fxRateToEUR ?? null,
    fxRateDate: observation.fxRateDate ?? null,
  }
}
