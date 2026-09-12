"use server"

import { sql } from "drizzle-orm"
import { getCurrentUser } from "@/lib/auth/current-user"
import { withUserContext } from "@/lib/db/rls"

const OFFER_CURRENCIES = new Set(["EUR", "USD", "JPY", "GBP"] as const)
type OfferCurrency = "EUR" | "USD" | "JPY" | "GBP"

function cleanCurrency(value: string): OfferCurrency {
  const currency = value.trim().toUpperCase() as OfferCurrency
  if (!OFFER_CURRENCIES.has(currency)) throw new Error("Unsupported currency")
  return currency
}

function cleanAmount(value: number, currency: OfferCurrency) {
  if (!Number.isFinite(value) || value <= 0) throw new Error("Offer amount must be positive")
  if (currency === "JPY") return Math.round(value)
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export async function startMarketplaceOfferAction(
  collectionShareId: string,
  amount: number,
  currency: string,
) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")

  const cleanCode = cleanCurrency(currency)
  const cleanValue = cleanAmount(amount, cleanCode)

  return withUserContext(user.id, async (tx) => {
    const rows = await tx.execute(sql<{ conversation_id: string; offer_id: string }>`
      select *
      from public.trackdash_start_marketplace_offer(
        ${collectionShareId}::uuid,
        ${cleanValue}::numeric,
        ${cleanCode}::text
      )
    `)

    const row = rows[0]
    if (!row?.conversation_id || !row?.offer_id) throw new Error("Couldn't start this offer")

    return {
      conversationId: row.conversation_id,
      offerId: row.offer_id,
    }
  })
}
