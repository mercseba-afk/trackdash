import "server-only"

import { createClient } from "@/lib/supabase/server"

// Server-only helper: resolves the currently authenticated Supabase user
// from the request's session cookie, for passing a real userId into the
// data access layer (lib/db/queries/*) — that layer never accepts a
// hardcoded id, this is what supplies the real one once something calls
// it.
//
// NOTE (Step 3 scope): this only reads the existing Supabase Auth session
// via the server client from Step 1 (lib/supabase/server.ts). It does NOT
// create or read a `profiles` row, does NOT touch AuthGate, and nothing
// in the UI calls this yet — login/signup still run entirely on the
// client-side store (components/screens/auth-screen.tsx), so in practice
// there is no real Supabase session to resolve until that's wired up in a
// later step. This exists so server actions written from now on have a
// correct, non-hardcoded way to ask "who is making this request".
export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null
  return user
}
