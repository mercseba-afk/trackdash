export type MarketChannel = "retail" | "marketplace"

export type AvailabilityStatus =
  | "in_stock"
  | "low_stock"
  | "preorder"
  | "backorder"
  | "out_of_stock"
  | "discontinued"
  | "unknown"

export type MarketRegime =
  | "retail_driven"
  | "mixed_scarce"
  | "secondary_market_driven"
  | "insufficient"

export type ConfidenceLabel = "low" | "medium" | "high"
export type CostBasis = "delivered" | "item_only"
export type SoldEvidenceGrade = "verified" | "indicative"
export type SoldEvidenceGrain = "event" | "monthly" | "rolling_window" | "full_history"

export interface CurrentOfferEvidence {
  stableId: string
  candidateId?: string | null
  sourceId: string
  channel: MarketChannel
  sellerFingerprint?: string | null
  availability: AvailabilityStatus
  itemPriceEUR: number
  shippingEUR?: number | null
  observedAt: string
}

export interface SoldMarketEvidence {
  stableId: string
  sourceId: string
  averagePriceEUR: number
  salesCount: number
  periodStart: string
  periodEnd: string
  grain: SoldEvidenceGrain
  evidenceGrade: SoldEvidenceGrade
}

export interface MonthlyTrendPoint {
  month: string
  soldAnchorEUR: number
  salesCount: number
}

export interface StartingOffer {
  stableId: string
  candidateId: string | null
  sourceId: string
  channel: MarketChannel
  itemPriceEUR: number
  shippingEUR: number | null
  effectiveCostEUR: number | null
  costBasis: CostBasis
}

export interface MarketSignalDraft {
  marketRegime: MarketRegime
  marketValueEUR: number | null
  lowEUR: number | null
  highEUR: number | null
  confidenceScore: number
  confidenceLabel: ConfidenceLabel
  retailAnchorEUR: number | null
  activeAnchorEUR: number | null
  soldAnchorEUR: number | null
  startingOffer: StartingOffer | null
  retailSourceCount: number
  activeOfferCount: number
  currentOfferCount: number
  soldUnits: number
  soldSourceCount: number
  soldEvidenceCount: number
  shippingKnownRatio: number
  trendPercent: number | null
  trendWindowMonths: 1 | 3 | null
  monthlyTrend: MonthlyTrendPoint[]
  algorithmVersion: "r3"
}

interface WeightedValue {
  value: number
  weight: number
}

interface OfferRepresentative {
  stableId: string
  candidateId: string | null
  sourceId: string
  channel: MarketChannel
  sellerFingerprint: string | null
  itemPriceEUR: number
  shippingEUR: number | null
  effectiveCostEUR: number | null
  costBasis: CostBasis
  weight: number
}

const DAY_MS = 86_400_000

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function dateMs(value: string): number {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value
  const parsed = Date.parse(normalized)
  if (!Number.isFinite(parsed)) throw new Error(`Invalid date: ${value}`)
  return parsed
}

function median(values: number[]): number {
  if (!values.length) throw new Error("median requires at least one value")
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

function weightedMedian(values: WeightedValue[]): number | null {
  const clean = values
    .filter((item) => Number.isFinite(item.value) && item.value > 0 && Number.isFinite(item.weight) && item.weight > 0)
    .sort((a, b) => a.value - b.value)

  if (!clean.length) return null
  const total = clean.reduce((sum, item) => sum + item.weight, 0)
  const halfway = total / 2
  let cumulative = 0
  for (const item of clean) {
    cumulative += item.weight
    if (cumulative >= halfway) return round2(item.value)
  }
  return round2(clean[clean.length - 1].value)
}

function weightedAverage(values: WeightedValue[]): number | null {
  const clean = values.filter(
    (item) => Number.isFinite(item.value) && item.value > 0 && Number.isFinite(item.weight) && item.weight > 0,
  )
  if (!clean.length) return null
  const weight = clean.reduce((sum, item) => sum + item.weight, 0)
  return round2(clean.reduce((sum, item) => sum + item.value * item.weight, 0) / weight)
}

function isPurchasable(availability: AvailabilityStatus): boolean {
  return availability === "in_stock" || availability === "low_stock"
}

function costBasis(offer: CurrentOfferEvidence): {
  itemPriceEUR: number
  shippingEUR: number | null
  effectiveCostEUR: number | null
  costBasis: CostBasis
  comparableCostEUR: number
  weight: number
} | null {
  if (!Number.isFinite(offer.itemPriceEUR) || offer.itemPriceEUR <= 0) return null

  const itemPriceEUR = round2(offer.itemPriceEUR)
  if (offer.shippingEUR != null) {
    if (!Number.isFinite(offer.shippingEUR) || offer.shippingEUR < 0) return null
    const shippingEUR = round2(offer.shippingEUR)
    return {
      itemPriceEUR,
      shippingEUR,
      effectiveCostEUR: round2(itemPriceEUR + shippingEUR),
      costBasis: "delivered",
      comparableCostEUR: round2(itemPriceEUR + shippingEUR),
      weight: offer.availability === "low_stock" ? 0.9 : 1,
    }
  }

  return {
    itemPriceEUR,
    shippingEUR: null,
    effectiveCostEUR: null,
    costBasis: "item_only",
    comparableCostEUR: itemPriceEUR,
    weight: offer.availability === "low_stock" ? 0.55 : 0.65,
  }
}

function chooseRepresentative(offers: CurrentOfferEvidence[]): OfferRepresentative | null {
  const candidates = offers.flatMap((offer) => {
    const cost = costBasis(offer)
    if (!cost) return []
    return [{
      stableId: offer.stableId,
      candidateId: offer.candidateId ?? null,
      sourceId: offer.sourceId,
      channel: offer.channel,
      sellerFingerprint: offer.sellerFingerprint ?? null,
      itemPriceEUR: cost.itemPriceEUR,
      shippingEUR: cost.shippingEUR,
      effectiveCostEUR: cost.effectiveCostEUR,
      costBasis: cost.costBasis,
      comparableCostEUR: cost.comparableCostEUR,
      weight: cost.weight,
    }]
  })

  if (!candidates.length) return null

  const delivered = candidates.filter((item) => item.costBasis === "delivered")
  const pool = delivered.length ? delivered : candidates
  return [...pool].sort((a, b) => {
    const aCost = a.effectiveCostEUR ?? a.itemPriceEUR
    const bCost = b.effectiveCostEUR ?? b.itemPriceEUR
    if (aCost !== bCost) return aCost - bCost
    return a.stableId.localeCompare(b.stableId)
  })[0]
}

function buildOfferRepresentatives(offers: CurrentOfferEvidence[]): {
  retail: OfferRepresentative[]
  active: OfferRepresentative[]
  current: OfferRepresentative[]
} {
  const current = offers.filter((offer) => isPurchasable(offer.availability))
  const retailGroups = new Map<string, CurrentOfferEvidence[]>()
  const activeGroups = new Map<string, CurrentOfferEvidence[]>()

  for (const offer of current) {
    if (offer.channel === "retail") {
      const bucket = retailGroups.get(offer.sourceId) ?? []
      bucket.push(offer)
      retailGroups.set(offer.sourceId, bucket)
      continue
    }

    const key = `${offer.sourceId}|${offer.sellerFingerprint ?? offer.stableId}`
    const bucket = activeGroups.get(key) ?? []
    bucket.push(offer)
    activeGroups.set(key, bucket)
  }

  const retail = [...retailGroups.values()].flatMap((group) => {
    const rep = chooseRepresentative(group)
    return rep ? [rep] : []
  })
  const active = [...activeGroups.values()].flatMap((group) => {
    const rep = chooseRepresentative(group)
    return rep ? [rep] : []
  })

  return { retail, active, current: [...retail, ...active] }
}

function anchorForOffers(reps: OfferRepresentative[]): number | null {
  // Market Value is the value of the collectible itself, not a destination-specific
  // landed cost. Shipping remains stored and is used for acquisition context and
  // confidence, but never gets added to the public retail/active market anchors.
  if (!reps.length) return null
  return round2(median(reps.map((rep) => rep.itemPriceEUR)))
}

function ageDays(periodEnd: string, asOfDate: string): number {
  return Math.max(0, (dateMs(asOfDate) - dateMs(periodEnd)) / DAY_MS)
}

function soldFreshnessWeight(periodEnd: string, asOfDate: string): number {
  const age = ageDays(periodEnd, asOfDate)
  if (age <= 90) return 1
  if (age <= 180) return 0.9
  if (age <= 365) return 0.75
  if (age <= 730) return 0.55
  if (age <= 1095) return 0.4
  return 0.25
}

function soldGrainWeight(grain: SoldEvidenceGrain): number {
  if (grain === "monthly" || grain === "event") return 1
  if (grain === "rolling_window") return 0.85
  return 0.75
}

function soldEvidenceWeight(evidence: SoldMarketEvidence, asOfDate: string): number {
  const grade = evidence.evidenceGrade === "verified" ? 1 : 0.8
  return (
    Math.sqrt(Math.max(1, evidence.salesCount)) *
    soldFreshnessWeight(evidence.periodEnd, asOfDate) *
    soldGrainWeight(evidence.grain) *
    grade
  )
}

function soldAnchor(evidence: SoldMarketEvidence[], asOfDate: string): number | null {
  return weightedMedian(
    evidence.map((item) => ({
      value: item.averagePriceEUR,
      weight: soldEvidenceWeight(item, asOfDate),
    })),
  )
}

function deriveRegime(
  retailSourceCount: number,
  activeAnchorEUR: number | null,
  soldAnchorEUR: number | null,
): MarketRegime {
  if (retailSourceCount >= 2) return "retail_driven"
  if (retailSourceCount === 1) {
    return activeAnchorEUR != null || soldAnchorEUR != null ? "mixed_scarce" : "retail_driven"
  }
  if (activeAnchorEUR != null || soldAnchorEUR != null) return "secondary_market_driven"
  return "insufficient"
}

function baseChannelWeights(regime: MarketRegime): { retail: number; active: number; sold: number } {
  if (regime === "retail_driven") return { retail: 0.65, sold: 0.2, active: 0.15 }
  if (regime === "mixed_scarce") return { retail: 0.35, sold: 0.35, active: 0.3 }
  if (regime === "secondary_market_driven") return { retail: 0, sold: 0.6, active: 0.4 }
  return { retail: 0, sold: 0, active: 0 }
}

function soldReliability(evidence: SoldMarketEvidence[]): number {
  const units = evidence.reduce((sum, item) => sum + Math.max(0, item.salesCount), 0)
  const sources = new Set(evidence.map((item) => item.sourceId)).size
  if (!units) return 0
  const volume = clamp(Math.log2(units + 1) / 6, 0.25, 1)
  const diversity = clamp(0.55 + sources * 0.15, 0.55, 1)
  return round2(volume * diversity)
}

function offerReliability(count: number, shippingKnownRatio: number, kind: MarketChannel): number {
  if (!count) return 0
  const diversity = kind === "retail"
    ? clamp(0.55 + count * 0.18, 0.55, 1)
    : clamp(0.5 + Math.min(count, 5) * 0.1, 0.5, 1)
  const shipping = 0.7 + shippingKnownRatio * 0.3
  return round2(diversity * shipping)
}

function channelWeightedMarketValue(input: {
  regime: MarketRegime
  retailAnchorEUR: number | null
  activeAnchorEUR: number | null
  soldAnchorEUR: number | null
  retailReliability: number
  activeReliability: number
  soldReliability: number
}): number | null {
  const base = baseChannelWeights(input.regime)
  const values: WeightedValue[] = []

  if (input.retailAnchorEUR != null) values.push({ value: input.retailAnchorEUR, weight: base.retail * input.retailReliability })
  if (input.activeAnchorEUR != null) values.push({ value: input.activeAnchorEUR, weight: base.active * input.activeReliability })
  if (input.soldAnchorEUR != null) values.push({ value: input.soldAnchorEUR, weight: base.sold * input.soldReliability })

  return weightedAverage(values)
}

function chooseStartingOffer(reps: OfferRepresentative[]): StartingOffer | null {
  if (!reps.length) return null

  // "A partire da" means the lowest current purchasable ITEM price. Shipping is
  // preserved on the chosen offer for provenance/details, but never replaces the
  // item price in the headline just because another source has known delivery.
  const selected = [...reps].sort((a, b) => {
    if (a.itemPriceEUR !== b.itemPriceEUR) return a.itemPriceEUR - b.itemPriceEUR
    const aCost = a.effectiveCostEUR ?? Number.POSITIVE_INFINITY
    const bCost = b.effectiveCostEUR ?? Number.POSITIVE_INFINITY
    if (aCost !== bCost) return aCost - bCost
    return a.stableId.localeCompare(b.stableId)
  })[0]

  return {
    stableId: selected.stableId,
    candidateId: selected.candidateId,
    sourceId: selected.sourceId,
    channel: selected.channel,
    itemPriceEUR: selected.itemPriceEUR,
    shippingEUR: selected.shippingEUR,
    effectiveCostEUR: selected.effectiveCostEUR,
    costBasis: selected.costBasis,
  }
}

function agreementScore(anchors: number[]): number {
  if (!anchors.length) return 0
  if (anchors.length === 1) return 5
  const center = median(anchors)
  const spread = Math.max(...anchors.map((value) => Math.abs(value - center) / center))
  if (spread <= 0.15) return 20
  if (spread <= 0.3) return 16
  if (spread <= 0.5) return 10
  if (spread <= 0.8) return 6
  return 2
}

function confidenceLabel(score: number): ConfidenceLabel {
  if (score >= 75) return "high"
  if (score >= 50) return "medium"
  return "low"
}

function confidenceScore(input: {
  retailSourceCount: number
  activeOfferCount: number
  soldUnits: number
  soldSourceCount: number
  shippingKnownRatio: number
  anchors: number[]
  soldEvidence: SoldMarketEvidence[]
  asOfDate: string
}): number {
  const retail = Math.min(25, input.retailSourceCount * 10)
  const active = Math.min(15, input.activeOfferCount * 3)
  const soldVolume = input.soldUnits ? Math.min(18, Math.log2(input.soldUnits + 1) * 3) : 0
  const soldSources = Math.min(10, input.soldSourceCount * 4)
  const agreement = agreementScore(input.anchors)
  const shipping = input.shippingKnownRatio * 7

  const mostRecentSold = input.soldEvidence.map((item) => dateMs(item.periodEnd)).sort((a, b) => b - a)[0]
  let freshness = 0
  if (mostRecentSold) {
    const age = Math.max(0, (dateMs(input.asOfDate) - mostRecentSold) / DAY_MS)
    freshness = age <= 90 ? 5 : age <= 180 ? 4 : age <= 365 ? 3 : age <= 730 ? 2 : 1
  }

  return Math.round(clamp(retail + active + soldVolume + soldSources + agreement + shipping + freshness, 0, 100))
}

function monthKey(date: string): string {
  return date.slice(0, 7)
}

function monthOrdinal(month: string): number {
  const [year, monthNumber] = month.split("-").map(Number)
  return year * 12 + monthNumber - 1
}

function monthEndMs(month: string): number {
  const [year, monthNumber] = month.split("-").map(Number)
  return Date.UTC(year, monthNumber, 0)
}

function monthsAreConsecutive(points: MonthlyTrendPoint[]): boolean {
  return points.every((point, index) => index === 0 || monthOrdinal(point.month) === monthOrdinal(points[index - 1].month) + 1)
}

function isCompleteCalendarMonth(item: SoldMarketEvidence): boolean {
  if (item.grain !== "monthly") return false
  const start = new Date(`${item.periodStart}T00:00:00Z`)
  const end = new Date(`${item.periodEnd}T00:00:00Z`)
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return false
  if (start.getUTCDate() !== 1) return false
  const expectedLast = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate()
  return end.getUTCFullYear() === start.getUTCFullYear()
    && end.getUTCMonth() === start.getUTCMonth()
    && end.getUTCDate() === expectedLast
}

function buildMonthlyTrend(evidence: SoldMarketEvidence[], asOfDate: string): {
  points: MonthlyTrendPoint[]
  percent: number | null
  window: 1 | 3 | null
} {
  const byMonth = new Map<string, SoldMarketEvidence[]>()
  for (const item of evidence) {
    if (!isCompleteCalendarMonth(item)) continue
    if (dateMs(item.periodEnd) > dateMs(asOfDate)) continue
    const key = monthKey(item.periodStart)
    const bucket = byMonth.get(key) ?? []
    bucket.push(item)
    byMonth.set(key, bucket)
  }

  const points = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([month, bucket]) => {
      const anchor = weightedMedian(
        bucket.map((item) => ({
          value: item.averagePriceEUR,
          weight: Math.sqrt(Math.max(1, item.salesCount)) * (item.evidenceGrade === "verified" ? 1 : 0.8),
        })),
      )
      if (anchor == null) return []
      return [{ month, soldAnchorEUR: anchor, salesCount: bucket.reduce((sum, item) => sum + item.salesCount, 0) }]
    })

  if (!points.length) return { points, percent: null, window: null }

  // A current trend must be current. Old historical monthly research remains
  // useful history, but it must not drive today's up/down indicator.
  const latestPoint = points[points.length - 1]
  const latestAgeDays = Math.max(0, (dateMs(asOfDate) - monthEndMs(latestPoint.month)) / DAY_MS)
  if (latestAgeDays > 90) return { points, percent: null, window: null }

  if (points.length >= 6) {
    const latest6 = points.slice(-6)
    if (monthsAreConsecutive(latest6)) {
      const latest3 = latest6.slice(-3)
      const previous3 = latest6.slice(0, 3)
      const recent = weightedAverage(latest3.map((point) => ({ value: point.soldAnchorEUR, weight: Math.sqrt(point.salesCount) })))
      const previous = weightedAverage(previous3.map((point) => ({ value: point.soldAnchorEUR, weight: Math.sqrt(point.salesCount) })))
      if (recent != null && previous != null && previous > 0) {
        return { points, percent: round2(((recent - previous) / previous) * 100), window: 3 }
      }
    }
  }

  if (points.length >= 2) {
    const latest2 = points.slice(-2)
    if (monthsAreConsecutive(latest2)) {
      const latest = latest2[1].soldAnchorEUR
      const previous = latest2[0].soldAnchorEUR
      if (previous > 0) return { points, percent: round2(((latest - previous) / previous) * 100), window: 1 }
    }
  }

  return { points, percent: null, window: null }
}

export function computeCurrentMarketSignal(input: {
  offers: CurrentOfferEvidence[]
  soldEvidence: SoldMarketEvidence[]
  monthlySoldEvidence?: SoldMarketEvidence[]
  asOfDate: string
}): MarketSignalDraft {
  const offers = buildOfferRepresentatives(input.offers)
  const retailAnchorEUR = anchorForOffers(offers.retail)
  const activeAnchorEUR = anchorForOffers(offers.active)
  const soldAnchorEUR = soldAnchor(input.soldEvidence, input.asOfDate)
  const retailSourceCount = new Set(offers.retail.map((item) => item.sourceId)).size
  const activeOfferCount = offers.active.length
  const currentOfferCount = offers.current.length
  const soldUnits = input.soldEvidence.reduce((sum, item) => sum + Math.max(0, item.salesCount), 0)
  const soldSourceCount = new Set(input.soldEvidence.map((item) => item.sourceId)).size
  const soldEvidenceCount = input.soldEvidence.length
  const shippingKnownCount = offers.current.filter((item) => item.costBasis === "delivered").length
  const shippingKnownRatio = currentOfferCount ? round2(shippingKnownCount / currentOfferCount) : 0
  const regime = deriveRegime(retailSourceCount, activeAnchorEUR, soldAnchorEUR)

  const retailReliability = offerReliability(
    offers.retail.length,
    offers.retail.length ? offers.retail.filter((item) => item.costBasis === "delivered").length / offers.retail.length : 0,
    "retail",
  )
  const activeReliability = offerReliability(
    offers.active.length,
    offers.active.length ? offers.active.filter((item) => item.costBasis === "delivered").length / offers.active.length : 0,
    "marketplace",
  )
  const soldReliabilityValue = soldReliability(input.soldEvidence)

  const marketValueEUR = regime === "insufficient"
    ? null
    : channelWeightedMarketValue({
        regime,
        retailAnchorEUR,
        activeAnchorEUR,
        soldAnchorEUR,
        retailReliability,
        activeReliability,
        soldReliability: soldReliabilityValue,
      })

  const anchors = [retailAnchorEUR, activeAnchorEUR, soldAnchorEUR].filter((value): value is number => value != null && value > 0)
  const lowEUR = anchors.length ? round2(Math.min(...anchors)) : null
  const highEUR = anchors.length ? round2(Math.max(...anchors)) : null
  const score = confidenceScore({
    retailSourceCount,
    activeOfferCount,
    soldUnits,
    soldSourceCount,
    shippingKnownRatio,
    anchors,
    soldEvidence: input.soldEvidence,
    asOfDate: input.asOfDate,
  })
  const trend = buildMonthlyTrend(input.monthlySoldEvidence ?? input.soldEvidence, input.asOfDate)

  return {
    marketRegime: regime,
    marketValueEUR,
    lowEUR,
    highEUR,
    confidenceScore: score,
    confidenceLabel: confidenceLabel(score),
    retailAnchorEUR,
    activeAnchorEUR,
    soldAnchorEUR,
    startingOffer: chooseStartingOffer(offers.current),
    retailSourceCount,
    activeOfferCount,
    currentOfferCount,
    soldUnits,
    soldSourceCount,
    soldEvidenceCount,
    shippingKnownRatio,
    trendPercent: trend.percent,
    trendWindowMonths: trend.window,
    monthlyTrend: trend.points,
    algorithmVersion: "r3",
  }
}
