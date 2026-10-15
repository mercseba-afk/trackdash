"use server"

import { getCachedPublicMarketSignalMap } from "@/lib/market/public-cached"

// Read-only Server Action used by the global market provider to refresh the same
// canonical R3 signal map without duplicating pricing logic in client screens.
export async function getPublicMarketSignalsAction() {
  return getCachedPublicMarketSignalMap()
}
