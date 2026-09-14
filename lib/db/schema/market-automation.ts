import { sql } from "drizzle-orm"
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { priceSources } from "./market"

// Source-level acquisition policy is the only new persistence object in
// Market Automation v1. Scanner targets/runs/digests already exist in market.ts
// and are intentionally reused rather than duplicated.
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
