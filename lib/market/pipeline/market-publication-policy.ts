import type {
  CurrentOfferEvidence,
  MarketSignalDraft,
  SoldMarketEvidence,
} from "./market-model"

const HOUR_MS = 3_600_000
const DAY_MS = 86_400_000

// Scanner cadence deliberately runs inside these windows:
// marketplace normal/cold = 72h, expiry = 96h
// retail normal/cold = 168h, expiry = 192h
// The extra day is operational grace, not permission to keep stale stock forever.
export const MARKETPLACE_OFFER_MAX_AGE_HOURS = 96
export const RETAIL_OFFER_MAX_AGE_HOURS = 192

export function filterFreshCurrentOffers(
  offers: CurrentOfferEvidence[],
  now: Date,
): CurrentOfferEvidence[] {
  return offers.filter((offer) => {
    const checkedAt = Date.parse(offer.observedAt)
    if (!Number.isFinite(checkedAt)) return false

    const ageMs = Math.max(0, now.getTime() - checkedAt)
    const maxAgeHours = offer.channel === "marketplace"
      ? MARKETPLACE_OFFER_MAX_AGE_HOURS
      : RETAIL_OFFER_MAX_AGE_HOURS

    return ageMs <= maxAgeHours * HOUR_MS
  })
}

function confidenceLabel(score: number): MarketSignalDraft["confidenceLabel"] {
  if (score >= 75) return "high"
  if (score >= 50) return "medium"
  return "low"
}

function soldFreshnessPoints(evidence: SoldMarketEvidence[], asOfDate: string): number {
  if (!evidence.length) return 0
  const asOf = Date.parse(`${asOfDate}T23:59:59Z`)
  const latest = Math.max(...evidence.map((row) => Date.parse(`${row.periodEnd}T23:59:59Z`)).filter(Number.isFinite))
  if (!Number.isFinite(asOf) || !Number.isFinite(latest)) return 0

  const ageDays = Math.max(0, (asOf - latest) / DAY_MS)
  if (ageDays <= 90) return 25
  if (ageDays <= 180) return 20
  if (ageDays <= 365) return 15
  if (ageDays <= 730) return 8
  return 4
}

function soldQualityPoints(evidence: SoldMarketEvidence[]): { points: number; hasVerified: boolean } {
  if (!evidence.length) return { points: 0, hasVerified: false }
  let weighted = 0
  let totalWeight = 0
  let hasVerified = false

  for (const row of evidence) {
    const weight = Math.sqrt(Math.max(1, row.salesCount))
    const points = row.evidenceGrade === "verified" ? 20 : 10
    if (row.evidenceGrade === "verified") hasVerified = true
    weighted += points * weight
    totalWeight += weight
  }

  return {
    points: totalWeight > 0 ? weighted / totalWeight : 0,
    hasVerified,
  }
}

// Confidence shown next to a sold-based Market Value describes the evidence
// behind THAT value, not the amount of asking-price activity around it.
// Indicative-only title-matched Product Research can reach Medium, but never High.
export function publicSoldConfidence(
  signal: MarketSignalDraft,
  soldEvidence: SoldMarketEvidence[],
  asOfDate: string,
): { score: number; label: MarketSignalDraft["confidenceLabel"] } {
  const volume = signal.soldUnits > 0
    ? Math.min(30, Math.log2(signal.soldUnits + 1) * 5)
    : 0
  const diversity = Math.min(20, signal.soldSourceCount * 8)
  const freshness = soldFreshnessPoints(soldEvidence, asOfDate)
  const quality = soldQualityPoints(soldEvidence)

  let score = Math.round(Math.min(100, volume + diversity + freshness + quality.points))
  if (!quality.hasVerified) score = Math.min(score, 70)

  return { score, label: confidenceLabel(score) }
}

// A retail-based headline is allowed only when at least two independent current
// retail sources agree that the Release is genuinely purchasable. One shop can be
// useful evidence, but it is too fragile to define the public value on its own.
// Completed sales can strengthen confidence when they broadly corroborate retail;
// active marketplace asks never increase headline confidence.
export function publicRetailConfidence(
  signal: MarketSignalDraft,
  soldEvidence: SoldMarketEvidence[],
  asOfDate: string,
): { score: number; label: MarketSignalDraft["confidenceLabel"] } {
  const retailSources = Math.min(60, signal.retailSourceCount * 25)
  let soldAgreement = 0

  if (signal.retailAnchorEUR != null && signal.retailAnchorEUR > 0 && signal.soldAnchorEUR != null && signal.soldAnchorEUR > 0) {
    const delta = Math.abs(signal.soldAnchorEUR - signal.retailAnchorEUR) / signal.retailAnchorEUR
    if (delta <= 0.15) soldAgreement = 20
    else if (delta <= 0.3) soldAgreement = 12
    else if (delta <= 0.5) soldAgreement = 6
  }

  const soldFreshness = soldEvidence.length ? Math.round(soldFreshnessPoints(soldEvidence, asOfDate) / 5) : 0
  const soldQuality = soldEvidence.length ? (soldQualityPoints(soldEvidence).hasVerified ? 5 : 2) : 0
  const score = Math.round(Math.min(100, retailSources + soldAgreement + soldFreshness + soldQuality))

  return { score, label: confidenceLabel(score) }
}

// Public v1 deliberately keeps three concepts separate:
//
// 1. Liquid current retail market -> Market Value = median verified retail price,
//    but only with at least two independent fresh retail sources.
// 2. Collector/secondary market -> Market Value = demonstrated completed-sale value.
// 3. Active asks -> seller expectations only; they are shown separately and never
//    manufacture or inflate Market Value.
//
// With one retail source and no sold evidence, or asks without sold evidence, the
// evidence remains visible but the headline stays unconsolidated.
export function applyPublicMarketPublicationPolicy(
  signal: MarketSignalDraft,
  soldEvidence: SoldMarketEvidence[] = [],
  asOfDate?: string,
): MarketSignalDraft {
  const hasLiquidRetail = signal.retailAnchorEUR != null && signal.retailAnchorEUR > 0 && signal.retailSourceCount >= 2
  const hasSoldValue = signal.soldAnchorEUR != null && signal.soldEvidenceCount > 0

  if (hasLiquidRetail) {
    const confidence = asOfDate
      ? publicRetailConfidence(signal, soldEvidence, asOfDate)
      : { score: signal.confidenceScore, label: signal.confidenceLabel }

    return {
      ...signal,
      marketValueEUR: signal.retailAnchorEUR,
      lowEUR: signal.retailAnchorEUR,
      highEUR: signal.retailAnchorEUR,
      confidenceScore: confidence.score,
      confidenceLabel: confidence.label,
    }
  }

  if (hasSoldValue) {
    const confidence = asOfDate && soldEvidence.length
      ? publicSoldConfidence(signal, soldEvidence, asOfDate)
      : { score: signal.confidenceScore, label: signal.confidenceLabel }

    return {
      ...signal,
      marketValueEUR: signal.soldAnchorEUR,
      lowEUR: signal.soldAnchorEUR,
      highEUR: signal.soldAnchorEUR,
      confidenceScore: confidence.score,
      confidenceLabel: confidence.label,
    }
  }

  return {
    ...signal,
    marketRegime: signal.retailSourceCount > 0 ? signal.marketRegime : "insufficient",
    marketValueEUR: null,
    lowEUR: null,
    highEUR: null,
  }
}
