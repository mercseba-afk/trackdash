"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { racingWebsiteLocale } from "@/lib/seo/catalog-paths"
import { useI18n, type AppLocale } from "@/lib/i18n"
import { Spinner } from "@/components/ui/spinner"

const STORAGE_KEY = "trackdash.locale"
const COOKIE_NAME = "trackdash.locale"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

function isLocale(value: string | null): value is AppLocale {
  return value === "en" || value === "it"
}

function writeLocaleCookie(locale: AppLocale) {
  document.cookie = `${COOKIE_NAME}=${locale}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

function isPublicSeoRoute(pathname: string) {
  return pathname === "/guide" || pathname.startsWith("/guide/") || pathname === "/en/guide" || pathname.startsWith("/en/guide/") || pathname === "/shop" || pathname.startsWith("/shop/") || pathname === "/en/shop" || pathname.startsWith("/en/shop/") || pathname === "/" || pathname === "/catalog" || pathname.startsWith("/catalog/") || pathname === "/market" || pathname === "/hotwheels" || pathname.startsWith("/hotwheels/")
}

export function I18nBootstrap({
  children,
  initialLocale,
  hasLocaleCookie,
  pinPublicLocale = false,
}: {
  children: React.ReactNode
  initialLocale: AppLocale
  hasLocaleCookie: boolean
  pinPublicLocale?: boolean
}) {
  const { locale, setLocale } = useI18n()
  const pathname = usePathname()
  const bootstrapped = React.useRef(false)
  const [ready, setReady] = React.useState(() => hasLocaleCookie && locale === initialLocale)
  const boundLocale = pinPublicLocale ? racingWebsiteLocale(pathname ?? "") : null
  const publicSeoRoute = boundLocale !== null || isPublicSeoRoute(pathname || "/")

  React.useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true

    let target = boundLocale ?? initialLocale
    if (!hasLocaleCookie && !boundLocale) {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (isLocale(stored)) target = stored
    }

    if (locale !== target) setLocale(target)
    document.documentElement.lang = target
    writeLocaleCookie(target)
    setReady(true)
  }, [boundLocale, hasLocaleCookie, initialLocale, locale, setLocale])

  React.useEffect(() => {
    if (!ready) return
    const guideLocale = pathname === "/en/guide" || pathname?.startsWith("/en/guide/") ? "en"
      : pathname === "/guide" || pathname?.startsWith("/guide/") ? "it" : null
    const target = boundLocale ?? guideLocale ?? locale
    if (locale !== target) setLocale(target)
    document.documentElement.lang = target
    writeLocaleCookie(target)
  }, [boundLocale, locale, ready, pathname, setLocale])

  if (!ready && !publicSeoRoute) {
    return (
      <div className="grid min-h-svh place-items-center bg-background" aria-hidden>
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    )
  }

  return <>{children}</>
}
