"use server"

import { getCurrentUser } from "@/lib/auth/current-user"
import { isInternalAnalyticsUser } from "@/lib/analytics/internal-user"

export async function getAnalyticsEligibilityAction(): Promise<{ userId: string | null; track: boolean }> {
  const user = await getCurrentUser()
  if (!user) return { userId: null, track: true }

  return {
    userId: user.id,
    track: !(await isInternalAnalyticsUser(user.id)),
  }
}
