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

// Confidence shown next to a sold-based Market Value must describe the evidence
// behind THAT value, not the amount of retail/asking-price activity around it.
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

// Public v1 has one deliberately simple definition across every Release:
//
// Market Value = demonstrated completed-sale value.
// Verified retail = current retail availability/price signal.
// Active asks = current seller expectations.
// Trend = movement of completed sales over time.
//
// Retail and asks remain valuable and visible, but neither can manufacture or
// inflate the public Market Value. This keeps the headline comparable between a
// current reissue, a scarce limited edition and a vintage discontinued Release.
export function applyPublicMarketPublicationPolicy(
  signal: MarketSignalDraft,
  soldEvidence: SoldMarketEvidence[] = [],
  asOfDate?: string,
): MarketSignalDraft {
  const hasSoldValue = signal.soldAnchorEUR != null && signal.soldEvidenceCount > 0

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
