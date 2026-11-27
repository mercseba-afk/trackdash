import "server-only"

import { sql, type SQLWrapper } from "drizzle-orm"

import type { MessagingUniverse } from "@/lib/messaging-inbox"

export type MessagingScope = "existing" | MessagingUniverse

export function messagingProductScope(productId: SQLWrapper, scope: MessagingScope) {
  const lego = sql`exists (
    select 1 from public.products messaging_product
    join public.categories messaging_category on messaging_category.id = messaging_product.category_id
    where messaging_product.id = ${productId} and messaging_category.slug in ${scope === "mini4wd"
      ? sql`('speed-champions', 'hotwheels')`
      : scope === "hotwheels" ? sql`('hotwheels')` : sql`('speed-champions')`}
  )`
  return scope === "speedchampions" || scope === "hotwheels" ? lego : sql`not ${lego}`
}
