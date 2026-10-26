import "server-only"
import { getCurrentAdmin } from "@/lib/admin/access"

// No public rollout or shared vertical preference changes during the pilot.
// The gate is checked by every page, not only the layout (layouts are cached).
export async function canAccessSpeedChampions(): Promise<boolean> {
  if (process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development") return true
  return Boolean(await getCurrentAdmin())
}
