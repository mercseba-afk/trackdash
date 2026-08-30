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
// NOTE (Step 1 — infrastructure only): this refreshes a session if one
// exists, but nothing in the app creates a session yet (no sign-in call is
// wired up). Safe to run on every request in the meantime.

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

  // Touches the session so expired tokens get refreshed. The returned user
  // is intentionally unused here — this step only wires up the plumbing;
  // route protection based on the session is a later step.
  await supabase.auth.getUser()

  return response
}
