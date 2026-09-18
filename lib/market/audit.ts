export type MarketAuditRegion =
  | "europe"
  | "japan"
  | "north_america"
  | "asia_pacific"
  | "global"
  | "internal"

export type MarketAuditConfidence = "low" | "medium" | "high"
export type MarketAuditStatus = "ready" | "thin" | "conflict" | "insufficient"

export interface MarketAuditRetailOffer {
  stableId: string
  sourceId: string
  merchantKey?: string | null
  region: MarketAuditRegion
  availability: "in_stock" | "low_stock" | "preorder" | "backorder" | "out_of_stock" | "discontinued" | "unknown"
  itemPriceEUR: number
}

export interface MarketAuditSoldEvidence {
  stableId: string
  sourceId: string
  averagePriceEUR: number
  salesCount: number
  sellerCount?: number | null
  evidenceGrade: "verified" | "indicative"
}

export interface MarketAuditAsk {
  stableId: string
  sourceId: string
  sellerFingerprint?: string | null
  itemPriceEUR: number
}

export interface MarketAuditInput {
  retailOffers: MarketAuditRetailOffer[]
  currentSoldEvidence: MarketAuditSoldEvidence[]
  historicalSoldEvidence?: MarketAuditSoldEvidence[]
  activeAsks?: MarketAuditAsk[]
}

export interface MarketAuditResult {
  status: MarketAuditStatus
  confidence: MarketAuditConfidence
  suggestedValueEUR: number | null
  observedLowEUR: number | null
  observedHighEUR: number | null
  retailAnchorEUR: number | null
  currentSoldAnchorEUR: number | null
  historicalSoldAnchorEUR: number | null
  activeAskAnchorEUR: number | null
  retailMerchantCount: number
  retailRegionCount: number
  soldUnits: number
  soldSourceCount: number
  knownSoldSellerCount: number | null
  activeAskSellerCount: number
  reasons: string[]
  regionalRetail: Array<{ region: MarketAuditRegion; merchantCount: number; medianEUR: number }>
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function median(values: number[]): number | null {
  const clean = values.filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b)
  if (!clean.length) return null
  const middle = Math.floor(clean.length / 2)
  return round2(clean.length % 2 ? clean[middle] : (clean[middle - 1] + clean[middle]) / 2)
}

function weightedMedian(values: Array<{ value: number; weight: number }>): number | null {
  const clean = values
    .filter((row) => Number.isFinite(row.value) && row.value > 0 && Number.isFinite(row.weight) && row.weight > 0)
    .sort((a, b) => a.value - b.value)
  if (!clean.length) return null
  const total = clean.reduce((sum, row) => sum + row.weight, 0)
  let cumulative = 0
  for (const row of clean) {
    cumulative += row.weight
    if (cumulative >= total / 2) return round2(row.value)
  }
  return round2(clean[clean.length - 1].value)
}

function knownSellerDiversity(evidence: MarketAuditSoldEvidence[]): number | null {
  const bySource = new Map<string, number>()
  let known = false
  for (const row of evidence) {
    if (row.sellerCount == null || !Number.isFinite(row.sellerCount) || row.sellerCount < 1) continue
    known = true
    bySource.set(row.sourceId, Math.max(bySource.get(row.sourceId) ?? 0, Math.floor(row.sellerCount)))
  }
  if (!known) return null
  return [...bySource.values()].reduce((sum, count) => sum + count, 0)
}

function soldAnchor(evidence: MarketAuditSoldEvidence[]): number | null {
  return weightedMedian(evidence.map((row) => ({
    value: row.averagePriceEUR,
    weight: Math.sqrt(Math.max(1, row.salesCount)) * (row.evidenceGrade === "verified" ? 1 : 0.8),
  })))
}

function isCurrentRetail(offer: MarketAuditRetailOffer): boolean {
  return offer.availability === "in_stock" || offer.availability === "low_stock"
}

function retailAudit(offers: MarketAuditRetailOffer[]) {
  const byMerchant = new Map<string, MarketAuditRetailOffer[]>()
  for (const offer of offers.filter(isCurrentRetail)) {
    if (!Number.isFinite(offer.itemPriceEUR) || offer.itemPriceEUR <= 0) continue
    const key = offer.merchantKey || `source:${offer.sourceId}`
    const bucket = byMerchant.get(key) ?? []
    bucket.push(offer)
    byMerchant.set(key, bucket)
  }

  const merchantRows = [...byMerchant.entries()].flatMap(([merchantKey, rows]) => {
    const representative = median(rows.map((row) => row.itemPriceEUR))
    if (representative == null) return []
    // A merchant spanning storefronts still gets one vote. Prefer a concrete
    // non-global region when all observed storefronts agree; otherwise global.
    const regions = [...new Set(rows.map((row) => row.region))]
    const region = regions.length === 1 ? regions[0] : "global"
    return [{ merchantKey, region, representative }]
  })

  const byRegion = new Map<MarketAuditRegion, number[]>()
  for (const row of merchantRows) {
    const bucket = byRegion.get(row.region) ?? []
    bucket.push(row.representative)
    byRegion.set(row.region, bucket)
  }

  const regionalRetail = [...byRegion.entries()].flatMap(([region, values]) => {
    const value = median(values)
    return value == null ? [] : [{ region, merchantCount: values.length, medianEUR: value }]
  }).sort((a, b) => a.region.localeCompare(b.region))

  return {
    merchantCount: merchantRows.length,
    regionCount: regionalRetail.length,
    regionalRetail,
    anchor: median(regionalRetail.map((row) => row.medianEUR)),
  }
}

function askAudit(asks: MarketAuditAsk[]) {
  const bySeller = new Map<string, number[]>()
  for (const ask of asks) {
    if (!Number.isFinite(ask.itemPriceEUR) || ask.itemPriceEUR <= 0) continue
    const key = ask.sellerFingerprint || `${ask.sourceId}|${ask.stableId}`
    const bucket = bySeller.get(key) ?? []
    bucket.push(ask.itemPriceEUR)
    bySeller.set(key, bucket)
  }
  const reps = [...bySeller.values()].flatMap((values) => {
    const value = median(values)
    return value == null ? [] : [value]
  })
  return { sellerCount: bySeller.size, anchor: median(reps) }
}

function relativeGap(a: number | null, b: number | null): number | null {
  if (a == null || b == null || a <= 0 || b <= 0) return null
  return Math.abs(a - b) / Math.max(a, b)
}

export function buildMarketAudit(input: MarketAuditInput): MarketAuditResult {
  const retail = retailAudit(input.retailOffers)
  const currentSold = input.currentSoldEvidence.filter((row) => row.salesCount > 0 && row.averagePriceEUR > 0)
  const historicalSold = (input.historicalSoldEvidence ?? []).filter((row) => row.salesCount > 0 && row.averagePriceEUR > 0)
  const asks = askAudit(input.activeAsks ?? [])

  const currentSoldAnchorEUR = soldAnchor(currentSold)
  const historicalSoldAnchorEUR = soldAnchor(historicalSold)
  const soldUnits = currentSold.reduce((sum, row) => sum + Math.max(0, row.salesCount), 0)
  const soldSourceCount = new Set(currentSold.map((row) => row.sourceId)).size
  const sellerCount = knownSellerDiversity(currentSold)
  const hasVerifiedCurrentSale = currentSold.some((row) => row.evidenceGrade === "verified")
  const soldQualified =
    currentSoldAnchorEUR != null &&
    soldUnits >= 2 &&
    (hasVerifiedCurrentSale || soldSourceCount >= 2 || (sellerCount != null && sellerCount >= 2))
  const retailQualified = retail.anchor != null && retail.merchantCount >= 2
  const retailRegionDiverse = retail.regionCount >= 2

  const reasons: string[] = []
  if (currentSoldAnchorEUR != null && sellerCount === 1 && !hasVerifiedCurrentSale) reasons.push("SOLD_SINGLE_SELLER_CONCENTRATION")
  if (retail.anchor != null && retail.merchantCount < 2) reasons.push("RETAIL_SINGLE_MERCHANT")
  if (retailQualified && !retailRegionDiverse) reasons.push("RETAIL_SINGLE_REGION")
  if (asks.anchor != null && !retailQualified && !soldQualified) reasons.push("ASK_ONLY_CONTEXT")

  const headlineAnchors: number[] = []
  if (retailQualified && retail.anchor != null) headlineAnchors.push(retail.anchor)
  if (soldQualified && currentSoldAnchorEUR != null) headlineAnchors.push(currentSoldAnchorEUR)

  // Broad historical sold evidence may corroborate a current retail-led market,
  // but it can never become today's headline on its own.
  if (
    retailQualified &&
    historicalSoldAnchorEUR != null &&
    relativeGap(retail.anchor, historicalSoldAnchorEUR) != null &&
    relativeGap(retail.anchor, historicalSoldAnchorEUR)! <= 0.35
  ) {
    reasons.push("HISTORICAL_SOLD_CORROBORATES_RETAIL")
  }

  const conflictGap = retailQualified && soldQualified
    ? relativeGap(retail.anchor, currentSoldAnchorEUR)
    : null
  if (conflictGap != null && conflictGap > 0.5) reasons.push("CURRENT_ANCHOR_CONFLICT")

  const suggestedValueEUR = conflictGap != null && conflictGap > 0.5
    ? null
    : median(headlineAnchors)

  const observed = [
    retail.anchor,
    currentSoldAnchorEUR,
    historicalSoldAnchorEUR,
    asks.anchor,
  ].filter((value): value is number => value != null && value > 0)

  let status: MarketAuditStatus = "insufficient"
  if (conflictGap != null && conflictGap > 0.5) status = "conflict"
  else if (suggestedValueEUR != null && (retailQualified || soldQualified)) status = "ready"
  else if (observed.length) status = "thin"

  let confidence: MarketAuditConfidence = "low"
  const lanes = Number(retailQualified) + Number(soldQualified)
  if (
    status === "ready" &&
    lanes === 2 &&
    retail.merchantCount >= 3 &&
    retailRegionDiverse &&
    soldUnits >= 5 &&
    (sellerCount == null || sellerCount >= 2) &&
    (conflictGap == null || conflictGap <= 0.25)
  ) {
    confidence = "high"
  } else if (
    status === "ready" &&
    (
      (retailQualified && retailRegionDiverse) ||
      (soldQualified && (sellerCount == null || sellerCount >= 2)) ||
      lanes === 2
    )
  ) {
    confidence = "medium"
  }

  return {
    status,
    confidence,
    suggestedValueEUR,
    observedLowEUR: observed.length ? round2(Math.min(...observed)) : null,
    observedHighEUR: observed.length ? round2(Math.max(...observed)) : null,
    retailAnchorEUR: retail.anchor,
    currentSoldAnchorEUR,
    historicalSoldAnchorEUR,
    activeAskAnchorEUR: asks.anchor,
    retailMerchantCount: retail.merchantCount,
    retailRegionCount: retail.regionCount,
    soldUnits,
    soldSourceCount,
    knownSoldSellerCount: sellerCount,
    activeAskSellerCount: asks.sellerCount,
    reasons,
    regionalRetail: retail.regionalRetail,
  }
}
