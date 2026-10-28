import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { removeOwnedCollectionPhotos } from "@/lib/account/collection-photo-cleanup"

const COLLECTION_PHOTO_BUCKET = "collection-item-photos"

export async function deleteUserAndOwnedStorage(userId: string) {
  const admin = createAdminClient()

  const { data: items, error: itemsError } = await admin
    .from("collection_items")
    .select("id")
    .eq("user_id", userId)
  if (itemsError) throw itemsError

  const itemIds = (items ?? []).map((item) => item.id)
  let registeredPaths: string[] = []
  if (itemIds.length > 0) {
    const { data: photos, error: photosError } = await admin
      .from("collection_item_photos")
      .select("url")
      .in("collection_item_id", itemIds)
    if (photosError) throw photosError

    registeredPaths = (photos ?? []).map((photo) => photo.url).filter(Boolean)
  }

  await removeOwnedCollectionPhotos(admin.storage.from(COLLECTION_PHOTO_BUCKET), userId, registeredPaths)

  const { error } = await admin.auth.admin.deleteUser(userId, false)
  if (error) throw error
}
