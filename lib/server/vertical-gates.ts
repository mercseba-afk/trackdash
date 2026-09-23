import "server-only"

import { getCurrentAdmin } from "@/lib/admin/access"
import type { CollectibleVertical } from "@/lib/verticals"
import { COLLECTIBLE_VERTICALS } from "@/lib/verticals"

export function isVerticalRouteEnabled(vertical: CollectibleVertical): boolean {
  if (COLLECTIBLE_VERTICALS[vertical].publicEnabled) return true

  if (vertical === "hotwheels") {
    return process.env.VERCEL_ENV === "preview"
  }

  return false
}

export async function canAccessVerticalRoute(vertical: CollectibleVertical): Promise<boolean> {
  if (COLLECTIBLE_VERTICALS[vertical].publicEnabled) return true

  if (vertical === "hotwheels") {
    if (process.env.VERCEL_ENV === "preview") return true
    return Boolean(await getCurrentAdmin())
  }

  return false
}
