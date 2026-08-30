// Taxonomy: brands and categories.
//
// Kept as its own top layer so that TrackDash can later extend from
// "Mini 4WD only" to "Collectibles -> Brand -> Product -> Release" without
// reshaping the tables below (products/releases already point at a
// category and a brand, not at "Mini 4WD" directly).

import type { AnyPgColumn } from "drizzle-orm/pg-core"
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(), // 'tamiya'
  name: text("name").notNull(), // 'Tamiya'
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(), // 'mini4wd'
  name: text("name").notNull(), // 'Mini 4WD'
  // Self-reference for future category hierarchies (e.g. Mini 4WD -> AR Chassis).
  // Not used by the current single-category MVP but costs nothing to have.
  parentId: uuid("parent_id").references((): AnyPgColumn => categories.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
