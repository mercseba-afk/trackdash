import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { createAdminClient } from "@/lib/supabase/admin"
import type {
  AvailabilityStatus,
  CurrentOfferEvidence,
  MarketChannel,
  MarketSignalDraft,
  SoldEvidenceGrade,
  SoldEvidenceGrain,
  SoldMarketEvidence,
} from "./market-model"
import type { MarketCondition } from "./types"
import type { ScanActivityTier, ScanQueueTarget, ScanScope } from "./scheduler"

function n(value: unknown): number | null {
  if (value == null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function fail(error: { message?: string } | null, context: string): void {
  if (error) throw new Error(`${context}: ${error.message ?? "unknown Supabase error"}`)
}

export interface AggregateObservationDraft {
  sourceId: string
  releaseId: string | null
  itemNumber: string
  possibleReleaseIds?: string[]
  attributionStatus: "release_exact" | "release_matched" | "item_pool" | "ambiguous_release"
  grain: Exclude<SoldEvidenceGrain, "event">
  periodStart: string
  periodEnd: string
  condition: MarketCondition
  queryKey: string
  queryDescription?: string | null
  salesCount: number
  sellerCount?: number | null
  averageItemPrice: number
  lowItemPrice?: number | null
  highItemPrice?: number | null
  averageShipping?: number | null
  freeShippingPct?: number | null
  auctionSalesCount?: number | null
  buyItNowSalesCount?: number | null
  acceptedOfferSalesCount?: number | null
  currency: string
  marketAverageEUR?: number | null
  fxRateToEUR?: number | null
  fxRateDate?: string | null
  evidenceGrade: SoldEvidenceGrade
  provenanceUrl?: string | null
  rawPayload?: unknown
  capturedAt?: string
}

export interface OfferStateDraft {
  candidateId: string
  releaseId: string
  sourceId: string
  condition: MarketCondition
  channel: MarketChannel
  availability: AvailabilityStatus
  sellerFingerprint?: string | null
  itemPrice: number
  shippingPrice?: number | null
  currency: string
  itemPriceEUR: number
  shippingEUR?: number | null
  fxRateToEUR?: number | null
  fxRateDate?: string | null
  observedAt: string
}

export interface StoredOfferState extends CurrentOfferEvidence {
  id: string
  condition: MarketCondition
  itemPrice: number
  shippingPrice: number | null
  currency: string
  fxRateToEUR: number | null
  fxRateDate: string | null
  firstSeenAt: string
  lastCheckedAt: string
  changedAt: string
}

export interface StoredAggregateEvidence extends SoldMarketEvidence {
  releaseId: string
  itemNumber: string
  attributionStatus: "release_exact" | "release_matched"
  queryKey: string
}

export interface ScanQueueDraft {
  releaseId: string
  sourceId: string
  scanScope: ScanScope
  enabled: boolean
  activityTier: ScanActivityTier
  scanIntervalHours: number
  priority?: number
  nextScanAt: string
  lastMaterialChangeAt?: string | null
  stableSince?: string | null
}

function mapOffer(row: any): StoredOfferState {
  return {
    id: row.id,
    stableId: row.id,
    candidateId: row.candidate_id,
    releaseId: row.release_id,
    sourceId: row.source_id,
    condition: row.condition,
    channel: row.channel,
    sellerFingerprint: row.seller_fingerprint,
    availability: row.availability,
    itemPrice: Number(row.item_price),
    shippingPrice: n(row.shipping_price),
    currency: row.currency,
    itemPriceEUR: Number(row.item_price_eur),
    shippingEUR: n(row.shipping_eur),
    fxRateToEUR: n(row.fx_rate_to_eur),
    fxRateDate: row.fx_rate_date,
    observedAt: row.last_checked_at,
    firstSeenAt: row.first_seen_at,
    lastCheckedAt: row.last_checked_at,
    changedAt: row.changed_at,
  }
}

function offerChangeKind(previous: StoredOfferState, next: OfferStateDraft): {
  changed: boolean
  kind: "price_change" | "availability_change" | "price_and_availability" | "shipping_change" | null
} {
  const priceChanged =
    previous.itemPrice !== next.itemPrice ||
    previous.itemPriceEUR !== next.itemPriceEUR
  const shippingChanged =
    previous.shippingPrice !== (next.shippingPrice ?? null) ||
    previous.shippingEUR !== (next.shippingEUR ?? null)
  const availabilityChanged = previous.availability !== next.availability

  if (availabilityChanged && (priceChanged || shippingChanged)) {
    return { changed: true, kind: "price_and_availability" }
  }
  if (availabilityChanged) return { changed: true, kind: "availability_change" }
  if (priceChanged) return { changed: true, kind: "price_change" }
  if (shippingChanged) return { changed: true, kind: "shipping_change" }
  return { changed: false, kind: null }
}

function statePayload(draft: OfferStateDraft, firstSeenAt: string, changedAt: string) {
  const shippingEUR = draft.shippingEUR ?? null
  return {
    candidate_id: draft.candidateId,
    release_id: draft.releaseId,
    source_id: draft.sourceId,
    condition: draft.condition,
    channel: draft.channel,
    availability: draft.availability,
    seller_fingerprint: draft.sellerFingerprint ?? null,
    item_price: draft.itemPrice,
    shipping_price: draft.shippingPrice ?? null,
    currency: draft.currency.toUpperCase(),
    item_price_eur: draft.itemPriceEUR,
    shipping_eur: shippingEUR,
    effective_cost_eur: shippingEUR == null ? null : Number((draft.itemPriceEUR + shippingEUR).toFixed(2)),
    cost_basis: shippingEUR == null ? "item_only" : "delivered",
    fx_rate_to_eur: draft.fxRateToEUR ?? null,
    fx_rate_date: draft.fxRateDate ?? null,
    first_seen_at: firstSeenAt,
    last_checked_at: draft.observedAt,
    changed_at: changedAt,
    updated_at: new Date().toISOString(),
  }
}

export class MarketR3Repository {
  constructor(private readonly client: SupabaseClient = createAdminClient()) {}

  async listCurrentOffers(releaseId: string, condition: MarketCondition): Promise<StoredOfferState[]> {
    const { data, error } = await this.client
      .from("market_offer_states")
      .select("id,candidate_id,release_id,source_id,condition,channel,availability,seller_fingerprint,item_price,shipping_price,currency,item_price_eur,shipping_eur,fx_rate_to_eur,fx_rate_date,first_seen_at,last_checked_at,changed_at")
      .eq("release_id", releaseId)
      .eq("condition", condition)
    fail(error, "load current market offers")
    return (data ?? []).map(mapOffer)
  }

  async listGranularSoldEvidence(releaseId: string, condition: MarketCondition): Promise<SoldMarketEvidence[]> {
    const { data: points, error: pointError } = await this.client
      .from("price_points")
      .select("candidate_id,source_id,market_price_eur,evidence_grade,sold_on")
      .eq("release_id", releaseId)
      .eq("condition", condition)
      .eq("status", "active")
      .eq("needs_revalidation", false)
      .not("market_price_eur", "is", null)
    fail(pointError, "load R3 granular sold evidence")

    if (!(points ?? []).length) return []
    const candidateIds = (points ?? []).map((row: any) => row.candidate_id)
    const { data: candidates, error: candidateError } = await this.client
      .from("market_candidates")
      .select("id,source_record_key,decision,reason_codes")
      .in("id", candidateIds)
    fail(candidateError, "load R3 sold candidate audit state")

    const byId = new Map((candidates ?? []).map((row: any) => [row.id, row]))
    return (points ?? []).flatMap((row: any) => {
      const candidate: any = byId.get(row.candidate_id)
      const price = n(row.market_price_eur)
      if (!candidate || candidate.decision !== "accepted" || price == null || price <= 0) return []
      if (Array.isArray(candidate.reason_codes) && candidate.reason_codes.includes("POSSIBLE_OUTLIER")) return []
      return [{
        stableId: `${row.source_id}|${candidate.source_record_key}`,
        sourceId: row.source_id,
        averagePriceEUR: price,
        salesCount: 1,
        periodStart: row.sold_on,
        periodEnd: row.sold_on,
        grain: "event" as const,
        evidenceGrade: (row.evidence_grade ?? "indicative") as SoldEvidenceGrade,
      }]
    })
  }

  async listAggregateSoldEvidence(releaseId: string, condition: MarketCondition): Promise<StoredAggregateEvidence[]> {
    const { data, error } = await this.client
      .from("market_aggregate_observations")
      .select("id,release_id,item_number,source_id,attribution_status,grain,period_start,period_end,query_key,sales_count,market_average_eur,evidence_grade")
      .eq("release_id", releaseId)
      .eq("condition", condition)
      .in("attribution_status", ["release_exact", "release_matched"])
      .not("market_average_eur", "is", null)
      .order("period_end", { ascending: true })
    fail(error, "load aggregate sold evidence")

    return (data ?? []).flatMap((row: any) => {
      const price = n(row.market_average_eur)
      if (price == null || price <= 0) return []
      return [{
        stableId: `aggregate|${row.id}`,
        releaseId: row.release_id,
        itemNumber: row.item_number,
        attributionStatus: row.attribution_status,
        queryKey: row.query_key,
        sourceId: row.source_id,
        averagePriceEUR: price,
        salesCount: row.sales_count,
        periodStart: row.period_start,
        periodEnd: row.period_end,
        grain: row.grain as Exclude<SoldEvidenceGrain, "event">,
        evidenceGrade: (row.evidence_grade ?? "indicative") as SoldEvidenceGrade,
      }]
    })
  }

  async upsertAggregateObservation(draft: AggregateObservationDraft): Promise<void> {
    const payload = {
      source_id: draft.sourceId,
      release_id: draft.releaseId,
      item_number: draft.itemNumber,
      possible_release_ids: draft.possibleReleaseIds ?? [],
      attribution_status: draft.attributionStatus,
      grain: draft.grain,
      period_start: draft.periodStart,
      period_end: draft.periodEnd,
      condition: draft.condition,
      query_key: draft.queryKey,
      query_description: draft.queryDescription ?? null,
      sales_count: draft.salesCount,
      seller_count: draft.sellerCount ?? null,
      average_item_price: draft.averageItemPrice,
      low_item_price: draft.lowItemPrice ?? null,
      high_item_price: draft.highItemPrice ?? null,
      average_shipping: draft.averageShipping ?? null,
      free_shipping_pct: draft.freeShippingPct ?? null,
      auction_sales_count: draft.auctionSalesCount ?? null,
      buy_it_now_sales_count: draft.buyItNowSalesCount ?? null,
      accepted_offer_sales_count: draft.acceptedOfferSalesCount ?? null,
      currency: draft.currency.toUpperCase(),
      market_average_eur: draft.marketAverageEUR ?? null,
      fx_rate_to_eur: draft.fxRateToEUR ?? null,
      fx_rate_date: draft.fxRateDate ?? null,
      evidence_grade: draft.evidenceGrade,
      provenance_url: draft.provenanceUrl ?? null,
      raw_payload: draft.rawPayload ?? null,
      captured_at: draft.capturedAt ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { error } = await this.client
      .from("market_aggregate_observations")
      .upsert(payload, {
        onConflict: "source_id,query_key,period_start,period_end,item_number",
      })
    fail(error, "upsert aggregate market observation")
  }

  async upsertOfferState(draft: OfferStateDraft): Promise<StoredOfferState> {
    const { data: existingRow, error: existingError } = await this.client
      .from("market_offer_states")
      .select("id,candidate_id,release_id,source_id,condition,channel,availability,seller_fingerprint,item_price,shipping_price,currency,item_price_eur,shipping_eur,fx_rate_to_eur,fx_rate_date,first_seen_at,last_checked_at,changed_at")
      .eq("candidate_id", draft.candidateId)
      .maybeSingle()
    fail(existingError, "load current offer state")

    if (!existingRow) {
      const payload = statePayload(draft, draft.observedAt, draft.observedAt)
      const { data, error } = await this.client
        .from("market_offer_states")
        .insert(payload)
        .select("id,candidate_id,release_id,source_id,condition,channel,availability,seller_fingerprint,item_price,shipping_price,currency,item_price_eur,shipping_eur,fx_rate_to_eur,fx_rate_date,first_seen_at,last_checked_at,changed_at")
        .single()
      fail(error, "insert current offer state")
      const state = mapOffer(data)

      const historyError = await this.client.from("market_offer_history").insert({
        offer_state_id: state.id,
        candidate_id: draft.candidateId,
        release_id: draft.releaseId,
        source_id: draft.sourceId,
        condition: draft.condition,
        channel: draft.channel,
        availability: draft.availability,
        item_price_eur: state.itemPriceEUR,
        shipping_eur: state.shippingEUR,
        effective_cost_eur: state.shippingEUR == null ? null : Number((state.itemPriceEUR + state.shippingEUR).toFixed(2)),
        cost_basis: state.shippingEUR == null ? "item_only" : "delivered",
        change_kind: "initial",
        observed_at: draft.observedAt,
      })
      fail(historyError.error, "record initial offer history")
      return state
    }

    const previous = mapOffer(existingRow)
    const change = offerChangeKind(previous, draft)
    const changedAt = change.changed ? draft.observedAt : previous.changedAt
    const payload = statePayload(draft, previous.firstSeenAt, changedAt)
    const { data, error } = await this.client
      .from("market_offer_states")
      .update(payload)
      .eq("id", previous.id)
      .select("id,candidate_id,release_id,source_id,condition,channel,availability,seller_fingerprint,item_price,shipping_price,currency,item_price_eur,shipping_eur,fx_rate_to_eur,fx_rate_date,first_seen_at,last_checked_at,changed_at")
      .single()
    fail(error, "update current offer state")
    const state = mapOffer(data)

    if (change.changed && change.kind) {
      const historyError = await this.client.from("market_offer_history").insert({
        offer_state_id: state.id,
        candidate_id: draft.candidateId,
        release_id: draft.releaseId,
        source_id: draft.sourceId,
        condition: draft.condition,
        channel: draft.channel,
        availability: draft.availability,
        item_price_eur: state.itemPriceEUR,
        shipping_eur: state.shippingEUR,
        effective_cost_eur: state.shippingEUR == null ? null : Number((state.itemPriceEUR + state.shippingEUR).toFixed(2)),
        cost_basis: state.shippingEUR == null ? "item_only" : "delivered",
        change_kind: change.kind,
        observed_at: draft.observedAt,
      })
      fail(historyError.error, "record offer history change")
    }

    return state
  }

  async upsertReleaseSignal(
    releaseId: string,
    condition: MarketCondition,
    signal: MarketSignalDraft,
  ): Promise<void> {
    const start = signal.startingOffer
    const { error } = await this.client
      .from("market_release_signals")
      .upsert(
        {
          release_id: releaseId,
          condition,
          market_regime: signal.marketRegime,
          market_value_eur: signal.marketValueEUR,
          low_eur: signal.lowEUR,
          high_eur: signal.highEUR,
          confidence_score: signal.confidenceScore,
          confidence_label: signal.confidenceLabel,
          retail_anchor_eur: signal.retailAnchorEUR,
          active_anchor_eur: signal.activeAnchorEUR,
          sold_anchor_eur: signal.soldAnchorEUR,
          starting_offer_candidate_id: start?.candidateId ?? null,
          starting_item_price_eur: start?.itemPriceEUR ?? null,
          starting_shipping_eur: start?.shippingEUR ?? null,
          starting_effective_cost_eur: start?.effectiveCostEUR ?? null,
          starting_cost_basis: start?.costBasis ?? null,
          retail_source_count: signal.retailSourceCount,
          active_offer_count: signal.activeOfferCount,
          current_offer_count: signal.currentOfferCount,
          sold_units: signal.soldUnits,
          sold_source_count: signal.soldSourceCount,
          sold_evidence_count: signal.soldEvidenceCount,
          shipping_known_ratio: signal.shippingKnownRatio,
          trend_percent: signal.trendPercent,
          trend_window_months: signal.trendWindowMonths,
          algorithm_version: signal.algorithmVersion,
          computed_at: new Date().toISOString(),
        },
        { onConflict: "release_id,condition" },
      )
    fail(error, "upsert R3 release signal")
  }

  async upsertMonthlySoldSignals(
    releaseId: string,
    condition: MarketCondition,
    signal: MarketSignalDraft,
  ): Promise<void> {
    for (const point of signal.monthlyTrend) {
      const { error } = await this.client
        .from("market_release_monthly_signals")
        .upsert(
          {
            release_id: releaseId,
            condition,
            month: `${point.month}-01`,
            market_regime: "secondary_market_driven",
            market_value_eur: point.soldAnchorEUR,
            retail_anchor_eur: null,
            active_anchor_eur: null,
            sold_anchor_eur: point.soldAnchorEUR,
            sold_units: point.salesCount,
            retail_source_count: 0,
            active_offer_count: 0,
            confidence_score: Math.min(70, 20 + Math.round(Math.log2(point.salesCount + 1) * 10)),
            algorithm_version: "r3",
            computed_at: new Date().toISOString(),
          },
          { onConflict: "release_id,condition,month" },
        )
      fail(error, "upsert R3 monthly sold signal")
    }
  }

  async upsertScanQueue(draft: ScanQueueDraft): Promise<void> {
    const { error } = await this.client
      .from("market_scan_queue")
      .upsert(
        {
          release_id: draft.releaseId,
          source_id: draft.sourceId,
          scan_scope: draft.scanScope,
          enabled: draft.enabled,
          activity_tier: draft.activityTier,
          scan_interval_hours: draft.scanIntervalHours,
          priority: draft.priority ?? 0,
          next_scan_at: draft.nextScanAt,
          last_material_change_at: draft.lastMaterialChangeAt ?? null,
          stable_since: draft.stableSince ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "release_id,source_id,scan_scope" },
      )
    fail(error, "upsert R3 scan queue")
  }

  async listDueScanQueue(now: string, limit = 100): Promise<ScanQueueTarget[]> {
    const { data, error } = await this.client
      .from("market_scan_queue")
      .select("id,release_id,source_id,scan_scope,activity_tier,priority,next_scan_at,enabled,locked_until")
      .eq("enabled", true)
      .lte("next_scan_at", now)
      .order("next_scan_at", { ascending: true })
      .order("priority", { ascending: false })
      .limit(limit)
    fail(error, "load due R3 scan queue")

    return (data ?? []).map((row: any) => ({
      id: row.id,
      releaseId: row.release_id,
      sourceId: row.source_id,
      scanScope: row.scan_scope,
      activityTier: row.activity_tier,
      priority: row.priority,
      nextScanAt: row.next_scan_at,
      enabled: row.enabled,
      lockedUntil: row.locked_until,
    }))
  }
}
