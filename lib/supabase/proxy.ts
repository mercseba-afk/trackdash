// Session-refresh helper for the root `proxy.ts`.
//
// Supabase's SSR auth relies on the access/refresh token cookies staying in
// sync between the browser and the server. Refreshing the session on every
// request (in Proxy) is the pattern Supabase currently recommends for the
// Next.js App Router, so that Server Components always see a valid session
// without each of them having to refresh it individually.
//
// Named/filed as "proxy" rather than "middleware": Next.js 16 deprecated the
// `middleware.ts` file convention in favour of `proxy.ts` (same underlying
// mechanism, renamed to avoid confusion with Express-style middleware).
// See node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
// for the official migration notes.
//
// Step 4: also returns the resolved user, so the root proxy.ts can decide
// route access server-side (redirect signed-out visitors away from
// protected pages, and signed-in ones away from /login and /signup) —
// this is a defense-in-depth complement to the existing client-side
// AuthGate (components/auth-gate.tsx), not a replacement for it: AuthGate
// still owns the loading-state UI while the client-side session settles.

import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  // Also refreshes expired tokens as a side effect of being called.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response, user }
}
