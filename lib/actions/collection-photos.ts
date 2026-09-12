"use server"

import { getCurrentUser } from "@/lib/auth/current-user"
import { createClient } from "@/lib/supabase/server"

export const COLLECTION_PHOTO_BUCKET = "collection-item-photos"
export const MAX_COLLECTION_PHOTOS = 5

export type CollectionPhotoView = {
  id: string
  collectionItemId: string
  path: string
  position: number
  signedUrl: string
  createdAt: string
}

type PhotoRow = {
  id: string
  collection_item_id: string
  url: string
  position: number
  created_at: string
}

async function signRows(rows: PhotoRow[]): Promise<CollectionPhotoView[]> {
  if (rows.length === 0) return []
  const supabase = await createClient()
  const signed = await Promise.all(rows.map(async (row) => {
    const { data, error } = await supabase.storage
      .from(COLLECTION_PHOTO_BUCKET)
      .createSignedUrl(row.url, 60 * 30)
    if (error || !data?.signedUrl) return null
    return {
      id: row.id,
      collectionItemId: row.collection_item_id,
      path: row.url,
      position: row.position,
      signedUrl: data.signedUrl,
      createdAt: row.created_at,
    } satisfies CollectionPhotoView
  }))
  return signed.filter((row): row is CollectionPhotoView => Boolean(row))
}

export async function getCollectionItemPhotosAction(collectionItemId: string): Promise<CollectionPhotoView[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("collection_item_photos")
    .select("id,collection_item_id,url,position,created_at")
    .eq("collection_item_id", collectionItemId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })

  if (error) throw new Error(error.message)
  return signRows((data ?? []) as PhotoRow[])
}

export async function registerCollectionItemPhotoAction(collectionItemId: string, path: string): Promise<CollectionPhotoView> {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")

  const expectedPrefix = `${user.id}/${collectionItemId}/`
  if (!path.startsWith(expectedPrefix) || path.includes("..")) throw new Error("Invalid photo path")

  const supabase = await createClient()
  const { data: existing, error: existingError } = await supabase
    .from("collection_item_photos")
    .select("id,position")
    .eq("collection_item_id", collectionItemId)
    .order("position", { ascending: true })

  if (existingError) throw new Error(existingError.message)
  if ((existing?.length ?? 0) >= MAX_COLLECTION_PHOTOS) throw new Error("Maximum 5 photos per copy")

  const position = existing?.length ?? 0
  const { data, error } = await supabase
    .from("collection_item_photos")
    .insert({ collection_item_id: collectionItemId, url: path, position })
    .select("id,collection_item_id,url,position,created_at")
    .single()

  if (error) throw new Error(error.message)
  const [signed] = await signRows([data as PhotoRow])
  if (!signed) throw new Error("Photo uploaded but preview could not be generated")
  return signed
}

export async function deleteCollectionItemPhotoAction(photoId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")

  const supabase = await createClient()
  const { data: row, error: findError } = await supabase
    .from("collection_item_photos")
    .select("id,collection_item_id,url")
    .eq("id", photoId)
    .single()

  if (findError || !row) throw new Error(findError?.message ?? "Photo not found")

  const { error: storageError } = await supabase.storage.from(COLLECTION_PHOTO_BUCKET).remove([row.url])
  if (storageError) throw new Error(storageError.message)

  const { error: deleteError } = await supabase.from("collection_item_photos").delete().eq("id", photoId)
  if (deleteError) throw new Error(deleteError.message)

  const { data: remaining, error: remainingError } = await supabase
    .from("collection_item_photos")
    .select("id")
    .eq("collection_item_id", row.collection_item_id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })

  if (!remainingError && remaining) {
    await Promise.all(remaining.map((photo, position) =>
      supabase.from("collection_item_photos").update({ position }).eq("id", photo.id),
    ))
  }
}

export async function reorderCollectionItemPhotosAction(collectionItemId: string, orderedIds: string[]) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")
  if (orderedIds.length > MAX_COLLECTION_PHOTOS) throw new Error("Maximum 5 photos per copy")
  if (new Set(orderedIds).size !== orderedIds.length) throw new Error("Duplicate photo id")

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("collection_item_photos")
    .select("id")
    .eq("collection_item_id", collectionItemId)

  if (error) throw new Error(error.message)
  const currentIds = (data ?? []).map((row) => row.id).sort()
  const requestedIds = [...orderedIds].sort()
  if (currentIds.length !== requestedIds.length || currentIds.some((id, index) => id !== requestedIds[index])) {
    throw new Error("Photo order does not match this copy")
  }

  for (let position = 0; position < orderedIds.length; position += 1) {
    const { error: updateError } = await supabase
      .from("collection_item_photos")
      .update({ position })
      .eq("id", orderedIds[position])
    if (updateError) throw new Error(updateError.message)
  }
}
