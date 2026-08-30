// Cross-table relations that don't naturally belong inside a single
// domain file, kept together here so each schema file above can stay
// focused on its own table definitions. Powers Drizzle's relational query
// API (db.query.products.findMany({ with: { releases: true } })) once the
// UI is actually wired up to the database in a later step.

import { relations } from "drizzle-orm"
import { productImages, productReleases, products, releaseImages } from "./catalog"
import { brands, categories } from "./taxonomy"

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}))

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, { fields: [categories.parentId], references: [categories.id] }),
  products: many(products),
}))

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  brand: one(brands, { fields: [products.brandId], references: [brands.id] }),
  releases: many(productReleases),
  images: many(productImages),
}))

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}))

export const productReleasesRelations = relations(productReleases, ({ one, many }) => ({
  product: one(products, { fields: [productReleases.productId], references: [products.id] }),
  images: many(releaseImages),
}))

export const releaseImagesRelations = relations(releaseImages, ({ one }) => ({
  release: one(productReleases, { fields: [releaseImages.releaseId], references: [productReleases.id] }),
}))
