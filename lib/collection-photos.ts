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
