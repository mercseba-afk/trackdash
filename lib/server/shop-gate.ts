import "server-only"
import { cache } from "react"
import { getCurrentUser } from "@/lib/auth/current-user"

// The collector shop is available to signed-in users. Private collection
// data remains protected; the data layer reads only opt-in offer shares.
export const canAccessShop = cache(async (): Promise<boolean> => {
  return Boolean(await getCurrentUser())
})
