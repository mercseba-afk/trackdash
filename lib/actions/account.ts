"use server"

import { getCurrentUser } from "@/lib/auth/current-user"
import { createAdminClient } from "@/lib/supabase/admin"

export async function getMySubscriptionAction() {
  const user = await getCurrentUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("account_subscriptions")
    .select("plan,subscription_status,billing_provider,payment_status,current_period_end,cancel_at_period_end")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) throw error
  return data ?? {
    plan: "free",
    subscription_status: "inactive",
    billing_provider: "none",
    payment_status: "not_applicable",
    current_period_end: null,
    cancel_at_period_end: false,
  }
}

export async function deleteMyAccountAction(confirmation: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")
  if (confirmation.trim().toUpperCase() !== "ELIMINA") {
    throw new Error("Conferma non valida")
  }

  const admin = createAdminClient()
  const { data: adminRow, error: adminReadError } = await admin
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (adminReadError) throw adminReadError
  if (adminRow) {
    throw new Error("L’account amministratore non può essere eliminato dall’area personale")
  }

  const { error } = await admin.auth.admin.deleteUser(user.id, false)
  if (error) throw error

  return { ok: true }
}
