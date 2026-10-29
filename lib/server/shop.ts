import "server-only"
import { and, eq, sql } from "drizzle-orm"
import { notFound } from "next/navigation"
import { canAccessShop } from "./shop-gate"
import { getCurrentUser } from "@/lib/auth/current-user"
import { withUserContext } from "@/lib/db/rls"
import { collectionShares } from "@/lib/db/schema"
import { createAdminClient } from "@/lib/supabase/admin"
import { getVisiblePrimaryCopyPhotos } from "@/lib/actions/shared-copy-photos"
import { releasePublicPath } from "@/lib/seo/catalog-paths"
import type { Condition, Currency } from "@/lib/types"

export type ShopCopy = {
  id: string
  username: string
  name: string
  editionName: string
  itemNumber: string | null
  releaseYear: number | null
  chassis: string | null
  condition: Condition
  askingPrice: number | null
  askingCurrency: Currency | null
  imageUrl: string | null
  isCopyPhoto: boolean
  releaseHref: string
  isMine: boolean
}

export async function getShopCopies(shareId?: string): Promise<ShopCopy[]> {
  // Guard the data boundary as well as each page. Never cache across users.
  if (!await canAccessShop()) notFound()
  if (shareId && !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(shareId)) notFound()
  const user = await getCurrentUser()
  if (!user) notFound()
  const rows = await withUserContext(user.id, (tx) => tx.query.collectionShares.findMany({
    where: and(
      eq(collectionShares.shareMode, "open_to_offers"),
      shareId ? eq(collectionShares.id, shareId) : undefined,
      sql`exists (select 1 from public.product_releases r join public.products p on p.id = r.product_id
        join public.brands b on b.id = p.brand_id
        where r.id = ${collectionShares.releaseId} and r.catalog_visibility = 'public'
        and b.slug = 'tamiya' and p.metadata->>'launch_status' = 'available'
        and coalesce(p.metadata->>'catalog_visibility', 'public') <> 'archived')`,
    ),
    columns: { id: true, userId: true, collectionItemId: true, condition: true, askingPrice: true, askingCurrency: true },
    with: {
      collector: { columns: { username: true } },
      product: { columns: { name: true }, with: { images: { columns: { url: true, position: true } } } },
      release: { columns: { editionName: true, itemNumber: true, releaseYear: true, chassis: true }, with: { images: { columns: { url: true, position: true } } } },
    },
    orderBy: (fields, { desc }) => [desc(fields.updatedAt), desc(fields.id)],
    limit: 100,
  }))
  if (!rows.length) return []
  // A reservation may belong to another buyer: participant RLS would conceal
  // it. Resolve only the share IDs on the server, never return deal details.
  const { data: deals, error } = await createAdminClient().from("marketplace_offers")
    .select("conversations!inner(collection_share_id)")
    .eq("status", "accepted").neq("deal_status", "cancelled")
    .in("conversations.collection_share_id", rows.map((row) => row.id))
  if (error) throw error // Fail closed rather than advertise reserved copies.
  const reserved = new Set((deals ?? []).flatMap((deal) => {
    const conversations = Array.isArray(deal.conversations) ? deal.conversations : [deal.conversations]
    return conversations.map((conversation) => conversation.collection_share_id as string)
  }))
  const available = rows.filter((row) => !reserved.has(row.id))
  const photos = await getVisiblePrimaryCopyPhotos(available.map((row) => row.collectionItemId))
  return available.map((row) => {
    const copyPhoto = photos.get(row.collectionItemId)
    const releaseImage = [...row.release.images].sort((a, b) => a.position - b.position)[0]?.url
    const productImage = [...row.product.images].sort((a, b) => a.position - b.position)[0]?.url
    return {
      id: row.id, username: row.collector.username, name: row.product.name,
      editionName: row.release.editionName, itemNumber: row.release.itemNumber,
      releaseYear: row.release.releaseYear, chassis: row.release.chassis,
      condition: row.condition as Condition,
      askingPrice: row.askingPrice ? Number(row.askingPrice) : null,
      askingCurrency: row.askingCurrency as Currency | null,
      imageUrl: copyPhoto ?? releaseImage ?? productImage ?? null,
      isCopyPhoto: Boolean(copyPhoto),
      releaseHref: releasePublicPath(row.product, { ...row.release, itemNumber: row.release.itemNumber ?? undefined, releaseYear: row.release.releaseYear ?? undefined }),
      isMine: user.id === row.userId,
    }
  })
}
