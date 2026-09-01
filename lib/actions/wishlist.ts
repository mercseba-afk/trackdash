"use server"

import { getCurrentUser } from "@/lib/auth/current-user"
import { createCollectionItem } from "@/lib/db/queries/collection"
import {
  addWishlistItem,
  getWishlistForUser,
  removeWishlistItem,
  updateWishlistItem,
} from "@/lib/db/queries/wishlist"
import type { Condition, Currency, WishlistPriority } from "@/lib/types"
import { mapCollectionRow, mapWishlistRow } from "./mappers"

export interface AddWishlistActionInput {
  productId: string
  releaseId?: string
  priority: WishlistPriority
  targetPrice?: number
  notes?: string
}

export async function getMyWishlistAction() {
  const user = await getCurrentUser()
  if (!user) return []
  const rows = await getWishlistForUser(user.id)
  return rows.map(mapWishlistRow)
}

export async function addWishlistItemAction(input: AddWishlistActionInput) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")
  const row = await addWishlistItem(user.id, {
    productId: input.productId,
    releaseId: input.releaseId ?? null,
    priority: input.priority,
    targetPrice: input.targetPrice !== undefined ? input.targetPrice.toString() : null,
    currency: "EUR",
    notes: input.notes ?? null,
  })
  return mapWishlistRow(row)
}

export async function updateWishlistItemAction(
  id: string,
  patch: Partial<{ priority: WishlistPriority; targetPrice: number; notes: string }>,
) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")
  const row = await updateWishlistItem(user.id, id, {
    ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
    ...(patch.targetPrice !== undefined ? { targetPrice: patch.targetPrice.toString() } : {}),
    ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
  })
  if (!row) return null
  return mapWishlistRow(row)
}

export async function removeWishlistItemAction(id: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")
  await removeWishlistItem(user.id, id)
}

export interface MoveWishlistToCollectionInput {
  releaseId: string
  condition: Condition
  acquisitionDate: string
  acquisitionPrice: number
  acquisitionCurrency: Currency
  releaseYearOverride?: number
  notes?: string
}

// Two sequential operations (create the collection item, then remove the
// wishlist item) rather than one DB transaction — the query layer
// (lib/db/queries/*) doesn't currently thread a shared transaction client
// through its functions, and adding that plumbing for this one call site
// is more than this step needs. Worth revisiting if partial failures here
// turn out to matter in practice.
export async function moveWishlistItemToCollectionAction(wishlistId: string, input: MoveWishlistToCollectionInput) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")

  const wishlist = await getWishlistForUser(user.id)
  const target = wishlist.find((w) => w.id === wishlistId)
  if (!target) throw new Error("Wishlist item not found")

  const row = await createCollectionItem(user.id, {
    productId: target.productId,
    releaseId: input.releaseId,
    quantity: 1,
    condition: input.condition,
    acquisitionDate: input.acquisitionDate.slice(0, 10),
    acquisitionPrice: input.acquisitionPrice.toString(),
    acquisitionCurrency: input.acquisitionCurrency,
    releaseYearOverride: input.releaseYearOverride ?? null,
    notes: input.notes ?? null,
  })
  await removeWishlistItem(user.id, wishlistId)
  return mapCollectionRow({ ...row, photos: [] })
}
