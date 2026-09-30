import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  ingestSoldObservationWithStore,
  runSoldResearchAdapterWithStore,
  type SoldIngestionCandidateDraft,
  type SoldIngestionCandidateRow,
  type SoldIngestionPointDraft,
  type SoldIngestionResult,
  type SoldIngestionSourceRow,
  type SoldIngestionStore,
  type SoldObservationInput,
  type SoldResearchAdapter,
  type SoldSourceAutomationPolicy,
} from "./sold-ingestion"
import type { MarketCondition } from "./types"

function fail(error: { message?: string } | null, context: string): void {
  if (error) throw new Error(`${context}: ${error.message ?? "unknown Supabase error"}`)
}

export class SupabaseSoldIngestionStore implements SoldIngestionStore {
  constructor(private readonly client: SupabaseClient = createAdminClient()) {}

  async getSourceBySlug(slug: string): Promise<SoldIngestionSourceRow | null> {
    const { data, error } = await this.client
      .from("price_sources")
      .select("id,slug,is_active,ingestion_mode")
      .eq("slug", slug)
      .maybeSingle()
    fail(error, "load SOLD source")

    if (!data) return null
    return {
      id: data.id,
      slug: data.slug,
      isActive: data.is_active,
      ingestionMode: data.ingestion_mode,
    }
  }

  async releaseExists(releaseId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from("product_releases")
      .select("id")
      .eq("id", releaseId)
      .maybeSingle()
    fail(error, "validate SOLD release")
    return Boolean(data)
  }

  async findCandidate(sourceId: string, sourceRecordKey: string): Promise<SoldIngestionCandidateRow | null> {
    const { data, error } = await this.client
      .from("market_candidates")
      .select("id,decision,resolved_release_id,needs_revalidation")
      .eq("source_id", sourceId)
      .eq("source_record_key", sourceRecordKey)
      .maybeSingle()
    fail(error, "load SOLD candidate")

    return data
      ? {
          id: data.id,
          decision: data.decision,
          resolvedReleaseId: data.resolved_release_id,
          needsRevalidation: data.needs_revalidation,
        }
      : null
  }

  async findAcceptedOriginalDuplicate(input: {
    originalSource: string
    originalRecordId: string
    excludeCandidateId?: string | null
  }): Promise<{ id: string } | null> {
    let query = this.client
      .from("market_candidates")
      .select("id")
      .eq("original_source", input.originalSource)
      .eq("original_record_id", input.originalRecordId)
      .eq("decision", "accepted")
      .limit(1)

    if (input.excludeCandidateId) query = query.neq("id", input.excludeCandidateId)

    const { data, error } = await query.maybeSingle()
    fail(error, "check SOLD original-record duplicate")
    return data ? { id: data.id } : null
  }

  async upsertCandidate(draft: SoldIngestionCandidateDraft): Promise<SoldIngestionCandidateRow> {
    const now = new Date().toISOString()
    const { data, error } = await this.client
      .from("market_candidates")
      .upsert(
        {
          source_id: draft.sourceId,
          source_record_key: draft.sourceRecordKey,
          external_listing_id: draft.externalListingId,
          original_source: draft.originalSource,
          original_record_id: draft.originalRecordId,
          listing_url: draft.listingUrl,
          title_raw: draft.titleRaw,
          item_number_observed: draft.itemNumberObserved,
          possible_release_ids: draft.possibleReleaseIds,
          resolved_release_id: draft.resolvedReleaseId,
          price: draft.price,
          currency: draft.currency,
          shipping_cost: draft.shippingCost,
          shipping_basis: draft.shippingBasis,
          observation_type: draft.observationType,
          condition_raw: draft.conditionRaw,
          condition: draft.condition,
          inner_bags_sealed: draft.innerBagsSealed,
          box_condition: draft.boxCondition,
          is_complete: draft.isComplete,
          is_lot: draft.isLot,
          quantity: draft.quantity,
          match_confidence: draft.matchConfidence,
          match_evidence: draft.matchEvidence,
          seller_fingerprint: draft.sellerFingerprint,
          evidence_group_key: draft.evidenceGroupKey,
          sold_on: draft.soldOn,
          observed_at: draft.observedAt,
          decision: draft.decision,
          reason_codes: draft.reasonCodes,
          needs_revalidation: draft.needsRevalidation,
          raw_payload: draft.rawPayload,
          last_observed_at: draft.observedAt,
          updated_at: now,
        },
        { onConflict: "source_id,source_record_key" },
      )
      .select("id,decision,resolved_release_id,needs_revalidation")
      .single()
    fail(error, "upsert SOLD candidate")

    return {
      id: data!.id,
      decision: data!.decision,
      resolvedReleaseId: data!.resolved_release_id,
      needsRevalidation: data!.needs_revalidation,
    }
  }

  async markCandidateNeedsReview(candidateId: string, reasonCodes: string[]): Promise<void> {
    const { error } = await this.client
      .from("market_candidates")
      .update({
        decision: "needs_review",
        reason_codes: reasonCodes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", candidateId)
    fail(error, "mark SOLD candidate for revalidation")
  }

  async disablePricePoint(candidateId: string): Promise<void> {
    const { error } = await this.client
      .from("price_points")
      .update({
        valuation_eligible: false,
        updated_at: new Date().toISOString(),
      })
      .eq("candidate_id", candidateId)
    fail(error, "disable SOLD price point")
  }

  async upsertPricePoint(draft: SoldIngestionPointDraft): Promise<{ id: string }> {
    const { data, error } = await this.client
      .from("price_points")
      .upsert(
        {
          candidate_id: draft.candidateId,
          release_id: draft.releaseId,
          source_id: draft.sourceId,
          observation_type: draft.observationType,
          condition: draft.condition,
          price: draft.price,
          currency: draft.currency,
          shipping_cost: draft.shippingCost,
          shipping_basis: draft.shippingBasis,
          valuation_price: draft.valuationPrice,
          normalized_price_eur: draft.normalizedPriceEUR,
          evidence_grade: draft.evidenceGrade,
          quality_flags: draft.qualityFlags,
          market_price_eur: draft.marketPriceEUR,
          market_price_basis: draft.marketPriceBasis,
          fx_rate_to_eur: draft.fxRateToEUR,
          fx_rate_date: draft.fxRateDate,
          inner_bags_sealed: draft.innerBagsSealed,
          box_condition: draft.boxCondition,
          is_complete: draft.isComplete,
          is_lot: draft.isLot,
          quantity: draft.quantity,
          match_confidence: draft.matchConfidence,
          match_evidence: draft.matchEvidence,
          evidence_group_key: draft.evidenceGroupKey,
          valuation_eligible: draft.valuationEligible,
          status: "active",
          needs_revalidation: draft.needsRevalidation,
          sold_on: draft.soldOn,
          observed_at: draft.observedAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "candidate_id" },
      )
      .select("id")
      .single()
    fail(error, "upsert SOLD price point")
    return { id: data!.id }
  }

  async enqueueRecompute(
    releaseId: string,
    condition: MarketCondition,
    dirtyAt: string,
  ): Promise<void> {
    const { error } = await this.client
      .from("market_recompute_queue")
      .upsert(
        {
          release_id: releaseId,
          condition,
          dirty_at: dirtyAt,
          available_at: dirtyAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "release_id,condition" },
      )
    fail(error, "enqueue SOLD market recompute")
  }
}

export async function ingestCanonicalSoldObservation(
  input: SoldObservationInput,
  options: {
    mode: "manual" | "automated"
    sourcePolicy?: SoldSourceAutomationPolicy
    now?: Date
  },
): Promise<SoldIngestionResult> {
  return ingestSoldObservationWithStore(
    input,
    new SupabaseSoldIngestionStore(),
    options,
  )
}

export async function runCanonicalSoldResearchAdapter(
  adapter: SoldResearchAdapter,
  target: { releaseId: string },
  options: { now?: Date } = {},
) {
  return runSoldResearchAdapterWithStore(
    adapter,
    target,
    new SupabaseSoldIngestionStore(),
    options,
  )
}
