import "server-only"

import { and, eq } from "drizzle-orm"
import type { InferInsertModel, InferSelectModel } from "drizzle-orm"
import { db } from "../index"
import { collectionItems } from "../schema"

export type CollectionItem = InferSelectModel<typeof collectionItems>
export type NewCollectionItem = InferInsertModel<typeof collectionItems>

// Every function below takes an explicit `userId` and filters by it in the
// query itself — this is what actually protects the data today (see
// lib/db/rls.ts for why the RLS policies alone aren't sufficient yet
// through this direct-Postgres connection). Never accept a userId from
// anywhere other than the caller's resolved session (see
// lib/auth/current-user.ts) — never hardcode one.

export async function getCollectionForUser(userId: string) {
  return db.query.collectionItems.findMany({
    where: eq(collectionItems.userId, userId),
    with: { product: true, release: true, photos: true },
    orderBy: (fields, { desc }) => [desc(fields.createdAt)],
  })
}

export async function getCollectionItemById(userId: string, id: string) {
  return db.query.collectionItems.findFirst({
    where: and(eq(collectionItems.id, id), eq(collectionItems.userId, userId)),
    with: {
      product: true,
      release: true,
      photos: true,
      valueHistory: { orderBy: (fields, { desc }) => [desc(fields.recordedAt)] },
    },
  })
}

export async function createCollectionItem(
  userId: string,
  data: Omit<NewCollectionItem, "id" | "userId" | "createdAt" | "updatedAt">,
) {
  const [item] = await db
    .insert(collectionItems)
    .values({ ...data, userId })
    .returning()
  return item
}

export async function updateCollectionItem(
  userId: string,
  id: string,
  data: Partial<Omit<NewCollectionItem, "id" | "userId" | "createdAt">>,
) {
  const [item] = await db
    .update(collectionItems)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(collectionItems.id, id), eq(collectionItems.userId, userId)))
    .returning()
  return item
}

export async function deleteCollectionItem(userId: string, id: string) {
  const [item] = await db
    .delete(collectionItems)
    .where(and(eq(collectionItems.id, id), eq(collectionItems.userId, userId)))
    .returning()
  return item
}
