"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/admin/access"
import type {
  AccountPlan,
  BillingProvider,
  PaymentStatus,
  SubscriptionStatus,
} from "@/lib/admin/types"
import { createAdminClient } from "@/lib/supabase/admin"

const USERNAME_RE = /^[A-Za-z0-9._-]+$/
const PLANS = new Set<AccountPlan>(["free", "pro"])
const STATUSES = new Set<SubscriptionStatus>(["inactive", "trialing", "active", "past_due", "canceled"])
const PROVIDERS = new Set<BillingProvider>(["none", "manual", "stripe", "app_store", "play_store"])
const PAYMENT_STATUSES = new Set<PaymentStatus>(["not_applicable", "pending", "paid", "failed", "refunded"])

export async function updateAdminUserAction(input: {
  userId: string
  email: string
  username: string
  country: string
  plan: AccountPlan
  subscriptionStatus: SubscriptionStatus
  billingProvider: BillingProvider
  paymentStatus: PaymentStatus
  adminNotes: string
}) {
  await requireAdmin()

  const email = input.email.trim().toLowerCase()
  const username = input.username.trim()
  const country = input.country.trim()
  const notes = input.adminNotes.trim()

  if (!input.userId) throw new Error("Missing user ID")
  if (!email.includes("@") || email.length > 254) throw new Error("Email non valida")
  if (username.length < 3 || username.length > 30 || !USERNAME_RE.test(username)) {
    throw new Error("Username non valido: usa 3-30 caratteri, lettere, numeri, punti, trattini o underscore")
  }
  if (country.length > 80) throw new Error("Paese troppo lungo")
  if (notes.length > 2000) throw new Error("Note troppo lunghe")
  if (!PLANS.has(input.plan)) throw new Error("Piano non valido")
  if (!STATUSES.has(input.subscriptionStatus)) throw new Error("Stato abbonamento non valido")
  if (!PROVIDERS.has(input.billingProvider)) throw new Error("Provider billing non valido")
  if (!PAYMENT_STATUSES.has(input.paymentStatus)) throw new Error("Stato pagamento non valido")

  const admin = createAdminClient()
  const { data: authData, error: authReadError } = await admin.auth.admin.getUserById(input.userId)
  if (authReadError || !authData.user) throw authReadError ?? new Error("Account non trovato")

  const { data: protectedAdmin, error: protectedAdminError } = await admin
    .from("app_admins")
    .select("user_id")
    .eq("user_id", input.userId)
    .maybeSingle()
  if (protectedAdminError) throw protectedAdminError

  if (protectedAdmin && (authData.user.email ?? "").toLowerCase() !== email) {
    throw new Error("L’email dell’account amministratore è protetta")
  }

  if ((authData.user.email ?? "").toLowerCase() !== email) {
    const { error } = await admin.auth.admin.updateUserById(input.userId, { email, email_confirm: true })
    if (error) throw error
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      username,
      country: country || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.userId)
  if (profileError) throw profileError

  const isFree = input.plan === "free"
  const subscriptionStatus: SubscriptionStatus = isFree ? "inactive" : input.subscriptionStatus
  const billingProvider: BillingProvider = isFree ? "none" : input.billingProvider
  const paymentStatus: PaymentStatus = isFree ? "not_applicable" : input.paymentStatus

  const { error: subscriptionError } = await admin
    .from("account_subscriptions")
    .upsert(
      {
        user_id: input.userId,
        plan: input.plan,
        subscription_status: subscriptionStatus,
        billing_provider: billingProvider,
        payment_status: paymentStatus,
        admin_notes: notes || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
  if (subscriptionError) throw subscriptionError

  revalidatePath("/admin")
  return { ok: true }
}

export async function deleteAdminUserAction(userId: string) {
  const currentAdmin = await requireAdmin()
  if (!userId) throw new Error("Missing user ID")
  if (userId === currentAdmin.id) throw new Error("Non puoi eliminare il tuo account amministratore")

  const admin = createAdminClient()
  const { data: protectedAdmin, error: adminReadError } = await admin
    .from("app_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle()
  if (adminReadError) throw adminReadError
  if (protectedAdmin) throw new Error("Non puoi eliminare un account amministratore")

  await deleteUserAndOwnedStorage(userId)

  revalidatePath("/admin")
  return { ok: true }
}
