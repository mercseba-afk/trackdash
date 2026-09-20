import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

const COLLECTION_PHOTO_BUCKET = "collection-item-photos"

export async function deleteUserAndOwnedStorage(userId: string) {
  const admin = createAdminClient()

  const { data: items, error: itemsError } = await admin
    .from("collection_items")
    .select("id")
    .eq("user_id", userId)
  if (itemsError) throw itemsError

  const itemIds = (items ?? []).map((item) => item.id)
  if (itemIds.length > 0) {
    const { data: photos, error: photosError } = await admin
      .from("collection_item_photos")
      .select("url")
      .in("collection_item_id", itemIds)
    if (photosError) throw photosError

    const paths = (photos ?? []).map((photo) => photo.url).filter(Boolean)
    for (let start = 0; start < paths.length; start += 1000) {
      const batch = paths.slice(start, start + 1000)
      if (batch.length === 0) continue
      const { error: storageError } = await admin.storage.from(COLLECTION_PHOTO_BUCKET).remove(batch)
      if (storageError) throw storageError
    }
  }

  const { error } = await admin.auth.admin.deleteUser(userId, false)
  if (error) throw error
}
