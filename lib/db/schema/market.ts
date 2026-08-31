// Price Intelligence schema.
//
// IMPORTANT — scope of this file: table definitions only. No eBay/Mercari/
// Yahoo Auctions integration, no scraper, no aggregation job exists yet.
// Those are explicitly deferred to a later step once real data sources are
// evaluated. What's here is the storage designed to support them later
// without a schema rewrite.
//
// Two-layer design:
//   - `price_points` is the raw, append-only, source-of-truth layer. One
//     row per observed data point (a sale, an active listing, a manual
//     user entry, an MSRP record). Never aggregated in place.
//   - `market_estimates` is a derived/cached layer, fully recomputable at
//     any time from `price_points`. It exists purely so the UI doesn't
//     have to re-run statistics on every page load; a future periodic job
//     is what will populate it.

import { relations, sql } from "drizzle-orm"
import { boolean, date, index, integer, jsonb, numeric, pgPolicy, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core"
import { anonRole, authenticatedRole } from "drizzle-orm/supabase"
import { productReleases } from "./catalog"
import { profiles } from "./profiles"

// RLS notes for this file (kept intentionally simple, per Step 3 scope):
//   - price_sources and market_estimates are treated like the catalog:
//     public, read-only reference/display data. Nothing sensitive in them.
//   - price_points is read-only to AUTHENTICATED users only (not anon),
//     unlike the other two — it carries submitted_by_user_id, which could
//     identify who submitted a manually-entered price once that feature
//     exists. Restricting raw price_points to signed-in users now avoids
//     having to tighten this later once real data (and real privacy
//     stakes) show up.
//   - No insert/update/delete policy is granted to anon/authenticated on
//     any of the three: all writes go through the service role (future
//     ingestion jobs), which bypasses RLS entirely and needs no policy.

export const priceSources = pgTable(
  "price_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(), // 'ebay_sold' | 'ebay_listing' | 'mercari' | 'yahoo_auctions_jp' | 'user' | 'msrp'
    name: text("name").notNull(),
    sourceType: text("source_type").notNull(), // 'sold' | 'listing' | 'user' | 'msrp' — drives the trust hierarchy
    baseTrustScore: numeric("base_trust_score", { precision: 3, scale: 2 }).notNull().default("1.0"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  () => [
    pgPolicy("price_sources_public_read", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS()

export const pricePoints = pgTable(
  "price_points",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    releaseId: uuid("release_id")
      .notNull()
      .references(() => productReleases.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => priceSources.id),
    condition: text("condition").notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").notNull(),
    shippingCost: numeric("shipping_cost", { precision: 10, scale: 2 }),
    // Denormalized copy of price_sources.source_type for fast filtering
    // without a join — kept in sync at write time by whatever ingests data.
    priceType: text("price_type").notNull(),
    isSold: boolean("is_sold").notNull().default(false),
    saleDate: date("sale_date"),
    listingDate: date("listing_date"),
    listingUrl: text("listing_url"),
    // Source-side unique id, used together with sourceId below to make
    // re-running an import idempotent instead of creating duplicates.
    externalListingId: text("external_listing_id"),
    submittedByUserId: uuid("submitted_by_user_id").references(() => profiles.id), // only set when priceType = 'user'
    reliabilityScore: numeric("reliability_score", { precision: 3, scale: 2 }), // computed later: outlier penalty, seller trust, etc.
    rawPayload: jsonb("raw_payload"), // raw response from the source, for debugging/audit — not used by any code yet
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_price_points_release_condition").on(table.releaseId, table.condition),
    index("idx_price_points_sale_date").on(table.releaseId, table.saleDate),
    unique("price_points_source_external_id_unique").on(table.sourceId, table.externalListingId),
    pgPolicy("price_points_authenticated_read", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
).enableRLS()

// Cached aggregate per (release, condition). `condition = NULL` means a
// release-level estimate not broken down by condition. Always safe to
// TRUNCATE and recompute from price_points — it holds no information that
// doesn't already exist there.
export const marketEstimates = pgTable(
  "market_estimates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    releaseId: uuid("release_id")
      .notNull()
      .references(() => productReleases.id, { onDelete: "cascade" }),
    condition: text("condition"),
    value: numeric("value", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("EUR"),
    confidence: text("confidence").notNull(), // 'High' | 'Medium' | 'Low' | 'Insufficient'
    sampleSize: integer("sample_size").notNull(),
    low: numeric("low", { precision: 10, scale: 2 }),
    high: numeric("high", { precision: 10, scale: 2 }),
    median: numeric("median", { precision: 10, scale: 2 }),
    average: numeric("average", { precision: 10, scale: 2 }),
    trend30d: numeric("trend_30d", { precision: 6, scale: 2 }),
    trend90d: numeric("trend_90d", { precision: 6, scale: 2 }),
    direction: text("direction"), // 'rising' | 'stable' | 'falling'
    computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
    isDemo: boolean("is_demo").notNull().default(false), // carried over from the current v0 prototype's honesty-in-the-UI convention
  },
  (table) => [
    index("idx_market_estimates_release").on(table.releaseId),
    unique("market_estimates_release_condition_unique").on(table.releaseId, table.condition),
    pgPolicy("market_estimates_public_read", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS()

export const priceSourcesRelations = relations(priceSources, ({ many }) => ({
  pricePoints: many(pricePoints),
}))

export const pricePointsRelations = relations(pricePoints, ({ one }) => ({
  release: one(productReleases, { fields: [pricePoints.releaseId], references: [productReleases.id] }),
  source: one(priceSources, { fields: [pricePoints.sourceId], references: [priceSources.id] }),
  submittedBy: one(profiles, { fields: [pricePoints.submittedByUserId], references: [profiles.id] }),
}))

export const marketEstimatesRelations = relations(marketEstimates, ({ one }) => ({
  release: one(productReleases, { fields: [marketEstimates.releaseId], references: [productReleases.id] }),
}))
