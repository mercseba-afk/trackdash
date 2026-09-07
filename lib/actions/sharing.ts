"use server"

import { getCurrentUser } from "@/lib/auth/current-user"
import { withUserContext } from "@/lib/db/rls"
import { getProfileById } from "@/lib/db/queries/profiles"
import {
  deleteCollectionShare,
  getCollectorsForRelease,
  getMyCollectionShares,
  getSharedCollectionForUsername,
  pruneCollectorProfileIfEmpty,
  upsertCollectionShare,
  upsertCollectorProfile,
  type ShareMode,
} from "@/lib/db/queries/sharing"

function assertShareMode(value: string): asserts value is ShareMode {
  if (value !== "showcase" && value !== "open_to_offers") {
    throw new Error("Invalid sharing mode")
  }
}

export async function getMyCollectionSharesAction() {
  const user = await getCurrentUser()
  if (!user) return []

  const rows = await withUserContext(user.id, (tx) => getMyCollectionShares(user.id, tx))
  return rows.map((row) => ({
    id: row.id,
    collectionItemId: row.collectionItemId,
    productId: row.productId,
    releaseId: row.releaseId,
    condition: row.condition,
    shareMode: row.shareMode as ShareMode,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }))
}

export async function setCollectionShareAction(collectionItemId: string, shareMode: string) {
  assertShareMode(shareMode)

  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")

  return withUserContext(user.id, async (tx) => {
    const profile = await getProfileById(user.id, tx)
    if (!profile) throw new Error("Collector profile not found")

    // Creating the public-safe profile projection and the share in the same
    // transaction avoids a visible profile with no corresponding shared item.
    await upsertCollectorProfile(
      user.id,
      {
        username: profile.username,
        country: profile.country,
        avatarUrl: profile.avatarUrl,
      },
      tx,
    )

    const row = await upsertCollectionShare(user.id, collectionItemId, shareMode, tx)
    return {
      id: row.id,
      collectionItemId: row.collectionItemId,
      productId: row.productId,
      releaseId: row.releaseId,
      condition: row.condition,
      shareMode: row.shareMode as ShareMode,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }
  })
}

export async function removeCollectionShareAction(collectionItemId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")

  await withUserContext(user.id, async (tx) => {
    await deleteCollectionShare(user.id, collectionItemId, tx)
    // No shared rows left = no reason to keep a discoverable public profile.
    await pruneCollectorProfileIfEmpty(user.id, tx)
  })
}

export async function getReleaseCollectorsAction(releaseId: string) {
  const user = await getCurrentUser()
  if (!user) return []

  const rows = await withUserContext(user.id, (tx) => getCollectorsForRelease(releaseId, tx))
  return rows.map((row) => ({
    userId: row.userId,
    username: row.collector.username,
    country: row.collector.country ?? undefined,
    avatarUrl: row.collector.avatarUrl ?? undefined,
    collectionItemId: row.collectionItemId,
    condition: row.condition,
    shareMode: row.shareMode as ShareMode,
  }))
}

export async function getSharedCollectionByUsernameAction(username: string) {
  const user = await getCurrentUser()
  if (!user) return null

  const result = await withUserContext(user.id, (tx) => getSharedCollectionForUsername(username, tx))
  if (!result || result.shares.length === 0) return null

  return {
    profile: {
      userId: result.userId,
      username: result.username,
      country: result.country ?? undefined,
      avatarUrl: result.avatarUrl ?? undefined,
    },
    shares: result.shares.map((share) => ({
      id: share.id,
      collectionItemId: share.collectionItemId,
      productId: share.productId,
      releaseId: share.releaseId,
      condition: share.condition,
      shareMode: share.shareMode as ShareMode,
      updatedAt: share.updatedAt.toISOString(),
    })),
  }
}
