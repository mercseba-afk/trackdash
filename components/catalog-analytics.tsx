"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useI18n } from "@/lib/i18n"

const measurementId = "G-QJ1XLZTK3W"
const preferenceKey = "trackdash.analytics-consent"
const disableKey = "ga-disable-G-QJ1XLZTK3W"

type GoogleTagWindow = Window & {
  dataLayer?: unknown[]
  [disableKey]?: boolean
}

export function CatalogAnalytics() {
  const pathname = usePathname()
  const { locale } = useI18n()
  const it = locale === "it"
  const route = pathname.replace(/^\/en(?=\/|$)/, "")
  const catalog = route === "/catalog" || route.startsWith("/catalog/")
  const privacy = route === "/privacy"
  const production = process.env.NODE_ENV === "production"
  const [choice, setChoice] = useState<string | null | undefined>(undefined)
  const [editing, setEditing] = useState(false)
  const initialized = useRef(false)
  const lastPage = useRef<string | null>(null)

  useEffect(() => {
    function readPreference() {
      try {
        setChoice(localStorage.getItem(preferenceKey))
      } catch {
        setChoice(null)
      }
    }
    readPreference()
    window.addEventListener("storage", readPreference)
    return () => window.removeEventListener("storage", readPreference)
  }, [])

  useEffect(() => {
    if (!production || location.hostname !== "trackdash.it") return
    const browser = window as GoogleTagWindow
    browser[disableKey] = choice !== "granted" || !catalog
    if (choice !== "granted" || !catalog) {
      lastPage.current = null
      return
    }
    browser.dataLayer ??= []
    function tag(..._args: unknown[]) {
      browser.dataLayer?.push(arguments)
    }
    if (!initialized.current) {
      initialized.current = true
      tag("consent", "default", {
        analytics_storage: "granted", ad_storage: "denied",
        ad_user_data: "denied", ad_personalization: "denied",
      })
      tag("js", new Date())
      tag("config", measurementId, {
        send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false,
        page_location: location.origin + pathname, page_referrer: "",
      })
      const script = document.createElement("script")
      script.async = true
      script.src = "https://www.googletagmanager.com/gtag/js?id=" + measurementId
      document.head.append(script)
    }
    if (lastPage.current === pathname) return
    lastPage.current = pathname
    tag("event", "page_view", {
      page_location: location.origin + pathname, page_referrer: "",
      page_title: document.title,
    })
  }, [catalog, choice, pathname, production])

  function savePreference(value: "granted" | "denied") {
    try {
      localStorage.setItem(preferenceKey, value)
    } catch {
      // The selection still applies until the tab is closed or reloaded.
    }
    if (value === "denied") {
      const browser = window as GoogleTagWindow
      browser[disableKey] = true
      for (const cookie of document.cookie.split(";")) {
        const name = cookie.split("=")[0].trim()
        if (name !== "_ga" && name !== "_ga_QJ1XLZTK3W") continue
        document.cookie = name + "=; Max-Age=0; Path=/; Secure"
        document.cookie = name + "=; Max-Age=0; Path=/; Domain=trackdash.it; Secure"
      }
    }
    setChoice(value)
    setEditing(false)
  }

  if (!production || choice === undefined) return null

  const showChoice = (catalog && choice === null) || (privacy && editing)
  if (!showChoice && !privacy) return null

  return (
    <aside aria-label={it ? "Preferenze analytics" : "Analytics preferences"}
      className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 ml-auto w-auto max-w-sm rounded-xl border bg-white p-3 text-sm shadow-md sm:bottom-4 sm:right-4">
      {showChoice ? (
        <>
          <p>{it ? "Possiamo usare Google Analytics per capire quali schede del catalogo sono più utili?" :
            "May we use Google Analytics to understand which catalog pages are most useful?"}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button type="button" className="rounded-md border px-3 py-2 font-medium" onClick={() => savePreference("denied")}>
              {it ? "Rifiuta" : "Decline"}
            </button>
            <button type="button" className="rounded-md border px-3 py-2 font-medium" onClick={() => savePreference("granted")}>
              {it ? "Accetta" : "Accept"}
            </button>
            <Link className="px-2 underline" href={it ? "/privacy" : "/en/privacy"}>{it ? "Privacy" : "Privacy notice"}</Link>
          </div>
        </>
      ) : (
        <button type="button" className="rounded-md border px-3 py-2 font-medium" onClick={() => setEditing(true)}>
          {it ? "Preferenze analytics" : "Analytics preferences"}
        </button>
      )}
    </aside>
  )
}
