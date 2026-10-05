export type RetailAvailability =
  | "in_stock"
  | "low_stock"
  | "preorder"
  | "backorder"
  | "out_of_stock"
  | "discontinued"
  | "unknown"

export function isObservedRetailSellThrough(
  previous: RetailAvailability | null | undefined,
  next: RetailAvailability,
): boolean {
  const wasAvailable = previous === "in_stock" || previous === "low_stock"
  const becameUnavailable = next === "out_of_stock" || next === "discontinued"
  return wasAvailable && becameUnavailable
}
