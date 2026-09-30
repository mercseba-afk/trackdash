import { register } from "node:module"
register("./ts-extension-loader.mjs", import.meta.url)

import assert from "node:assert/strict"

const {
  EBAY_PRODUCT_RESEARCH_SOLD_POLICY,
  canAutomateSoldSource,
  ingestSoldObservationWithStore,
  normalizeSoldObservation,
  runSoldResearchAdapterWithStore,
} = await import("../lib/market/pipeline/sold-ingestion.ts")

const fxResolver = async (amount, currency, soldOn) => {
  if (currency === "EUR") {
    return {
      amountEUR: Math.round(amount * 100) / 100,
      fxRateToEUR: null,
      fxRateDate: null,
      fxSource: null,
    }
  }
  return {
    amountEUR: Math.round(amount * 0.8 * 100) / 100,
    fxRateToEUR: 0.8,
    fxRateDate: soldOn,
    fxSource: "ecb_reference",
  }
}

class FakeSoldStore {
  constructor() {
    this.sources = new Map([
      ["ebay_product_research", {
        id: "src-ebay",
        slug: "ebay_product_research",
        isActive: true,
        ingestionMode: "manual",
      }],
      ["licensed_fixture", {
        id: "src-licensed",
        slug: "licensed_fixture",
        isActive: true,
        ingestionMode: "licensed_feed",
      }],
    ])
    this.releases = new Set(["r1", "r2"])
    this.candidates = new Map()
    this.points = new Map()
    this.recompute = []
    this.nextCandidate = 1
    this.nextPoint = 1
  }

  key(sourceId, sourceRecordKey) {
    return `${sourceId}|${sourceRecordKey}`
  }

  async getSourceBySlug(slug) {
    return this.sources.get(slug) ?? null
  }

  async releaseExists(releaseId) {
    return this.releases.has(releaseId)
  }

  async findCandidate(sourceId, sourceRecordKey) {
    return this.candidates.get(this.key(sourceId, sourceRecordKey)) ?? null
  }

  async findAcceptedOriginalDuplicate({ originalSource, originalRecordId, excludeCandidateId }) {
    for (const row of this.candidates.values()) {
      if (
        row.id !== excludeCandidateId &&
        row.decision === "accepted" &&
        row.originalSource === originalSource &&
        row.originalRecordId === originalRecordId
      ) {
        return { id: row.id }
      }
    }
    return null
  }

  async upsertCandidate(draft) {
    const key = this.key(draft.sourceId, draft.sourceRecordKey)
    let row = this.candidates.get(key)
    if (!row) {
      row = {
        id: `c${this.nextCandidate++}`,
        ...draft,
        needsRevalidation: false,
      }
      this.candidates.set(key, row)
    } else {
      const releaseChanged = row.resolvedReleaseId !== draft.resolvedReleaseId
      Object.assign(row, draft)
      if (releaseChanged) row.needsRevalidation = true
    }
    return {
      id: row.id,
      decision: row.decision,
      resolvedReleaseId: row.resolvedReleaseId,
      needsRevalidation: row.needsRevalidation,
    }
  }

  async markCandidateNeedsReview(candidateId, reasonCodes) {
    const row = [...this.candidates.values()].find((candidate) => candidate.id === candidateId)
    if (!row) throw new Error("candidate not found")
    row.decision = "needs_review"
    row.reasonCodes = [...reasonCodes]
  }

  async disablePricePoint(candidateId) {
    const point = this.points.get(candidateId)
    if (point) point.valuationEligible = false
  }

  async upsertPricePoint(draft) {
    let row = this.points.get(draft.candidateId)
    if (!row) {
      row = { id: `p${this.nextPoint++}`, ...draft }
      this.points.set(draft.candidateId, row)
    } else {
      Object.assign(row, draft)
    }
    return { id: row.id }
  }

  async enqueueRecompute(releaseId, condition, dirtyAt) {
    this.recompute.push({ releaseId, condition, dirtyAt })
  }
}

function fixedSale(overrides = {}) {
  return {
    sourceSlug: "ebay_product_research",
    sourceRecordKey: "event-1",
    releaseId: "r1",
    originalSource: "EBAY_US",
    originalRecordId: "123",
    listingUrl: "https://example.invalid/123",
    titleRaw: "Hot Wheels HCJ81 example",
    itemNumberObserved: "HCJ81",
    exactReleaseMatch: true,
    matchEvidence: ["item_number_exact", "edition_name_exact"],
    soldStateVerified: true,
    packagingVerified: true,
    price: 25,
    currency: "USD",
    shippingCost: null,
    shippingBasis: "unknown",
    saleMechanism: "fixed_price",
    condition: "new_complete_unbuilt",
    isComplete: true,
    isLot: false,
    quantity: 1,
    sellerFingerprint: "ebay:seller-a",
    soldOn: "2026-09-01",
    observedAt: "2026-09-30T12:00:00.000Z",
    ...overrides,
  }
}

let passed = 0
async function test(name, fn) {
  await fn()
  passed += 1
  console.log(`ok: ${name}`)
}

await test("eBay Product Research remains manual-only for SOLD automation", async () => {
  assert.equal(canAutomateSoldSource(EBAY_PRODUCT_RESEARCH_SOLD_POLICY), false)

  const store = new FakeSoldStore()
  await assert.rejects(
    () => ingestSoldObservationWithStore(
      fixedSale(),
      store,
      {
        mode: "automated",
        sourcePolicy: EBAY_PRODUCT_RESEARCH_SOLD_POLICY,
        fxResolver,
      },
    ),
    /SOLD_SOURCE_NOT_AUTOMATION_READY:ebay_product_research/,
  )
})

await test("fixed-price exact SOLD is normalized, persisted and queues recompute", async () => {
  const store = new FakeSoldStore()
  const result = await ingestSoldObservationWithStore(
    fixedSale(),
    store,
    { mode: "manual", fxResolver },
  )

  assert.equal(result.status, "promoted")
  assert.equal(result.recomputeQueued, true)
  assert.equal(store.points.size, 1)
  assert.equal(store.recompute.length, 1)

  const point = [...store.points.values()][0]
  assert.equal(point.marketPriceEUR, 20)
  assert.equal(point.evidenceGrade, "verified")
  assert.deepEqual(point.qualityFlags, ["shipping_unknown"])
  assert.equal(point.marketPriceBasis, "raw_sale")
  assert.equal(point.fxRateToEUR, 0.8)
  assert.equal(point.valuationEligible, true)
})

await test("same source record is idempotent", async () => {
  const store = new FakeSoldStore()
  const first = await ingestSoldObservationWithStore(
    fixedSale(),
    store,
    { mode: "manual", fxResolver },
  )
  const second = await ingestSoldObservationWithStore(
    fixedSale(),
    store,
    { mode: "manual", fxResolver },
  )

  assert.equal(first.candidateId, second.candidateId)
  assert.equal(first.pricePointId, second.pricePointId)
  assert.equal(store.candidates.size, 1)
  assert.equal(store.points.size, 1)
})

await test("release correction is quarantined for DB-style revalidation", async () => {
  const store = new FakeSoldStore()
  await ingestSoldObservationWithStore(
    fixedSale(),
    store,
    { mode: "manual", fxResolver },
  )

  const corrected = await ingestSoldObservationWithStore(
    fixedSale({
      releaseId: "r2",
      exactReleaseMatch: true,
      originalRecordId: "123",
    }),
    store,
    { mode: "manual", fxResolver },
  )

  assert.equal(corrected.status, "needs_review")
  assert.equal(corrected.recomputeQueued, false)
  assert.equal(corrected.reasonCodes.includes("REVALIDATION_REQUIRED"), true)
  const candidate = [...store.candidates.values()][0]
  assert.equal(candidate.needsRevalidation, true)
  assert.equal(candidate.decision, "needs_review")
  const point = [...store.points.values()][0]
  assert.equal(point.valuationEligible, false)
})

await test("unverified SOLD state routes to review without a price point", async () => {
  const store = new FakeSoldStore()
  const result = await ingestSoldObservationWithStore(
    fixedSale({ sourceRecordKey: "sold-state-review", soldStateVerified: false }),
    store,
    { mode: "manual", fxResolver },
  )

  assert.equal(result.status, "needs_review")
  assert.equal(result.recomputeQueued, false)
  assert.equal(store.points.size, 0)
  const candidate = [...store.candidates.values()][0]
  assert.equal(candidate.reasonCodes.includes("SOLD_STATE_NOT_VERIFIED"), true)
})

await test("ambiguous packaging routes to review without a price point", async () => {
  const store = new FakeSoldStore()
  const result = await ingestSoldObservationWithStore(
    fixedSale({ sourceRecordKey: "review-1", packagingVerified: false }),
    store,
    { mode: "manual", fxResolver },
  )

  assert.equal(result.status, "needs_review")
  assert.equal(result.recomputeQueued, false)
  assert.equal(store.points.size, 0)
  const candidate = [...store.candidates.values()][0]
  assert.equal(candidate.decision, "needs_review")
  assert.equal(candidate.reasonCodes.includes("PACKAGING_UNVERIFIED"), true)
})

await test("auction SOLD remains eligible but lower-grade", async () => {
  const store = new FakeSoldStore()
  const result = await ingestSoldObservationWithStore(
    fixedSale({
      sourceRecordKey: "auction-1",
      saleMechanism: "auction",
      originalRecordId: "auction-1",
    }),
    store,
    { mode: "manual", fxResolver },
  )

  assert.equal(result.status, "promoted")
  const point = [...store.points.values()][0]
  assert.equal(point.observationType, "auction_awarded")
  assert.equal(point.evidenceGrade, "indicative")

  const candidate = [...store.candidates.values()][0]
  assert.equal(candidate.reasonCodes.includes("AUCTION_LOWER_WEIGHT"), true)
})

await test("same original event across sources is deduplicated", async () => {
  const store = new FakeSoldStore()
  await ingestSoldObservationWithStore(
    fixedSale(),
    store,
    { mode: "manual", fxResolver },
  )

  const duplicate = await ingestSoldObservationWithStore(
    fixedSale({
      sourceSlug: "licensed_fixture",
      sourceRecordKey: "provider-copy",
      originalSource: "EBAY_US",
      originalRecordId: "123",
    }),
    store,
    { mode: "manual", fxResolver },
  )

  assert.equal(duplicate.status, "duplicate")
  assert.equal(duplicate.recomputeQueued, false)
  assert.equal(store.points.size, 1)
})

await test("manual DB source cannot be promoted by a forged READY automation policy", async () => {
  const store = new FakeSoldStore()
  const forgedPolicy = {
    slug: "ebay_product_research",
    discovery: "automated",
    approvedForAutomation: true,
    runtimeVerified: true,
    requiresLicense: false,
    licenseReady: true,
  }

  await assert.rejects(
    () => ingestSoldObservationWithStore(
      fixedSale(),
      store,
      {
        mode: "automated",
        sourcePolicy: forgedPolicy,
        fxResolver,
      },
    ),
    /SOLD_SOURCE_INGESTION_MODE_NOT_AUTOMATED:ebay_product_research/,
  )
})

await test("READY licensed adapter can run the automated path", async () => {
  const store = new FakeSoldStore()
  const policy = {
    slug: "licensed_fixture",
    discovery: "automated",
    approvedForAutomation: true,
    runtimeVerified: true,
    requiresLicense: true,
    licenseReady: true,
  }

  const adapter = {
    sourcePolicy: policy,
    async scan({ releaseId }) {
      return [fixedSale({
        sourceSlug: undefined,
        sourceRecordKey: "licensed-event-1",
        releaseId,
        originalSource: "LICENSED_PROVIDER",
        originalRecordId: "licensed-event-1",
        currency: "EUR",
        price: 18,
      })]
        .map(({ sourceSlug: _sourceSlug, ...row }) => row)
    },
  }

  const summary = await runSoldResearchAdapterWithStore(
    adapter,
    { releaseId: "r1" },
    store,
    { fxResolver },
  )

  assert.deepEqual(summary, {
    scanned: 1,
    promoted: 1,
    needsReview: 0,
    rejected: 0,
    duplicates: 0,
  })
  assert.equal(store.points.size, 1)
  assert.equal(store.recompute.length, 1)
})

await test("missing seller downgrades fixed-price SOLD evidence to indicative", async () => {
  const normalized = await normalizeSoldObservation(
    fixedSale({
      sourceRecordKey: "seller-unknown",
      sellerFingerprint: null,
      currency: "EUR",
      price: 20,
    }),
    fxResolver,
  )

  assert.equal(normalized.decision, "accepted")
  assert.equal(normalized.evidenceGrade, "indicative")
  assert.equal(normalized.qualityFlags.includes("seller_unknown"), true)
})

await test("normalizer rejects multi-item lots fail-closed", async () => {
  const normalized = await normalizeSoldObservation(
    fixedSale({
      sourceRecordKey: "lot-1",
      isLot: true,
      quantity: 3,
      currency: "EUR",
      price: 45,
    }),
    fxResolver,
  )

  assert.equal(normalized.decision, "rejected")
  assert.equal(normalized.reasonCodes.includes("MULTI_ITEM_NOT_COMPARABLE"), true)
})

console.log(`${passed} passed, 0 failed`)
console.log("MARKET SOLD INGESTION TEST PASSED")
