import "server-only"

import { createClient } from "@/lib/supabase/server"

const COLLECTION_PHOTO_BUCKET = "collection-item-photos"

type PhotoRow = {
  collection_item_id: string
  url: string
  position: number
  created_at: string
}

/**
 * Resolve only the primary real photo for copies that the caller is allowed
 * to see through RLS. Migration 0077 deliberately exposes real copy photos
 * only for open_to_offers shares (plus the owner), never for showcase-only
 * copies. Signed URLs are short-lived and the bucket stays private.
 */
export async function getVisiblePrimaryCopyPhotos(collectionItemIds: string[]) {
  const uniqueIds = [...new Set(collectionItemIds.filter(Boolean))]
  if (uniqueIds.length === 0) return new Map<string, string>()

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("collection_item_photos")
    .select("collection_item_id,url,position,created_at")
    .in("collection_item_id", uniqueIds)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })

  if (error) return new Map<string, string>()

  const firstByItem = new Map<string, PhotoRow>()
  for (const row of (data ?? []) as PhotoRow[]) {
    if (!firstByItem.has(row.collection_item_id)) firstByItem.set(row.collection_item_id, row)
  }

  const entries = await Promise.all([...firstByItem.entries()].map(async ([collectionItemId, row]) => {
    const { data: signed, error: signError } = await supabase.storage
      .from(COLLECTION_PHOTO_BUCKET)
      .createSignedUrl(row.url, 60 * 20)
    if (signError || !signed?.signedUrl) return null
    return [collectionItemId, signed.signedUrl] as const
  }))

  return new Map(entries.filter((entry): entry is readonly [string, string] => Boolean(entry)))
}
