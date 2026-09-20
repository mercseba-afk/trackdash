"use server"

import { getCurrentUser } from "@/lib/auth/current-user"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

async function requireSensitiveAccountSession() {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")

  const supabase = await createClient()
  const { data: assurance, error: assuranceError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (assuranceError) throw assuranceError

  const admin = createAdminClient()
  const { data: adminRow, error: adminError } = await admin
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle()
  if (adminError) throw adminError

  const requiresAal2 =
    Boolean(adminRow) ||
    assurance.nextLevel === "aal2"

  if (requiresAal2 && assurance.currentLevel !== "aal2") {
    throw new Error("Completa la verifica 2FA prima di modificare i dati sensibili dell’account")
  }

  return { user, supabase }
}

export async function updateMyEmailAction(email: string) {
  const { user, supabase } = await requireSensitiveAccountSession()
  const nextEmail = email.trim().toLowerCase()
  if (!nextEmail.includes("@") || nextEmail.length > 254) throw new Error("Email non valida")

  const admin = createAdminClient()
  const { data: adminRow, error: adminError } = await admin
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle()
  if (adminError) throw adminError
  if (adminRow && nextEmail !== user.email?.toLowerCase()) {
    throw new Error("L’email dell’account amministratore è protetta")
  }

  const { error } = await supabase.auth.updateUser({ email: nextEmail })
  if (error) throw error
  return { ok: true }
}

export async function updateMyPasswordAction(password: string) {
  const { supabase } = await requireSensitiveAccountSession()
  if (password.length < 10) throw new Error("Usa una password di almeno 10 caratteri")
  if (password.length > 128) throw new Error("Password troppo lunga")

  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
  return { ok: true }
}

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
  const { user } = await requireSensitiveAccountSession()
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

  await deleteUserAndOwnedStorage(user.id)
  return { ok: true }
}
