"use server"

import { getCurrentUser } from "@/lib/auth/current-user"
import { withUserContext } from "@/lib/db/rls"
import {
  createCollectionItem,
  deleteCollectionItem,
  getCollectionForUser,
  getCollectionItemById,
  updateCollectionItem,
} from "@/lib/db/queries/collection"
import { getProfileById } from "@/lib/db/queries/profiles"
import { upsertCollectionShare, upsertCollectorProfile, type ShareMode } from "@/lib/db/queries/sharing"
import { resolveHistoricalEurBasis } from "@/lib/fx/ecb"
import { createClient } from "@/lib/supabase/server"
import type { Condition, Currency } from "@/lib/types"
import { mapCollectionRow } from "./mappers"

export type InitialCollectionVisibility = "private" | ShareMode

function assertInitialVisibility(value: string): asserts value is InitialCollectionVisibility {
  if (value !== "private" && value !== "showcase" && value !== "open_to_offers") {
    throw new Error("Invalid collection visibility")
  }
}

function normalizeAcquisitionDate(value: string | null | undefined): string | null {
  return value ? value.slice(0, 10) : null
}

async function acquisitionFxColumns(price: number, currency: Currency, acquisitionDate: string | null) {
  const basis = await resolveHistoricalEurBasis(price, currency, acquisitionDate)
  return {
    acquisitionPriceEUR: basis.amountEUR != null ? basis.amountEUR.toString() : null,
    acquisitionFxRateToEUR: basis.fxRateToEUR != null ? basis.fxRateToEUR.toString() : null,
    acquisitionFxRateDate: basis.fxRateDate,
    acquisitionFxSource: basis.fxSource,
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

export async function previewHistoricalAcquisitionEurAction(input: {
  amount: number
  currency: Currency
  acquisitionDate: string
}) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")

  if (!Number.isFinite(input.amount) || input.amount <= 0) return null
  const acquisitionDate = normalizeAcquisitionDate(input.acquisitionDate)
  if (!acquisitionDate) return null

  const basis = await resolveHistoricalEurBasis(input.amount, input.currency, acquisitionDate)
  if (basis.amountEUR == null) return null

  return {
    amountEUR: basis.amountEUR,
    fxRateDate: basis.fxRateDate,
    fxSource: basis.fxSource,
  }
}

export async function addCollectionItemAction(input: AddCollectionActionInput) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")

  const visibility = input.visibility ?? "private"
  assertInitialVisibility(visibility)
  const acquisitionDate = normalizeAcquisitionDate(input.acquisitionDate)
  const fxColumns = await acquisitionFxColumns(input.acquisitionPrice, input.acquisitionCurrency, acquisitionDate)

  const row = await withUserContext(user.id, async (tx) => {
    const created = await createCollectionItem(
      user.id,
      {
        productId: input.productId,
        releaseId: input.releaseId,
        quantity: 1,
        condition: input.condition,
        acquisitionDate,
        acquisitionPrice: input.acquisitionPrice.toString(),
        acquisitionCurrency: input.acquisitionCurrency,
        ...fxColumns,
        releaseYearOverride: input.releaseYearOverride ?? null,
        notes: input.notes ?? null,
      },
      tx,
    )

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

  const current = await withUserContext(user.id, (tx) => getCollectionItemById(user.id, id, tx))
  if (!current) return null

  const acquisitionChanged =
    patch.acquisitionDate !== undefined ||
    patch.acquisitionPrice !== undefined ||
    patch.acquisitionCurrency !== undefined
  const nextDate = patch.acquisitionDate !== undefined
    ? normalizeAcquisitionDate(patch.acquisitionDate)
    : current.acquisitionDate
  const nextPrice = patch.acquisitionPrice ?? Number(current.acquisitionPrice ?? 0)
  const nextCurrency = patch.acquisitionCurrency ?? (current.acquisitionCurrency as Currency)
  const fxColumns = acquisitionChanged
    ? await acquisitionFxColumns(nextPrice, nextCurrency, nextDate)
    : null

  const row = await withUserContext(user.id, (tx) =>
    updateCollectionItem(
      user.id,
      id,
      {
        ...(patch.condition !== undefined ? { condition: patch.condition } : {}),
        ...(patch.acquisitionDate !== undefined ? { acquisitionDate: nextDate } : {}),
        ...(patch.acquisitionPrice !== undefined ? { acquisitionPrice: patch.acquisitionPrice.toString() } : {}),
        ...(patch.acquisitionCurrency !== undefined ? { acquisitionCurrency: patch.acquisitionCurrency } : {}),
        ...(fxColumns ?? {}),
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

  const current = await withUserContext(user.id, (tx) => getCollectionItemById(user.id, id, tx))
  if (!current) return
  const photoPaths = current.photos.map((photo) => photo.url)

  await withUserContext(user.id, (tx) => deleteCollectionItem(user.id, id, tx))

  // DB deletion is authoritative. The photo rows cascade with the item; 0078
  // then permits deletion of the now-orphaned Storage objects only when they
  // are not protected by a historical collection_item_transfers snapshot.
  if (photoPaths.length > 0) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.storage.from("collection-item-photos").remove(photoPaths)
      if (error) console.error("Failed to clean collection photo objects:", error.message)
    } catch (error) {
      console.error("Failed to clean collection photo objects:", error)
    }
  }
}
