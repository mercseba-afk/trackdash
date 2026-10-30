import "server-only"
import { and, eq, sql } from "drizzle-orm"
import { notFound } from "next/navigation"
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
  fallbackImageUrl: string | null
  isCopyPhoto: boolean
  releaseHref: string
  isMine: boolean
}

export async function getShopCopies(shareId?: string): Promise<ShopCopy[]> {
  // Public, opt-in sale projection only. Never return private collection rows.
  if (shareId && !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(shareId)) notFound()
  const user = await getCurrentUser()
  const rows = user ? await withUserContext(user.id, (tx) => tx.query.collectionShares.findMany({
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
  })) : await getPublicShopRows(shareId)
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
  const photos = user
    ? await getVisiblePrimaryCopyPhotos(available.map((row) => row.collectionItemId))
    : await getPublicSalePhotos(available.map((row) => row.collectionItemId))
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
      fallbackImageUrl: copyPhoto ? releaseImage ?? null : null,
      isCopyPhoto: Boolean(copyPhoto),
      releaseHref: releasePublicPath(row.product, { ...row.release, itemNumber: row.release.itemNumber ?? undefined, releaseYear: row.release.releaseYear ?? undefined }),
      isMine: user?.id === row.userId,
    }
  })
}

// The existing Data API remains authenticated-only. This narrow server-side
// projection explicitly authorizes anonymous reads of open sale shares only;
// no anonymous grants, private profiles or collection_items are involved.
async function getPublicShopRows(shareId?: string) {
  let query = createAdminClient().from("collection_shares").select(`
    id,user_id,collection_item_id,condition,asking_price,asking_currency,
    collector:collector_profiles!collection_shares_user_id_fkey!inner(username),
    product:products!collection_shares_product_id_fkey!inner(name,metadata,brand:brands!inner(slug),images:product_images(url,position)),
    release:product_releases!collection_shares_release_id_fkey!inner(edition_name,item_number,release_year,chassis,catalog_visibility,images:release_images(url,position))
  `).eq("share_mode", "open_to_offers")
    .eq("release.catalog_visibility", "public")
    .eq("product.brand.slug", "tamiya")
    .eq("product.metadata->>launch_status", "available")
    .order("updated_at", { ascending: false }).order("id", { ascending: false }).limit(100)
  if (shareId) query = query.eq("id", shareId)
  const { data, error } = await query
  if (error) throw error
  // Untyped Supabase clients infer nested to-one relations as arrays. Normalize
  // both response shapes before applying the final visibility checks.
  const one = <T,>(value: T | T[]) => Array.isArray(value) ? value[0] : value
  return (data ?? []).flatMap((row) => {
    const product = one(row.product)
    const release = one(row.release)
    const collector = one(row.collector)
    const brand = product && one(product.brand)
    const metadata = product?.metadata as Record<string, unknown> | null
    if (!product || !release || !collector || brand?.slug !== "tamiya"
      || release.catalog_visibility !== "public" || metadata?.launch_status !== "available"
      || metadata?.catalog_visibility === "archived") return []
    return [{
      id: row.id as string, userId: row.user_id as string,
      collectionItemId: row.collection_item_id as string,
      condition: row.condition as string, askingPrice: row.asking_price as string | null,
      askingCurrency: row.asking_currency as string | null,
      collector: { username: collector.username as string },
      product: { name: product.name as string, images: product.images as Array<{url: string; position: number}> },
      release: { editionName: release.edition_name as string, itemNumber: release.item_number as string | null,
        releaseYear: release.release_year as number | null, chassis: release.chassis as string | null,
        images: release.images as Array<{url: string; position: number}> },
    }]
  })
}

// Called only with the bounded, available open_to_offers rows above. Private
// photos stay in a private bucket; only those sale copies receive signed URLs.
async function getPublicSalePhotos(collectionItemIds: string[]) {
  if (!collectionItemIds.length) return new Map<string, string>()
  const client = createAdminClient()
  const { data, error } = await client.from("collection_item_photos")
    .select("collection_item_id,url,position,created_at")
    .in("collection_item_id", collectionItemIds)
    .order("position", { ascending: true }).order("created_at", { ascending: true })
  if (error) return new Map<string, string>()
  const first = new Map<string, string>()
  for (const row of data ?? []) if (!first.has(row.collection_item_id)) first.set(row.collection_item_id, row.url)
  const signed = await Promise.all([...first].map(async ([id, path]) => {
    const { data, error } = await client.storage.from("collection-item-photos").createSignedUrl(path, 60 * 20)
    return !error && data?.signedUrl ? [id, data.signedUrl] as const : null
  }))
  return new Map(signed.filter((entry): entry is readonly [string, string] => entry !== null))
}
