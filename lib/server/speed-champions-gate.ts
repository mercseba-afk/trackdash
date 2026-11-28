import "server-only"
import { getCurrentUser } from "@/lib/auth/current-user"

// Personal Speed Champions features are available to every authenticated user.
// Each query and write still runs in that user's RLS context.
export async function canAccessSpeedChampions(): Promise<boolean> {
  return Boolean(await getCurrentUser())
}
