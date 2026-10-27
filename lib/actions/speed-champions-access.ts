"use server"

import { canAccessSpeedChampions } from "@/lib/server/speed-champions-gate"

// The navigation receives only a permission boolean, never the owner ID.
// Catalog pages independently enforce the same server-side authorization.
export async function getSpeedChampionsAccessAction(): Promise<boolean> {
  return canAccessSpeedChampions()
}
