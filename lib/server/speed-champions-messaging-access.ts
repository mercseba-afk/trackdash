import "server-only"

import { cache } from "react"
import { getCurrentUser } from "@/lib/auth/current-user"

export const getSpeedChampionsMessagingUser = cache(async () => getCurrentUser())

export async function canBrowseSpeedChampions(): Promise<boolean> {
  return Boolean(await getSpeedChampionsMessagingUser())
}
