import "server-only"

import { sql } from "drizzle-orm"
import { withUserContext } from "@/lib/db/rls"
import type { LegoListItem, LegoListKind } from "@/lib/lego/personal-list-types"

export async function readLegoList(userId: string, filter: { kind: LegoListKind } | { setNumber: string }) {
  return withUserContext(userId, (tx) => tx.execute<LegoListItem>(sql`
    select list_kind as kind, set_number as "setNumber", quantity, condition
    from public.lego_personal_list_items
    where user_id = ${userId} and ${"kind" in filter ? sql`list_kind = ${filter.kind}` : sql`set_number = ${filter.setNumber}`}
    order by set_number
  `))
}
