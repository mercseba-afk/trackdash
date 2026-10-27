import observations from "./price-observations.json"

// Reviewed listing snapshots, never completed-sale valuations. No automatic refresh yet.
export const PRICE_OBSERVATION_TTL_DAYS = 15
export function getLegoAskingPrices(setNumber: string, asOf: string) {
  const now = Date.parse(asOf)
  if (!Number.isFinite(now)) return []
  return observations.filter((row) => {
    const age = now - Date.parse(`${row.observedAt}T00:00:00Z`)
    return row.setNumber === setNumber && row.kind === "asking" && row.currency === "EUR"
      && Number.isInteger(row.itemPriceCents) && row.itemPriceCents > 0
      && age >= 0 && age < PRICE_OBSERVATION_TTL_DAYS * 86400000
  }).sort((a, b) => a.itemPriceCents - b.itemPriceCents)
}
// Public summaries deliberately omit item IDs, source links and seller information.
export function getPublicLegoMarketSummary(setNumber: string, asOf: string) {
  const prices = getLegoAskingPrices(setNumber, asOf)
  return {
    askingLowCents: prices[0]?.itemPriceCents ?? null,
    askingHighCents: prices.at(-1)?.itemPriceCents ?? null,
    askingCount: prices.length,
    observedAt: prices[0]?.observedAt ?? null,
    condition: prices.length ? (prices.every(row => row.condition === "sigillato") ? "Sigillato" : "Nuovo dichiarato") : null,
  }
}
export type LegoMarketSummary = ReturnType<typeof getPublicLegoMarketSummary>
