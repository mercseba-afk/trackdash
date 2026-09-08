"use client"

import * as React from "react"
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

export function I18nBootstrap({
  children,
  initialLocale,
  hasLocaleCookie,
}: {
  children: React.ReactNode
  initialLocale: AppLocale
  hasLocaleCookie: boolean
}) {
  const { locale, setLocale } = useI18n()
  const bootstrapped = React.useRef(false)
  const [ready, setReady] = React.useState(() => hasLocaleCookie && locale === initialLocale)

  React.useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true

    let target = initialLocale
    if (!hasLocaleCookie) {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (isLocale(stored)) target = stored
    }

    if (locale !== target) setLocale(target)
    document.documentElement.lang = target
    writeLocaleCookie(target)
    setReady(true)
  }, [hasLocaleCookie, initialLocale, locale, setLocale])

  React.useEffect(() => {
    if (!ready) return
    document.documentElement.lang = locale
    writeLocaleCookie(locale)
  }, [locale, ready])

  if (!ready) {
    return (
      <div className="grid min-h-svh place-items-center bg-background" aria-hidden>
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    )
  }

  return <>{children}</>
}
