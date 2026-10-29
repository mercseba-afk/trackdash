import "server-only"
import { cache } from "react"
import { getCurrentAdmin } from "@/lib/admin/access"

// Reuse the configured owner allowlist, with no development/preview bypass.
export const canAccessShop = cache(async (): Promise<boolean> => {
  const ownerId = process.env.SPEED_CHAMPIONS_OWNER_ID?.trim()
  if (!ownerId) return false
  const user = await getCurrentAdmin()
  return user?.id === ownerId
})
