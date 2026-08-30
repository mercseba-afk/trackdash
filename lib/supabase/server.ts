// Supabase client for use in Server Components, Server Actions, and Route
// Handlers. Reads/writes the auth session via Next.js' `cookies()` store, per
// the current @supabase/ssr integration pattern for the App Router.
//
// This must be called fresh on every request (it's a factory, not a
// singleton) because it binds to that request's cookie store.
//
// NOTE (Step 1 — infrastructure only): nothing in the app calls this yet.

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // `setAll` is called from a Server Component in some cases,
            // where cookies cannot be mutated. This is safe to ignore as
            // long as the Proxy (see lib/supabase/proxy.ts and the root
            // proxy.ts) is also refreshing the session on every request.
          }
        },
      },
    },
  )
}
