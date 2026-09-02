import "server-only"

import { and, eq } from "drizzle-orm"
import type { InferInsertModel, InferSelectModel } from "drizzle-orm"
import { db as defaultDb } from "../index"
import { collectionItems } from "../schema"
import type { Database } from "../types"

export type CollectionItem = InferSelectModel<typeof collectionItems>
export type NewCollectionItem = InferInsertModel<typeof collectionItems>

// Every function below takes an explicit `userId` and filters by it in the
// query itself — defense in depth, correct regardless of which Postgres
// role executes it. As of Step 5, callers (lib/actions/collection.ts) also
// route these through lib/db/rls.ts's withUserContext(), passing its `tx`
// as the optional trailing `dbClient` — that's what makes the `auth.uid()
// = user_id` RLS policies on these tables actually apply, on top of the
// explicit filter here. Defaults to the plain singleton db for callers
// that don't have a user context (there shouldn't be any for this file in
// practice, but the default keeps the functions usable standalone, e.g.
// from a future admin/migration script run as the privileged role).

export async function getCollectionForUser(userId: string, dbClient: Database = defaultDb) {
  return dbClient.query.collectionItems.findMany({
    where: eq(collectionItems.userId, userId),
    with: { product: true, release: true, photos: true },
    orderBy: (fields, { desc }) => [desc(fields.createdAt)],
  })
}

export async function getCollectionItemById(userId: string, id: string, dbClient: Database = defaultDb) {
  return dbClient.query.collectionItems.findFirst({
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
  dbClient: Database = defaultDb,
) {
  const [item] = await dbClient
    .insert(collectionItems)
    .values({ ...data, userId })
    .returning()
  return item
}

export async function updateCollectionItem(
  userId: string,
  id: string,
  data: Partial<Omit<NewCollectionItem, "id" | "userId" | "createdAt">>,
  dbClient: Database = defaultDb,
) {
  const [item] = await dbClient
    .update(collectionItems)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(collectionItems.id, id), eq(collectionItems.userId, userId)))
    .returning()
  return item
}

export async function deleteCollectionItem(userId: string, id: string, dbClient: Database = defaultDb) {
  const [item] = await dbClient
    .delete(collectionItems)
    .where(and(eq(collectionItems.id, id), eq(collectionItems.userId, userId)))
    .returning()
  return item
}
