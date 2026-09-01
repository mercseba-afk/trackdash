// Root Next.js Proxy (the file convention Next.js 16 renamed from
// `middleware.ts` to `proxy.ts` — same mechanism, new name/export).
//
// Refreshes the Supabase session cookie on every request (see
// lib/supabase/proxy.ts) and, as of Step 4, also enforces route access
// server-side:
//   - no session + protected route -> redirect to /login
//   - session exists + /login or /signup -> redirect to / (no point
//     showing the auth forms to someone already signed in)
//
// This is a complement to the existing client-side AuthGate
// (components/auth-gate.tsx), not a replacement — AuthGate still owns the
// loading-state UI while the client-side session settles on first paint.
// Doing the redirect here too means a signed-out visitor never even
// receives the protected page's HTML, rather than briefly receiving it and
// being bounced client-side.
const PUBLIC_PATHS = ["/login", "/signup"]

import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/proxy"

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request)

  const { pathname } = request.nextUrl
  const isPublicPath = PUBLIC_PATHS.includes(pathname)

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (user && isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icons, and other static assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
