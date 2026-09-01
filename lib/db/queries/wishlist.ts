import "server-only"

import { and, eq } from "drizzle-orm"
import type { InferInsertModel, InferSelectModel } from "drizzle-orm"
import { db } from "../index"
import { wishlistItems } from "../schema"

export type WishlistItem = InferSelectModel<typeof wishlistItems>
export type NewWishlistItem = InferInsertModel<typeof wishlistItems>

export async function getWishlistForUser(userId: string) {
  return db.query.wishlistItems.findMany({
    where: eq(wishlistItems.userId, userId),
    with: { product: true, release: true },
    orderBy: (fields, { desc }) => [desc(fields.createdAt)],
  })
}

export async function addWishlistItem(userId: string, data: Omit<NewWishlistItem, "id" | "userId" | "createdAt">) {
  const [item] = await db
    .insert(wishlistItems)
    .values({ ...data, userId })
    .returning()
  return item
}

export async function updateWishlistItem(
  userId: string,
  id: string,
  data: Partial<Omit<NewWishlistItem, "id" | "userId" | "createdAt">>,
) {
  const [item] = await db
    .update(wishlistItems)
    .set(data)
    .where(and(eq(wishlistItems.id, id), eq(wishlistItems.userId, userId)))
    .returning()
  return item
}

export async function removeWishlistItem(userId: string, id: string) {
  const [item] = await db
    .delete(wishlistItems)
    .where(and(eq(wishlistItems.id, id), eq(wishlistItems.userId, userId)))
    .returning()
  return item
}
