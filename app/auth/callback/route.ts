// Supabase SSR/PKCE auth callback. Exchanges the one-time `code` a
// recovery (or any other Supabase Auth PKCE) email link carries for a
// real session, then redirects to `next`.
//
// Reuses the existing server Supabase client (lib/supabase/server.ts) --
// no separate/duplicate Supabase client construction. This is the ONLY
// place in the app that calls exchangeCodeForSession; every other auth
// action (sign in, sign up, forgot password, update password) uses the
// browser client directly and never touches a code param.
//
// Redirect safety: `next` comes from the query string, which is
// attacker-influenceable (a malicious link could be crafted with a
// different `next`), so it is validated against a small internal
// allowlist before use -- never redirected to verbatim. See
// ALLOWED_NEXT_PATHS below.
import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Every path this callback is allowed to send a user to after exchanging
// their code. Internal, relative, allowlisted -- no external host is
// ever accepted, and anything not in this list falls back to the safe
// default (/update-password, the only flow that currently sends people
// through this route).
const ALLOWED_NEXT_PATHS = new Set(["/update-password"])
const DEFAULT_NEXT_PATH = "/update-password"

function resolveNextPath(rawNext: string | null): string {
  if (rawNext && ALLOWED_NEXT_PATHS.has(rawNext)) return rawNext
  return DEFAULT_NEXT_PATH
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = resolveNextPath(searchParams.get("next"))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // No code, or the exchange failed (expired/already-used/invalid link).
  // Send the visitor to update-password anyway -- that page itself
  // checks for a real session and shows an explicit "invalid or expired
  // link" state rather than this route trying to explain the failure via
  // a query string (which would leak Supabase-internal error detail into
  // a URL).
  return NextResponse.redirect(`${origin}/update-password`)
}
