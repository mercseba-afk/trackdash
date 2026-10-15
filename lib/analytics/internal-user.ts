import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

// Use the same source of truth as /admin. Identity is checked on the server,
// not by a spoofable browser flag, hardcoded email, username or IP address.
export async function isInternalAnalyticsUser(userId: string): Promise<boolean> {
  const { data, error } = await createAdminClient()
    .from("app_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) throw new Error(`Failed to check internal analytics account: ${error.message}`)
  return Boolean(data)
}
