// Core domain model for Mini 4WD Collector.
// Kept intentionally lean for the MVP but shaped so it maps cleanly onto a
// relational backend (PostgreSQL / Supabase) later without rewriting the UI.

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

export type LimitedEditionType =
  | "Japan Cup"
  | "Anniversary"
  | "Special Color"
  | "Clear Body"
  | "Premium"
  | "Store Exclusive"

export type Rarity = "Common" | "Uncommon" | "Rare" | "Very Rare" | "Grail"

export type VariantType =
  | "Original"
  | "Reissue"
  | "Premium Reissue"
  | "Special Color"
  | "Clear Body"
  | "Limited Edition"
  | "Anniversary Edition"
  | "Japan Cup Edition"

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

export interface ProductVariant {
  id: string
  productId: string
  variantType: VariantType
  variantName: string
  releaseYear?: number
  barcodeJAN?: string
  isOriginal: boolean
  notes?: string
}

export interface Product {
  id: string
  tamiyaItemNumber: string // e.g. "18626"
  tamiyaProductCode?: string // internal short code used for manual scanner entry
  name: string
  japaneseName?: string
  series: Series
  chassis: Chassis
  releaseYear: number
  discontinued: boolean
  isReissue: boolean
  isLimitedEdition: boolean
  limitedEditionType?: LimitedEditionType
  barcodeJAN: string
  msrpJPY: number
  msrpEUR: number
  rarity: Rarity
  description: string
  images: string[]
  variants: ProductVariant[]
}

export interface CollectionItem {
  id: string
  userId: string
  productId: string
  variantId?: string
  condition: Condition
  acquisitionDate: string // ISO date
  acquisitionPrice: number
  acquisitionCurrency: Currency
  notes?: string
  photos: string[]
  createdAt: string
}

export type WishlistPriority = "Low" | "Medium" | "High"

export interface WishlistItem {
  id: string
  userId: string
  productId: string
  variantId?: string
  priority: WishlistPriority
  targetPrice?: number
  currency: Currency
  notes?: string
  createdAt: string
}

// A single observed market data point. In production this table is populated
// by the price engine from real sold/active listings.
export interface PricePoint {
  id: string
  productId: string
  variantId?: string
  source: PriceSource
  price: number
  currency: Currency
  condition: Condition
  saleDate?: string
  listingDate?: string
  isSold: boolean
}

// Computed market estimate exposed to the UI. Always carries provenance so the
// interface can be honest about uncertainty.
export interface MarketEstimate {
  productId: string
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
