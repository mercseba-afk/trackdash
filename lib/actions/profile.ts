"use server"

import { getCurrentUser } from "@/lib/auth/current-user"
import { withUserContext } from "@/lib/db/rls"
import { getProfileById } from "@/lib/db/queries/profiles"

// The only reason this needs to be a Server Action rather than a plain
// client-side call: lib/db/* is server-only (Drizzle, DATABASE_URL). The
// session/identity itself (id, email) is already available client-side via
// the Supabase browser client (lib/supabase/client.ts) — this action only
// supplies the extra profile fields that live in our own `profiles` table
// (username, country, ...).
//
// Deliberately takes no userId parameter: it always resolves the caller's
// own session server-side via getCurrentUser(), so there is no way to ask
// for someone else's profile through this action. Step 5: also routed
// through withUserContext() so the `profiles_select_own` RLS policy
// actually applies, on top of the explicit id filter already in
// getProfileById.
export async function getMyProfileAction() {
  const user = await getCurrentUser()
  if (!user) return null
  return (await withUserContext(user.id, (tx) => getProfileById(user.id, tx))) ?? null
}
