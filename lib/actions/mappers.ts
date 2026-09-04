import "server-only"

import type {
  Chassis,
  CollectionItem,
  Condition,
  Currency,
  EditionType,
  Product,
  ProductRelease,
  ProductionStatus,
  Rarity,
  ReleaseSource,
  ReleaseSourceType,
  ReleaseType,
  Series,
  VerificationStatus,
  WishlistItem,
  WishlistPriority,
} from "@/lib/types"

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

type SourceRow = {
  id: string
  releaseId: string
  sourceType: string
  sourceUrl: string | null
  verifiedFields: string[]
  checkedAt: string | null
  notes: string | null
}

function mapSourceRow(row: SourceRow): ReleaseSource {
  return {
    id: row.id,
    releaseId: row.releaseId,
    sourceType: row.sourceType as ReleaseSourceType,
    sourceUrl: row.sourceUrl ?? undefined,
    verifiedFields: row.verifiedFields ?? [],
    checkedAt: row.checkedAt ?? undefined,
    notes: row.notes ?? undefined,
  }
}

type ReleaseRow = {
  id: string
  productId: string
  itemNumber: string | null
  releaseType: string
  editionType: string
  editionName: string
  releaseYear: number | null
  releaseDate: string | null
  chassis: string | null
  barcodeJan: string | null
  color: string | null
  countryMarket: string | null
  msrpJpy: string | null
  msrpEur: string | null
  notes: string | null
  discontinued: boolean
  isOriginal: boolean
  rarity: string | null
  verificationStatus: string
  productionStatus: string
  statusCheckedAt: Date | null
  images?: { url: string }[]
  sources?: SourceRow[]
}

export function mapReleaseRow(row: ReleaseRow): ProductRelease {
  return {
    id: row.id,
    productId: row.productId,
    itemNumber: row.itemNumber ?? undefined,
    releaseType: row.releaseType as ReleaseType,
    editionType: row.editionType as EditionType,
    editionName: row.editionName,
    releaseYear: row.releaseYear ?? undefined,
    releaseDate: row.releaseDate ?? undefined,
    chassis: (row.chassis as Chassis) ?? undefined,
    barcodeJAN: row.barcodeJan ?? undefined,
    color: row.color ?? undefined,
    countryMarket: row.countryMarket ?? undefined,
    msrpJPY: row.msrpJpy ? Number(row.msrpJpy) : undefined,
    msrpEUR: row.msrpEur ? Number(row.msrpEur) : undefined,
    // estimatedMsrpJPY/EUR deliberately left undefined here: the database
    // has no concept of a demo estimate (see lib/data/products.ts's file
    // header) -- only the mock/seed layer populates those.
    images: row.images ? row.images.map((i) => i.url) : [],
    notes: row.notes ?? undefined,
    discontinued: row.discontinued,
    isOriginal: row.isOriginal,
    rarity: (row.rarity as Rarity) ?? undefined,
    verificationStatus: row.verificationStatus as VerificationStatus,
    productionStatus: row.productionStatus as ProductionStatus,
    statusCheckedAt: row.statusCheckedAt ? row.statusCheckedAt.toISOString() : undefined,
    sources: row.sources ? row.sources.map(mapSourceRow) : [],
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
  originalReleaseYear: number | null
  rarity: string
  description: string | null
  canonicalReleaseId: string | null
  images?: { url: string }[]
  releases?: ReleaseRow[]
}

export function mapProductRow(row: ProductRow): Product {
  const releases = (row.releases ?? []).map(mapReleaseRow)
  const primary = releases.find((r) => r.isOriginal) ?? releases[0]
  // Catalog Model V2 (docs/CATALOG_MODEL_V2.md section 11): prefer the
  // release the DB explicitly names canonical; fall back to the row's own
  // canonicalItemNumber/chassis columns (kept in sync by migration
  // 0007_catalog_normalization.sql) only if that release isn't in the
  // eager-loaded set for some reason. This mirrors
  // lib/data/products.ts's PRODUCTS.map() so a product's chassis/item/year
  // mean the same thing whether the app is running off the mock seed or
  // real Supabase data.
  const canonicalRelease = row.canonicalReleaseId ? releases.find((r) => r.id === row.canonicalReleaseId) : undefined
  return {
    id: row.id,
    category: "mini4wd",
    itemNumber: canonicalRelease?.itemNumber ?? row.canonicalItemNumber ?? undefined,
    name: row.name,
    japaneseName: row.japaneseName ?? undefined,
    series: (row.series as Series) ?? "Racing Mini 4WD",
    // COMPATIBILITY/CACHE (Catalog Model V2 hardening point 1): strictly
    // the canonical release's chassis, or the DB's own canonical cache
    // column (kept in sync by the DB triggers), never an invented default.
    // undefined when there is no canonical release -- the UI shows "—".
    chassis: (canonicalRelease?.chassis ?? (row.chassis as Chassis)) || undefined,
    originalReleaseYear: canonicalRelease?.releaseYear ?? row.originalReleaseYear ?? undefined,
    rarity: row.rarity as Rarity,
    description: row.description ?? "",
    images: row.images ? row.images.map((i) => i.url) : [],
    releases,
    canonicalReleaseId: row.canonicalReleaseId ?? undefined,
    hasMultipleReleases: releases.length > 1,
    // FACTUAL, verified-only -- undefined (never 0, which would wrongly
    // imply "verified as free") unless a real Tamiya-confirmed figure
    // exists on the primary release. estimatedMsrpJPY/EUR are
    // deliberately left undefined here: the database has no concept of a
    // demo estimate (see lib/data/products.ts's file header) -- only the
    // mock/seed layer populates those, for lib/data/market.ts's demo
    // pricing engine.
    msrpJPY: primary?.msrpJPY,
    msrpEUR: primary?.msrpEUR,
  }
}
