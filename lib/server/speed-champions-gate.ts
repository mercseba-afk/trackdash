import "server-only"
import { getCurrentAdmin } from "@/lib/admin/access"

// Every page checks authorization; layouts alone are not an access boundary.
// Production stays closed unless both the owner allowlist and admin membership match.
export async function canAccessSpeedChampions(): Promise<boolean> {
  if (process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development") return true
  const ownerId = process.env.SPEED_CHAMPIONS_OWNER_ID?.trim()
  if (!ownerId) return false
  const user = await getCurrentAdmin()
  return user?.id === ownerId
}
