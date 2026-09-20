import { sql } from "drizzle-orm"
import {
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { authUsers } from "drizzle-orm/supabase"

export const appAdmins = pgTable("app_admins", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  label: text("label"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS()

export const accountSubscriptions = pgTable(
  "account_subscriptions",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    plan: text("plan").notNull().default("free"),
    subscriptionStatus: text("subscription_status").notNull().default("inactive"),
    billingProvider: text("billing_provider").notNull().default("none"),
    providerCustomerId: text("provider_customer_id"),
    providerSubscriptionId: text("provider_subscription_id"),
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    paymentStatus: text("payment_status").notNull().default("not_applicable"),
    lastPaymentAt: timestamp("last_payment_at", { withTimezone: true }),
    nextPaymentAt: timestamp("next_payment_at", { withTimezone: true }),
    lastPaymentAmount: numeric("last_payment_amount", { precision: 10, scale: 2 }),
    lastPaymentCurrency: text("last_payment_currency"),
    adminNotes: text("admin_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_account_subscriptions_plan_status").on(table.plan, table.subscriptionStatus),
    check("account_subscriptions_plan_check", sql`${table.plan} in ('free', 'pro')`),
    check(
      "account_subscriptions_status_check",
      sql`${table.subscriptionStatus} in ('inactive', 'trialing', 'active', 'past_due', 'canceled')`,
    ),
    check(
      "account_subscriptions_provider_check",
      sql`${table.billingProvider} in ('none', 'manual', 'stripe', 'app_store', 'play_store')`,
    ),
    check(
      "account_subscriptions_payment_check",
      sql`${table.paymentStatus} in ('not_applicable', 'pending', 'paid', 'failed', 'refunded')`,
    ),
  ],
).enableRLS()

export const appTrafficDaily = pgTable(
  "app_traffic_daily",
  {
    day: date("day").notNull().default(sql`current_date`),
    path: text("path").notNull(),
    signedIn: boolean("signed_in").notNull().default(false),
    pageViews: integer("page_views").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.day, table.path, table.signedIn] }),
    index("idx_app_traffic_daily_day").on(table.day.desc()),
    check("app_traffic_daily_page_views_check", sql`${table.pageViews} >= 0`),
    check("app_traffic_daily_path_length_check", sql`char_length(${table.path}) between 1 and 180`),
  ],
).enableRLS()
