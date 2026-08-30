// Wishlist. Unlike collection_items, `releaseId` is nullable here — this is
// the one deliberate place in the schema where "any release of this model"
// is a valid thing to want, since a collector may not care yet which
// specific edition they end up finding.

import { relations } from "drizzle-orm"
import { index, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { products, productReleases } from "./catalog"
import { profiles } from "./profiles"

export const wishlistItems = pgTable(
  "wishlist_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    releaseId: uuid("release_id").references(() => productReleases.id), // NULL = any release of this model
    priority: text("priority").notNull().default("Medium"), // 'Low' | 'Medium' | 'High'
    targetPrice: numeric("target_price", { precision: 10, scale: 2 }),
    currency: text("currency").notNull().default("EUR"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_wishlist_user").on(table.userId)],
)

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  owner: one(profiles, { fields: [wishlistItems.userId], references: [profiles.id] }),
  product: one(products, { fields: [wishlistItems.productId], references: [products.id] }),
  release: one(productReleases, { fields: [wishlistItems.releaseId], references: [productReleases.id] }),
}))
