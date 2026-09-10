"use server"

import { getPublicMarketSignalMap } from "@/lib/market/public"

// Read-only Server Action used by the global market provider to refresh the same
// canonical R3 signal map without duplicating pricing logic in client screens.
export async function getPublicMarketSignalsAction() {
  return getPublicMarketSignalMap()
}
