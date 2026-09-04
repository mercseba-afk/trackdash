import type {
  Condition,
  MarketEstimate,
  PriceConfidence,
  Product,
  ProductRelease,
  Rarity,
  TrendDirection,
} from "@/lib/types"
import { getReleaseById, primaryRelease } from "@/lib/data/products"

// -----------------------------------------------------------------------------
// PRICE ENGINE (DEMO)
// A deterministic stand-in for the production price engine. Crucially, it values
// the most precise identity available — MODEL -> RELEASE -> CONDITION -> MARKET —
// so a 1990 original and a 2026 reissue of the SAME model resolve to different
// estimates and confidence. In production this module resolves a market estimate
// from real data using a strict source hierarchy: sold listings > active listings
// > verified user prices > MSRP. For the MVP it derives believable, stable numbers
// from each release. Every value returned is flagged isDemo: true and the UI
// labels it accordingly. It NEVER presents MSRP as market value.
// -----------------------------------------------------------------------------

const RARITY_MULTIPLIER: Record<Rarity, number> = {
  Common: 1.6,
  Uncommon: 2.4,
  Rare: 3.6,
  "Very Rare": 6,
  Grail: 11,
}

// Condition materially changes what a specific kit is worth. Applied on top of
// the release-level baseline (which is itself expressed at "New / Opened").
const CONDITION_MULTIPLIER: Record<Condition, number> = {
  Sealed: 1.28,
  "New / Opened": 1,
  Built: 0.62,
  Used: 0.48,
  Incomplete: 0.32,
}

// stable hash so the same release always yields the same demo figures
function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

function confidenceFor(sampleSize: number): PriceConfidence {
  if (sampleSize >= 20) return "High"
  if (sampleSize >= 8) return "Medium"
  if (sampleSize >= 3) return "Low"
  return "Insufficient"
}

// round to a "collector-honest" figure — no fake precision like €42.37
function roundHonest(value: number): number {
  if (value >= 100) return Math.round(value / 5) * 5
  return Math.round(value)
}

// Core valuation for a specific RELEASE (optionally at a specific CONDITION).
export function getReleaseEstimate(
  product: Product,
  release: ProductRelease,
  condition?: Condition,
): MarketEstimate {
  const h = hash(release.id)
  const rarity = release.rarity ?? product.rarity
  // Prefer a real verified MSRP if one ever exists, then the DEMO estimate
  // (see lib/data/products.ts's file header + lib/types.ts) -- this engine
  // is explicitly a demo (isDemo: true below) and was never meant to read
  // factual-only fields, which are now correctly undefined for anything
  // not independently verified against an official Tamiya source. A
  // DB-sourced product/release with neither a verified price nor a demo
  // estimate (the current state for this whole catalog, post-audit) falls
  // through to 0 rather than throwing/NaN-ing -- a known, honest gap for
  // real market-data work, out of scope here.
  const jpyBasis = release.msrpJPY ?? release.estimatedMsrpJPY ?? product.msrpJPY ?? product.estimatedMsrpJPY
  const eurBasis = release.msrpEUR ?? release.estimatedMsrpEUR ?? product.msrpEUR ?? product.estimatedMsrpEUR
  const baseEUR = eurBasis && eurBasis > 0 ? eurBasis : (jpyBasis ?? 0) / 160
  const mult = RARITY_MULTIPLIER[rarity]
  const age = Math.max(0, new Date().getFullYear() - release.releaseYear)
  const ageBoost = 1 + Math.min(age, 35) * 0.012
  // Modern reissues that are still in production trade nearer to retail.
  const reissueDamp = release.isOriginal ? 1 : age <= 6 ? 0.7 : 0.88
  const conditionMult = condition ? CONDITION_MULTIPLIER[condition] : 1

  const value = roundHonest(baseEUR * mult * ageBoost * reissueDamp * conditionMult)

  const spread = 0.12 + (h % 10) / 100 // 12% - 21%
  const low = roundHonest(value * (1 - spread))
  const high = roundHonest(value * (1 + spread))
  const average = roundHonest((low + high) / 2)

  // sample size scales with rarity; vintage originals have thinner markets
  const base =
    rarity === "Common"
      ? 18 + (h % 20)
      : rarity === "Uncommon"
        ? 10 + (h % 12)
        : rarity === "Rare"
          ? 5 + (h % 8)
          : 2 + (h % 4)
  const sampleSize = release.isOriginal && age > 20 ? Math.max(1, base - 4) : base

  const trend30d = Number((((h % 15) - 6) + (age > 15 ? 2 : 0)).toFixed(0))
  const trend90d = Number((((h % 25) - 8) + (age > 15 ? 5 : 0)).toFixed(0))
  const direction: TrendDirection =
    trend90d > 3 ? "rising" : trend90d < -3 ? "falling" : "stable"

  return {
    productId: product.id,
    releaseId: release.id,
    condition,
    value,
    currency: "EUR",
    confidence: confidenceFor(sampleSize),
    sampleSize,
    source: "sold",
    average,
    median: roundHonest((low + value) / 2),
    low,
    high,
    trend30d,
    trend90d,
    direction,
    lastUpdated: "August 2026",
    isDemo: true,
  }
}

// Headline (model-level) estimate, computed from the model's primary release at
// the reference condition. Used across the catalog, cards and market views.
export function getProductEstimate(product: Product): MarketEstimate {
  return getReleaseEstimate(product, primaryRelease(product))
}

export function getReleaseEstimateById(releaseId: string, condition?: Condition): MarketEstimate | undefined {
  const found = getReleaseById(releaseId)
  return found ? getReleaseEstimate(found.product, found.release, condition) : undefined
}
