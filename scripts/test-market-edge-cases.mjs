import { register } from "node:module"
register("./ts-extension-loader.mjs", import.meta.url)

import assert from "node:assert/strict"

const { ingestManualVerifiedSaleWithStore } = await import("../lib/market/pipeline/orchestrator.ts")
const { computeMarketEstimate } = await import("../lib/market/pipeline/valuation.ts")

async function test(name, fn) {
  try {
    await fn()
    console.log("ok:", name)
  } catch (error) {
    console.error("FAIL:", name)
    throw error
  }
}

await test("valuation windows use evidence-group anchor date", async () => {
  const estimate = computeMarketEstimate(
    [
      {
        stableId: "source|old-anchor",
        soldOn: "2024-09-08",
        soldAt: null,
        normalizedPriceEUR: 50,
        evidenceGroupKey: "group-straddling-cutoff",
      },
      {
        stableId: "source|later-point",
        soldOn: "2024-09-10",
        soldAt: null,
        normalizedPriceEUR: 60,
        evidenceGroupKey: "group-straddling-cutoff",
      },
    ],
    "2026-09-09",
  )

  // The group anchor is outside even the maximum 730-day window. The later
  // point must not make the same independent group appear inside by itself.
  assert.equal(estimate, null)
})

const catalog = [
  {
    id: "r1",
    itemNumber: "18014",
    editionName: "Avante Jr.",
    releaseYear: 1988,
    releaseType: "Original",
    editionType: "original",
    chassis: "Type 2",
    color: "Blue",
  },
]

class StickyOutlierStore {
  constructor() {
    this.source = { id: "source-manual" }
    this.candidate = {
      id: "candidate-1",
      sourceId: this.source.id,
      sourceRecordKey: "sticky-outlier",
      resolvedReleaseId: "r1",
      condition: "new_complete_unbuilt",
      sellerFingerprint: "seller-outlier",
      evidenceGroupKey: "existing-outlier-group",
      decision: "needs_review",
      reasonCodes: ["POSSIBLE_OUTLIER"],
      needsRevalidation: false,
      observationType: "sold_confirmed",
      soldOn: "2026-02-01",
    }
    this.point = {
      id: "point-1",
      candidateId: this.candidate.id,
      releaseId: "r1",
      sourceId: this.source.id,
      condition: "new_complete_unbuilt",
      normalizedPriceEUR: 500,
      evidenceGroupKey: "existing-outlier-group",
      valuationEligible: false,
      status: "active",
      needsRevalidation: false,
      soldOn: "2026-02-01",
      soldAt: null,
    }
    this.disableCalls = 0
  }

  cloneCandidate() {
    return { ...this.candidate, reasonCodes: [...this.candidate.reasonCodes] }
  }

  async listCatalogReleases() { return catalog }
  async ensureSource() { return this.source }
  async findCandidate() { return this.cloneCandidate() }
  async findExactAcceptedDuplicate() { return null }

  async upsertCandidate({ candidate }) {
    // Simulate the normal UPSERT overwriting current classification fields.
    this.candidate = {
      ...this.candidate,
      resolvedReleaseId: candidate.resolvedReleaseId,
      condition: candidate.condition,
      sellerFingerprint: candidate.sellerFingerprint,
      decision: candidate.decision,
      reasonCodes: [...candidate.reasonCodes],
      observationType: candidate.observationType,
      soldOn: candidate.soldOn,
    }
    return this.cloneCandidate()
  }

  async patchCandidate(_candidateId, patch) {
    if (patch.decision !== undefined) this.candidate.decision = patch.decision
    if (patch.reasonCodes !== undefined) this.candidate.reasonCodes = [...patch.reasonCodes]
    if (patch.evidenceGroupKey !== undefined) this.candidate.evidenceGroupKey = patch.evidenceGroupKey
    if (patch.needsRevalidation !== undefined) this.candidate.needsRevalidation = patch.needsRevalidation
    return this.cloneCandidate()
  }

  async getCandidatePoint() { return { ...this.point } }
  async disableCandidatePoint() {
    this.point.valuationEligible = false
    this.disableCalls += 1
  }

  async listGroupingEvidence() { return [] }
  async updateGroupingAssignment() {}
  async clearPointRevalidation() {}
  async upsertPricePoint() { throw new Error("sticky outlier retry must not be re-promoted") }
  async listValuationPoints() { return [] }
  async getEstimate() { return null }
  async upsertEstimate() { throw new Error("no estimate should be created without eligible evidence") }
  async deleteEstimate() {}
  async recordHistorySnapshot() { return false }
}

await test("POSSIBLE_OUTLIER review survives an ordinary retry", async () => {
  const store = new StickyOutlierStore()
  const observation = {
    sourceRecordKey: "sticky-outlier",
    explicitReleaseId: "r1",
    identityReviewed: true,
    matchEvidence: ["manual_override"],
    observationType: "sold_confirmed",
    price: 500,
    currency: "EUR",
    shippingBasis: "excluded",
    condition: "new_complete_unbuilt",
    isComplete: true,
    isLot: false,
    quantity: 1,
    sellerFingerprint: "seller-outlier",
    soldOn: "2026-02-01",
    observedAt: "2026-09-09T12:00:00.000Z",
  }

  const result = await ingestManualVerifiedSaleWithStore(
    observation,
    store,
    new Date("2026-09-09T12:05:00Z"),
  )

  assert.equal(result.status, "needs_review")
  assert.ok(result.reasonCodes.includes("POSSIBLE_OUTLIER"))
  assert.equal(store.candidate.decision, "needs_review")
  assert.ok(store.candidate.reasonCodes.includes("POSSIBLE_OUTLIER"))
  assert.equal(store.point.valuationEligible, false)
  assert.equal(store.disableCalls, 1)
})

console.log("MARKET EDGE-CASE TEST PASSED")