"use server"

import { getCurrentUser } from "@/lib/auth/current-user"
import { withUserContext } from "@/lib/db/rls"
import { getCollectionItemById, updateCollectionItem } from "@/lib/db/queries/collection"
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
import type { Condition, Currency } from "@/lib/types"
import { mapCollectionRow } from "./mappers"

export type CollectionVisibility = "private" | ShareMode

function assertShareMode(value: string): asserts value is ShareMode {
  if (value !== "showcase" && value !== "open_to_offers") {
    throw new Error("Invalid sharing mode")
  }
}

function assertVisibility(value: string): asserts value is CollectionVisibility {
  if (value !== "private") assertShareMode(value)
}

function mapShare(row: {
  id: string
  collectionItemId: string
  productId: string
  releaseId: string
  condition: string
  shareMode: string
  createdAt: Date
  updatedAt: Date
}) {
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
  return rows.map(mapShare)
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

    return mapShare(await upsertCollectionShare(user.id, collectionItemId, shareMode, tx))
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

// Atomic edit used by My Collection. The private item mutation and its public
// sharing state are deliberately one PostgreSQL transaction: a failure in
// either half rolls the whole save back, so the UI can never end up with a
// newly-edited private item but an old sharing mode (or vice versa).
export async function saveCollectionItemAndShareAction(
  id: string,
  patch: Partial<{
    condition: Condition
    acquisitionDate: string
    acquisitionPrice: number
    acquisitionCurrency: Currency
    releaseYearOverride: number
    notes: string
  }>,
  visibility: string,
) {
  assertVisibility(visibility)

  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")

  return withUserContext(user.id, async (tx) => {
    const updated = await updateCollectionItem(
      user.id,
      id,
      {
        ...(patch.condition !== undefined ? { condition: patch.condition } : {}),
        ...(patch.acquisitionDate !== undefined ? { acquisitionDate: patch.acquisitionDate.slice(0, 10) } : {}),
        ...(patch.acquisitionPrice !== undefined ? { acquisitionPrice: patch.acquisitionPrice.toString() } : {}),
        ...(patch.acquisitionCurrency !== undefined ? { acquisitionCurrency: patch.acquisitionCurrency } : {}),
        ...(patch.releaseYearOverride !== undefined ? { releaseYearOverride: patch.releaseYearOverride } : {}),
        ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      },
      tx,
    )
    if (!updated) throw new Error("Collection item not found")

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

    // Return the fully-hydrated private row so the client store can update
    // itself without a second write or a second round-trip that could fail
    // after the transaction has already committed.
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
