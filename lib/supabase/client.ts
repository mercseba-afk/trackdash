// Supabase client for use in Client Components ("use client").
//
// This is intentionally the ONLY place that constructs a browser Supabase
// client. Import `createClient()` from here rather than instantiating
// `createBrowserClient` directly elsewhere, so there is a single point of
// configuration if the setup ever needs to change.
//
// NOTE (Step 1 — infrastructure only): nothing in the app calls this yet.
// Auth screens, the store, and data fetching are wired up in a later step.

import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
