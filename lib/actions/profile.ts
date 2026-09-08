"use server"

import { getCurrentUser } from "@/lib/auth/current-user"
import { withUserContext } from "@/lib/db/rls"
import { getProfileById, updateProfile } from "@/lib/db/queries/profiles"
import { syncCollectorProfileIfPresent } from "@/lib/db/queries/sharing"
import type { Currency } from "@/lib/types"

const ALLOWED_CURRENCIES = new Set<Currency>(["EUR", "USD", "JPY", "GBP"])
const USERNAME_RE = /^[A-Za-z0-9._-]+$/

// The only reason this needs to be a Server Action rather than a plain
// client-side call: lib/db/* is server-only (Drizzle, DATABASE_URL). The
// session/identity itself (id, email) is already available client-side via
// the Supabase browser client (lib/supabase/client.ts) — this action only
// supplies the extra profile fields that live in our own `profiles` table.
//
// Deliberately takes no userId parameter: it always resolves the caller's
// own session server-side via getCurrentUser(), so there is no way to ask
// for someone else's private profile through this action.
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
  }>,
) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")

  const clean: Partial<{
    username: string
    country: string | null
    preferredCurrency: Currency
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

  if (Object.keys(clean).length === 0) {
    return (await withUserContext(user.id, (tx) => getProfileById(user.id, tx))) ?? null
  }

  try {
    return await withUserContext(user.id, async (tx) => {
      const updated = await updateProfile(user.id, clean, tx)
      if (!updated) throw new Error("Collector profile not found")

      // Keep an existing public showcase identity aligned with the private
      // profile edit, but do not create a public profile for private users.
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
