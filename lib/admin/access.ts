import "server-only"

import { getCurrentUser } from "@/lib/auth/current-user"
import { createAdminClient } from "@/lib/supabase/admin"

export async function getCurrentAdmin() {
  const user = await getCurrentUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) throw error
  return data ? user : null
}

export async function requireAdmin() {
  const user = await getCurrentAdmin()
  if (!user) throw new Error("Admin access required")
  return user
}
