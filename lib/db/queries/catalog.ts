import "server-only"

import { eq } from "drizzle-orm"
import type { InferSelectModel } from "drizzle-orm"
import { db } from "../index"
import { brands, categories, productReleases, products } from "../schema"

export type Brand = InferSelectModel<typeof brands>
export type Category = InferSelectModel<typeof categories>
export type Product = InferSelectModel<typeof products>
export type ProductRelease = InferSelectModel<typeof productReleases>

export async function listBrands() {
  return db.select().from(brands).orderBy(brands.name)
}

export async function listCategories() {
  return db.select().from(categories).orderBy(categories.name)
}

// Catalog list view: products with brand/category names and their
// releases eager-loaded, since the catalog screen shows release count and
// the product-detail screen needs the release list right away.
export async function listProducts(limit = 50) {
  return db.query.products.findMany({
    with: { brand: true, category: true, releases: true },
    orderBy: (fields, { asc }) => [asc(fields.name)],
    limit,
  })
}

export async function getProductById(id: string) {
  return db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      brand: true,
      category: true,
      images: true,
      releases: { with: { images: true } },
    },
  })
}

export async function getProductBySlug(slug: string) {
  return db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: {
      brand: true,
      category: true,
      images: true,
      releases: { with: { images: true } },
    },
  })
}

export async function listReleasesForProduct(productId: string) {
  return db.query.productReleases.findMany({
    where: eq(productReleases.productId, productId),
    with: { images: true },
    orderBy: (fields, { asc }) => [asc(fields.releaseYear)],
  })
}

// A single release with its parent product attached — the shape the
// "add to collection/wishlist" flow and the market screen both need: they
// operate on one specific release, not just a model (see catalog.ts in
// lib/db/schema for why that distinction matters).
export async function getReleaseById(id: string) {
  return db.query.productReleases.findFirst({
    where: eq(productReleases.id, id),
    with: { product: true, images: true },
  })
}
