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
  const legoCatalog = route === "/speed-champions/catalog" || route.startsWith("/speed-champions/catalog/")
  const catalog = route === "/catalog" || route.startsWith("/catalog/") || legoCatalog
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
    if (lastPage.current !== pathname) {
      lastPage.current = pathname
      tag("event", "page_view", {
        page_location: location.origin + pathname, page_referrer: "",
        page_title: document.title,
        ...(legoCatalog ? { catalog_vertical: "speedchampions" } : {}),
      })
    }

    function recordAmazonClick(event: MouseEvent) {
      if (browser[disableKey] || event.defaultPrevented || event.button > 1) return
      if (!(event.target instanceof Element)) return
      const link = event.target.closest<HTMLAnchorElement>("a[data-amazon-item]")
      if (!link?.dataset.amazonItem) return
      tag("event", "amazon_product_click", {
        item_id: link.dataset.amazonItem,
        ...(legoCatalog ? { catalog_vertical: "speedchampions" } : {}),
        link_domain: "amazon.it",
        page_location: location.origin + pathname,
      })
    }
    document.addEventListener("click", recordAmazonClick)
    document.addEventListener("auxclick", recordAmazonClick)
    return () => {
      document.removeEventListener("click", recordAmazonClick)
      document.removeEventListener("auxclick", recordAmazonClick)
    }
  }, [catalog, choice, legoCatalog, pathname, production])

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

  const title = it ? "Preferenze cookie" : "Cookie preferences"
  const actionClass = "rounded-lg border border-border bg-background px-3 py-2 font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"

  return (
    <aside aria-label={title}
      className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 ml-auto max-h-[65dvh] w-auto max-w-md overflow-y-auto rounded-2xl border border-border bg-background p-4 text-sm text-foreground shadow-lg sm:bottom-4 sm:right-4">
      {showChoice ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">{title}</h2>
            <button
              type="button"
              className="grid size-9 shrink-0 place-items-center rounded-lg text-xl hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={it ? "Chiudi e usa solo i cookie necessari" : "Close and use necessary cookies only"}
              onClick={() => savePreference("denied")}
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <p className="mt-1 text-muted-foreground">
            {it ? "Usiamo cookie necessari per far funzionare TrackDash. Con il tuo consenso, usiamo anche cookie per misurare visite e clic nel catalogo. Se chiudi, restano attivi solo quelli necessari." :
              "We use necessary cookies to run TrackDash. With your consent, we also use cookies to measure visits and clicks in the catalog. Closing keeps only necessary cookies enabled."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={actionClass} onClick={() => savePreference("denied")}>
              {it ? "Solo necessari" : "Necessary only"}
            </button>
            <button type="button" className={actionClass} onClick={() => savePreference("granted")}>
              {it ? "Accetta tutti" : "Accept all"}
            </button>
          </div>
          <details className="mt-3">
            <summary className="w-fit cursor-pointer underline underline-offset-2">
              {it ? "Dettagli e preferenze" : "Details and preferences"}
            </summary>
            <dl className="mt-2 space-y-2 text-muted-foreground">
              <div>
                <dt className="font-medium text-foreground">{it ? "Necessari · sempre attivi" : "Necessary · always enabled"}</dt>
                <dd>{it ? "Servono per sessione, sicurezza e preferenze." : "Support sessions, security and preferences."}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">{it ? "Statistiche · facoltativi" : "Statistics · optional"}</dt>
                <dd>{it ? "Google Analytics misura le pagine viste e i clic verso Amazon nel catalogo." :
                  "Google Analytics measures page views and outbound Amazon clicks in the catalog."}</dd>
              </div>
            </dl>
          </details>
          <Link className="mt-2 inline-block underline underline-offset-2" href={it ? "/privacy" : "/en/privacy"}>
            {it ? "Informativa privacy e cookie" : "Privacy and cookie notice"}
          </Link>
        </>
      ) : (
        <button type="button" className={actionClass} onClick={() => setEditing(true)}>
          {title}
        </button>
      )}
    </aside>
  )
}
