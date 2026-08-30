// Root Next.js Proxy (the file convention Next.js 16 renamed from
// `middleware.ts` to `proxy.ts` — same mechanism, new name/export).
//
// Currently only refreshes the Supabase session cookie (see
// lib/supabase/proxy.ts) so that server-side auth stays consistent once
// real authentication is wired up in a later step.
//
// This does NOT protect any routes yet — the existing client-side
// `AuthGate` (components/auth-gate.tsx) is untouched and still governs
// access in this step.

import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/proxy"

export async function proxy(request: NextRequest) {
  return updateSession(request)
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
