// A user's collection.
//
// `quantity` is ONLY for copies that are genuinely identical in every way
// that matters to a collector — same release, same condition, same
// acquisition batch. The moment two physical copies differ in condition,
// purchase price, purchase date, or anything else worth tracking
// individually, they become two separate `collection_items` rows instead
// of one row with quantity = 2. This is a data-entry convention the
// application layer enforces later, not something the schema itself can
// force — the column just needs to exist and default sensibly to 1.

import { relations } from "drizzle-orm"
import { date, index, integer, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { products, productReleases } from "./catalog"
import { profiles } from "./profiles"

export const collectionItems = pgTable(
  "collection_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    releaseId: uuid("release_id")
      .notNull()
      .references(() => productReleases.id),
    // See file header: identical copies only. Different condition/price/etc
    // => separate rows, not a higher quantity.
    quantity: integer("quantity").notNull().default(1),
    condition: text("condition").notNull(), // 'Sealed' | 'New / Opened' | 'Built' | 'Used' | 'Incomplete'
    acquisitionDate: date("acquisition_date"),
    acquisitionPrice: numeric("acquisition_price", { precision: 10, scale: 2 }),
    acquisitionCurrency: text("acquisition_currency").notNull().default("EUR"),
    acquisitionSource: text("acquisition_source"), // 'eBay' | 'Negozio' | 'Mercatino' | ...
    // Collector's own correction, when the physical item's actual release
    // year is known to differ from the catalog release's nominal year
    // (e.g. old stock sold years later) — kept separate from releaseYear
    // on product_releases, which describes the catalog entry itself.
    releaseYearOverride: integer("release_year_override"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_collection_user").on(table.userId), index("idx_collection_release").on(table.releaseId)],
)

export const collectionItemPhotos = pgTable("collection_item_photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  collectionItemId: uuid("collection_item_id")
    .notNull()
    .references(() => collectionItems.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// Historical snapshots of a single owned item's estimated value, populated
// by a periodic job (later step) so the UI can chart "how has the value of
// my collection changed over time".
export const collectionItemValueHistory = pgTable(
  "collection_item_value_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    collectionItemId: uuid("collection_item_id")
      .notNull()
      .references(() => collectionItems.id, { onDelete: "cascade" }),
    estimatedValue: numeric("estimated_value", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("EUR"),
    confidence: text("confidence").notNull(), // 'High' | 'Medium' | 'Low' | 'Insufficient'
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_value_history_item_date").on(table.collectionItemId, table.recordedAt)],
)

export const collectionItemsRelations = relations(collectionItems, ({ one, many }) => ({
  owner: one(profiles, { fields: [collectionItems.userId], references: [profiles.id] }),
  product: one(products, { fields: [collectionItems.productId], references: [products.id] }),
  release: one(productReleases, { fields: [collectionItems.releaseId], references: [productReleases.id] }),
  photos: many(collectionItemPhotos),
  valueHistory: many(collectionItemValueHistory),
}))

export const collectionItemPhotosRelations = relations(collectionItemPhotos, ({ one }) => ({
  collectionItem: one(collectionItems, {
    fields: [collectionItemPhotos.collectionItemId],
    references: [collectionItems.id],
  }),
}))

export const collectionItemValueHistoryRelations = relations(collectionItemValueHistory, ({ one }) => ({
  collectionItem: one(collectionItems, {
    fields: [collectionItemValueHistory.collectionItemId],
    references: [collectionItems.id],
  }),
}))
