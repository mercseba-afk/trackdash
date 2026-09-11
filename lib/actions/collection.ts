"use server"

import { getCurrentUser } from "@/lib/auth/current-user"
import { withUserContext } from "@/lib/db/rls"
import {
  createCollectionItem,
  deleteCollectionItem,
  getCollectionForUser,
  updateCollectionItem,
} from "@/lib/db/queries/collection"
import { getProfileById } from "@/lib/db/queries/profiles"
import { upsertCollectionShare, upsertCollectorProfile, type ShareMode } from "@/lib/db/queries/sharing"
import type { Condition, Currency } from "@/lib/types"
import { mapCollectionRow } from "./mappers"

// Every action below resolves the caller's own user via getCurrentUser()
// (Step 3) and never accepts a userId parameter from the client — there is
// no way to read or write another user's collection through these.
//
// Step 5: every DB call is now wrapped in withUserContext(user.id, ...)
// (lib/db/rls.ts), which is what makes the `auth.uid() = user_id` RLS
// policy on collection_items actually apply to these queries — not just
// the explicit userId filter already inside lib/db/queries/collection.ts.

export type InitialCollectionVisibility = "private" | ShareMode

function assertInitialVisibility(value: string): asserts value is InitialCollectionVisibility {
  if (value !== "private" && value !== "showcase" && value !== "open_to_offers") {
    throw new Error("Invalid collection visibility")
  }
}

export interface AddCollectionActionInput {
  productId: string
  releaseId: string
  condition: Condition
  acquisitionDate: string
  acquisitionPrice: number
  acquisitionCurrency: Currency
  releaseYearOverride?: number
  notes?: string
  visibility?: InitialCollectionVisibility
  askingPrice?: number
  askingCurrency?: Currency
}

export async function getMyCollectionAction() {
  const user = await getCurrentUser()
  if (!user) return []
  const rows = await withUserContext(user.id, (tx) => getCollectionForUser(user.id, tx))
  return rows.map(mapCollectionRow)
}

export async function addCollectionItemAction(input: AddCollectionActionInput) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")

  const visibility = input.visibility ?? "private"
  assertInitialVisibility(visibility)

  const row = await withUserContext(user.id, async (tx) => {
    const created = await createCollectionItem(
      user.id,
      {
        productId: input.productId,
        releaseId: input.releaseId,
        quantity: 1,
        condition: input.condition,
        // acquisition_date is nullable: an unknown historical purchase date
        // is better represented as NULL than silently pretending it was today.
        acquisitionDate: input.acquisitionDate ? input.acquisitionDate.slice(0, 10) : null,
        acquisitionPrice: input.acquisitionPrice.toString(),
        acquisitionCurrency: input.acquisitionCurrency,
        releaseYearOverride: input.releaseYearOverride ?? null,
        notes: input.notes ?? null,
      },
      tx,
    )

    // Sharing is opt-in and created in the SAME transaction as the private
    // collection item. A failure cannot leave behind a half-created public
    // projection, and Private remains the default when visibility is omitted.
    if (visibility !== "private") {
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
      await upsertCollectionShare(user.id, created.id, visibility, tx, {
        askingPrice: input.askingPrice,
        askingCurrency: input.askingCurrency,
      })
    }

    return created
  })

  return mapCollectionRow({ ...row, photos: [] })
}

export async function updateCollectionItemAction(
  id: string,
  patch: Partial<{
    condition: Condition
    acquisitionDate: string
    acquisitionPrice: number
    acquisitionCurrency: Currency
    releaseYearOverride: number
    notes: string
  }>,
) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")
  const row = await withUserContext(user.id, (tx) =>
    updateCollectionItem(
      user.id,
      id,
      {
        ...(patch.condition !== undefined ? { condition: patch.condition } : {}),
        ...(patch.acquisitionDate !== undefined
          ? { acquisitionDate: patch.acquisitionDate ? patch.acquisitionDate.slice(0, 10) : null }
          : {}),
        ...(patch.acquisitionPrice !== undefined ? { acquisitionPrice: patch.acquisitionPrice.toString() } : {}),
        ...(patch.acquisitionCurrency !== undefined ? { acquisitionCurrency: patch.acquisitionCurrency } : {}),
        ...(patch.releaseYearOverride !== undefined ? { releaseYearOverride: patch.releaseYearOverride } : {}),
        ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      },
      tx,
    ),
  )
  if (!row) return null
  return mapCollectionRow({ ...row, photos: [] })
}

export async function removeCollectionItemAction(id: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")
  await withUserContext(user.id, (tx) => deleteCollectionItem(user.id, id, tx))
}