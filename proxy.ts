import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/proxy"

// TrackDash now has a public discovery layer and a protected personal layer.
// Catalog/Product/Release and Price Intelligence must be useful before signup;
// Collection, Wishlist, Scanner, Messages and account tools remain protected.
const SIGNED_OUT_AUTH_PATHS = ["/login", "/signup", "/forgot-password"]
const PUBLIC_CONTENT_PATHS = ["/"]
const PUBLIC_CONTENT_PREFIXES = ["/catalog", "/market"]

// Server-to-server, bootstrap, diagnostics and crawler discovery routes authenticate/guard
// themselves where required and must not depend on a browser Supabase session.
const UNGATED_PREFIXES = [
  "/api/dev",
  "/api/version",
  "/api/cron",
  "/api/ebay/marketplace-account-deletion",
  "/api/internal/ebay-95467-microbatch",
  "/auth/callback",
  "/update-password",
  "/pwa-debug",
  "/manifest.webmanifest",
  "/robots.txt",
  "/sitemap.xml",
  "/sw.js",
  "/offline.html",
  "/brand-car-v5",
]

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

function safeInternalNext(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null
  if (SIGNED_OUT_AUTH_PATHS.some((path) => matchesPrefix(value.split("?", 1)[0], path))) return null
  return value
}

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request)
  const { pathname, search } = request.nextUrl

  const isAuthPath = SIGNED_OUT_AUTH_PATHS.includes(pathname)
  const isPublicContent =
    PUBLIC_CONTENT_PATHS.includes(pathname) ||
    PUBLIC_CONTENT_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))
  const isUngated = UNGATED_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  if (isUngated || isPublicContent) return response

  if (!user && !isAuthPath) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.search = ""
    url.searchParams.set("next", `${pathname}${search}`)
    return NextResponse.redirect(url)
  }

  if (user && isAuthPath) {
    const destination = safeInternalNext(request.nextUrl.searchParams.get("next")) ?? "/dashboard"
    return NextResponse.redirect(new URL(destination, request.url))
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
