import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { createAdminClient } from "@/lib/supabase/admin"
import type {
  CatalogReleaseIdentity,
  ClassifiedCandidate,
  EvidenceGrade,
  EvidenceQualityMix,
  MarketCondition,
  MarketEstimateDraft,
  MarketQualityFlag,
  MonthlySourceStatDraft,
  PricePointDraft,
} from "./types"

export interface MarketSourceConfig {
  slug: string
  name: string
  sourceType: string
  origin: "external_market" | "trackdash_marketplace" | "trackdash_transaction" | "reference"
  ingestionMode: "api" | "licensed_feed" | "manual" | "internal" | "disabled"
  isActive: boolean
}

export interface StoredCandidate {
  id: string
  sourceId: string
  sourceRecordKey: string
  resolvedReleaseId: string | null
  condition: MarketCondition
  sellerFingerprint: string | null
  evidenceGroupKey: string | null
  decision: "accepted" | "needs_review" | "rejected" | "duplicate"
  reasonCodes: string[]
  needsRevalidation: boolean
  observationType: string
  soldOn: string | null
}

export interface StoredPricePoint {
  id: string
  candidateId: string
  releaseId: string
  sourceId: string
  condition: MarketCondition
  normalizedPriceEUR: number | null
  marketPriceEUR: number | null
  evidenceGrade: EvidenceGrade
  qualityFlags: MarketQualityFlag[]
  evidenceGroupKey: string | null
  valuationEligible: boolean
  status: "active" | "excluded" | "reversed"
  needsRevalidation: boolean
  soldOn: string
  soldAt: string | null
}

export interface GroupingEvidenceRow extends StoredPricePoint {
  sourceRecordKey: string
  sellerFingerprint: string | null
}

export interface StoredEstimate {
  releaseId: string
  condition: MarketCondition
  displayMode: "last_sale" | "range" | "value"
  value: number | null
  low: number | null
  high: number | null
  median: number | null
  rangeMethod: "cleaned_min_max" | "q1_q3" | null
  sampleSize: number
  independentEvidenceCount: number
  verifiedObservationCount: number
  indicativeObservationCount: number
  sourceCount: number
  qualityMix: EvidenceQualityMix
  windowDays: 365 | 730
  lowestCurrentAsk: number | null
  lastVerifiedSale: number | null
  lastVerifiedSaleAt: string | null
  lastVerifiedSaleOn: string | null
  trendPercent: number | null
  trendWindowDays: 90 | 365 | null
  lastScannedAt: string | null
  lastValuationChangeAt: string | null
  algorithmVersion: string
  computedAt: string
}

export interface ValuationPointRow {
  stableId: string
  sourceId: string
  soldOn: string
  soldAt: string | null
  normalizedPriceEUR: number
  evidenceGroupKey: string
  evidenceGrade: EvidenceGrade
}

function n(value: unknown): number | null {
  if (value == null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function fail(error: { message?: string } | null, context: string): void {
  if (error) throw new Error(`${context}: ${error.message ?? "unknown Supabase error"}`)
}

function mapCandidate(row: any): StoredCandidate {
  return {
    id: row.id,
    sourceId: row.source_id,
    sourceRecordKey: row.source_record_key,
    resolvedReleaseId: row.resolved_release_id,
    condition: row.condition,
    sellerFingerprint: row.seller_fingerprint,
    evidenceGroupKey: row.evidence_group_key,
    decision: row.decision,
    reasonCodes: row.reason_codes ?? [],
    needsRevalidation: row.needs_revalidation,
    observationType: row.observation_type,
    soldOn: row.sold_on,
  }
}

function mapPoint(row: any): StoredPricePoint {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    releaseId: row.release_id,
    sourceId: row.source_id,
    condition: row.condition,
    normalizedPriceEUR: n(row.normalized_price_eur),
    marketPriceEUR: n(row.market_price_eur),
    evidenceGrade: row.evidence_grade ?? "indicative",
    qualityFlags: row.quality_flags ?? [],
    evidenceGroupKey: row.evidence_group_key,
    valuationEligible: row.valuation_eligible,
    status: row.status,
    needsRevalidation: row.needs_revalidation,
    soldOn: row.sold_on,
    soldAt: row.sold_at,
  }
}

export class MarketPipelineRepository {
  constructor(private readonly client: SupabaseClient = createAdminClient()) {}

  async listCatalogReleases(): Promise<CatalogReleaseIdentity[]> {
    const { data, error } = await this.client
      .from("product_releases")
      .select("id,item_number,edition_name,release_year,release_type,edition_type,chassis,color")
      .order("id")
    fail(error, "load catalog releases")

    return (data ?? []).map((row: any) => ({
      id: row.id,
      itemNumber: row.item_number,
      editionName: row.edition_name,
      releaseYear: row.release_year,
      releaseType: row.release_type,
      editionType: row.edition_type,
      chassis: row.chassis,
      color: row.color,
    }))
  }

  async ensureSource(config: MarketSourceConfig): Promise<{ id: string }> {
    const { data, error } = await this.client
      .from("price_sources")
      .upsert(
        {
          slug: config.slug,
          name: config.name,
          source_type: config.sourceType,
          origin: config.origin,
          ingestion_mode: config.ingestionMode,
          is_active: config.isActive,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single()
    fail(error, "ensure market source")
    return { id: data!.id }
  }

  async findCandidate(sourceId: string, sourceRecordKey: string): Promise<StoredCandidate | null> {
    const { data, error } = await this.client
      .from("market_candidates")
      .select("id,source_id,source_record_key,resolved_release_id,condition,seller_fingerprint,evidence_group_key,decision,reason_codes,needs_revalidation,observation_type,sold_on")
      .eq("source_id", sourceId)
      .eq("source_record_key", sourceRecordKey)
      .maybeSingle()
    fail(error, "find candidate")
    return data ? mapCandidate(data) : null
  }

  async findExactAcceptedDuplicate(input: {
    sourceId: string
    originalSource: string
    originalRecordId: string
    excludeCandidateId?: string | null
  }): Promise<StoredCandidate | null> {
    let query = this.client
      .from("market_candidates")
      .select("id,source_id,source_record_key,resolved_release_id,condition,seller_fingerprint,evidence_group_key,decision,reason_codes,needs_revalidation,observation_type,sold_on")
      .eq("original_source", input.originalSource)
      .eq("original_record_id", input.originalRecordId)
      .limit(1)

    if (input.excludeCandidateId) query = query.neq("id", input.excludeCandidateId)

    const { data, error } = await query.maybeSingle()
    fail(error, "find exact original-event duplicate")
    return data ? mapCandidate(data) : null
  }

  async upsertCandidate(input: {
    sourceId: string
    candidate: ClassifiedCandidate
    stateHash: string
  }): Promise<StoredCandidate> {
    const now = new Date().toISOString()
    const c = input.candidate
    const payload = {
      source_id: input.sourceId,
      source_record_key: c.sourceRecordKey,
      external_listing_id: c.externalListingId,
      original_source: c.originalSource,
      original_record_id: c.originalRecordId,
      listing_url: c.listingUrl,
      title_raw: c.titleRaw,
      item_number_observed: c.itemNumberObserved,
      possible_release_ids: c.possibleReleaseIds,
      resolved_release_id: c.resolvedReleaseId,
      price: c.price,
      currency: c.currency,
      shipping_cost: c.shippingCost,
      shipping_basis: c.shippingBasis,
      observation_type: c.observationType,
      condition_raw: c.conditionRaw,
      condition: c.condition,
      inner_bags_sealed: c.innerBagsSealed,
      box_condition: c.boxCondition,
      is_complete: c.isComplete,
      is_lot: c.isLot,
      quantity: c.quantity,
      match_confidence: c.matchConfidence,
      match_evidence: c.matchEvidence,
      seller_fingerprint: c.sellerFingerprint,
      sold_at: c.soldAt,
      sold_on: c.soldOn,
      listing_date: c.listingDate,
      observed_at: c.observedAt,
      decision: c.decision,
      reason_codes: c.reasonCodes,
      state_hash: input.stateHash,
      raw_payload: c.rawPayload,
      last_observed_at: c.observedAt,
      updated_at: now,
    }

    const { data, error } = await this.client
      .from("market_candidates")
      .upsert(payload, { onConflict: "source_id,source_record_key" })
      .select("id,source_id,source_record_key,resolved_release_id,condition,seller_fingerprint,evidence_group_key,decision,reason_codes,needs_revalidation,observation_type,sold_on")
      .single()
    fail(error, "upsert market candidate")
    return mapCandidate(data)
  }

  async patchCandidate(
    candidateId: string,
    patch: {
      decision?: StoredCandidate["decision"]
      reasonCodes?: string[]
      evidenceGroupKey?: string | null
      needsRevalidation?: boolean
    },
  ): Promise<StoredCandidate> {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (patch.decision !== undefined) payload.decision = patch.decision
    if (patch.reasonCodes !== undefined) payload.reason_codes = patch.reasonCodes
    if (patch.evidenceGroupKey !== undefined) payload.evidence_group_key = patch.evidenceGroupKey
    if (patch.needsRevalidation !== undefined) payload.needs_revalidation = patch.needsRevalidation

    const { data, error } = await this.client
      .from("market_candidates")
      .update(payload)
      .eq("id", candidateId)
      .select("id,source_id,source_record_key,resolved_release_id,condition,seller_fingerprint,evidence_group_key,decision,reason_codes,needs_revalidation,observation_type,sold_on")
      .single()
    fail(error, "patch market candidate")
    return mapCandidate(data)
  }

  async getCandidatePoint(candidateId: string): Promise<StoredPricePoint | null> {
    const { data, error } = await this.client
      .from("price_points")
      .select("id,candidate_id,release_id,source_id,condition,normalized_price_eur,market_price_eur,evidence_grade,quality_flags,evidence_group_key,valuation_eligible,status,needs_revalidation,sold_on,sold_at")
      .eq("candidate_id", candidateId)
      .maybeSingle()
    fail(error, "load candidate price point")
    return data ? mapPoint(data) : null
  }

  async listGroupingEvidence(input: {
    releaseId: string
    condition: MarketCondition
    sourceId: string
    sellerFingerprint: string | null
  }): Promise<GroupingEvidenceRow[]> {
    const { data: pointRows, error: pointError } = await this.client
      .from("price_points")
      .select("id,candidate_id,release_id,source_id,condition,normalized_price_eur,market_price_eur,evidence_grade,quality_flags,evidence_group_key,valuation_eligible,status,needs_revalidation,sold_on,sold_at")
      .eq("release_id", input.releaseId)
      .eq("condition", input.condition)
      .eq("source_id", input.sourceId)
      .eq("status", "active")
      .eq("needs_revalidation", false)
      .not("market_price_eur", "is", null)
    fail(pointError, "load grouping price points")

    const points = (pointRows ?? []).map(mapPoint)
    if (!points.length) return []

    const candidateIds = points.map((row) => row.candidateId)
    let candidateQuery = this.client
      .from("market_candidates")
      .select("id,source_record_key,seller_fingerprint,decision,reason_codes")
      .in("id", candidateIds)

    candidateQuery = input.sellerFingerprint == null
      ? candidateQuery.is("seller_fingerprint", null)
      : candidateQuery.eq("seller_fingerprint", input.sellerFingerprint)

    const { data: candidateRows, error: candidateError } = await candidateQuery
    fail(candidateError, "load grouping candidate identities")

    const candidates = new Map((candidateRows ?? []).map((row: any) => [row.id, row]))
    return points.flatMap((point) => {
      const candidate: any = candidates.get(point.candidateId)
      if (!candidate) return []

      const isPendingOutlier =
        candidate.decision === "needs_review" &&
        Array.isArray(candidate.reason_codes) &&
        candidate.reason_codes.includes("POSSIBLE_OUTLIER")
      if (!point.valuationEligible && !isPendingOutlier) return []

      return [{
        ...point,
        sourceRecordKey: candidate.source_record_key,
        sellerFingerprint: candidate.seller_fingerprint ?? null,
      }]
    })
  }

  async updateGroupingAssignment(input: {
    pointId: string
    candidateId: string
    evidenceGroupKey: string
  }): Promise<void> {
    const now = new Date().toISOString()
    const pointResult = await this.client
      .from("price_points")
      .update({ evidence_group_key: input.evidenceGroupKey, updated_at: now })
      .eq("id", input.pointId)
    fail(pointResult.error, "update price-point evidence group")

    const candidateResult = await this.client
      .from("market_candidates")
      .update({ evidence_group_key: input.evidenceGroupKey, updated_at: now })
      .eq("id", input.candidateId)
    fail(candidateResult.error, "update candidate evidence group")
  }

  async clearPointRevalidation(candidateId: string): Promise<void> {
    const { error } = await this.client
      .from("price_points")
      .update({ needs_revalidation: false, valuation_eligible: false, updated_at: new Date().toISOString() })
      .eq("candidate_id", candidateId)
    fail(error, "clear price-point revalidation")
  }

  async disableCandidatePoint(candidateId: string): Promise<void> {
    const { error } = await this.client
      .from("price_points")
      .update({ valuation_eligible: false, updated_at: new Date().toISOString() })
      .eq("candidate_id", candidateId)
    fail(error, "disable candidate price point")
  }

  async upsertPricePoint(input: {
    candidateId: string
    sourceId: string
    point: PricePointDraft
  }): Promise<StoredPricePoint> {
    const p = input.point
    const payload = {
      candidate_id: input.candidateId,
      release_id: p.releaseId,
      source_id: input.sourceId,
      observation_type: p.observationType,
      condition: p.condition,
      price: p.price,
      currency: p.currency,
      shipping_cost: p.shippingCost,
      shipping_basis: p.shippingBasis,
      valuation_price: p.valuationPrice,
      normalized_price_eur: p.normalizedPriceEUR,
      market_price_eur: p.marketPriceEUR,
      market_price_basis: p.marketPriceBasis,
      fx_rate_to_eur: p.fxRateToEUR,
      fx_rate_date: p.fxRateDate,
      inner_bags_sealed: p.innerBagsSealed,
      box_condition: p.boxCondition,
      is_complete: p.isComplete,
      is_lot: p.isLot,
      quantity: p.quantity,
      match_confidence: p.matchConfidence,
      match_evidence: p.matchEvidence,
      evidence_group_key: p.evidenceGroupKey,
      evidence_grade: p.evidenceGrade,
      quality_flags: p.qualityFlags,
      valuation_eligible: p.valuationEligible,
      sold_at: p.soldAt,
      sold_on: p.soldOn,
      observed_at: p.observedAt,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await this.client
      .from("price_points")
      .upsert(payload, { onConflict: "candidate_id" })
      .select("id,candidate_id,release_id,source_id,condition,normalized_price_eur,market_price_eur,evidence_grade,quality_flags,evidence_group_key,valuation_eligible,status,needs_revalidation,sold_on,sold_at")
      .single()
    fail(error, "upsert price point")
    return mapPoint(data)
  }

  async listValuationPoints(releaseId: string, condition: MarketCondition): Promise<ValuationPointRow[]> {
    const { data: pointRows, error: pointError } = await this.client
      .from("price_points")
      .select("candidate_id,source_id,market_price_eur,evidence_grade,evidence_group_key,sold_on,sold_at")
      .eq("release_id", releaseId)
      .eq("condition", condition)
      .eq("valuation_eligible", true)
      .eq("status", "active")
      .eq("needs_revalidation", false)
      .not("market_price_eur", "is", null)
      .not("evidence_group_key", "is", null)
    fail(pointError, "load valuation points")

    const rows = pointRows ?? []
    if (!rows.length) return []

    const candidateIds = rows.map((row: any) => row.candidate_id)
    const { data: candidateRows, error: candidateError } = await this.client
      .from("market_candidates")
      .select("id,source_record_key")
      .in("id", candidateIds)
    fail(candidateError, "load valuation stable identities")

    const sourceRecordKeys = new Map((candidateRows ?? []).map((row: any) => [row.id, row.source_record_key]))
    return rows.flatMap((row: any) => {
      const sourceRecordKey = sourceRecordKeys.get(row.candidate_id)
      const marketPrice = n(row.market_price_eur)
      if (!sourceRecordKey || marketPrice == null || !row.evidence_group_key) return []
      return [{
        stableId: `${row.source_id}|${sourceRecordKey}`,
        sourceId: row.source_id,
        soldOn: row.sold_on,
        soldAt: row.sold_at,
        normalizedPriceEUR: marketPrice,
        evidenceGroupKey: row.evidence_group_key,
        evidenceGrade: row.evidence_grade ?? "indicative",
      }]
    })
  }

  async getEstimate(releaseId: string, condition: MarketCondition): Promise<StoredEstimate | null> {
    const { data, error } = await this.client
      .from("market_estimates")
      .select("release_id,condition,display_mode,value,low,high,median,range_method,sample_size,independent_evidence_count,verified_observation_count,indicative_observation_count,source_count,quality_mix,window_days,lowest_current_ask,last_verified_sale,last_verified_sale_at,last_verified_sale_on,trend_percent,trend_window_days,last_scanned_at,last_valuation_change_at,algorithm_version,computed_at")
      .eq("release_id", releaseId)
      .eq("condition", condition)
      .maybeSingle()
    fail(error, "load market estimate")
    if (!data) return null

    return {
      releaseId: data.release_id,
      condition: data.condition,
      displayMode: data.display_mode,
      value: n(data.value),
      low: n(data.low),
      high: n(data.high),
      median: n(data.median),
      rangeMethod: data.range_method,
      sampleSize: data.sample_size,
      independentEvidenceCount: data.independent_evidence_count,
      verifiedObservationCount: data.verified_observation_count,
      indicativeObservationCount: data.indicative_observation_count,
      sourceCount: data.source_count,
      qualityMix: data.quality_mix,
      windowDays: data.window_days,
      lowestCurrentAsk: n(data.lowest_current_ask),
      lastVerifiedSale: n(data.last_verified_sale),
      lastVerifiedSaleAt: data.last_verified_sale_at,
      lastVerifiedSaleOn: data.last_verified_sale_on,
      trendPercent: n(data.trend_percent),
      trendWindowDays: data.trend_window_days,
      lastScannedAt: data.last_scanned_at,
      lastValuationChangeAt: data.last_valuation_change_at,
      algorithmVersion: data.algorithm_version,
      computedAt: data.computed_at,
    }
  }

  async upsertEstimate(input: {
    releaseId: string
    condition: MarketCondition
    draft: MarketEstimateDraft
    previous: StoredEstimate | null
    materiallyChanged: boolean
  }): Promise<void> {
    const now = new Date().toISOString()
    const d = input.draft
    const payload = {
      release_id: input.releaseId,
      condition: input.condition,
      display_mode: d.displayMode,
      value: d.value,
      currency: d.currency,
      low: d.low,
      high: d.high,
      median: d.median,
      range_method: d.rangeMethod,
      sample_size: d.sampleSize,
      independent_evidence_count: d.independentEvidenceCount,
      verified_observation_count: d.verifiedObservationCount,
      indicative_observation_count: d.indicativeObservationCount,
      source_count: d.sourceCount,
      quality_mix: d.qualityMix,
      window_days: d.windowDays,
      lowest_current_ask: input.previous?.lowestCurrentAsk ?? null,
      last_verified_sale: d.lastVerifiedSale,
      last_verified_sale_at: d.lastVerifiedSaleAt,
      last_verified_sale_on: d.lastVerifiedSaleOn,
      trend_percent: d.trendPercent,
      trend_window_days: d.trendWindowDays,
      last_scanned_at: input.previous?.lastScannedAt ?? null,
      last_valuation_change_at: input.materiallyChanged
        ? now
        : (input.previous?.lastValuationChangeAt ?? now),
      algorithm_version: d.algorithmVersion,
      computed_at: now,
    }

    const { error } = await this.client
      .from("market_estimates")
      .upsert(payload, { onConflict: "release_id,condition" })
    fail(error, "upsert market estimate")
  }

  async deleteEstimate(releaseId: string, condition: MarketCondition): Promise<void> {
    const { error } = await this.client
      .from("market_estimates")
      .delete()
      .eq("release_id", releaseId)
      .eq("condition", condition)
    fail(error, "delete empty market estimate")
  }

  async recordHistorySnapshot(input: {
    releaseId: string
    condition: MarketCondition
    snapshotPeriod: string
  }): Promise<boolean> {
    const estimate = await this.getEstimate(input.releaseId, input.condition)
    if (!estimate) return false

    const { error } = await this.client.from("market_value_history").upsert(
      {
        release_id: estimate.releaseId,
        condition: estimate.condition,
        snapshot_period: input.snapshotPeriod,
        display_mode: estimate.displayMode,
        value: estimate.value,
        low: estimate.low,
        high: estimate.high,
        median: estimate.median,
        range_method: estimate.rangeMethod,
        currency: "EUR",
        sample_size: estimate.sampleSize,
        independent_evidence_count: estimate.independentEvidenceCount,
        verified_observation_count: estimate.verifiedObservationCount,
        indicative_observation_count: estimate.indicativeObservationCount,
        source_count: estimate.sourceCount,
        quality_mix: estimate.qualityMix,
        window_days: estimate.windowDays,
        algorithm_version: estimate.algorithmVersion,
        recorded_at: new Date().toISOString(),
      },
      { onConflict: "release_id,condition,snapshot_period" },
    )
    fail(error, "record market value snapshot")
    return true
  }

  async upsertMonthlySourceStat(draft: MonthlySourceStatDraft): Promise<void> {
    const { error } = await this.client.from("market_monthly_source_stats").upsert(
      {
        release_id: draft.releaseId,
        source_id: draft.sourceId,
        month: draft.month,
        condition: draft.condition,
        query_key: draft.queryKey,
        query_description: draft.queryDescription ?? null,
        sales_count: draft.salesCount,
        seller_count: draft.sellerCount ?? null,
        average_price: draft.averagePrice,
        low_price: draft.lowPrice ?? null,
        high_price: draft.highPrice ?? null,
        average_shipping: draft.averageShipping ?? null,
        currency: draft.currency.toUpperCase(),
        market_average_eur: draft.marketAverageEUR ?? null,
        fx_rate_to_eur: draft.fxRateToEUR ?? null,
        fx_rate_date: draft.fxRateDate ?? null,
        evidence_grade: draft.evidenceGrade,
        provenance_url: draft.provenanceUrl ?? null,
        raw_payload: draft.rawPayload ?? null,
        captured_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "release_id,source_id,month,condition,query_key" },
    )
    fail(error, "upsert monthly source statistics")
  }
}

export type MarketPipelineStore = Pick<
  MarketPipelineRepository,
  | "listCatalogReleases"
  | "ensureSource"
  | "findCandidate"
  | "findExactAcceptedDuplicate"
  | "upsertCandidate"
  | "patchCandidate"
  | "getCandidatePoint"
  | "listGroupingEvidence"
  | "updateGroupingAssignment"
  | "clearPointRevalidation"
  | "disableCandidatePoint"
  | "upsertPricePoint"
  | "listValuationPoints"
  | "getEstimate"
  | "upsertEstimate"
  | "deleteEstimate"
  | "recordHistorySnapshot"
>
