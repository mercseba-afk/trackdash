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

function totalSoldUnits(evidence: SoldMarketEvidence[]): number {
  return evidence.reduce((sum, row) => sum + Math.max(0, row.salesCount), 0)
}

function pricesBroadlyCorroborate(a: number | null, b: number | null, tolerance = 0.3): boolean {
  if (a == null || b == null || a <= 0 || b <= 0) return false
  return Math.abs(a - b) / Math.max(a, b) <= tolerance
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

// Market Method v2 publication rules:
//
// 1. Current value is based on current evidence, not a historical average by default.
//    `selectCurrentSoldEvidence` has already chosen the best recent window per source.
// 2. Two independent fresh retailers may define the headline as the current retail median.
// 3. Otherwise completed sales define the headline, but one isolated indicative sale
//    is not enough to publish Market Value.
// 4. One verified completed sale may publish only when one fresh retailer independently
//    corroborates it within a broad 30% band.
// 5. Active asking prices remain separate seller expectations and never create or inflate
//    the public Market Value.
export function applyPublicMarketPublicationPolicy(
  signal: MarketSignalDraft,
  soldEvidence: SoldMarketEvidence[] = [],
  asOfDate?: string,
): MarketSignalDraft {
  const hasLiquidRetail = signal.retailAnchorEUR != null && signal.retailAnchorEUR > 0 && signal.retailSourceCount >= 2
  const soldUnits = Math.max(signal.soldUnits, totalSoldUnits(soldEvidence))
  const hasVerifiedSale = soldEvidence.some((row) => row.evidenceGrade === "verified" && row.salesCount > 0)
  const hasSoldCluster = signal.soldAnchorEUR != null && signal.soldAnchorEUR > 0 && soldUnits >= 2
  const singleVerifiedCorroborated =
    signal.soldAnchorEUR != null &&
    signal.soldAnchorEUR > 0 &&
    soldUnits === 1 &&
    hasVerifiedSale &&
    signal.retailSourceCount >= 1 &&
    pricesBroadlyCorroborate(signal.soldAnchorEUR, signal.retailAnchorEUR)

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

  if (hasSoldCluster || singleVerifiedCorroborated) {
    const confidence = asOfDate && soldEvidence.length
      ? publicSoldConfidence({ ...signal, soldUnits }, soldEvidence, asOfDate)
      : { score: signal.confidenceScore, label: signal.confidenceLabel }

    return {
      ...signal,
      soldUnits,
      marketValueEUR: signal.soldAnchorEUR,
      lowEUR: signal.soldAnchorEUR,
      highEUR: signal.soldAnchorEUR,
      confidenceScore: confidence.score,
      confidenceLabel: confidence.label,
    }
  }

  return {
    ...signal,
    soldUnits,
    marketRegime: signal.retailSourceCount > 0 ? signal.marketRegime : "insufficient",
    marketValueEUR: null,
    lowEUR: null,
    highEUR: null,
  }
}
