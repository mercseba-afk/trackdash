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
//
// /api/dev/health (Step 5) is excluded from both rules: it's a diagnostic
// endpoint whose whole purpose is to work regardless of auth state
// (including "is Supabase Auth itself reachable" — which the redirect
// rule below would prevent it from ever reporting on if it were treated
// as a protected route). It has its own NODE_ENV guard for prod safety.
//
// Forgot/reset password (Images Phase 2 + Auth pass): /forgot-password
// behaves exactly like /login and /signup -- reachable when signed out,
// bounced to / when already signed in.
//
// /auth/callback and /update-password are deliberately UNGATED, not
// merely "public": a user arriving via a real recovery link has, by the
// time they reach /update-password, a genuine Supabase session (created
// by the callback route's code exchange) -- indistinguishable from an
// ordinary signed-in session to `supabase.auth.getUser()`. If
// /update-password were in PUBLIC_PATHS, the "signed-in + public path ->
// redirect to /" rule above would immediately bounce them away and break
// the entire recovery flow. Ungating both routes lets them work whether
// or not a session exists yet; each route/page decides for itself what
// to show (see app/auth/callback/route.ts and
// components/screens/update-password-screen.tsx for how each handles a
// missing/invalid recovery state).
const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password"]
const UNGATED_PREFIXES = ["/api/dev", "/auth/callback", "/update-password"]

import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/proxy"

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request)

  const { pathname } = request.nextUrl
  const isPublicPath = PUBLIC_PATHS.includes(pathname)
  const isUngated = UNGATED_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  if (isUngated) return response

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
