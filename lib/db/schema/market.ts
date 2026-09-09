// Price Intelligence v1 schema.
//
// Storage layers:
//   price_sources              — source registry; automation disabled until verified.
//   market_scan_runs/targets   — service-only scanner audit/scheduling state.
//   market_candidates          — service-only CURRENT source records + review/audit evidence.
//   price_points               — normalized completed-sale observations; never hard-deleted.
//   market_estimates           — current sanitized derived cache, fully recomputable.
//   market_value_history       — sanitized derived snapshots.
//   market_review_digests      — thin service-only send-log.
//
// Core benchmark: New / Unused + Complete + Unbuilt.
// UNKNOWN > INVENTED: ambiguous identity, condition, sale timing, seller independence,
// shipping, or FX never becomes valuation-eligible automatically.

import { relations, sql } from "drizzle-orm"
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core"
import { anonRole, authenticatedRole } from "drizzle-orm/supabase"
import { productReleases } from "./catalog"

export const priceSources = pgTable(
  "price_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    sourceType: text("source_type").notNull(),
    origin: text("origin").notNull().default("external_market"),
    ingestionMode: text("ingestion_mode").notNull().default("disabled"),
    baseTrustScore: numeric("base_trust_score", { precision: 3, scale: 2 }).notNull().default("1.0"),
    isActive: boolean("is_active").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "price_sources_origin_check",
      sql`${table.origin} in ('external_market', 'trackdash_marketplace', 'trackdash_transaction', 'reference')`,
    ),
    check(
      "price_sources_ingestion_mode_check",
      sql`${table.ingestionMode} in ('api', 'licensed_feed', 'manual', 'internal', 'disabled')`,
    ),
    pgPolicy("price_sources_public_read", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS()

export const marketScanRuns = pgTable(
  "market_scan_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    status: text("status").notNull().default("running"),
    targetsAttempted: integer("targets_attempted").notNull().default(0),
    targetsSucceeded: integer("targets_succeeded").notNull().default(0),
    candidatesFound: integer("candidates_found").notNull().default(0),
    acceptedCount: integer("accepted_count").notNull().default(0),
    reviewCount: integer("review_count").notNull().default(0),
    rejectedCount: integer("rejected_count").notNull().default(0),
    duplicateCount: integer("duplicate_count").notNull().default(0),
    valuationsChanged: integer("valuations_changed").notNull().default(0),
    trendsChanged: integer("trends_changed").notNull().default(0),
    errorSummary: text("error_summary"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_market_scan_runs_started_at").on(table.startedAt),
    check("market_scan_runs_status_check", sql`${table.status} in ('running', 'completed', 'partial', 'failed')`),
    check("market_scan_runs_time_check", sql`${table.finishedAt} is null or ${table.finishedAt} >= ${table.startedAt}`),
    check(
      "market_scan_runs_counts_check",
      sql`${table.targetsAttempted} >= 0
        and ${table.targetsSucceeded} >= 0
        and ${table.candidatesFound} >= 0
        and ${table.acceptedCount} >= 0
        and ${table.reviewCount} >= 0
        and ${table.rejectedCount} >= 0
        and ${table.duplicateCount} >= 0
        and ${table.valuationsChanged} >= 0
        and ${table.trendsChanged} >= 0`,
    ),
  ],
).enableRLS()

export const marketScanTargets = pgTable(
  "market_scan_targets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    releaseId: uuid("release_id")
      .notNull()
      .references(() => productReleases.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => priceSources.id, { onDelete: "cascade" }),
    enabled: boolean("enabled").notNull().default(false),
    scanIntervalHours: integer("scan_interval_hours").notNull().default(168),
    priority: integer("priority").notNull().default(0),
    lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
    lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),
    nextScanAt: timestamp("next_scan_at", { withTimezone: true }).notNull().defaultNow(),
    consecutiveFailures: integer("consecutive_failures").notNull().default(0),
    lastError: text("last_error"),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("market_scan_targets_release_source_unique").on(table.releaseId, table.sourceId),
    index("idx_market_scan_targets_due").on(table.enabled, table.nextScanAt, table.priority),
    check("market_scan_targets_interval_check", sql`${table.scanIntervalHours} >= 24`),
    check("market_scan_targets_failures_check", sql`${table.consecutiveFailures} >= 0`),
  ],
).enableRLS()

export const marketCandidates = pgTable(
  "market_candidates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scanRunId: uuid("scan_run_id").references(() => marketScanRuns.id, { onDelete: "set null" }),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => priceSources.id, { onDelete: "restrict" }),
    sourceRecordKey: text("source_record_key").notNull(),
    externalListingId: text("external_listing_id"),
    originalSource: text("original_source"),
    originalRecordId: text("original_record_id"),
    listingUrl: text("listing_url"),
    titleRaw: text("title_raw"),
    itemNumberObserved: text("item_number_observed"),
    possibleReleaseIds: uuid("possible_release_ids").array().notNull().default(sql`'{}'::uuid[]`),
    resolvedReleaseId: uuid("resolved_release_id").references(() => productReleases.id, { onDelete: "set null" }),
    price: numeric("price", { precision: 12, scale: 2 }),
    currency: text("currency"),
    shippingCost: numeric("shipping_cost", { precision: 12, scale: 2 }),
    shippingBasis: text("shipping_basis").notNull().default("unknown"),
    observationType: text("observation_type").notNull().default("unknown"),
    conditionRaw: text("condition_raw"),
    condition: text("condition").notNull().default("unknown"),
    innerBagsSealed: text("inner_bags_sealed").notNull().default("unknown"),
    boxCondition: text("box_condition").notNull().default("unknown"),
    isComplete: boolean("is_complete"),
    isLot: boolean("is_lot"),
    quantity: integer("quantity"),
    matchConfidence: text("match_confidence"),
    matchEvidence: text("match_evidence").array().notNull().default(sql`'{}'::text[]`),
    sellerFingerprint: text("seller_fingerprint"),
    evidenceGroupKey: text("evidence_group_key"),
    soldAt: timestamp("sold_at", { withTimezone: true }),
    soldOn: date("sold_on"),
    listingDate: date("listing_date"),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull().defaultNow(),
    decision: text("decision").notNull().default("needs_review"),
    reasonCodes: text("reason_codes").array().notNull().default(sql`'{}'::text[]`),
    reviewNotes: text("review_notes"),
    stateHash: text("state_hash"),
    needsRevalidation: boolean("needs_revalidation").notNull().default(false),
    rawPayload: jsonb("raw_payload"),
    firstObservedAt: timestamp("first_observed_at", { withTimezone: true }).notNull().defaultNow(),
    lastObservedAt: timestamp("last_observed_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("market_candidates_source_record_unique").on(table.sourceId, table.sourceRecordKey),
    index("idx_market_candidates_release").on(table.resolvedReleaseId, table.decision),
    index("idx_market_candidates_review").on(table.decision, table.needsRevalidation, table.lastObservedAt),
    index("idx_market_candidates_original_record").on(table.originalSource, table.originalRecordId),
    check("market_candidates_price_check", sql`${table.price} is null or ${table.price} >= 0`),
    check("market_candidates_shipping_cost_check", sql`${table.shippingCost} is null or ${table.shippingCost} >= 0`),
    check("market_candidates_quantity_check", sql`${table.quantity} is null or ${table.quantity} >= 1`),
    check("market_candidates_observation_time_check", sql`${table.lastObservedAt} >= ${table.firstObservedAt}`),
    check(
      "market_candidates_shipping_basis_check",
      sql`${table.shippingBasis} in ('excluded', 'included_exact', 'included_unknown', 'buyer_paid', 'unknown')`,
    ),
    check(
      "market_candidates_observation_type_check",
      sql`${table.observationType} in (
        'sold_confirmed', 'auction_awarded', 'marketplace_sold', 'active_listing',
        'retail_in_stock', 'dealer_buyback', 'retail_out_of_stock', 'ended_unsold',
        'msrp_reference', 'unknown'
      )`,
    ),
    check(
      "market_candidates_condition_check",
      sql`${table.condition} in ('new_complete_unbuilt', 'built_complete', 'incomplete_parts_custom', 'unknown')`,
    ),
    check("market_candidates_inner_bags_check", sql`${table.innerBagsSealed} in ('yes', 'no', 'unknown')`),
    check("market_candidates_box_condition_check", sql`${table.boxCondition} in ('normal', 'significantly_damaged', 'unknown')`),
    check(
      "market_candidates_match_confidence_check",
      sql`${table.matchConfidence} is null or ${table.matchConfidence} in ('exact', 'strong', 'ambiguous', 'rejected')`,
    ),
    check("market_candidates_decision_check", sql`${table.decision} in ('accepted', 'needs_review', 'rejected', 'duplicate')`),
    check(
      "market_candidates_match_evidence_check",
      sql`${table.matchEvidence} <@ array[
        'item_number_exact', 'edition_name_exact', 'release_year_stated', 'reissue_stated',
        'chassis_stated', 'color_variant_match', 'packaging_generation_match', 'image_reviewed',
        'official_reference_match', 'manual_override'
      ]::text[]`,
    ),
    check(
      "market_candidates_accepted_audit_check",
      sql`${table.decision} <> 'accepted' or (
        ${table.resolvedReleaseId} is not null
        and ${table.matchConfidence} is not null
        and ${table.matchConfidence} in ('exact', 'strong')
        and cardinality(${table.matchEvidence}) > 0
      )`,
    ),
  ],
).enableRLS()

export const pricePoints = pgTable(
  "price_points",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => marketCandidates.id, { onDelete: "restrict" }),
    releaseId: uuid("release_id")
      .notNull()
      .references(() => productReleases.id, { onDelete: "restrict" }),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => priceSources.id, { onDelete: "restrict" }),
    observationType: text("observation_type").notNull(),
    condition: text("condition").notNull(),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    currency: text("currency").notNull(),
    shippingCost: numeric("shipping_cost", { precision: 12, scale: 2 }),
    shippingBasis: text("shipping_basis").notNull(),
    valuationPrice: numeric("valuation_price", { precision: 12, scale: 2 }),
    normalizedPriceEUR: numeric("normalized_price_eur", { precision: 12, scale: 2 }),
    fxRateToEUR: numeric("fx_rate_to_eur", { precision: 18, scale: 8 }),
    fxRateDate: date("fx_rate_date"),
    innerBagsSealed: text("inner_bags_sealed").notNull().default("unknown"),
    boxCondition: text("box_condition").notNull().default("unknown"),
    isComplete: boolean("is_complete"),
    isLot: boolean("is_lot"),
    quantity: integer("quantity"),
    matchConfidence: text("match_confidence").notNull(),
    matchEvidence: text("match_evidence").array().notNull(),
    evidenceGroupKey: text("evidence_group_key"),
    valuationEligible: boolean("valuation_eligible").notNull().default(false),
    status: text("status").notNull().default("active"),
    needsRevalidation: boolean("needs_revalidation").notNull().default(false),
    soldAt: timestamp("sold_at", { withTimezone: true }),
    soldOn: date("sold_on"),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("price_points_candidate_unique").on(table.candidateId),
    index("idx_price_points_release_condition").on(table.releaseId, table.condition),
    index("idx_price_points_sold").on(table.releaseId, table.soldOn, table.soldAt),
    index("idx_price_points_valuation").on(
      table.releaseId,
      table.condition,
      table.valuationEligible,
      table.status,
      table.needsRevalidation,
      table.soldOn,
      table.soldAt,
    ),
    index("idx_price_points_evidence_group").on(table.releaseId, table.condition, table.evidenceGroupKey),
    check("price_points_price_check", sql`${table.price} >= 0`),
    check("price_points_shipping_cost_check", sql`${table.shippingCost} is null or ${table.shippingCost} >= 0`),
    check("price_points_quantity_check", sql`${table.quantity} is null or ${table.quantity} >= 1`),
    check("price_points_sale_time_check", sql`${table.soldAt} is not null or ${table.soldOn} is not null`),
    check("price_points_observation_type_check", sql`${table.observationType} in ('sold_confirmed', 'auction_awarded', 'marketplace_sold')`),
    check(
      "price_points_condition_check",
      sql`${table.condition} in ('new_complete_unbuilt', 'built_complete', 'incomplete_parts_custom', 'unknown')`,
    ),
    check(
      "price_points_shipping_basis_check",
      sql`${table.shippingBasis} in ('excluded', 'included_exact', 'included_unknown', 'buyer_paid', 'unknown')`,
    ),
    check("price_points_inner_bags_check", sql`${table.innerBagsSealed} in ('yes', 'no', 'unknown')`),
    check("price_points_box_condition_check", sql`${table.boxCondition} in ('normal', 'significantly_damaged', 'unknown')`),
    check("price_points_match_confidence_check", sql`${table.matchConfidence} in ('exact', 'strong')`),
    check(
      "price_points_match_evidence_check",
      sql`cardinality(${table.matchEvidence}) > 0 and ${table.matchEvidence} <@ array[
        'item_number_exact', 'edition_name_exact', 'release_year_stated', 'reissue_stated',
        'chassis_stated', 'color_variant_match', 'packaging_generation_match', 'image_reviewed',
        'official_reference_match', 'manual_override'
      ]::text[]`,
    ),
    check("price_points_status_check", sql`${table.status} in ('active', 'excluded', 'reversed')`),
    check(
      "price_points_shipping_value_check",
      sql`(
        ${table.shippingBasis} in ('included_unknown', 'unknown')
        and ${table.valuationPrice} is null
        and ${table.normalizedPriceEUR} is null
        and ${table.fxRateToEUR} is null
        and ${table.fxRateDate} is null
      ) or (
        ${table.shippingBasis} in ('excluded', 'buyer_paid')
        and ${table.valuationPrice} = ${table.price}
      ) or (
        ${table.shippingBasis} = 'included_exact'
        and ${table.shippingCost} is not null
        and ${table.price} >= ${table.shippingCost}
        and ${table.valuationPrice} = ${table.price} - ${table.shippingCost}
      )`,
    ),
    check(
      "price_points_fx_check",
      sql`${table.valuationPrice} is null or (
        ${table.currency} = 'EUR'
        and ${table.normalizedPriceEUR} = ${table.valuationPrice}
        and ${table.fxRateToEUR} is null
        and ${table.fxRateDate} is null
      ) or (
        ${table.currency} <> 'EUR'
        and ${table.fxRateToEUR} is not null
        and ${table.fxRateToEUR} > 0
        and ${table.fxRateDate} is not null
        and ${table.normalizedPriceEUR} = round(${table.valuationPrice} * ${table.fxRateToEUR}, 2)
      )`,
    ),
    check(
      "price_points_valuation_eligibility_check",
      sql`${table.valuationEligible} = false or (
        ${table.status} = 'active'
        and ${table.needsRevalidation} = false
        and ${table.observationType} in ('sold_confirmed', 'auction_awarded', 'marketplace_sold')
        and ${table.condition} = 'new_complete_unbuilt'
        and ${table.matchConfidence} in ('exact', 'strong')
        and cardinality(${table.matchEvidence}) > 0
        and ${table.isComplete} is true
        and ${table.isLot} is false
        and ${table.quantity} = 1
        and ${table.evidenceGroupKey} is not null
        and ${table.shippingBasis} in ('excluded', 'included_exact', 'buyer_paid')
        and ${table.valuationPrice} is not null and ${table.valuationPrice} > 0
        and ${table.normalizedPriceEUR} is not null and ${table.normalizedPriceEUR} > 0
        and (${table.soldAt} is not null or ${table.soldOn} is not null)
      )`,
    ),
    pgPolicy("price_points_authenticated_read", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
).enableRLS()

export const marketEstimates = pgTable(
  "market_estimates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    releaseId: uuid("release_id")
      .notNull()
      .references(() => productReleases.id, { onDelete: "cascade" }),
    condition: text("condition").notNull(),
    displayMode: text("display_mode").notNull(),
    value: numeric("value", { precision: 12, scale: 2 }),
    currency: text("currency").notNull().default("EUR"),
    low: numeric("low", { precision: 12, scale: 2 }),
    high: numeric("high", { precision: 12, scale: 2 }),
    median: numeric("median", { precision: 12, scale: 2 }),
    sampleSize: integer("sample_size").notNull(),
    independentEvidenceCount: integer("independent_evidence_count").notNull(),
    windowDays: integer("window_days").notNull().default(365),
    lowestCurrentAsk: numeric("lowest_current_ask", { precision: 12, scale: 2 }),
    lastVerifiedSale: numeric("last_verified_sale", { precision: 12, scale: 2 }),
    lastVerifiedSaleAt: timestamp("last_verified_sale_at", { withTimezone: true }),
    lastVerifiedSaleOn: date("last_verified_sale_on"),
    trendPercent: numeric("trend_percent", { precision: 7, scale: 2 }),
    trendWindowDays: integer("trend_window_days"),
    lastScannedAt: timestamp("last_scanned_at", { withTimezone: true }),
    lastValuationChangeAt: timestamp("last_valuation_change_at", { withTimezone: true }),
    algorithmVersion: text("algorithm_version").notNull().default("v1"),
    computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("market_estimates_release_condition_unique").on(table.releaseId, table.condition),
    index("idx_market_estimates_release").on(table.releaseId),
    check(
      "market_estimates_condition_check",
      sql`${table.condition} in ('new_complete_unbuilt', 'built_complete', 'incomplete_parts_custom', 'unknown')`,
    ),
    check("market_estimates_currency_check", sql`${table.currency} = 'EUR'`),
    check("market_estimates_display_mode_check", sql`${table.displayMode} in ('last_sale', 'range', 'value')`),
    check(
      "market_estimates_counts_check",
      sql`${table.sampleSize} >= ${table.independentEvidenceCount}
        and ${table.independentEvidenceCount} >= 1
        and ${table.windowDays} in (365, 730)`,
    ),
    check(
      "market_estimates_range_check",
      sql`(${table.low} is null and ${table.high} is null)
        or (${table.low} is not null and ${table.high} is not null and ${table.low} <= ${table.high})`,
    ),
    check(
      "market_estimates_last_sale_check",
      sql`(${table.lastVerifiedSale} is null and ${table.lastVerifiedSaleAt} is null and ${table.lastVerifiedSaleOn} is null)
        or (${table.lastVerifiedSale} is not null and (${table.lastVerifiedSaleAt} is not null or ${table.lastVerifiedSaleOn} is not null))`,
    ),
    check(
      "market_estimates_trend_check",
      sql`(${table.trendPercent} is null and ${table.trendWindowDays} is null)
        or (${table.trendPercent} is not null and ${table.trendWindowDays} in (90, 365))`,
    ),
    check(
      "market_estimates_tier_check",
      sql`(
        ${table.independentEvidenceCount} = 1
        and ${table.displayMode} = 'last_sale'
        and ${table.lastVerifiedSale} is not null
        and ${table.value} = ${table.lastVerifiedSale}
        and ${table.low} is null and ${table.high} is null and ${table.median} is null
      ) or (
        ${table.independentEvidenceCount} between 2 and 4
        and ${table.displayMode} = 'range'
        and ${table.value} is null and ${table.median} is null
        and ${table.low} is not null and ${table.high} is not null
      ) or (
        ${table.independentEvidenceCount} >= 5
        and ${table.displayMode} = 'value'
        and ${table.value} is not null and ${table.median} is not null
        and ${table.low} is not null and ${table.high} is not null
        and ${table.value} = ${table.median}
      )`,
    ),
    pgPolicy("market_estimates_public_read", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS()

export const marketValueHistory = pgTable(
  "market_value_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    releaseId: uuid("release_id")
      .notNull()
      .references(() => productReleases.id, { onDelete: "cascade" }),
    condition: text("condition").notNull(),
    snapshotPeriod: date("snapshot_period").notNull(),
    displayMode: text("display_mode").notNull(),
    value: numeric("value", { precision: 12, scale: 2 }),
    low: numeric("low", { precision: 12, scale: 2 }),
    high: numeric("high", { precision: 12, scale: 2 }),
    median: numeric("median", { precision: 12, scale: 2 }),
    currency: text("currency").notNull().default("EUR"),
    independentEvidenceCount: integer("independent_evidence_count").notNull(),
    windowDays: integer("window_days").notNull(),
    algorithmVersion: text("algorithm_version").notNull().default("v1"),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("market_value_history_release_condition_period_unique").on(
      table.releaseId,
      table.condition,
      table.snapshotPeriod,
    ),
    index("idx_market_value_history_release_period").on(table.releaseId, table.condition, table.snapshotPeriod),
    check(
      "market_value_history_condition_check",
      sql`${table.condition} in ('new_complete_unbuilt', 'built_complete', 'incomplete_parts_custom', 'unknown')`,
    ),
    check("market_value_history_currency_check", sql`${table.currency} = 'EUR'`),
    check("market_value_history_display_mode_check", sql`${table.displayMode} in ('last_sale', 'range', 'value')`),
    check(
      "market_value_history_counts_check",
      sql`${table.independentEvidenceCount} >= 1 and ${table.windowDays} in (365, 730)`,
    ),
    check(
      "market_value_history_range_check",
      sql`(${table.low} is null and ${table.high} is null)
        or (${table.low} is not null and ${table.high} is not null and ${table.low} <= ${table.high})`,
    ),
    check(
      "market_value_history_tier_check",
      sql`(
        ${table.independentEvidenceCount} = 1
        and ${table.displayMode} = 'last_sale'
        and ${table.value} is not null
        and ${table.low} is null and ${table.high} is null and ${table.median} is null
      ) or (
        ${table.independentEvidenceCount} between 2 and 4
        and ${table.displayMode} = 'range'
        and ${table.value} is null and ${table.median} is null
        and ${table.low} is not null and ${table.high} is not null
      ) or (
        ${table.independentEvidenceCount} >= 5
        and ${table.displayMode} = 'value'
        and ${table.value} is not null and ${table.median} is not null
        and ${table.low} is not null and ${table.high} is not null
        and ${table.value} = ${table.median}
      )`,
    ),
    pgPolicy("market_value_history_public_read", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS()

export const marketReviewDigests = pgTable(
  "market_review_digests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    kind: text("kind").notNull().default("weekly_review"),
    status: text("status").notNull().default("pending"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("market_review_digests_period_kind_unique").on(table.periodStart, table.periodEnd, table.kind),
    check("market_review_digests_kind_check", sql`${table.kind} in ('weekly_review', 'scanner_failure')`),
    check("market_review_digests_status_check", sql`${table.status} in ('pending', 'sent', 'failed')`),
    check("market_review_digests_period_check", sql`${table.periodEnd} > ${table.periodStart}`),
    check("market_review_digests_sent_check", sql`(${table.status} = 'sent' and ${table.sentAt} is not null) or ${table.status} <> 'sent'`),
  ],
).enableRLS()

export const priceSourcesRelations = relations(priceSources, ({ many }) => ({
  pricePoints: many(pricePoints),
  scanTargets: many(marketScanTargets),
  candidates: many(marketCandidates),
}))

export const marketScanRunsRelations = relations(marketScanRuns, ({ many }) => ({
  candidates: many(marketCandidates),
}))

export const marketScanTargetsRelations = relations(marketScanTargets, ({ one }) => ({
  release: one(productReleases, { fields: [marketScanTargets.releaseId], references: [productReleases.id] }),
  source: one(priceSources, { fields: [marketScanTargets.sourceId], references: [priceSources.id] }),
}))

export const marketCandidatesRelations = relations(marketCandidates, ({ one, many }) => ({
  scanRun: one(marketScanRuns, { fields: [marketCandidates.scanRunId], references: [marketScanRuns.id] }),
  source: one(priceSources, { fields: [marketCandidates.sourceId], references: [priceSources.id] }),
  release: one(productReleases, {
    fields: [marketCandidates.resolvedReleaseId],
    references: [productReleases.id],
  }),
  pricePoints: many(pricePoints),
}))

export const pricePointsRelations = relations(pricePoints, ({ one }) => ({
  candidate: one(marketCandidates, { fields: [pricePoints.candidateId], references: [marketCandidates.id] }),
  release: one(productReleases, { fields: [pricePoints.releaseId], references: [productReleases.id] }),
  source: one(priceSources, { fields: [pricePoints.sourceId], references: [priceSources.id] }),
}))

export const marketEstimatesRelations = relations(marketEstimates, ({ one }) => ({
  release: one(productReleases, { fields: [marketEstimates.releaseId], references: [productReleases.id] }),
}))

export const marketValueHistoryRelations = relations(marketValueHistory, ({ one }) => ({
  release: one(productReleases, { fields: [marketValueHistory.releaseId], references: [productReleases.id] }),
}))
