import type {
  CurrentOfferEvidence,
  MarketSignalDraft,
  SoldMarketEvidence,
} from "./market-model"

const HOUR_MS = 3_600_000
const DAY_MS = 86_400_000

// Freshness follows the slow Mini 4WD refresh policy. A COLD observation must
// remain visible until its next scheduled refresh, with a small operational
// grace period. Recency weighting still happens separately in the market model.
export const MARKETPLACE_OFFER_MAX_AGE_HOURS = 360 // 14d cadence + 1d grace
export const RETAIL_OFFER_MAX_AGE_HOURS = 744 // 30d cadence + 1d grace

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

function knownSellerDiversity(evidence: SoldMarketEvidence[]): number | null {
  const bySource = new Map<string, number>()
  let hasKnownSellerCount = false

  for (const row of evidence) {
    if (row.sellerCount == null || !Number.isFinite(row.sellerCount) || row.sellerCount < 1) continue
    hasKnownSellerCount = true
    bySource.set(row.sourceId, Math.max(bySource.get(row.sourceId) ?? 0, Math.floor(row.sellerCount)))
  }

  if (!hasKnownSellerCount) return null
  return [...bySource.values()].reduce((sum, count) => sum + count, 0)
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

  const sellerDiversity = knownSellerDiversity(soldEvidence)
  const usesHistoricalFallback = soldEvidence.some((row) => row.grain === "full_history")

  // A broad historical window is a legitimate fallback when recent research is
  // unavailable, but it is deliberately weaker than a dedicated current window.
  if (usesHistoricalFallback) score = Math.max(0, score - 15)

  // Repeated sales from one known seller prove transactions, not broad market
  // agreement. Unknown seller diversity may reach Medium only with meaningful
  // volume; it can never become High on its own.
  if (!quality.hasVerified && sellerDiversity === 1) score = Math.min(score, 49)
  if (!quality.hasVerified && sellerDiversity == null && signal.soldSourceCount <= 1) {
    score = Math.min(score, 69)
  }

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

// Market Method v4 publication rules:
// These rules are shared by current Releases and future backfills.
//
// 1. Completed sales are the primary public Market Value when the selected sold
//    evidence is sufficiently broad. Recent windows remain preferred; a recent
//    full-history aggregate is only a lower-confidence fallback.
// 2. Seller diversity remains an evidence-quality factor, not a publication veto.
//    Five or more recent/selected sales from one known seller may publish a low-
//    confidence sold value; independent sellers/retail strengthen it.
// 3. Current retail is a corroborating/current-availability lane. If completed
//    sales are absent, at least two independent current merchants may define the
//    value, with region-aware safeguards.
// 4. Active marketplace ASK prices remain context only and never manufacture or
//    inflate Market Value.
// 5. Strong disagreement lowers confidence instead of averaging incompatible
//    regional/sold markets into a fake midpoint.
export function applyPublicMarketPublicationPolicy(
  signal: MarketSignalDraft,
  soldEvidence: SoldMarketEvidence[] = [],
  asOfDate?: string,
): MarketSignalDraft {
  const soldUnits = Math.max(signal.soldUnits, totalSoldUnits(soldEvidence))
  const sellerDiversity = knownSellerDiversity(soldEvidence)
  const hasVerifiedSale = soldEvidence.some((row) => row.evidenceGrade === "verified" && row.salesCount > 0)

  const hasLiquidRetail =
    signal.retailAnchorEUR != null &&
    signal.retailAnchorEUR > 0 &&
    signal.retailSourceCount >= 2

  const severeTwoRegionSplit =
    signal.retailRegionCount === 2 &&
    signal.retailRegionalSpreadRatio != null &&
    signal.retailRegionalSpreadRatio >= 1.75

  const retailCanHeadline =
    hasLiquidRetail &&
    (!severeTwoRegionSplit || signal.retailRegionCount >= 3)

  const retailCorroboratesSold =
    signal.retailSourceCount >= 1 &&
    pricesBroadlyCorroborate(signal.soldAnchorEUR, signal.retailAnchorEUR)

  const broadIndicativeSold =
    signal.soldSourceCount >= 2 ||
    (sellerDiversity != null && sellerDiversity >= 2) ||
    (sellerDiversity == null && soldUnits >= 5)

  const concentratedButMeaningfulSold =
    sellerDiversity === 1 &&
    soldUnits >= 5

  const hasSoldCluster =
    signal.soldAnchorEUR != null &&
    signal.soldAnchorEUR > 0 &&
    soldUnits >= 2 &&
    (
      hasVerifiedSale ||
      broadIndicativeSold ||
      concentratedButMeaningfulSold ||
      (sellerDiversity === 1 && retailCorroboratesSold)
    )

  const singleVerifiedCorroborated =
    signal.soldAnchorEUR != null &&
    signal.soldAnchorEUR > 0 &&
    soldUnits === 1 &&
    hasVerifiedSale &&
    retailCorroboratesSold

  if (hasSoldCluster || singleVerifiedCorroborated) {
    let confidence = asOfDate && soldEvidence.length
      ? publicSoldConfidence({ ...signal, soldUnits }, soldEvidence, asOfDate)
      : { score: signal.confidenceScore, label: signal.confidenceLabel }

    const hasRetailConflict =
      retailCanHeadline &&
      !pricesBroadlyCorroborate(signal.soldAnchorEUR, signal.retailAnchorEUR, 0.5)

    if (hasRetailConflict) {
      const score = Math.min(confidence.score, 49)
      confidence = { score, label: confidenceLabel(score) }
    } else if (retailCanHeadline && pricesBroadlyCorroborate(signal.soldAnchorEUR, signal.retailAnchorEUR, 0.3)) {
      const score = Math.min(100, confidence.score + 5)
      confidence = { score, label: confidenceLabel(score) }
    }

    const rangeUsesRetail =
      retailCanHeadline &&
      pricesBroadlyCorroborate(signal.soldAnchorEUR, signal.retailAnchorEUR, 0.5)

    const lowEUR = rangeUsesRetail
      ? Math.min(signal.soldAnchorEUR!, signal.retailAnchorEUR!)
      : signal.soldAnchorEUR
    const highEUR = rangeUsesRetail
      ? Math.max(signal.soldAnchorEUR!, signal.retailAnchorEUR!)
      : signal.soldAnchorEUR

    return {
      ...signal,
      soldUnits,
      soldSellerCount: sellerDiversity,
      marketValueEUR: signal.soldAnchorEUR,
      lowEUR,
      highEUR,
      confidenceScore: confidence.score,
      confidenceLabel: confidence.label,
    }
  }

  if (retailCanHeadline) {
    const confidence = asOfDate
      ? publicRetailConfidence(signal, soldEvidence, asOfDate)
      : { score: signal.confidenceScore, label: signal.confidenceLabel }

    return {
      ...signal,
      soldUnits,
      soldSellerCount: sellerDiversity,
      marketValueEUR: signal.retailAnchorEUR,
      lowEUR: signal.retailAnchorEUR,
      highEUR: signal.retailAnchorEUR,
      confidenceScore: confidence.score,
      confidenceLabel: confidence.label,
    }
  }

  return {
    ...signal,
    soldUnits,
    soldSellerCount: sellerDiversity,
    marketRegime: signal.retailSourceCount > 0 ? signal.marketRegime : "insufficient",
    marketValueEUR: null,
    lowEUR: null,
    highEUR: null,
    confidenceScore: Math.min(signal.confidenceScore, 49),
    confidenceLabel: "low",
  }
}
