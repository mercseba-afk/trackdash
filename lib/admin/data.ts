import "server-only"

import { requireAdmin } from "@/lib/admin/access"
import type {
  AccountPlan,
  AdminDashboardData,
  BillingProvider,
  PaymentStatus,
  SubscriptionStatus,
} from "@/lib/admin/types"
import { createAdminClient } from "@/lib/supabase/admin"

function isoTime(value: string | null | undefined) {
  return value ? new Date(value).getTime() : 0
}

async function listAllAuthUsers() {
  const admin = createAdminClient()
  const users: Array<{
    id: string
    email?: string
    created_at: string
    last_sign_in_at?: string | null
  }> = []

  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    users.push(...data.users)
    if (data.users.length < 1000) break
  }

  return users
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const currentAdmin = await requireAdmin()
  const admin = createAdminClient()
  const now = Date.now()
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
  const trafficStart = new Date(thirtyDaysAgo).toISOString().slice(0, 10)

  const authUsers = await listAllAuthUsers()
  const [
    profilesResult,
    subscriptionsResult,
    collectionResult,
    adminsResult,
    trafficResult,
  ] = await Promise.all([
    admin.from("profiles").select("id,username,country"),
    admin
      .from("account_subscriptions")
      .select("user_id,plan,subscription_status,billing_provider,payment_status,last_payment_at,next_payment_at,admin_notes"),
    admin.from("collection_items").select("user_id,quantity"),
    admin.from("app_admins").select("user_id"),
    admin
      .from("app_traffic_daily")
      .select("day,path,page_views")
      .gte("day", trafficStart),
  ])

  for (const result of [profilesResult, subscriptionsResult, collectionResult, adminsResult, trafficResult]) {
    if (result.error) throw result.error
  }

  const profiles = new Map(
    (profilesResult.data ?? []).map((row) => [
      row.id,
      { username: row.username ?? "", country: row.country ?? "" },
    ]),
  )
  const subscriptions = new Map(
    (subscriptionsResult.data ?? []).map((row) => [row.user_id, row]),
  )
  const adminIds = new Set((adminsResult.data ?? []).map((row) => row.user_id))
  const collectionCounts = new Map<string, number>()

  for (const row of collectionResult.data ?? []) {
    collectionCounts.set(
      row.user_id,
      (collectionCounts.get(row.user_id) ?? 0) + Math.max(1, Number(row.quantity ?? 1)),
    )
  }

  const trafficRows = trafficResult.data ?? []
  const pageViews7d = trafficRows
    .filter((row) => new Date(`${row.day}T00:00:00Z`).getTime() >= sevenDaysAgo)
    .reduce((sum, row) => sum + Number(row.page_views ?? 0), 0)
  const pageViews30d = trafficRows.reduce((sum, row) => sum + Number(row.page_views ?? 0), 0)

  const dayMap = new Map<string, number>()
  for (let offset = 13; offset >= 0; offset -= 1) {
    const d = new Date(now - offset * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    dayMap.set(d, 0)
  }
  for (const row of trafficRows) {
    if (dayMap.has(row.day)) {
      dayMap.set(row.day, (dayMap.get(row.day) ?? 0) + Number(row.page_views ?? 0))
    }
  }

  const routeMap = new Map<string, number>()
  for (const row of trafficRows) {
    routeMap.set(row.path, (routeMap.get(row.path) ?? 0) + Number(row.page_views ?? 0))
  }

  const users = authUsers
    .map((user) => {
      const profile = profiles.get(user.id)
      const subscription = subscriptions.get(user.id)
      return {
        id: user.id,
        email: user.email ?? "",
        username: profile?.username ?? user.email?.split("@")[0] ?? "collector",
        country: profile?.country ?? "",
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at ?? null,
        collectionCount: collectionCounts.get(user.id) ?? 0,
        isAdmin: adminIds.has(user.id),
        plan: (subscription?.plan ?? "free") as AccountPlan,
        subscriptionStatus: (subscription?.subscription_status ?? "inactive") as SubscriptionStatus,
        billingProvider: (subscription?.billing_provider ?? "none") as BillingProvider,
        paymentStatus: (subscription?.payment_status ?? "not_applicable") as PaymentStatus,
        lastPaymentAt: subscription?.last_payment_at ?? null,
        nextPaymentAt: subscription?.next_payment_at ?? null,
        adminNotes: subscription?.admin_notes ?? "",
      }
    })
    .sort((a, b) => isoTime(b.createdAt) - isoTime(a.createdAt))

  const collectionPieces = Array.from(collectionCounts.values()).reduce((sum, count) => sum + count, 0)

  return {
    currentAdminId: currentAdmin.id,
    generatedAt: new Date().toISOString(),
    stats: {
      totalAccounts: authUsers.length,
      active7d: authUsers.filter((user) => isoTime(user.last_sign_in_at) >= sevenDaysAgo).length,
      active30d: authUsers.filter((user) => isoTime(user.last_sign_in_at) >= thirtyDaysAgo).length,
      new7d: authUsers.filter((user) => isoTime(user.created_at) >= sevenDaysAgo).length,
      new30d: authUsers.filter((user) => isoTime(user.created_at) >= thirtyDaysAgo).length,
      collectorsWithItems: Array.from(collectionCounts.values()).filter((count) => count > 0).length,
      collectionPieces,
      pageViews7d,
      pageViews30d,
      proActive: users.filter(
        (user) => user.plan === "pro" && ["trialing", "active"].includes(user.subscriptionStatus),
      ).length,
    },
    dailyTraffic: Array.from(dayMap, ([day, pageViews]) => ({ day, pageViews })),
    topRoutes: Array.from(routeMap, ([path, pageViews]) => ({ path, pageViews }))
      .sort((a, b) => b.pageViews - a.pageViews)
      .slice(0, 8),
    users,
  }
}
