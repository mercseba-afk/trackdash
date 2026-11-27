import "server-only"

import { sql, type SQLWrapper } from "drizzle-orm"

export type MessagingScope = "existing" | "speedchampions"

export function messagingProductScope(productId: SQLWrapper, scope: MessagingScope) {
  const lego = sql`exists (
    select 1 from public.products messaging_product
    join public.categories messaging_category on messaging_category.id = messaging_product.category_id
    where messaging_product.id = ${productId} and messaging_category.slug = 'speed-champions'
  )`
  return scope === "speedchampions" ? lego : sql`not ${lego}`
}
