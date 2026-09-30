import { resolveMarketEurBasis, type HistoricalEurBasis } from "../../fx/ecb"
import {
  MATCH_EVIDENCE_CODES,
  type EvidenceGrade,
  type MarketCondition,
  type MarketQualityFlag,
  type MatchEvidence,
  type ShippingBasis,
} from "./types"

export type SoldSaleMechanism = "fixed_price" | "auction"

export interface SoldSourceAutomationPolicy {
  slug: string
  discovery: "manual_only" | "automated"
  approvedForAutomation: boolean
  runtimeVerified: boolean
  requiresLicense: boolean
  licenseReady: boolean
}

export const EBAY_PRODUCT_RESEARCH_SOLD_POLICY: SoldSourceAutomationPolicy = {
  slug: "ebay_product_research",
  discovery: "manual_only",
  approvedForAutomation: false,
  runtimeVerified: false,
  requiresLicense: true,
  licenseReady: false,
}

export function canAutomateSoldSource(policy: SoldSourceAutomationPolicy): boolean {
  return Boolean(
    policy.discovery === "automated" &&
      policy.approvedForAutomation &&
      policy.runtimeVerified &&
      (!policy.requiresLicense || policy.licenseReady),
  )
}

export interface SoldObservationInput {
  sourceSlug: string
  sourceRecordKey: string
  releaseId: string

  externalListingId?: string | null
  originalSource?: string | null
  originalRecordId?: string | null
  listingUrl?: string | null
  titleRaw?: string | null
  itemNumberObserved?: string | null

  exactReleaseMatch: boolean
  matchEvidence: MatchEvidence[]
  packagingVerified: boolean

  price: number
  currency: string
  shippingCost?: number | null
  shippingBasis?: ShippingBasis
  saleMechanism?: SoldSaleMechanism

  condition?: MarketCondition
  conditionRaw?: string | null
  isComplete?: boolean | null
  isLot?: boolean | null
  quantity?: number | null

  sellerFingerprint?: string | null
  soldOn: string
  observedAt?: string | null
  rawPayload?: unknown
}

export interface NormalizedSoldObservation {
  decision: "accepted" | "needs_review" | "rejected"
  reasonCodes: string[]
  observationType: "marketplace_sold" | "auction_awarded"
  condition: MarketCondition
  isComplete: boolean | null
  isLot: boolean
  quantity: number
  matchConfidence: "exact" | "ambiguous" | "rejected"
  matchEvidence: MatchEvidence[]
  evidenceGrade: EvidenceGrade
  qualityFlags: MarketQualityFlag[]
  valuationPrice: number | null
  normalizedPriceEUR: number | null
  marketPriceEUR: number | null
  marketPriceBasis: "shipping_adjusted" | "raw_sale" | null
  fxRateToEUR: number | null
  fxRateDate: string | null
}

export interface SoldIngestionCandidateDraft {
  sourceId: string
  sourceRecordKey: string
  externalListingId: string | null
  originalSource: string | null
  originalRecordId: string | null
  listingUrl: string | null
  titleRaw: string | null
  itemNumberObserved: string | null
  possibleReleaseIds: string[]
  resolvedReleaseId: string | null
  price: number
  currency: string
  shippingCost: number | null
  shippingBasis: ShippingBasis
  observationType: "marketplace_sold" | "auction_awarded"
  conditionRaw: string | null
  condition: MarketCondition
  innerBagsSealed: "unknown"
  boxCondition: "normal" | "unknown"
  isComplete: boolean | null
  isLot: boolean
  quantity: number
  matchConfidence: "exact" | "ambiguous" | "rejected"
  matchEvidence: MatchEvidence[]
  sellerFingerprint: string | null
  evidenceGroupKey: string | null
  soldOn: string
  observedAt: string
  decision: "accepted" | "needs_review" | "rejected" | "duplicate"
  reasonCodes: string[]
  needsRevalidation: boolean
  rawPayload: unknown
}

export interface SoldIngestionPointDraft {
  candidateId: string
  releaseId: string
  sourceId: string
  observationType: "marketplace_sold" | "auction_awarded"
  condition: MarketCondition
  price: number
  currency: string
  shippingCost: number | null
  shippingBasis: ShippingBasis
  valuationPrice: number | null
  normalizedPriceEUR: number | null
  evidenceGrade: EvidenceGrade
  qualityFlags: MarketQualityFlag[]
  marketPriceEUR: number
  marketPriceBasis: "shipping_adjusted" | "raw_sale"
  fxRateToEUR: number | null
  fxRateDate: string | null
  innerBagsSealed: "unknown"
  boxCondition: "normal" | "unknown"
  isComplete: boolean | null
  isLot: boolean
  quantity: number
  matchConfidence: "exact"
  matchEvidence: MatchEvidence[]
  evidenceGroupKey: string | null
  valuationEligible: true
  needsRevalidation: false
  soldOn: string
  observedAt: string
}

export interface SoldIngestionSourceRow {
  id: string
  slug: string
  isActive: boolean
  ingestionMode: string
}

export interface SoldIngestionCandidateRow {
  id: string
  decision: "accepted" | "needs_review" | "rejected" | "duplicate"
}

export interface SoldIngestionStore {
  getSourceBySlug(slug: string): Promise<SoldIngestionSourceRow | null>
  releaseExists(releaseId: string): Promise<boolean>
  findCandidate(sourceId: string, sourceRecordKey: string): Promise<SoldIngestionCandidateRow | null>
  findAcceptedOriginalDuplicate(input: {
    originalSource: string
    originalRecordId: string
    excludeCandidateId?: string | null
  }): Promise<{ id: string } | null>
  upsertCandidate(draft: SoldIngestionCandidateDraft): Promise<SoldIngestionCandidateRow>
  disablePricePoint(candidateId: string): Promise<void>
  upsertPricePoint(draft: SoldIngestionPointDraft): Promise<{ id: string }>
  enqueueRecompute(releaseId: string, condition: MarketCondition, dirtyAt: string): Promise<void>
}

export interface SoldIngestionResult {
  status: "promoted" | "needs_review" | "rejected" | "duplicate"
  candidateId: string
  pricePointId: string | null
  reasonCodes: string[]
  recomputeQueued: boolean
}

type FxResolver = (
  amount: number,
  currency: string,
  observationDate: string | null | undefined,
) => Promise<HistoricalEurBasis>

const EVIDENCE_CODES = new Set<string>(MATCH_EVIDENCE_CODES)

function uniq<T>(values: T[]): T[] {
  return [...new Set(values)]
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function validIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function canonicalEvidence(values: MatchEvidence[]): MatchEvidence[] {
  return uniq(values.filter((value) => EVIDENCE_CODES.has(value)))
}

export async function normalizeSoldObservation(
  input: SoldObservationInput,
  fxResolver: FxResolver = resolveMarketEurBasis,
): Promise<NormalizedSoldObservation> {
  const reasonCodes: string[] = []
  const condition = input.condition ?? "new_complete_unbuilt"
  const isLot = input.isLot === true
  const quantity = input.quantity ?? 1
  const isComplete = input.isComplete ?? (input.packagingVerified ? true : null)
  const matchEvidence = canonicalEvidence(input.matchEvidence)
  const saleMechanism = input.saleMechanism ?? "fixed_price"
  const observationType = saleMechanism === "auction" ? "auction_awarded" : "marketplace_sold"
  const shippingBasis = input.shippingBasis ?? "unknown"

  let decision: NormalizedSoldObservation["decision"] = "accepted"

  if (!input.exactReleaseMatch) {
    decision = "needs_review"
    reasonCodes.push("RELEASE_NOT_CONFIRMED")
  }
  if (!matchEvidence.length) {
    decision = "needs_review"
    reasonCodes.push("MATCH_EVIDENCE_REQUIRED")
  }
  if (!input.packagingVerified) {
    decision = "needs_review"
    reasonCodes.push("PACKAGING_UNVERIFIED")
  }
  if (!validIsoDate(input.soldOn)) {
    decision = "needs_review"
    reasonCodes.push("SOLD_DATE_INVALID")
  }
  if (!Number.isFinite(input.price) || input.price <= 0 || !input.currency.trim()) {
    decision = "rejected"
    reasonCodes.push("PRICE_AND_CURRENCY_REQUIRED")
  }
  if (isLot || quantity !== 1) {
    decision = "rejected"
    reasonCodes.push("MULTI_ITEM_NOT_COMPARABLE")
  }
  if (condition !== "new_complete_unbuilt") {
    decision = "rejected"
    reasonCodes.push("CONDITION_NOT_COMPARABLE")
  }
  if (isComplete === false) {
    decision = "rejected"
    reasonCodes.push("INCOMPLETE_NOT_COMPARABLE")
  }

  let valuationPrice: number | null = null
  let marketNativePrice = input.price
  let marketPriceBasis: NormalizedSoldObservation["marketPriceBasis"] = "raw_sale"

  if (shippingBasis === "excluded" || shippingBasis === "buyer_paid") {
    valuationPrice = round2(input.price)
    marketPriceBasis = "shipping_adjusted"
  } else if (shippingBasis === "included_exact") {
    if (
      input.shippingCost == null ||
      !Number.isFinite(input.shippingCost) ||
      input.shippingCost < 0 ||
      input.shippingCost > input.price
    ) {
      decision = "needs_review"
      reasonCodes.push("EXACT_SHIPPING_INVALID")
    } else {
      valuationPrice = round2(input.price - input.shippingCost)
      marketNativePrice = valuationPrice
      marketPriceBasis = "shipping_adjusted"
    }
  }

  const currency = input.currency.trim().toUpperCase()
  let marketPriceEUR: number | null = null
  let normalizedPriceEUR: number | null = null
  let fxRateToEUR: number | null = null
  let fxRateDate: string | null = null

  if (decision !== "rejected" && validIsoDate(input.soldOn) && input.price > 0 && currency) {
    const basis = await fxResolver(marketNativePrice, currency, input.soldOn)
    marketPriceEUR = basis.amountEUR
    fxRateToEUR = basis.fxRateToEUR
    fxRateDate = basis.fxRateDate

    if (valuationPrice != null) {
      if (currency === "EUR") {
        normalizedPriceEUR = round2(valuationPrice)
      } else if (basis.fxRateToEUR) {
        normalizedPriceEUR = round2(valuationPrice * basis.fxRateToEUR)
      }
    }

    if (marketPriceEUR == null || marketPriceEUR <= 0) {
      decision = "needs_review"
      reasonCodes.push("FX_PROVENANCE_REQUIRED")
    }
  }

  const qualityFlags: MarketQualityFlag[] = []
  if (["included_unknown", "unknown"].includes(shippingBasis)) qualityFlags.push("shipping_unknown")

  const evidenceGrade: EvidenceGrade = saleMechanism === "auction" ? "indicative" : "verified"
  if (saleMechanism === "auction") reasonCodes.push("AUCTION_LOWER_WEIGHT")

  return {
    decision,
    reasonCodes: uniq(reasonCodes),
    observationType,
    condition,
    isComplete,
    isLot,
    quantity,
    matchConfidence: decision === "accepted" ? "exact" : decision === "rejected" ? "rejected" : "ambiguous",
    matchEvidence,
    evidenceGrade,
    qualityFlags: uniq(qualityFlags),
    valuationPrice,
    normalizedPriceEUR,
    marketPriceEUR,
    marketPriceBasis,
    fxRateToEUR,
    fxRateDate,
  }
}

export async function ingestSoldObservationWithStore(
  input: SoldObservationInput,
  store: SoldIngestionStore,
  options: {
    mode: "manual" | "automated"
    sourcePolicy?: SoldSourceAutomationPolicy
    now?: Date
    fxResolver?: FxResolver
  },
): Promise<SoldIngestionResult> {
  if (!input.sourceSlug.trim()) throw new Error("SOLD_SOURCE_SLUG_REQUIRED")
  if (!input.sourceRecordKey.trim()) throw new Error("SOLD_SOURCE_RECORD_KEY_REQUIRED")
  if (!input.releaseId.trim()) throw new Error("SOLD_RELEASE_ID_REQUIRED")

  if (options.mode === "automated") {
    const policy = options.sourcePolicy
    if (!policy || policy.slug !== input.sourceSlug || !canAutomateSoldSource(policy)) {
      throw new Error(`SOLD_SOURCE_NOT_AUTOMATION_READY:${input.sourceSlug}`)
    }
  }

  const source = await store.getSourceBySlug(input.sourceSlug)
  if (!source) throw new Error(`SOLD_SOURCE_NOT_FOUND:${input.sourceSlug}`)
  if (!source.isActive) throw new Error(`SOLD_SOURCE_INACTIVE:${input.sourceSlug}`)
  if (!(await store.releaseExists(input.releaseId))) throw new Error(`SOLD_RELEASE_NOT_FOUND:${input.releaseId}`)

  const normalized = await normalizeSoldObservation(input, options.fxResolver)
  const observedAt = input.observedAt ?? (options.now ?? new Date()).toISOString()
  const previous = await store.findCandidate(source.id, input.sourceRecordKey)

  let decision: SoldIngestionCandidateDraft["decision"] = normalized.decision
  let reasonCodes = [...normalized.reasonCodes]

  if (
    decision === "accepted" &&
    input.originalSource &&
    input.originalRecordId
  ) {
    const duplicate = await store.findAcceptedOriginalDuplicate({
      originalSource: input.originalSource,
      originalRecordId: input.originalRecordId,
      excludeCandidateId: previous?.id ?? null,
    })
    if (duplicate) {
      decision = "duplicate"
      reasonCodes = uniq([...reasonCodes, "EXACT_ORIGINAL_RECORD_DUPLICATE"])
    }
  }

  const candidate = await store.upsertCandidate({
    sourceId: source.id,
    sourceRecordKey: input.sourceRecordKey,
    externalListingId: input.externalListingId ?? null,
    originalSource: input.originalSource ?? null,
    originalRecordId: input.originalRecordId ?? null,
    listingUrl: input.listingUrl ?? null,
    titleRaw: input.titleRaw ?? null,
    itemNumberObserved: input.itemNumberObserved ?? null,
    possibleReleaseIds: [input.releaseId],
    resolvedReleaseId: input.exactReleaseMatch ? input.releaseId : null,
    price: input.price,
    currency: input.currency.trim().toUpperCase(),
    shippingCost: input.shippingCost ?? null,
    shippingBasis: input.shippingBasis ?? "unknown",
    observationType: normalized.observationType,
    conditionRaw: input.conditionRaw ?? null,
    condition: normalized.condition,
    innerBagsSealed: "unknown",
    boxCondition: input.packagingVerified ? "normal" : "unknown",
    isComplete: normalized.isComplete,
    isLot: normalized.isLot,
    quantity: normalized.quantity,
    matchConfidence: normalized.matchConfidence,
    matchEvidence: normalized.matchEvidence,
    sellerFingerprint: input.sellerFingerprint ?? null,
    evidenceGroupKey: null,
    soldOn: input.soldOn,
    observedAt,
    decision,
    reasonCodes,
    needsRevalidation: false,
    rawPayload: input.rawPayload ?? null,
  })

  if (decision !== "accepted" || normalized.marketPriceEUR == null || normalized.marketPriceBasis == null) {
    await store.disablePricePoint(candidate.id)
    return {
      status: decision === "duplicate"
        ? "duplicate"
        : decision === "rejected"
          ? "rejected"
          : "needs_review",
      candidateId: candidate.id,
      pricePointId: null,
      reasonCodes,
      recomputeQueued: false,
    }
  }

  const point = await store.upsertPricePoint({
    candidateId: candidate.id,
    releaseId: input.releaseId,
    sourceId: source.id,
    observationType: normalized.observationType,
    condition: normalized.condition,
    price: input.price,
    currency: input.currency.trim().toUpperCase(),
    shippingCost: input.shippingCost ?? null,
    shippingBasis: input.shippingBasis ?? "unknown",
    valuationPrice: normalized.valuationPrice,
    normalizedPriceEUR: normalized.normalizedPriceEUR,
    evidenceGrade: normalized.evidenceGrade,
    qualityFlags: normalized.qualityFlags,
    marketPriceEUR: normalized.marketPriceEUR,
    marketPriceBasis: normalized.marketPriceBasis,
    fxRateToEUR: normalized.fxRateToEUR,
    fxRateDate: normalized.fxRateDate,
    innerBagsSealed: "unknown",
    boxCondition: input.packagingVerified ? "normal" : "unknown",
    isComplete: normalized.isComplete,
    isLot: normalized.isLot,
    quantity: normalized.quantity,
    matchConfidence: "exact",
    matchEvidence: normalized.matchEvidence,
    evidenceGroupKey: null,
    valuationEligible: true,
    needsRevalidation: false,
    soldOn: input.soldOn,
    observedAt,
  })

  await store.enqueueRecompute(input.releaseId, normalized.condition, observedAt)

  return {
    status: "promoted",
    candidateId: candidate.id,
    pricePointId: point.id,
    reasonCodes,
    recomputeQueued: true,
  }
}

export interface SoldResearchAdapter {
  sourcePolicy: SoldSourceAutomationPolicy
  scan(target: { releaseId: string }): Promise<Omit<SoldObservationInput, "sourceSlug">[]>
}

export async function runSoldResearchAdapterWithStore(
  adapter: SoldResearchAdapter,
  target: { releaseId: string },
  store: SoldIngestionStore,
  options: {
    now?: Date
    fxResolver?: FxResolver
  } = {},
): Promise<{
  scanned: number
  promoted: number
  needsReview: number
  rejected: number
  duplicates: number
}> {
  if (!canAutomateSoldSource(adapter.sourcePolicy)) {
    throw new Error(`SOLD_SOURCE_NOT_AUTOMATION_READY:${adapter.sourcePolicy.slug}`)
  }

  const observations = await adapter.scan(target)
  const summary = { scanned: observations.length, promoted: 0, needsReview: 0, rejected: 0, duplicates: 0 }

  for (const observation of observations) {
    if (observation.releaseId !== target.releaseId) {
      throw new Error("SOLD_ADAPTER_RELEASE_SCOPE_MISMATCH")
    }

    const result = await ingestSoldObservationWithStore(
      { ...observation, sourceSlug: adapter.sourcePolicy.slug },
      store,
      {
        mode: "automated",
        sourcePolicy: adapter.sourcePolicy,
        now: options.now,
        fxResolver: options.fxResolver,
      },
    )

    if (result.status === "promoted") summary.promoted += 1
    if (result.status === "needs_review") summary.needsReview += 1
    if (result.status === "rejected") summary.rejected += 1
    if (result.status === "duplicate") summary.duplicates += 1
  }

  return summary
}
