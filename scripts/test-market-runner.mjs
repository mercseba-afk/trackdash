import { register } from "node:module"
register("./ts-extension-loader.mjs", import.meta.url)

import assert from "node:assert/strict"
const { ingestManualVerifiedSaleWithStore } = await import("../lib/market/pipeline/orchestrator.ts")

const catalog = [
  { id: "r1", itemNumber: "18014", editionName: "Avante Jr.", releaseYear: 1988, releaseType: "Original", editionType: "original", chassis: "Type 2", color: "Blue" },
  { id: "r2", itemNumber: "18014", editionName: "Avante Jr. (2024 Reissue)", releaseYear: 2024, releaseType: "Reissue", editionType: "reissue", chassis: "Type 2", color: "Blue" },
]

class FakeMarketStore {
  constructor() {
    this.source = { id: "source-manual" }
    this.candidates = new Map()
    this.points = new Map()
    this.estimates = new Map()
    this.nextCandidate = 1
    this.nextPoint = 1
  }

  async listCatalogReleases() { return catalog }
  async ensureSource() { return this.source }

  key(sourceId, sourceRecordKey) { return `${sourceId}|${sourceRecordKey}` }
  estimateKey(releaseId, condition) { return `${releaseId}|${condition}` }

  async findCandidate(sourceId, sourceRecordKey) {
    return this.candidates.get(this.key(sourceId, sourceRecordKey)) ?? null
  }

  async findExactAcceptedDuplicate() { return null }

  async upsertCandidate({ sourceId, candidate }) {
    const key = this.key(sourceId, candidate.sourceRecordKey)
    let row = this.candidates.get(key)
    if (!row) {
      row = {
        id: `c${this.nextCandidate++}`,
        sourceId,
        sourceRecordKey: candidate.sourceRecordKey,
        resolvedReleaseId: candidate.resolvedReleaseId,
        condition: candidate.condition,
        sellerFingerprint: candidate.sellerFingerprint,
        evidenceGroupKey: null,
        decision: candidate.decision,
        reasonCodes: [...candidate.reasonCodes],
        needsRevalidation: false,
        observationType: candidate.observationType,
        soldOn: candidate.soldOn,
      }
      this.candidates.set(key, row)
      return row
    }

    const releaseChanged = row.resolvedReleaseId !== candidate.resolvedReleaseId
    row.resolvedReleaseId = candidate.resolvedReleaseId
    row.condition = candidate.condition
    row.sellerFingerprint = candidate.sellerFingerprint
    row.decision = candidate.decision
    row.reasonCodes = [...candidate.reasonCodes]
    row.observationType = candidate.observationType
    row.soldOn = candidate.soldOn

    if (releaseChanged) {
      row.needsRevalidation = true
      const point = this.points.get(row.id)
      if (point) {
        point.releaseId = candidate.resolvedReleaseId
        point.needsRevalidation = true
        point.valuationEligible = false
      }
    }
    return row
  }

  async patchCandidate(candidateId, patch) {
    const row = [...this.candidates.values()].find((candidate) => candidate.id === candidateId)
    if (!row) throw new Error("candidate not found")
    if (patch.decision !== undefined) row.decision = patch.decision
    if (patch.reasonCodes !== undefined) row.reasonCodes = [...patch.reasonCodes]
    if (patch.evidenceGroupKey !== undefined) row.evidenceGroupKey = patch.evidenceGroupKey
    if (patch.needsRevalidation !== undefined) row.needsRevalidation = patch.needsRevalidation
    return row
  }

  async getCandidatePoint(candidateId) { return this.points.get(candidateId) ?? null }

  async listGroupingEvidence({ releaseId, condition, sourceId, sellerFingerprint }) {
    return [...this.points.values()].flatMap((point) => {
      const candidate = [...this.candidates.values()].find((row) => row.id === point.candidateId)
      if (
        !candidate ||
        candidate.sellerFingerprint !== sellerFingerprint ||
        point.releaseId !== releaseId ||
        point.condition !== condition ||
        point.sourceId !== sourceId ||
        point.status !== "active" ||
        point.needsRevalidation ||
        point.marketPriceEUR == null
      ) return []

      const isPendingOutlier = candidate.decision === "needs_review" && candidate.reasonCodes.includes("POSSIBLE_OUTLIER")
      if (!point.valuationEligible && !isPendingOutlier) return []
      return [{ ...point, sourceRecordKey: candidate.sourceRecordKey, sellerFingerprint }]
    })
  }

  async updateGroupingAssignment({ pointId, candidateId, evidenceGroupKey }) {
    const point = [...this.points.values()].find((row) => row.id === pointId)
    if (point) point.evidenceGroupKey = evidenceGroupKey
    const candidate = [...this.candidates.values()].find((row) => row.id === candidateId)
    if (candidate) candidate.evidenceGroupKey = evidenceGroupKey
  }

  async clearPointRevalidation(candidateId) {
    const point = this.points.get(candidateId)
    if (point) {
      point.needsRevalidation = false
      point.valuationEligible = false
    }
  }

  async disableCandidatePoint(candidateId) {
    const point = this.points.get(candidateId)
    if (point) point.valuationEligible = false
  }

  async upsertPricePoint({ candidateId, sourceId, point }) {
    let row = this.points.get(candidateId)
    if (!row) {
      row = {
        id: `p${this.nextPoint++}`,
        candidateId,
        sourceId,
        releaseId: point.releaseId,
        condition: point.condition,
        normalizedPriceEUR: point.normalizedPriceEUR,
        marketPriceEUR: point.marketPriceEUR,
        evidenceGrade: point.evidenceGrade,
        qualityFlags: [...point.qualityFlags],
        evidenceGroupKey: point.evidenceGroupKey,
        valuationEligible: point.valuationEligible,
        status: "active",
        needsRevalidation: point.needsRevalidation,
        soldOn: point.soldOn,
        soldAt: point.soldAt,
      }
      this.points.set(candidateId, row)
      return row
    }

    row.sourceId = sourceId
    row.releaseId = point.releaseId
    row.condition = point.condition
    row.normalizedPriceEUR = point.normalizedPriceEUR
    row.marketPriceEUR = point.marketPriceEUR
    row.evidenceGrade = point.evidenceGrade
    row.qualityFlags = [...point.qualityFlags]
    row.evidenceGroupKey = point.evidenceGroupKey
    row.valuationEligible = point.valuationEligible
    row.soldOn = point.soldOn
    row.soldAt = point.soldAt
    return row
  }

  async listValuationPoints(releaseId, condition) {
    return [...this.points.values()].flatMap((point) => {
      if (
        point.releaseId !== releaseId ||
        point.condition !== condition ||
        !point.valuationEligible ||
        point.status !== "active" ||
        point.needsRevalidation ||
        point.marketPriceEUR == null ||
        !point.evidenceGroupKey
      ) return []
      const candidate = [...this.candidates.values()].find((row) => row.id === point.candidateId)
      return [{
        stableId: `${point.sourceId}|${candidate.sourceRecordKey}`,
        sourceId: point.sourceId,
        soldOn: point.soldOn,
        soldAt: point.soldAt,
        normalizedPriceEUR: point.marketPriceEUR,
        evidenceGroupKey: point.evidenceGroupKey,
        evidenceGrade: point.evidenceGrade,
      }]
    })
  }

  async getEstimate(releaseId, condition) {
    return this.estimates.get(this.estimateKey(releaseId, condition)) ?? null
  }

  async upsertEstimate({ releaseId, condition, draft, previous, materiallyChanged }) {
    const now = "2026-09-09T10:00:00.000Z"
    this.estimates.set(this.estimateKey(releaseId, condition), {
      releaseId,
      condition,
      displayMode: draft.displayMode,
      value: draft.value,
      low: draft.low,
      high: draft.high,
      median: draft.median,
      rangeMethod: draft.rangeMethod,
      sampleSize: draft.sampleSize,
      independentEvidenceCount: draft.independentEvidenceCount,
      verifiedObservationCount: draft.verifiedObservationCount,
      indicativeObservationCount: draft.indicativeObservationCount,
      sourceCount: draft.sourceCount,
      qualityMix: draft.qualityMix,
      windowDays: draft.windowDays,
      lowestCurrentAsk: previous?.lowestCurrentAsk ?? null,
      lastVerifiedSale: draft.lastVerifiedSale,
      lastVerifiedSaleAt: draft.lastVerifiedSaleAt,
      lastVerifiedSaleOn: draft.lastVerifiedSaleOn,
      trendPercent: draft.trendPercent,
      trendWindowDays: draft.trendWindowDays,
      lastScannedAt: previous?.lastScannedAt ?? null,
      lastValuationChangeAt: materiallyChanged ? now : (previous?.lastValuationChangeAt ?? now),
      algorithmVersion: draft.algorithmVersion,
      computedAt: now,
    })
  }

  async deleteEstimate(releaseId, condition) {
    this.estimates.delete(this.estimateKey(releaseId, condition))
  }

  async recordHistorySnapshot() { return true }
}

function sale({
  key,
  releaseId = "r1",
  seller = "seller-1",
  soldOn,
  price,
  shippingBasis = "excluded",
  isComplete = true,
  condition = "new_complete_unbuilt",
  quantity = 1,
}) {
  return {
    sourceRecordKey: key,
    explicitReleaseId: releaseId,
    identityReviewed: true,
    matchEvidence: ["manual_override"],
    observationType: "sold_confirmed",
    price,
    currency: "EUR",
    shippingBasis,
    condition,
    isComplete,
    isLot: false,
    quantity,
    sellerFingerprint: seller,
    soldOn,
    observedAt: `${soldOn}T12:00:00.000Z`,
  }
}

async function test(name, fn) {
  try {
    await fn()
    console.log("ok:", name)
  } catch (error) {
    console.error("FAIL:", name)
    throw error
  }
}

await test("manual sale promotes and creates a tier-1 estimate", async () => {
  const store = new FakeMarketStore()
  const result = await ingestManualVerifiedSaleWithStore(
    sale({ key: "one", seller: "seller-1", soldOn: "2026-01-01", price: 50 }),
    store,
    new Date("2026-09-09T12:00:00Z"),
  )
  assert.equal(result.status, "promoted")
  const point = [...store.points.values()][0]
  const estimate = store.estimates.get("r1|new_complete_unbuilt")
  assert.equal(point.valuationEligible, true)
  assert.equal(point.evidenceGrade, "indicative")
  assert.equal(estimate.displayMode, "last_sale")
  assert.equal(estimate.qualityMix, "indicative_only")
})

await test("retrying the same source record is idempotent", async () => {
  const store = new FakeMarketStore()
  const observation = sale({ key: "same", seller: "seller-1", soldOn: "2026-01-01", price: 50 })
  const first = await ingestManualVerifiedSaleWithStore(observation, store, new Date("2026-09-09T12:00:00Z"))
  const second = await ingestManualVerifiedSaleWithStore(observation, store, new Date("2026-09-09T12:05:00Z"))
  assert.equal(first.candidateId, second.candidateId)
  assert.equal(first.pricePointId, second.pricePointId)
  assert.equal(store.candidates.size, 1)
  assert.equal(store.points.size, 1)
})

await test("reviewed Release correction completes DB-triggered revalidation", async () => {
  const store = new FakeMarketStore()
  await ingestManualVerifiedSaleWithStore(
    sale({ key: "correction", releaseId: "r1", seller: "seller-c", soldOn: "2026-02-01", price: 40 }),
    store,
    new Date("2026-09-09T12:00:00Z"),
  )
  const corrected = await ingestManualVerifiedSaleWithStore(
    sale({ key: "correction", releaseId: "r2", seller: "seller-c", soldOn: "2026-02-01", price: 40 }),
    store,
    new Date("2026-09-09T12:10:00Z"),
  )
  const candidate = [...store.candidates.values()][0]
  const point = [...store.points.values()][0]
  assert.equal(corrected.status, "promoted")
  assert.equal(candidate.resolvedReleaseId, "r2")
  assert.equal(candidate.needsRevalidation, false)
  assert.equal(point.releaseId, "r2")
  assert.equal(point.needsRevalidation, false)
  assert.equal(point.valuationEligible, true)
  assert.equal(store.estimates.has("r1|new_complete_unbuilt"), false)
  assert.equal(store.estimates.has("r2|new_complete_unbuilt"), true)
})

await test("outlier is compared with prior independent groups across different sellers", async () => {
  const store = new FakeMarketStore()
  const now = new Date("2026-09-09T12:00:00Z")
  for (const input of [
    { key: "a", seller: "seller-a", soldOn: "2026-01-01", price: 50 },
    { key: "b", seller: "seller-b", soldOn: "2026-01-10", price: 55 },
    { key: "c", seller: "seller-c", soldOn: "2026-01-20", price: 45 },
  ]) {
    const result = await ingestManualVerifiedSaleWithStore(sale(input), store, now)
    assert.equal(result.status, "promoted")
  }

  const outlier = await ingestManualVerifiedSaleWithStore(
    sale({ key: "extreme", seller: "seller-d", soldOn: "2026-02-01", price: 500 }),
    store,
    now,
  )
  const candidate = [...store.candidates.values()].find((row) => row.sourceRecordKey === "extreme")
  const point = store.points.get(candidate.id)
  assert.equal(outlier.status, "needs_review")
  assert.ok(candidate.reasonCodes.includes("POSSIBLE_OUTLIER"))
  assert.equal(point.valuationEligible, false)
  assert.equal(store.estimates.get("r1|new_complete_unbuilt").independentEvidenceCount, 3)
})

await test("unknown seller and unknown shipping still produce indicative market evidence", async () => {
  const store = new FakeMarketStore()
  const result = await ingestManualVerifiedSaleWithStore(
    sale({
      key: "broad-market",
      seller: null,
      soldOn: "2026-08-01",
      price: 72,
      shippingBasis: "unknown",
      isComplete: null,
    }),
    store,
    new Date("2026-09-09T12:00:00Z"),
  )
  const point = [...store.points.values()][0]
  const estimate = store.estimates.get("r1|new_complete_unbuilt")
  assert.equal(result.status, "promoted")
  assert.equal(point.marketPriceEUR, 72)
  assert.equal(point.evidenceGrade, "indicative")
  assert.ok(point.qualityFlags.includes("seller_unknown"))
  assert.ok(point.qualityFlags.includes("shipping_unknown"))
  assert.ok(point.qualityFlags.includes("completeness_unconfirmed"))
  assert.equal(point.valuationEligible, true)
  assert.equal(estimate.value, 72)
  assert.equal(estimate.indicativeObservationCount, 1)
})

await test("unknown-seller sales within seven days remain one conservative independent group", async () => {
  const store = new FakeMarketStore()
  const now = new Date("2026-09-09T12:00:00Z")
  for (const input of [
    { key: "u1", seller: null, soldOn: "2026-08-01", price: 50 },
    { key: "u2", seller: null, soldOn: "2026-08-06", price: 60 },
  ]) {
    const result = await ingestManualVerifiedSaleWithStore(sale(input), store, now)
    assert.equal(result.status, "promoted")
  }
  const estimate = store.estimates.get("r1|new_complete_unbuilt")
  assert.equal(estimate.sampleSize, 2)
  assert.equal(estimate.independentEvidenceCount, 1)
  assert.equal(estimate.value, 60)
})

console.log("MARKET RUNNER TEST PASSED")
