"use server"

import { canBrowseSpeedChampions } from "@/lib/server/speed-champions-messaging-access"

// The navigation receives only a permission boolean, never the owner ID.
// Catalog pages independently enforce the same server-side authorization.
export async function getSpeedChampionsAccessAction(): Promise<boolean> {
  return canBrowseSpeedChampions()
}
