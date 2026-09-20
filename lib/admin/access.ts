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

export async function getCurrentAdminAccessState() {
  const user = await getCurrentAdmin()
  if (!user) return { user: null, aal2: false }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error) throw error

  return { user, aal2: data.currentLevel === "aal2" }
}

export async function requireAdmin() {
  const state = await getCurrentAdminAccessState()
  if (!state.user) throw new Error("Admin access required")
  if (!state.aal2) throw new Error("Two-factor authentication required")
  return state.user
}
