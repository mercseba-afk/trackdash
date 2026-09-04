// Core domain model for the collector app.
//
// The model is intentionally split into a conceptual MODEL (Product) and its
// concrete commercial RELEASES/EDITIONS (ProductRelease). This is the crucial
// distinction for serious collectors: the historical "original release year" of
// a model is NOT the same as the year of the specific kit a collector owns
// (e.g. a 2026 reissue of a 1990 original). Collection items therefore reference
// a specific release, and every price/valuation is derived from the most precise
// identity available (model -> release -> condition).
//
// The entity names (Product / ProductRelease / CollectionItem / PricePoint) are
// deliberately category-agnostic so the same backend can later support other
// collectible categories (e.g. trading cards) without a rewrite. Category-specific
// vocabulary (chassis, series) lives in optional, Mini 4WD-flavoured fields.

export type ProductCategory = "mini4wd"

export type Chassis =
  | "Type 1"
  | "Type 2"
  | "Type 3"
  | "Zero"
  | "Super 1"
  | "Super TZ"
  | "Super X"
  | "Super XX"
  | "Super II"
  | "VS"
  | "AR"
  | "MS"
  | "MA"
  | "VZ"
  | "FM-A"

export type Series =
  | "Racing Mini 4WD"
  | "Fully Cowled"
  | "Aero"
  | "Avante"
  | "Dash! Yonkuro"
  | "Let's & Go"
  | "Mighty"
  | "Super Mini 4WD"
  | "Classic"

export type Rarity = "Common" | "Uncommon" | "Rare" | "Very Rare" | "Grail"

// Controlled vocabulary for the type of a specific release/edition. Kept as an
// open-ended union + runtime array so the catalog can grow new edition types
// without breaking existing data.
export type ReleaseType =
  | "Original"
  | "Reissue"
  | "Special Edition"
  | "Limited Edition"
  | "Anniversary Edition"
  | "Japan Cup Edition"
  | "Color Special"
  | "Clear Body"
  | "Premium"
  | "Chassis Variant"
  | "Other"

export type Condition =
  | "Sealed"
  | "New / Opened"
  | "Built"
  | "Used"
  | "Incomplete"

export type Currency = "EUR" | "USD" | "JPY" | "GBP"

export type PriceSource =
  | "sold" // Priority 1 — real sold listings
  | "listing" // Priority 2 — active asking prices
  | "user" // Priority 3 — verified user-submitted prices
  | "msrp" // Priority 4 — manufacturer suggested retail price

export type PriceConfidence = "High" | "Medium" | "Low" | "Insufficient"

export type TrendDirection = "rising" | "stable" | "falling"

// -----------------------------------------------------------------------------
// CATALOG MODEL V2 — controlled vocabularies (see docs/CATALOG_MODEL_V2.md)
// -----------------------------------------------------------------------------

// How confidently a RELEASE's factual data is backed by evidence. Does NOT
// require every field to be populated — a `verified` release may still have
// e.g. `barcodeJAN: undefined` because the barcode specifically was never
// checked. NULL/undefined fields are always valid; this status describes the
// release's core identity (existence, item number where claimed, chassis),
// not field-by-field completeness.
export type VerificationStatus = "verified" | "partial" | "unverified"

// Coarse, deliberately small edition classification — see
// lib/data/products.ts's file header for the normalization rule from the
// existing (richer, free-er) ReleaseType. Not a replacement for
// `releaseType`/`editionName`, which remain the primary display vocabulary.
export type EditionType =
  | "original"
  | "premium"
  | "color_special"
  | "limited"
  | "anniversary"
  | "japan_cup"
  | "reissue"
  | "special"
  | "other"

// Whether Tamiya still officially sells/produces this specific release.
// Deliberately distinct from marketplace availability (whether a copy can be
// found on eBay/Amazon right now) -- that's a Price Intelligence/Market
// Data concern, not a catalog fact.
export type ProductionStatus = "announced" | "active" | "discontinued" | "unknown"

export type ReleaseSourceType = "official_manufacturer" | "official_catalog_pdf" | "official_archive" | "trusted_secondary" | "other"

// A single piece of evidence backing a release's factual data — so a future
// maintainer can see WHY a value exists without reading old chat history or
// dense code comments. `verifiedFields` names which specific release fields
// this particular source backs (e.g. ["itemNumber", "chassis"]), since one
// source rarely confirms every field at once.
export interface ReleaseSource {
  id: string
  releaseId: string
  sourceType: ReleaseSourceType
  sourceUrl?: string
  verifiedFields: string[]
  checkedAt?: string // ISO date
  notes?: string
}

// -----------------------------------------------------------------------------
// PRODUCT_RELEASE / EDITION
// A specific commercial release of a model. This is the identity a collection
// item points at, and the identity the price engine values.
// -----------------------------------------------------------------------------
export interface ProductRelease {
  id: string
  productId: string
  itemNumber?: string // ITEM number for THIS release (may match the model or differ) -- undefined when genuinely unverified, never a placeholder string
  releaseType: ReleaseType
  editionName: string // display name for this release, e.g. "Dash-1 Emperor (2026 Reissue)"
  /** Coarse controlled classification (Catalog Model V2) — see lib/types.ts. Distinct from releaseType/editionName above, which remain the primary display vocabulary. */
  editionType: EditionType
  releaseYear: number // the year THIS release hit the market
  releaseDate?: string // ISO date if a precise date is known
  chassis: Chassis
  barcodeJAN?: string
  color?: string
  countryMarket?: string
  /** FACTUAL, verified-only MSRP — undefined unless a real Tamiya-confirmed figure exists. This is what the database stores; never populate from an estimate. */
  msrpJPY?: number
  msrpEUR?: number
  /** DEMO estimate only, for lib/data/market.ts's pricing engine — NEVER written to the database, NEVER shown as factual MSRP. Distinct on purpose from msrpJPY/msrpEUR above. */
  estimatedMsrpJPY?: number
  estimatedMsrpEUR?: number
  images?: string[]
  notes?: string
  discontinued: boolean // compatibility field — see productionStatus below, the Catalog Model V2 authoritative source; kept in sync (discontinued === productionStatus === 'discontinued'), never set independently
  isOriginal: boolean // true for the model's original historical release
  rarity?: Rarity // release-specific rarity; falls back to the model rarity
  /** How confidently this release's factual data is backed by evidence — see lib/types.ts's VerificationStatus. Does not require every field to be populated. */
  verificationStatus: VerificationStatus
  /** Whether Tamiya still officially sells/produces this exact release — distinct from marketplace availability. */
  productionStatus: ProductionStatus
  statusCheckedAt?: string // ISO date productionStatus was last confirmed
  /** Evidence backing this release's factual data — see ReleaseSource. Empty array is valid (no source recorded yet); NEVER invent a source. */
  sources: ReleaseSource[]
}

// -----------------------------------------------------------------------------
// PRODUCT / MODEL
// The conceptual identity. Its original_release_year is stored separately and is
// NEVER treated as the year of a specific owned kit.
// -----------------------------------------------------------------------------
export interface Product {
  id: string
  category: ProductCategory
  /**
   * COMPATIBILITY/CACHE field (Catalog Model V2) — denormalized from
   * `canonicalRelease.itemNumber` below, NEVER an independent source of
   * truth. See lib/data/products.ts's file header. Undefined when
   * genuinely unverified.
   */
  itemNumber?: string
  /**
   * Internal stable identity anchor (see lib/data/stable-id.ts and
   * lib/data/products.ts's file header) — NOT for display. Exists so
   * scripts/generate-catalog-seed.mjs can derive a slug that doesn't
   * depend on the correctable `itemNumber` above.
   */
  seedKey?: string
  productCode?: string // short code used for manual scanner entry
  name: string // canonical model name
  japaneseName?: string
  series: Series
  /**
   * COMPATIBILITY/CACHE field (Catalog Model V2) — denormalized from
   * `canonicalRelease.chassis`. A Product does NOT have one universally
   * true chassis (releases legitimately differ, e.g. Vanguard Sonic's
   * Original is Super 1 while its Premium is Super II) — this field
   * exists only so existing UI that expects a single representative
   * chassis keeps working, and it is ALWAYS the canonical/original
   * release's own chassis, never an independently curated value.
   */
  chassis: Chassis
  originalReleaseYear: number // the model's FIRST-EVER release year -- COMPATIBILITY/CACHE, denormalized from canonicalRelease.releaseYear
  rarity: Rarity
  description: string
  images: string[]
  releases: ProductRelease[]
  /**
   * The release considered authoritative for this model's identity —
   * normally its original historical release. May be undefined when no
   * release can be confidently identified as canonical (UNKNOWN >
   * INVENTED — never force an arbitrary release to be canonical merely
   * to populate this field). When set, `itemNumber`/`chassis`/
   * `originalReleaseYear` above are always derived from this release;
   * see lib/data/products.ts's PRODUCTS.map() and
   * scripts/check-catalog-invariants.mjs, which both enforce this.
   */
  canonicalReleaseId?: string
  // derived convenience (computed at build time)
  hasMultipleReleases: boolean
  /** FACTUAL, verified-only MSRP of the primary release, for headline display -- undefined unless a real Tamiya-confirmed figure exists. */
  msrpJPY?: number
  msrpEUR?: number
  /** DEMO estimate only, for lib/data/market.ts -- NEVER written to the database, NEVER shown as factual MSRP. */
  estimatedMsrpJPY?: number
  estimatedMsrpEUR?: number
}

export interface CollectionItem {
  id: string
  userId: string
  productId: string
  releaseId: string // the specific release/edition owned
  condition: Condition
  acquisitionDate: string // ISO date
  acquisitionPrice: number
  acquisitionCurrency: Currency
  // Optional collector override of the release year for THIS physical item.
  // Lets a collector correct the exact kit year without mutating the shared
  // release/original-release data.
  releaseYearOverride?: number
  notes?: string
  photos: string[]
  createdAt: string
}

export type WishlistPriority = "Low" | "Medium" | "High"

export interface WishlistItem {
  id: string
  userId: string
  productId: string
  releaseId?: string // optional target release; undefined = any release of the model
  priority: WishlistPriority
  targetPrice?: number
  currency: Currency
  notes?: string
  createdAt: string
}

// A single observed market data point, always tied to a specific release +
// condition so that (for example) a 1990 original is never blended with a 2026
// reissue. In production this table is populated by the price engine.
export interface PricePoint {
  id: string
  releaseId: string
  condition: Condition
  source: PriceSource
  price: number
  currency: Currency
  saleDate?: string
  listingDate?: string
  isSold: boolean
  listingUrl?: string
}

// Computed market estimate exposed to the UI. Always carries provenance and the
// exact release/condition it was computed for, so the interface can be honest.
export interface MarketEstimate {
  productId: string
  releaseId: string
  condition?: Condition
  value: number
  currency: Currency
  confidence: PriceConfidence
  sampleSize: number
  source: PriceSource
  average: number
  median: number
  low: number
  high: number
  trend30d: number // percentage
  trend90d: number // percentage
  direction: TrendDirection
  lastUpdated: string
  isDemo: boolean
}

export interface User {
  id: string
  email: string
  username: string
  country: string
  createdAt: string
  avatarUrl?: string
}

export type CollectorLevel = "Starter" | "Collector" | "Enthusiast" | "Expert"

// -----------------------------------------------------------------------------
// Runtime constant arrays (kept in sync with the union types above so UI can
// iterate over them for filters, selects and toggle groups).
// -----------------------------------------------------------------------------

export const CONDITIONS: Condition[] = ["Sealed", "New / Opened", "Built", "Used", "Incomplete"]

export const RARITIES: Rarity[] = ["Common", "Uncommon", "Rare", "Very Rare", "Grail"]

export const CURRENCIES: Currency[] = ["EUR", "USD", "JPY", "GBP"]

export const PRIORITIES: WishlistPriority[] = ["High", "Medium", "Low"]

export const RELEASE_TYPES: ReleaseType[] = [
  "Original",
  "Reissue",
  "Special Edition",
  "Limited Edition",
  "Anniversary Edition",
  "Japan Cup Edition",
  "Color Special",
  "Clear Body",
  "Premium",
  "Chassis Variant",
  "Other",
]

export const VERIFICATION_STATUSES: VerificationStatus[] = ["verified", "partial", "unverified"]

export const EDITION_TYPES: EditionType[] = [
  "original",
  "premium",
  "color_special",
  "limited",
  "anniversary",
  "japan_cup",
  "reissue",
  "special",
  "other",
]

export const PRODUCTION_STATUSES: ProductionStatus[] = ["announced", "active", "discontinued", "unknown"]

export const RELEASE_SOURCE_TYPES: ReleaseSourceType[] = [
  "official_manufacturer",
  "official_catalog_pdf",
  "official_archive",
  "trusted_secondary",
  "other",
]
