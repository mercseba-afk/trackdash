import type {
  MarketEstimate,
  PriceConfidence,
  Product,
  Rarity,
  TrendDirection,
} from "@/lib/types"
import { getProductById } from "@/lib/data/products"

// -----------------------------------------------------------------------------
// PRICE ENGINE (DEMO)
// A deterministic stand-in for the production price engine. In production this
// module resolves a market estimate from real data using a strict source
// hierarchy: sold listings > active listings > verified user prices > MSRP.
// For the MVP it derives believable, stable numbers from each product so the UI
// can be exercised end to end. Every value returned is flagged isDemo: true and
// the UI labels it accordingly. It NEVER presents MSRP as market value.
// -----------------------------------------------------------------------------

const RARITY_MULTIPLIER: Record<Rarity, number> = {
  Common: 1.6,
  Uncommon: 2.4,
  Rare: 3.6,
  "Very Rare": 6,
  Grail: 11,
}

// stable hash so the same product always yields the same demo figures
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

export function getMarketEstimate(product: Product): MarketEstimate {
  const h = hash(product.id)
  const baseEUR = product.msrpEUR > 0 ? product.msrpEUR : product.msrpJPY / 160
  const mult = RARITY_MULTIPLIER[product.rarity]
  const age = Math.max(0, new Date().getFullYear() - product.releaseYear)
  const ageBoost = 1 + Math.min(age, 35) * 0.012
  const value = roundHonest(baseEUR * mult * ageBoost)

  const spread = 0.12 + (h % 10) / 100 // 12% - 21%
  const low = roundHonest(value * (1 - spread))
  const high = roundHonest(value * (1 + spread))
  const average = roundHonest((low + high) / 2)

  // sample size scales with rarity & popularity, capped modestly for demo
  const sampleSize =
    product.rarity === "Common"
      ? 18 + (h % 20)
      : product.rarity === "Uncommon"
        ? 10 + (h % 12)
        : product.rarity === "Rare"
          ? 5 + (h % 8)
          : 2 + (h % 4)

  const trend30d = Number((((h % 15) - 6) + (age > 15 ? 2 : 0)).toFixed(0))
  const trend90d = Number((((h % 25) - 8) + (age > 15 ? 5 : 0)).toFixed(0))
  const direction: TrendDirection =
    trend90d > 3 ? "rising" : trend90d < -3 ? "falling" : "stable"

  return {
    productId: product.id,
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

export function getEstimateById(productId: string): MarketEstimate | undefined {
  const p = getProductById(productId)
  return p ? getMarketEstimate(p) : undefined
}
