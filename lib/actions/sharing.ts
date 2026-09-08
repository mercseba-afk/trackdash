"use server"

import { getCurrentUser } from "@/lib/auth/current-user"
import { withUserContext } from "@/lib/db/rls"
import { getProfileById } from "@/lib/db/queries/profiles"
import { getCollectionItemById, updateCollectionItem } from "@/lib/db/queries/collection"
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
import type { CollectionItem, Condition, Currency } from "@/lib/types"
import { mapCollectionRow } from "./mappers"

function assertShareMode(value: string): asserts value is ShareMode {
  if (value !== "showcase" && value !== "open_to_offers") {
    throw new Error("Invalid sharing mode")
  }
}

function mapShare(row: Awaited<ReturnType<typeof upsertCollectionShare>>) {
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

    await upsertCollectorProfile(
      user.id,
      {
        username: profile.username,
        country: profile.country,
        avatarUrl: profile.avatarUrl,
      },
      tx,
    )

    return mapShare(await upsertCollectionShare(user.id, collectionItemId, shareMode, tx))
  })
}

export async function removeCollectionShareAction(collectionItemId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")

  await withUserContext(user.id, async (tx) => {
    await deleteCollectionShare(user.id, collectionItemId, tx)
    await pruneCollectorProfileIfEmpty(user.id, tx)
  })
}

export async function saveCollectionItemAndShareAction(
  id: string,
  patch: Partial<CollectionItem>,
  visibility: "private" | ShareMode,
) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")
  if (visibility !== "private") assertShareMode(visibility)

  return withUserContext(user.id, async (tx) => {
    await updateCollectionItem(
      user.id,
      id,
      {
        ...(patch.condition !== undefined ? { condition: patch.condition as Condition } : {}),
        ...(patch.acquisitionDate !== undefined ? { acquisitionDate: patch.acquisitionDate.slice(0, 10) } : {}),
        ...(patch.acquisitionPrice !== undefined ? { acquisitionPrice: patch.acquisitionPrice.toString() } : {}),
        ...(patch.acquisitionCurrency !== undefined ? { acquisitionCurrency: patch.acquisitionCurrency as Currency } : {}),
        ...(patch.releaseYearOverride !== undefined ? { releaseYearOverride: patch.releaseYearOverride } : {}),
        ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      },
      tx,
    )

    let share: ReturnType<typeof mapShare> | null = null
    if (visibility === "private") {
      await deleteCollectionShare(user.id, id, tx)
      await pruneCollectorProfileIfEmpty(user.id, tx)
    } else {
      const profile = await getProfileById(user.id, tx)
      if (!profile) throw new Error("Collector profile not found")
      await upsertCollectorProfile(
        user.id,
        {
          username: profile.username,
          country: profile.country,
          avatarUrl: profile.avatarUrl,
        },
        tx,
      )
      share = mapShare(await upsertCollectionShare(user.id, id, visibility, tx))
    }

    const hydratedItem = await getCollectionItemById(user.id, id, tx)
    if (!hydratedItem) throw new Error("Collection item not found after save")

    return {
      item: mapCollectionRow(hydratedItem),
      share,
    }
  })
}

export async function getReleaseCollectorsAction(releaseId: string) {
  const user = await getCurrentUser()
  if (!user) return []

  const rows = await withUserContext(user.id, (tx) => getCollectorsForRelease(releaseId, tx))
  return rows.map((row) => ({
    id: row.id,
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
    shares: result.shares.map((share) => {
      const releaseImage = [...share.release.images].sort((a, b) => a.position - b.position)[0]?.url
      const productImage = [...share.product.images].sort((a, b) => a.position - b.position)[0]?.url

      return {
        id: share.id,
        collectionItemId: share.collectionItemId,
        condition: share.condition,
        shareMode: share.shareMode as ShareMode,
        updatedAt: share.updatedAt.toISOString(),
        imageUrl: releaseImage ?? productImage,
        product: {
          id: share.product.id,
          name: share.product.name,
        },
        release: {
          id: share.release.id,
          editionName: share.release.editionName,
          itemNumber: share.release.itemNumber ?? undefined,
          releaseYear: share.release.releaseYear ?? undefined,
        },
      }
    }),
  }
}
