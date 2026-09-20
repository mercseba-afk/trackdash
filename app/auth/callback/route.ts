// Supabase SSR/PKCE callback used by password recovery and third-party OAuth.
// Exchanges the one-time code for a cookie-backed session and then redirects only
// to a validated same-origin TrackDash path.
import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

const DEFAULT_APP_PATH = "/dashboard"
const RECOVERY_PATH = "/update-password"
const AUTH_ENTRY_PATHS = new Set(["/login", "/signup", "/forgot-password", "/auth/callback"])

function resolveNextPath(rawNext: string | null, origin: string, fallback: string): string {
  if (!rawNext) return fallback

  try {
    const target = new URL(rawNext, origin)
    if (target.origin !== origin) return fallback
    if (!target.pathname.startsWith("/") || AUTH_ENTRY_PATHS.has(target.pathname)) return fallback
    return `${target.pathname}${target.search}`
  } catch {
    return fallback
  }
}

function isFreshAccount(user: { created_at: string; last_sign_in_at?: string | null }) {
  const createdAt = Date.parse(user.created_at)
  const lastSignInAt = Date.parse(user.last_sign_in_at ?? "")
  if (!Number.isFinite(createdAt) || !Number.isFinite(lastSignInAt)) return false
  return Math.abs(lastSignInAt - createdAt) <= 5 * 60 * 1000
}

function oauthLocale(value: string | null): "it" | "en" | null {
  return value === "it" || value === "en" ? value : null
}

function onboardingPath(next: string, locale: "it" | "en" | null) {
  const params = new URLSearchParams()
  if (next !== "/dashboard") params.set("next", next)
  if (locale) params.set("locale", locale)
  const query = params.toString()
  return query ? `/onboarding?${query}` : "/onboarding"
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const flow = searchParams.get("flow")
  const isGoogleFlow = flow === "google"
  const selectedLocale = oauthLocale(searchParams.get("locale"))
  const fallback = isGoogleFlow ? DEFAULT_APP_PATH : RECOVERY_PATH
  const next = resolveNextPath(searchParams.get("next"), origin, fallback)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      let destination = next

      if (isGoogleFlow) {
        const { data } = await supabase.auth.getUser()
        const user = data.user
        const onboardingComplete = user?.user_metadata?.onboarding_completed === true

        if (user && !onboardingComplete && isFreshAccount(user)) {
          if (selectedLocale) {
            await supabase
              .from("profiles")
              .update({ preferred_locale: selectedLocale })
              .eq("id", user.id)
          }
          destination = onboardingPath(next, selectedLocale)
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host")
      if (process.env.NODE_ENV !== "development" && forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${destination}`)
      }

      return NextResponse.redirect(`${origin}${destination}`)
    }
  }

  if (isGoogleFlow) {
    const url = new URL("/login", origin)
    url.searchParams.set("oauth_error", "google")
    const requestedNext = resolveNextPath(searchParams.get("next"), origin, DEFAULT_APP_PATH)
    if (requestedNext !== DEFAULT_APP_PATH) url.searchParams.set("next", requestedNext)
    return NextResponse.redirect(url)
  }

  // Recovery links keep their existing explicit invalid/expired-link handling.
  return NextResponse.redirect(`${origin}${RECOVERY_PATH}`)
}
