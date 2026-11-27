import "server-only"
import { getCurrentAdmin } from "@/lib/admin/access"

import { cache } from "react"

export const getSpeedChampionsOwner = cache(async () => {
  const ownerId = process.env.SPEED_CHAMPIONS_OWNER_ID?.trim()
  if (!ownerId) return null
  const user = await getCurrentAdmin()
  return user?.id === ownerId ? user : null
})

// Every page checks authorization; layouts alone are not an access boundary.
// Hosted deployments require both the owner allowlist and admin membership.
export async function canAccessSpeedChampions(): Promise<boolean> {
  if (!process.env.VERCEL_ENV && process.env.NODE_ENV === "development") return true
  return Boolean(await getSpeedChampionsOwner())
}
