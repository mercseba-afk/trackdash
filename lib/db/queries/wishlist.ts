import "server-only"

import { and, eq } from "drizzle-orm"
import type { InferInsertModel, InferSelectModel } from "drizzle-orm"
import { db as defaultDb } from "../index"
import { wishlistItems } from "../schema"
import type { Database } from "../types"

export type WishlistItem = InferSelectModel<typeof wishlistItems>
export type NewWishlistItem = InferInsertModel<typeof wishlistItems>

// Same pattern as lib/db/queries/collection.ts: explicit userId filter as
// the baseline defense, plus an optional dbClient so callers can route
// through lib/db/rls.ts's withUserContext() for real RLS enforcement.

export async function getWishlistForUser(userId: string, dbClient: Database = defaultDb) {
  return dbClient.query.wishlistItems.findMany({
    where: eq(wishlistItems.userId, userId),
    with: { product: true, release: true },
    orderBy: (fields, { desc }) => [desc(fields.createdAt)],
  })
}

export async function addWishlistItem(
  userId: string,
  data: Omit<NewWishlistItem, "id" | "userId" | "createdAt">,
  dbClient: Database = defaultDb,
) {
  const [item] = await dbClient
    .insert(wishlistItems)
    .values({ ...data, userId })
    .returning()
  return item
}

export async function updateWishlistItem(
  userId: string,
  id: string,
  data: Partial<Omit<NewWishlistItem, "id" | "userId" | "createdAt">>,
  dbClient: Database = defaultDb,
) {
  const [item] = await dbClient
    .update(wishlistItems)
    .set(data)
    .where(and(eq(wishlistItems.id, id), eq(wishlistItems.userId, userId)))
    .returning()
  return item
}

export async function removeWishlistItem(userId: string, id: string, dbClient: Database = defaultDb) {
  const [item] = await dbClient
    .delete(wishlistItems)
    .where(and(eq(wishlistItems.id, id), eq(wishlistItems.userId, userId)))
    .returning()
  return item
}
