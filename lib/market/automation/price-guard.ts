import type { ParsedAvailability } from "./exact-page-adapter"

export interface AutomatedPriceGuardInput {
  priceEUR: number
  availability: ParsedAvailability
  independentReferenceEUR: number[]
  previousSameSourceEUR?: number | null
  headlineConfidence?: "low" | "medium" | "high" | null
}

export interface AutomatedPriceGuardResult {
  decision: "accept" | "review"
  reasonCodes: string[]
  baselineEUR: number | null
}

function median(values: number[]): number | null {
  const clean = values.filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b)
  if (!clean.length) return null
  const middle = Math.floor(clean.length / 2)
  return clean.length % 2 ? clean[middle] : (clean[middle - 1] + clean[middle]) / 2
}

function isPurchasable(availability: ParsedAvailability): boolean {
  return availability === "in_stock" || availability === "low_stock"
}

export function guardAutomatedPrice(input: AutomatedPriceGuardInput): AutomatedPriceGuardResult {
  const reasonCodes: string[] = []
  const baselineEUR = median(input.independentReferenceEUR)

  // Unavailable stock is retained as context only, so an odd historical sticker
  // price cannot affect Market Value or `Da`. It does not need a valuation guard.
  if (!isPurchasable(input.availability)) {
    return { decision: "accept", reasonCodes, baselineEUR }
  }

  const previous = input.previousSameSourceEUR
  if (previous != null && previous > 0) {
    const ratio = input.priceEUR / previous
    if (ratio < 0.5 || ratio > 2) reasonCodes.push("AUTOMATION_SOURCE_PRICE_JUMP")
  }

  const cleanReferenceCount = input.independentReferenceEUR.filter((value) => Number.isFinite(value) && value > 0).length
  if (baselineEUR != null && cleanReferenceCount >= 2) {
    const ratio = input.priceEUR / baselineEUR
    if (ratio < 0.45 || ratio > 2.2) reasonCodes.push("AUTOMATION_CROSS_SOURCE_OUTLIER")
  } else if (
    baselineEUR != null &&
    (input.headlineConfidence === "medium" || input.headlineConfidence === "high")
  ) {
    // A single established headline is weaker evidence than two independent
    // references, so only extreme contradictions are quarantined here.
    const ratio = input.priceEUR / baselineEUR
    if (ratio < 0.35 || ratio > 3) reasonCodes.push("AUTOMATION_HEADLINE_CONTRADICTION")
  }

  return {
    decision: reasonCodes.length ? "review" : "accept",
    reasonCodes,
    baselineEUR,
  }
}
