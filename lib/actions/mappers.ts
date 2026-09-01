import "server-only"

import type { Chassis, CollectionItem, Condition, Currency, Product, ProductRelease, Rarity, ReleaseType, Series, WishlistItem, WishlistPriority } from "@/lib/types"

// Bridges Drizzle's DB row shapes (lib/db/schema/*.ts — numeric columns as
// strings, dates as Date/string per column mode, snake_case in Postgres but
// already camelCase here) to the UI's existing types (lib/types.ts), so
// screens built against those types don't need to know or care whether the
// data came from Postgres or (previously) localStorage/mock data.
//
// The casts below (e.g. `as Condition`, `as Chassis`) are a deliberate,
// narrow boundary: the database columns are intentionally plain TEXT (see
// the schema comments in lib/db/schema/catalog.ts) so the catalog can grow
// new values without a migration, while the UI still benefits from a
// closed union for things like <Select> options. Crossing that boundary
// always needs some cast; it's contained to these mapper functions rather
// than scattered through the app.

type CollectionRow = {
  id: string
  userId: string
  productId: string
  releaseId: string
  condition: string
  acquisitionDate: string | null
  acquisitionPrice: string | null
  acquisitionCurrency: string
  releaseYearOverride: number | null
  notes: string | null
  createdAt: Date
  photos?: { url: string }[]
}

export function mapCollectionRow(row: CollectionRow): CollectionItem {
  return {
    id: row.id,
    userId: row.userId,
    productId: row.productId,
    releaseId: row.releaseId,
    condition: row.condition as Condition,
    acquisitionDate: row.acquisitionDate ?? "",
    acquisitionPrice: row.acquisitionPrice ? Number(row.acquisitionPrice) : 0,
    acquisitionCurrency: row.acquisitionCurrency as Currency,
    releaseYearOverride: row.releaseYearOverride ?? undefined,
    notes: row.notes ?? undefined,
    photos: row.photos ? row.photos.map((p) => p.url) : [],
    createdAt: row.createdAt.toISOString(),
  }
}

type WishlistRow = {
  id: string
  userId: string
  productId: string
  releaseId: string | null
  priority: string
  targetPrice: string | null
  currency: string
  notes: string | null
  createdAt: Date
}

export function mapWishlistRow(row: WishlistRow): WishlistItem {
  return {
    id: row.id,
    userId: row.userId,
    productId: row.productId,
    releaseId: row.releaseId ?? undefined,
    priority: row.priority as WishlistPriority,
    targetPrice: row.targetPrice ? Number(row.targetPrice) : undefined,
    currency: row.currency as Currency,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt.toISOString(),
  }
}

type ReleaseRow = {
  id: string
  productId: string
  itemNumber: string
  releaseType: string
  editionName: string
  releaseYear: number
  releaseDate: string | null
  chassis: string
  barcodeJan: string | null
  color: string | null
  countryMarket: string | null
  msrpJpy: string | null
  msrpEur: string | null
  notes: string | null
  discontinued: boolean
  isOriginal: boolean
  rarity: string | null
  images?: { url: string }[]
}

export function mapReleaseRow(row: ReleaseRow): ProductRelease {
  return {
    id: row.id,
    productId: row.productId,
    itemNumber: row.itemNumber,
    releaseType: row.releaseType as ReleaseType,
    editionName: row.editionName,
    releaseYear: row.releaseYear,
    releaseDate: row.releaseDate ?? undefined,
    chassis: row.chassis as Chassis,
    barcodeJAN: row.barcodeJan ?? undefined,
    color: row.color ?? undefined,
    countryMarket: row.countryMarket ?? undefined,
    msrpJPY: row.msrpJpy ? Number(row.msrpJpy) : undefined,
    msrpEUR: row.msrpEur ? Number(row.msrpEur) : undefined,
    images: row.images ? row.images.map((i) => i.url) : [],
    notes: row.notes ?? undefined,
    discontinued: row.discontinued,
    isOriginal: row.isOriginal,
    rarity: (row.rarity as Rarity) ?? undefined,
  }
}

type ProductRow = {
  id: string
  slug: string
  canonicalItemNumber: string | null
  name: string
  japaneseName: string | null
  series: string | null
  chassis: string | null
  originalReleaseYear: number
  rarity: string
  description: string | null
  images?: { url: string }[]
  releases?: ReleaseRow[]
}

export function mapProductRow(row: ProductRow): Product {
  const releases = (row.releases ?? []).map(mapReleaseRow)
  const primary = releases.find((r) => r.isOriginal) ?? releases[0]
  return {
    id: row.id,
    category: "mini4wd",
    itemNumber: row.canonicalItemNumber ?? row.releases?.[0]?.itemNumber ?? "",
    name: row.name,
    japaneseName: row.japaneseName ?? undefined,
    series: (row.series as Series) ?? "Racing Mini 4WD",
    chassis: (row.chassis as Chassis) ?? primary?.chassis ?? "MA",
    originalReleaseYear: row.originalReleaseYear,
    rarity: row.rarity as Rarity,
    description: row.description ?? "",
    images: row.images ? row.images.map((i) => i.url) : [],
    releases,
    hasMultipleReleases: releases.length > 1,
    msrpJPY: primary?.msrpJPY ?? 0,
    msrpEUR: primary?.msrpEUR ?? 0,
  }
}
