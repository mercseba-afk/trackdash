"use server"

import { requireAdmin } from "@/lib/admin/access"
import {
  listHotWheelsEbayAuditProfiles,
  runHotWheelsEbayAskAuditForRelease,
  type HotWheelsAskAuditResult,
} from "@/lib/market/automation/hotwheels-ebay-audit"

export type HotWheelsAuditProfileOption = {
  releaseId: string
  castingName: string
  identifier: string
  releaseYear: number | null
  lineName: string
  subseries: string | null
  chaseType: string | null
}

export async function listHotWheelsAuditProfilesAction(): Promise<HotWheelsAuditProfileOption[]> {
  await requireAdmin()

  const profiles = await listHotWheelsEbayAuditProfiles()
  return profiles
    .map((profile) => ({
      releaseId: profile.releaseId,
      castingName: profile.castingName,
      identifier: profile.primaryIdentifier,
      releaseYear: profile.releaseYear,
      lineName: profile.lineName,
      subseries: profile.subseries ?? null,
      chaseType: profile.chaseType ?? null,
    }))
    .sort((a, b) => {
      const casting = a.castingName.localeCompare(b.castingName)
      if (casting !== 0) return casting
      return (a.releaseYear ?? 0) - (b.releaseYear ?? 0) || a.identifier.localeCompare(b.identifier)
    })
}

export async function runHotWheelsAskAuditAction(input: {
  releaseId: string
  includeFallbackQuery?: boolean
}): Promise<HotWheelsAskAuditResult> {
  await requireAdmin()

  const releaseId = input.releaseId.trim()
  if (!releaseId) throw new Error("Release Hot Wheels mancante")

  // Read-only diagnostic: no market candidates, offers, queue or recompute writes.
  return runHotWheelsEbayAskAuditForRelease(releaseId, {
    perQueryLimit: 10,
    includeFallbackQuery: input.includeFallbackQuery === true,
    maxDetailLookups: 5,
  })
}
