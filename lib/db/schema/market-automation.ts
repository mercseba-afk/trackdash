import { sql } from "drizzle-orm"
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core"
import { productReleases } from "./catalog"
import { priceSources } from "./market"

export const marketSourcePolicies = pgTable(
  "market_source_policies",
  {
    sourceId: uuid("source_id")
      .primaryKey()
      .references(() => priceSources.id, { onDelete: "cascade" }),
    sourceFamily: text("source_family").notNull(),
    scanScope: text("scan_scope").notNull(),
    independentKey: text("independent_key").notNull(),
    role: text("role").notNull(),
    includeByDefault: boolean("include_by_default").notNull().default(false),
    currentOfferCapable: boolean("current_offer_capable").notNull().default(false),
    completedSaleCapable: boolean("completed_sale_capable").notNull().default(false),
    unavailableProvidesContext: boolean("unavailable_provides_context").notNull().default(false),
    defaultIntervalHours: integer("default_interval_hours").notNull(),
    priority: integer("priority").notNull().default(0),
    adapterStatus: text("adapter_status").notNull().default("manual"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_market_source_policies_scope_priority").on(table.scanScope, table.priority.desc()),
    check(
      "market_source_policies_scope_check",
      sql`${table.scanScope} in ('retail', 'active_marketplace', 'sold_research')`,
    ),
    check(
      "market_source_policies_role_check",
      sql`${table.role} in ('structural_reference', 'primary_marketplace', 'secondary_marketplace', 'retail_reference', 'supporting_retail', 'internal_sales', 'other')`,
    ),
    check(
      "market_source_policies_adapter_status_check",
      sql`${table.adapterStatus} in ('ready', 'manual', 'planned', 'internal')`,
    ),
    check(
      "market_source_policies_interval_check",
      sql`${table.defaultIntervalHours} >= 24`,
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
    index("idx_market_scan_targets_due").on(table.enabled, table.nextScanAt, table.priority.desc()),
    check("market_scan_targets_interval_check", sql`${table.scanIntervalHours} >= 24`),
    check("market_scan_targets_failures_check", sql`${table.consecutiveFailures} >= 0`),
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
    index("idx_market_scan_runs_started").on(table.startedAt.desc()),
    check(
      "market_scan_runs_status_check",
      sql`${table.status} in ('running', 'completed', 'partial', 'failed')`,
    ),
    check(
      "market_scan_runs_counts_check",
      sql`${table.targetsAttempted} >= 0 and ${table.targetsSucceeded} >= 0 and ${table.candidatesFound} >= 0 and ${table.acceptedCount} >= 0 and ${table.reviewCount} >= 0 and ${table.rejectedCount} >= 0 and ${table.duplicateCount} >= 0 and ${table.valuationsChanged} >= 0 and ${table.trendsChanged} >= 0`,
    ),
    check(
      "market_scan_runs_time_check",
      sql`${table.finishedAt} is null or ${table.finishedAt} >= ${table.startedAt}`,
    ),
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
    index("idx_market_review_digests_period").on(table.periodEnd.desc()),
    check(
      "market_review_digests_kind_check",
      sql`${table.kind} in ('weekly_review', 'scanner_failure')`,
    ),
    check(
      "market_review_digests_status_check",
      sql`${table.status} in ('pending', 'sent', 'failed')`,
    ),
    check(
      "market_review_digests_period_check",
      sql`${table.periodEnd} > ${table.periodStart}`,
    ),
    check(
      "market_review_digests_sent_check",
      sql`(${table.status} = 'sent' and ${table.sentAt} is not null) or ${table.status} <> 'sent'`,
    ),
  ],
).enableRLS()
