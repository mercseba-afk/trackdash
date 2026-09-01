"use server"

import { getCurrentUser } from "@/lib/auth/current-user"
import {
  createCollectionItem,
  deleteCollectionItem,
  getCollectionForUser,
  updateCollectionItem,
} from "@/lib/db/queries/collection"
import type { Condition, Currency } from "@/lib/types"
import { mapCollectionRow } from "./mappers"

// Every action below resolves the caller's own user via getCurrentUser()
// (Step 3) and never accepts a userId parameter from the client — there is
// no way to read or write another user's collection through these.

export interface AddCollectionActionInput {
  productId: string
  releaseId: string
  condition: Condition
  acquisitionDate: string
  acquisitionPrice: number
  acquisitionCurrency: Currency
  releaseYearOverride?: number
  notes?: string
}

export async function getMyCollectionAction() {
  const user = await getCurrentUser()
  if (!user) return []
  const rows = await getCollectionForUser(user.id)
  return rows.map(mapCollectionRow)
}

export async function addCollectionItemAction(input: AddCollectionActionInput) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")
  const row = await createCollectionItem(user.id, {
    productId: input.productId,
    releaseId: input.releaseId,
    quantity: 1,
    condition: input.condition,
    // The dialog sends a full ISO datetime (new Date(...).toISOString());
    // the DB column is a plain `date`, so trim to its YYYY-MM-DD prefix.
    acquisitionDate: input.acquisitionDate.slice(0, 10),
    acquisitionPrice: input.acquisitionPrice.toString(),
    acquisitionCurrency: input.acquisitionCurrency,
    releaseYearOverride: input.releaseYearOverride ?? null,
    notes: input.notes ?? null,
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
  const row = await updateCollectionItem(user.id, id, {
    ...(patch.condition !== undefined ? { condition: patch.condition } : {}),
    ...(patch.acquisitionDate !== undefined ? { acquisitionDate: patch.acquisitionDate.slice(0, 10) } : {}),
    ...(patch.acquisitionPrice !== undefined ? { acquisitionPrice: patch.acquisitionPrice.toString() } : {}),
    ...(patch.acquisitionCurrency !== undefined ? { acquisitionCurrency: patch.acquisitionCurrency } : {}),
    ...(patch.releaseYearOverride !== undefined ? { releaseYearOverride: patch.releaseYearOverride } : {}),
    ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
  })
  if (!row) return null
  return mapCollectionRow({ ...row, photos: [] })
}

export async function removeCollectionItemAction(id: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")
  await deleteCollectionItem(user.id, id)
}
