import "server-only"

import { and, eq, sql } from "drizzle-orm"
import { db as defaultDb } from "../index"
import { collectionItems, collectionShares, collectorProfiles } from "../schema"
import type { Database } from "../types"

export type ShareMode = "showcase" | "open_to_offers"

export async function getMyCollectionShares(userId: string, dbClient: Database = defaultDb) {
  return dbClient.query.collectionShares.findMany({
    where: eq(collectionShares.userId, userId),
    orderBy: (fields, { desc }) => [desc(fields.updatedAt)],
  })
}

export async function upsertCollectorProfile(
  userId: string,
  profile: { username: string; country?: string | null; avatarUrl?: string | null },
  dbClient: Database = defaultDb,
) {
  const [row] = await dbClient
    .insert(collectorProfiles)
    .values({
      userId,
      username: profile.username,
      country: profile.country ?? null,
      avatarUrl: profile.avatarUrl ?? null,
    })
    .onConflictDoUpdate({
      target: collectorProfiles.userId,
      set: {
        username: profile.username,
        country: profile.country ?? null,
        avatarUrl: profile.avatarUrl ?? null,
        updatedAt: new Date(),
      },
    })
    .returning()
  return row
}

// Profile edits must keep an already-public collector projection in sync, but
// must NOT create a discoverable public profile for a user who has never shared
// anything. An UPDATE-only query preserves that privacy boundary.
export async function syncCollectorProfileIfPresent(
  userId: string,
  profile: { username: string; country?: string | null; avatarUrl?: string | null },
  dbClient: Database = defaultDb,
) {
  const [row] = await dbClient
    .update(collectorProfiles)
    .set({
      username: profile.username,
      country: profile.country ?? null,
      avatarUrl: profile.avatarUrl ?? null,
      updatedAt: new Date(),
    })
    .where(eq(collectorProfiles.userId, userId))
    .returning()

  return row
}

export async function upsertCollectionShare(
  userId: string,
  collectionItemId: string,
  shareMode: ShareMode,
  dbClient: Database = defaultDb,
) {
  // Resolve all public snapshot fields from the caller's OWN private row. The
  // client never supplies product/release/condition, so it cannot forge them.
  const item = await dbClient.query.collectionItems.findFirst({
    where: and(eq(collectionItems.id, collectionItemId), eq(collectionItems.userId, userId)),
  })
  if (!item) throw new Error("Collection item not found")

  const [share] = await dbClient
    .insert(collectionShares)
    .values({
      collectionItemId: item.id,
      userId,
      productId: item.productId,
      releaseId: item.releaseId,
      condition: item.condition,
      shareMode,
    })
    .onConflictDoUpdate({
      target: collectionShares.collectionItemId,
      set: {
        productId: item.productId,
        releaseId: item.releaseId,
        condition: item.condition,
        shareMode,
        updatedAt: new Date(),
      },
    })
    .returning()

  return share
}

export async function deleteCollectionShare(
  userId: string,
  collectionItemId: string,
  dbClient: Database = defaultDb,
) {
  const [row] = await dbClient
    .delete(collectionShares)
    .where(and(eq(collectionShares.collectionItemId, collectionItemId), eq(collectionShares.userId, userId)))
    .returning()
  return row
}

export async function pruneCollectorProfileIfEmpty(userId: string, dbClient: Database = defaultDb) {
  const remaining = await dbClient.query.collectionShares.findFirst({
    where: eq(collectionShares.userId, userId),
    columns: { id: true },
  })
  if (remaining) return false

  await dbClient.delete(collectorProfiles).where(eq(collectorProfiles.userId, userId))
  return true
}

export async function getCollectorsForRelease(releaseId: string, dbClient: Database = defaultDb) {
  return dbClient.query.collectionShares.findMany({
    where: eq(collectionShares.releaseId, releaseId),
    with: { collector: true },
    orderBy: (fields, { desc }) => [desc(fields.shareMode), desc(fields.updatedAt)],
  })
}

// Product-page release cards only need tiny aggregate signals. This query is
// deliberately based on collection_shares, never private collection_items, so
// the counts reveal only collectors who explicitly opted into Shared/Offers.
// Count DISTINCT users: a collector sharing two physical copies is still one
// collector in the UI, while the release-detail page can continue listing the
// individual copies themselves.
export async function getReleaseCommunityCounts(productId: string, dbClient: Database = defaultDb) {
  return dbClient
    .select({
      releaseId: collectionShares.releaseId,
      collectors: sql<number>`count(distinct ${collectionShares.userId})::int`,
      openToOffers: sql<number>`count(distinct ${collectionShares.userId}) filter (where ${collectionShares.shareMode} = 'open_to_offers')::int`,
    })
    .from(collectionShares)
    .where(eq(collectionShares.productId, productId))
    .groupBy(collectionShares.releaseId)
}

export async function getSharedCollectionForUsername(username: string, dbClient: Database = defaultDb) {
  return dbClient.query.collectorProfiles.findFirst({
    where: eq(collectorProfiles.username, username),
    with: {
      shares: {
        with: {
          product: { with: { images: true } },
          release: { with: { images: true } },
        },
        orderBy: (fields, { desc }) => [desc(fields.updatedAt)],
      },
    },
  })
}
