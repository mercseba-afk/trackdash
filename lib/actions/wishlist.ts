"use server"

import { getCurrentUser } from "@/lib/auth/current-user"
import { withUserContext } from "@/lib/db/rls"
import { createCollectionItem } from "@/lib/db/queries/collection"
import {
  addWishlistItem,
  getWishlistForUser,
  removeWishlistItem,
  updateWishlistItem,
} from "@/lib/db/queries/wishlist"
import type { Condition, Currency, WishlistPriority } from "@/lib/types"
import { mapCollectionRow, mapWishlistRow } from "./mappers"

// Step 5: every DB call is now wrapped in withUserContext(user.id, ...) —
// see lib/actions/collection.ts's header comment for why.

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
  const rows = await withUserContext(user.id, (tx) => getWishlistForUser(user.id, tx))
  return rows.map(mapWishlistRow)
}

export async function addWishlistItemAction(input: AddWishlistActionInput) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")
  const row = await withUserContext(user.id, (tx) =>
    addWishlistItem(
      user.id,
      {
        productId: input.productId,
        releaseId: input.releaseId ?? null,
        priority: input.priority,
        targetPrice: input.targetPrice !== undefined ? input.targetPrice.toString() : null,
        currency: "EUR",
        notes: input.notes ?? null,
      },
      tx,
    ),
  )
  return mapWishlistRow(row)
}

export async function updateWishlistItemAction(
  id: string,
  patch: Partial<{ priority: WishlistPriority; targetPrice: number; notes: string }>,
) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")
  const row = await withUserContext(user.id, (tx) =>
    updateWishlistItem(
      user.id,
      id,
      {
        ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
        ...(patch.targetPrice !== undefined ? { targetPrice: patch.targetPrice.toString() } : {}),
        ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      },
      tx,
    ),
  )
  if (!row) return null
  return mapWishlistRow(row)
}

export async function removeWishlistItemAction(id: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")
  await withUserContext(user.id, (tx) => removeWishlistItem(user.id, id, tx))
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

// Both operations now run inside the SAME withUserContext transaction —
// an improvement over Step 4B, which ran them as two separate calls (and
// therefore two separate transactions). Still not a single atomic
// operation was the Step 4B tradeoff description; as of Step 5 it
// actually is: if removeWishlistItem fails, createCollectionItem's insert
// rolls back too, since both happen inside withUserContext's one
// db.transaction().
export async function moveWishlistItemToCollectionAction(wishlistId: string, input: MoveWishlistToCollectionInput) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")

  return withUserContext(user.id, async (tx) => {
    const wishlist = await getWishlistForUser(user.id, tx)
    const target = wishlist.find((w) => w.id === wishlistId)
    if (!target) throw new Error("Wishlist item not found")

    const row = await createCollectionItem(
      user.id,
      {
        productId: target.productId,
        releaseId: input.releaseId,
        quantity: 1,
        condition: input.condition,
        acquisitionDate: input.acquisitionDate.slice(0, 10),
        acquisitionPrice: input.acquisitionPrice.toString(),
        acquisitionCurrency: input.acquisitionCurrency,
        releaseYearOverride: input.releaseYearOverride ?? null,
        notes: input.notes ?? null,
      },
      tx,
    )
    await removeWishlistItem(user.id, wishlistId, tx)
    return mapCollectionRow({ ...row, photos: [] })
  })
}
