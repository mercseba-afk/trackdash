import "server-only"

import { sql } from "drizzle-orm"
import { db as defaultDb } from "../index"
import type { Database } from "../types"

export async function getUnreadDealNotificationCount(
  userId: string,
  dbClient: Database = defaultDb,
) {
  const rows = await dbClient.execute(sql<{ unread_count: number }>`
    with pending_incoming_offers as (
      select o.id
      from public.marketplace_offers o
      join public.conversations c on c.id = o.conversation_id
      left join public.conversation_reads cr
        on cr.conversation_id = c.id and cr.user_id = ${userId}::uuid
      where c.owner_id = ${userId}::uuid
        and c.status = 'accepted'
        and o.creator_id <> ${userId}::uuid
        and o.status = 'pending'
        and o.created_at > coalesce(cr.last_read_at, '-infinity'::timestamptz)
    ),
    due_seller_followups as (
      select o.id
      from public.marketplace_offers o
      join public.conversations c on c.id = o.conversation_id
      where c.owner_id = ${userId}::uuid
        and o.status = 'accepted'
        and o.deal_status = 'open'
        and o.followup_due_at is not null
        and o.followup_due_at <= now()
    ),
    pending_buyer_confirmations as (
      select s.id
      from public.marketplace_sales s
      where s.buyer_id = ${userId}::uuid
        and s.status = 'pending_confirmation'
    )
    select (
      (select count(*) from pending_incoming_offers) +
      (select count(*) from due_seller_followups) +
      (select count(*) from pending_buyer_confirmations)
    )::int as unread_count
  `)
  return Number(rows[0]?.unread_count ?? 0)
}
