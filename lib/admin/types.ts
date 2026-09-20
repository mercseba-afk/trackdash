export type AccountPlan = "free" | "pro"
export type SubscriptionStatus = "inactive" | "trialing" | "active" | "past_due" | "canceled"
export type BillingProvider = "none" | "manual" | "stripe" | "app_store" | "play_store"
export type PaymentStatus = "not_applicable" | "pending" | "paid" | "failed" | "refunded"

export interface AdminUserRow {
  id: string
  email: string
  username: string
  country: string
  createdAt: string
  lastSignInAt: string | null
  collectionCount: number
  isAdmin: boolean
  plan: AccountPlan
  subscriptionStatus: SubscriptionStatus
  billingProvider: BillingProvider
  paymentStatus: PaymentStatus
  lastPaymentAt: string | null
  nextPaymentAt: string | null
  adminNotes: string
}

export interface AdminDashboardData {
  currentAdminId: string
  generatedAt: string
  stats: {
    totalAccounts: number
    active7d: number
    active30d: number
    new7d: number
    new30d: number
    collectorsWithItems: number
    collectionPieces: number
    pageViews7d: number
    pageViews30d: number
    proActive: number
  }
  dailyTraffic: Array<{
    day: string
    pageViews: number
  }>
  topRoutes: Array<{
    path: string
    pageViews: number
  }>
  community: {
    messagesTotal: number
    messages7d: number
    messages30d: number
    conversationsTotal: number
    conversationsAccepted: number
    offersTotal: number
    offersAccepted: number
    offersOpen: number
    salesReported: number
    salesConfirmed: number
    salesDisputed: number
    ownershipTransfers: number
    offerAcceptanceRate: number
    saleConfirmationRate: number
  }
  users: AdminUserRow[]
}
