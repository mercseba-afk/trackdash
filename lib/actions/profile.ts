"use server"

import { getCurrentUser } from "@/lib/auth/current-user"
import { withUserContext } from "@/lib/db/rls"
import { getProfileById, updateProfile } from "@/lib/db/queries/profiles"
import { syncCollectorProfileIfPresent } from "@/lib/db/queries/sharing"
import type { Currency } from "@/lib/types"

const ALLOWED_CURRENCIES = new Set<Currency>(["EUR", "USD", "JPY", "GBP"])
const ALLOWED_LOCALES = new Set(["en", "it"] as const)
const USERNAME_RE = /^[A-Za-z0-9._-]+$/

export async function getMyProfileAction() {
  const user = await getCurrentUser()
  if (!user) return null
  return (await withUserContext(user.id, (tx) => getProfileById(user.id, tx))) ?? null
}

export async function updateMyProfileAction(
  patch: Partial<{
    username: string
    country: string
    preferredCurrency: Currency
    preferredLocale: "en" | "it"
  }>,
) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")

  const clean: Partial<{
    username: string
    country: string | null
    preferredCurrency: Currency
    preferredLocale: "en" | "it"
  }> = {}

  if (patch.username !== undefined) {
    const username = patch.username.trim()
    if (username.length < 3 || username.length > 30) {
      throw new Error("Username must be between 3 and 30 characters")
    }
    if (!USERNAME_RE.test(username)) {
      throw new Error("Username can only use letters, numbers, dots, dashes and underscores")
    }
    clean.username = username
  }

  if (patch.country !== undefined) {
    const country = patch.country.trim()
    if (country.length > 80) throw new Error("Country must be 80 characters or fewer")
    clean.country = country || null
  }

  if (patch.preferredCurrency !== undefined) {
    if (!ALLOWED_CURRENCIES.has(patch.preferredCurrency)) throw new Error("Invalid currency")
    clean.preferredCurrency = patch.preferredCurrency
  }

  if (patch.preferredLocale !== undefined) {
    if (!ALLOWED_LOCALES.has(patch.preferredLocale)) throw new Error("Invalid language")
    clean.preferredLocale = patch.preferredLocale
  }

  if (Object.keys(clean).length === 0) {
    return (await withUserContext(user.id, (tx) => getProfileById(user.id, tx))) ?? null
  }

  try {
    return await withUserContext(user.id, async (tx) => {
      const updated = await updateProfile(user.id, clean, tx)
      if (!updated) throw new Error("Collector profile not found")

      await syncCollectorProfileIfPresent(
        user.id,
        {
          username: updated.username,
          country: updated.country,
          avatarUrl: updated.avatarUrl,
        },
        tx,
      )

      return updated
    })
  } catch (error) {
    const e = error as { code?: string; cause?: { code?: string } }
    if (e?.code === "23505" || e?.cause?.code === "23505") {
      throw new Error("That username is already taken")
    }
    throw error
  }
}
