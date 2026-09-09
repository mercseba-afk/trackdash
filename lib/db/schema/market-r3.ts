import { relations, sql } from "drizzle-orm"
import {
  boolean,
  check,
  date,
  foreignKey,
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
import { marketCandidates, priceSources } from "./market"

export const marketAggregateObservations = pgTable(
  "market_aggregate_observations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => priceSources.id, { onDelete: "restrict" }),
    releaseId: uuid("release_id").references(() => productReleases.id, { onDelete: "restrict" }),
    itemNumber: text("item_number").notNull(),
    possibleReleaseIds: uuid("possible_release_ids").array().notNull().default(sql`'{}'::uuid[]`),
    attributionStatus: text("attribution_status").notNull(),
    grain: text("grain").notNull(),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    condition: text("condition").notNull().default("unknown"),
    queryKey: text("query_key").notNull(),
    queryDescription: text("query_description"),
    salesCount: integer("sales_count").notNull(),
    sellerCount: integer("seller_count"),
    averageItemPrice: numeric("average_item_price", { precision: 12, scale: 2 }).notNull(),
    lowItemPrice: numeric("low_item_price", { precision: 12, scale: 2 }),
    highItemPrice: numeric("high_item_price", { precision: 12, scale: 2 }),
    averageShipping: numeric("average_shipping", { precision: 12, scale: 2 }),
    freeShippingPct: numeric("free_shipping_pct", { precision: 5, scale: 2 }),
    auctionSalesCount: integer("auction_sales_count"),
    buyItNowSalesCount: integer("buy_it_now_sales_count"),
    acceptedOfferSalesCount: integer("accepted_offer_sales_count"),
    currency: text("currency").notNull(),
    marketAverageEUR: numeric("market_average_eur", { precision: 12, scale: 2 }),
    fxRateToEUR: numeric("fx_rate_to_eur", { precision: 18, scale: 8 }),
    fxRateDate: date("fx_rate_date"),
    evidenceGrade: text("evidence_grade").notNull().default("indicative"),
    provenanceUrl: text("provenance_url"),
    rawPayload: jsonb("raw_payload"),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("market_aggregate_observations_unique").on(
      table.sourceId,
      table.queryKey,
      table.periodStart,
      table.periodEnd,
      table.itemNumber,
    ),
    index("idx_market_aggregate_release_period").on(table.releaseId, table.condition, table.periodEnd.desc()),
    index("idx_market_aggregate_item_period").on(table.itemNumber, table.periodEnd.desc()),
    check(
      "market_aggregate_attribution_check",
      sql`${table.attributionStatus} in ('release_exact', 'release_matched', 'item_pool', 'ambiguous_release')`,
    ),
    check(
      "market_aggregate_identity_check",
      sql`(${table.releaseId} is not null and ${table.attributionStatus} in ('release_exact', 'release_matched'))
        or (${table.releaseId} is null and ${table.attributionStatus} in ('item_pool', 'ambiguous_release'))`,
    ),
    check(
      "market_aggregate_grain_check",
      sql`${table.grain} in ('monthly', 'rolling_window', 'full_history')`,
    ),
    check(
      "market_aggregate_period_check",
      sql`${table.periodEnd} >= ${table.periodStart}`,
    ),
    check(
      "market_aggregate_condition_check",
      sql`${table.condition} in ('new_complete_unbuilt', 'built_complete', 'incomplete_parts_custom', 'unknown')`,
    ),
    check(
      "market_aggregate_counts_check",
      sql`${table.salesCount} >= 1
        and (${table.sellerCount} is null or ${table.sellerCount} >= 1)
        and (${table.auctionSalesCount} is null or ${table.auctionSalesCount} >= 0)
        and (${table.buyItNowSalesCount} is null or ${table.buyItNowSalesCount} >= 0)
        and (${table.acceptedOfferSalesCount} is null or ${table.acceptedOfferSalesCount} >= 0)`,
    ),
    check(
      "market_aggregate_price_check",
      sql`${table.averageItemPrice} > 0
        and (${table.lowItemPrice} is null or ${table.lowItemPrice} >= 0)
        and (${table.highItemPrice} is null or ${table.highItemPrice} >= 0)
        and ((${table.lowItemPrice} is null and ${table.highItemPrice} is null)
          or (${table.lowItemPrice} is not null and ${table.highItemPrice} is not null
            and ${table.lowItemPrice} <= ${table.averageItemPrice}
            and ${table.averageItemPrice} <= ${table.highItemPrice}))
        and (${table.averageShipping} is null or ${table.averageShipping} >= 0)
        and (${table.freeShippingPct} is null or (${table.freeShippingPct} >= 0 and ${table.freeShippingPct} <= 100))`,
    ),
    check(
      "market_aggregate_grade_check",
      sql`${table.evidenceGrade} in ('verified', 'indicative')`,
    ),
    check(
      "market_aggregate_fx_check",
      sql`${table.marketAverageEUR} is null or (
        ${table.marketAverageEUR} > 0 and (
          (${table.currency} = 'EUR'
            and ${table.marketAverageEUR} = ${table.averageItemPrice}
            and ${table.fxRateToEUR} is null
            and ${table.fxRateDate} is null)
          or
          (${table.currency} <> 'EUR'
            and ${table.fxRateToEUR} is not null
            and ${table.fxRateToEUR} > 0
            and ${table.fxRateDate} is not null
            and ${table.marketAverageEUR} = round(${table.averageItemPrice} * ${table.fxRateToEUR}, 2))
        )
      )`,
    ),
  ],
).enableRLS()

export const marketOfferStates = pgTable(
  "market_offer_states",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    candidateId: uuid("candidate_id").notNull(),
    releaseId: uuid("release_id")
      .notNull()
      .references(() => productReleases.id, { onDelete: "restrict" }),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => priceSources.id, { onDelete: "restrict" }),
    condition: text("condition").notNull().default("new_complete_unbuilt"),
    channel: text("channel").notNull(),
    availability: text("availability").notNull(),
    sellerFingerprint: text("seller_fingerprint"),
    itemPrice: numeric("item_price", { precision: 12, scale: 2 }).notNull(),
    shippingPrice: numeric("shipping_price", { precision: 12, scale: 2 }),
    currency: text("currency").notNull(),
    itemPriceEUR: numeric("item_price_eur", { precision: 12, scale: 2 }).notNull(),
    shippingEUR: numeric("shipping_eur", { precision: 12, scale: 2 }),
    effectiveCostEUR: numeric("effective_cost_eur", { precision: 12, scale: 2 }),
    costBasis: text("cost_basis").notNull(),
    fxRateToEUR: numeric("fx_rate_to_eur", { precision: 18, scale: 8 }),
    fxRateDate: date("fx_rate_date"),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull(),
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }).notNull(),
    changedAt: timestamp("changed_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("market_offer_states_candidate_unique").on(table.candidateId),
    foreignKey({
      columns: [table.candidateId, table.sourceId, table.releaseId],
      foreignColumns: [marketCandidates.id, marketCandidates.sourceId, marketCandidates.resolvedReleaseId],
      name: "market_offer_states_candidate_identity_fk",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
    index("idx_market_offer_states_release_current").on(table.releaseId, table.condition, table.channel, table.availability),
    index("idx_market_offer_states_source").on(table.sourceId, table.lastCheckedAt.desc()),
    check(
      "market_offer_states_condition_check",
      sql`${table.condition} in ('new_complete_unbuilt', 'built_complete', 'incomplete_parts_custom', 'unknown')`,
    ),
    check("market_offer_states_channel_check", sql`${table.channel} in ('retail', 'marketplace')`),
    check(
      "market_offer_states_availability_check",
      sql`${table.availability} in ('in_stock', 'low_stock', 'preorder', 'backorder', 'out_of_stock', 'discontinued', 'unknown')`,
    ),
    check("market_offer_states_price_check", sql`${table.itemPrice} > 0 and ${table.itemPriceEUR} > 0`),
    check(
      "market_offer_states_shipping_check",
      sql`${table.shippingPrice} is null or ${table.shippingPrice} >= 0`,
    ),
    check(
      "market_offer_states_cost_basis_check",
      sql`(
        ${table.costBasis} = 'delivered'
        and ${table.shippingEUR} is not null
        and ${table.shippingEUR} >= 0
        and ${table.effectiveCostEUR} = ${table.itemPriceEUR} + ${table.shippingEUR}
      ) or (
        ${table.costBasis} = 'item_only'
        and ${table.effectiveCostEUR} is null
      )`,
    ),
    check(
      "market_offer_states_time_check",
      sql`${table.lastCheckedAt} >= ${table.firstSeenAt} and ${table.changedAt} >= ${table.firstSeenAt}`,
    ),
  ],
).enableRLS()

export const marketOfferHistory = pgTable(
  "market_offer_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    offerStateId: uuid("offer_state_id")
      .notNull()
      .references(() => marketOfferStates.id, { onDelete: "restrict" }),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => marketCandidates.id, { onDelete: "restrict" }),
    releaseId: uuid("release_id")
      .notNull()
      .references(() => productReleases.id, { onDelete: "restrict" }),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => priceSources.id, { onDelete: "restrict" }),
    condition: text("condition").notNull(),
    channel: text("channel").notNull(),
    availability: text("availability").notNull(),
    itemPriceEUR: numeric("item_price_eur", { precision: 12, scale: 2 }).notNull(),
    shippingEUR: numeric("shipping_eur", { precision: 12, scale: 2 }),
    effectiveCostEUR: numeric("effective_cost_eur", { precision: 12, scale: 2 }),
    costBasis: text("cost_basis").notNull(),
    changeKind: text("change_kind").notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("market_offer_history_state_observed_unique").on(table.offerStateId, table.observedAt),
    index("idx_market_offer_history_release").on(table.releaseId, table.condition, table.observedAt.desc()),
    check("market_offer_history_channel_check", sql`${table.channel} in ('retail', 'marketplace')`),
    check(
      "market_offer_history_availability_check",
      sql`${table.availability} in ('in_stock', 'low_stock', 'preorder', 'backorder', 'out_of_stock', 'discontinued', 'unknown')`,
    ),
    check(
      "market_offer_history_cost_basis_check",
      sql`${table.costBasis} in ('delivered', 'item_only')`,
    ),
    check(
      "market_offer_history_change_kind_check",
      sql`${table.changeKind} in ('initial', 'price_change', 'availability_change', 'price_and_availability', 'shipping_change')`,
    ),
  ],
).enableRLS()

export const marketReleaseSignals = pgTable(
  "market_release_signals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    releaseId: uuid("release_id")
      .notNull()
      .references(() => productReleases.id, { onDelete: "cascade" }),
    condition: text("condition").notNull().default("new_complete_unbuilt"),
    marketRegime: text("market_regime").notNull(),
    marketValueEUR: numeric("market_value_eur", { precision: 12, scale: 2 }),
    lowEUR: numeric("low_eur", { precision: 12, scale: 2 }),
    highEUR: numeric("high_eur", { precision: 12, scale: 2 }),
    confidenceScore: integer("confidence_score").notNull(),
    confidenceLabel: text("confidence_label").notNull(),
    retailAnchorEUR: numeric("retail_anchor_eur", { precision: 12, scale: 2 }),
    activeAnchorEUR: numeric("active_anchor_eur", { precision: 12, scale: 2 }),
    soldAnchorEUR: numeric("sold_anchor_eur", { precision: 12, scale: 2 }),
    startingOfferCandidateId: uuid("starting_offer_candidate_id").references(() => marketCandidates.id, { onDelete: "set null" }),
    startingItemPriceEUR: numeric("starting_item_price_eur", { precision: 12, scale: 2 }),
    startingShippingEUR: numeric("starting_shipping_eur", { precision: 12, scale: 2 }),
    startingEffectiveCostEUR: numeric("starting_effective_cost_eur", { precision: 12, scale: 2 }),
    startingCostBasis: text("starting_cost_basis"),
    retailSourceCount: integer("retail_source_count").notNull().default(0),
    activeOfferCount: integer("active_offer_count").notNull().default(0),
    currentOfferCount: integer("current_offer_count").notNull().default(0),
    soldUnits: integer("sold_units").notNull().default(0),
    soldSourceCount: integer("sold_source_count").notNull().default(0),
    soldEvidenceCount: integer("sold_evidence_count").notNull().default(0),
    shippingKnownRatio: numeric("shipping_known_ratio", { precision: 5, scale: 4 }).notNull().default("0"),
    trendPercent: numeric("trend_percent", { precision: 8, scale: 2 }),
    trendWindowMonths: integer("trend_window_months"),
    algorithmVersion: text("algorithm_version").notNull().default("r3"),
    computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("market_release_signals_release_condition_unique").on(table.releaseId, table.condition),
    index("idx_market_release_signals_release").on(table.releaseId),
    check(
      "market_release_signals_condition_check",
      sql`${table.condition} in ('new_complete_unbuilt', 'built_complete', 'incomplete_parts_custom', 'unknown')`,
    ),
    check(
      "market_release_signals_regime_check",
      sql`${table.marketRegime} in ('retail_driven', 'mixed_scarce', 'secondary_market_driven', 'insufficient')`,
    ),
    check(
      "market_release_signals_confidence_check",
      sql`${table.confidenceScore} between 0 and 100 and ${table.confidenceLabel} in ('low', 'medium', 'high')`,
    ),
    check(
      "market_release_signals_values_check",
      sql`(${table.marketValueEUR} is null or ${table.marketValueEUR} > 0)
        and (${table.lowEUR} is null or ${table.lowEUR} > 0)
        and (${table.highEUR} is null or ${table.highEUR} > 0)
        and ((${table.lowEUR} is null and ${table.highEUR} is null)
          or (${table.lowEUR} is not null and ${table.highEUR} is not null and ${table.lowEUR} <= ${table.highEUR}))`,
    ),
    check(
      "market_release_signals_counts_check",
      sql`${table.retailSourceCount} >= 0
        and ${table.activeOfferCount} >= 0
        and ${table.currentOfferCount} >= 0
        and ${table.soldUnits} >= 0
        and ${table.soldSourceCount} >= 0
        and ${table.soldEvidenceCount} >= 0`,
    ),
    check(
      "market_release_signals_shipping_ratio_check",
      sql`${table.shippingKnownRatio} >= 0 and ${table.shippingKnownRatio} <= 1`,
    ),
    check(
      "market_release_signals_starting_basis_check",
      sql`${table.startingCostBasis} is null or ${table.startingCostBasis} in ('delivered', 'item_only')`,
    ),
    check(
      "market_release_signals_trend_check",
      sql`(${table.trendPercent} is null and ${table.trendWindowMonths} is null)
        or (${table.trendPercent} is not null and ${table.trendWindowMonths} in (1, 3, 6, 12))`,
    ),
    pgPolicy("market_release_signals_public_read", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS()

export const marketReleaseMonthlySignals = pgTable(
  "market_release_monthly_signals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    releaseId: uuid("release_id")
      .notNull()
      .references(() => productReleases.id, { onDelete: "cascade" }),
    condition: text("condition").notNull().default("new_complete_unbuilt"),
    month: date("month").notNull(),
    marketRegime: text("market_regime").notNull(),
    marketValueEUR: numeric("market_value_eur", { precision: 12, scale: 2 }),
    retailAnchorEUR: numeric("retail_anchor_eur", { precision: 12, scale: 2 }),
    activeAnchorEUR: numeric("active_anchor_eur", { precision: 12, scale: 2 }),
    soldAnchorEUR: numeric("sold_anchor_eur", { precision: 12, scale: 2 }),
    soldUnits: integer("sold_units").notNull().default(0),
    retailSourceCount: integer("retail_source_count").notNull().default(0),
    activeOfferCount: integer("active_offer_count").notNull().default(0),
    confidenceScore: integer("confidence_score").notNull(),
    algorithmVersion: text("algorithm_version").notNull().default("r3"),
    computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("market_release_monthly_signals_unique").on(table.releaseId, table.condition, table.month),
    index("idx_market_release_monthly_signals_release_month").on(table.releaseId, table.condition, table.month.desc()),
    check("market_release_monthly_signals_month_check", sql`${table.month} = date_trunc('month', ${table.month})::date`),
    check(
      "market_release_monthly_signals_regime_check",
      sql`${table.marketRegime} in ('retail_driven', 'mixed_scarce', 'secondary_market_driven', 'insufficient')`,
    ),
    check(
      "market_release_monthly_signals_confidence_check",
      sql`${table.confidenceScore} between 0 and 100`,
    ),
    pgPolicy("market_release_monthly_signals_public_read", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS()

export const marketScanQueue = pgTable(
  "market_scan_queue",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    releaseId: uuid("release_id")
      .notNull()
      .references(() => productReleases.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => priceSources.id, { onDelete: "cascade" }),
    scanScope: text("scan_scope").notNull(),
    enabled: boolean("enabled").notNull().default(false),
    activityTier: text("activity_tier").notNull().default("normal"),
    scanIntervalHours: integer("scan_interval_hours").notNull(),
    priority: integer("priority").notNull().default(0),
    lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
    lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),
    lastMaterialChangeAt: timestamp("last_material_change_at", { withTimezone: true }),
    stableSince: timestamp("stable_since", { withTimezone: true }),
    nextScanAt: timestamp("next_scan_at", { withTimezone: true }).notNull().defaultNow(),
    consecutiveFailures: integer("consecutive_failures").notNull().default(0),
    lastError: text("last_error"),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("market_scan_queue_release_source_scope_unique").on(table.releaseId, table.sourceId, table.scanScope),
    index("idx_market_scan_queue_due").on(table.enabled, table.nextScanAt, table.priority.desc()),
    check(
      "market_scan_queue_scope_check",
      sql`${table.scanScope} in ('retail', 'active_marketplace', 'sold_research')`,
    ),
    check(
      "market_scan_queue_tier_check",
      sql`${table.activityTier} in ('hot', 'normal', 'cold')`,
    ),
    check(
      "market_scan_queue_interval_check",
      sql`${table.scanIntervalHours} >= 24`,
    ),
    check(
      "market_scan_queue_failures_check",
      sql`${table.consecutiveFailures} >= 0`,
    ),
  ],
).enableRLS()

export const marketOfferStatesRelations = relations(marketOfferStates, ({ one, many }) => ({
  candidate: one(marketCandidates, {
    fields: [marketOfferStates.candidateId],
    references: [marketCandidates.id],
  }),
  release: one(productReleases, {
    fields: [marketOfferStates.releaseId],
    references: [productReleases.id],
  }),
  source: one(priceSources, {
    fields: [marketOfferStates.sourceId],
    references: [priceSources.id],
  }),
  history: many(marketOfferHistory),
}))

export const marketOfferHistoryRelations = relations(marketOfferHistory, ({ one }) => ({
  offerState: one(marketOfferStates, {
    fields: [marketOfferHistory.offerStateId],
    references: [marketOfferStates.id],
  }),
}))

export const marketAggregateObservationsRelations = relations(marketAggregateObservations, ({ one }) => ({
  release: one(productReleases, {
    fields: [marketAggregateObservations.releaseId],
    references: [productReleases.id],
  }),
  source: one(priceSources, {
    fields: [marketAggregateObservations.sourceId],
    references: [priceSources.id],
  }),
}))

export const marketReleaseSignalsRelations = relations(marketReleaseSignals, ({ one }) => ({
  release: one(productReleases, {
    fields: [marketReleaseSignals.releaseId],
    references: [productReleases.id],
  }),
}))

export const marketReleaseMonthlySignalsRelations = relations(marketReleaseMonthlySignals, ({ one }) => ({
  release: one(productReleases, {
    fields: [marketReleaseMonthlySignals.releaseId],
    references: [productReleases.id],
  }),
}))
