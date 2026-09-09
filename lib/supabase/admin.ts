import "server-only"

import { createClient } from "@supabase/supabase-js"

// Elevated client for trusted backend jobs only. Never import this from a
// Client Component and never expose either supported key through NEXT_PUBLIC_*.
//
// Supabase's current key model prefers sb_secret_* keys. The legacy
// service_role JWT remains supported as a migration fallback for existing
// environments, including TrackDash's original setup.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set")
  if (!key) {
    throw new Error("Set SUPABASE_SECRET_KEY (preferred) or SUPABASE_SERVICE_ROLE_KEY for market pipeline jobs")
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}
