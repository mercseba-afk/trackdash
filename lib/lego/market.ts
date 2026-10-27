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
export function formatLegoPrice(cents: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100)
}
