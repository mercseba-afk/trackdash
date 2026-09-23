import "server-only"

import type { CollectibleVertical } from "@/lib/verticals"
import { COLLECTIBLE_VERTICALS } from "@/lib/verticals"

export function isVerticalRouteEnabled(vertical: CollectibleVertical): boolean {
  if (COLLECTIBLE_VERTICALS[vertical].publicEnabled) return true

  if (vertical === "hotwheels") {
    if (process.env.VERCEL_ENV === "preview") return true
    return process.env.HOTWHEELS_PILOT_ENABLED === "true"
  }

  return false
}
