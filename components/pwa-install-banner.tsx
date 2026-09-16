"use client"

import * as React from "react"
import Image from "next/image"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

const DISMISSED_AT_KEY = "trackdash.pwa.install-banner-dismissed-at"
const DISMISS_FOR_MS = 14 * 24 * 60 * 60 * 1000

function isStandalone() {
  if (typeof window === "undefined") return false
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

function requestInstall() {
  window.dispatchEvent(new Event("trackdash:pwa-request-install"))
}

export function PwaInstallBanner() {
  const { locale } = useI18n()
  const it = locale === "it"
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    if (isStandalone()) return

    const dismissedAt = Number(window.localStorage.getItem(DISMISSED_AT_KEY) ?? "0")
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_FOR_MS) return

    const mobile = window.matchMedia("(max-width: 767px)")
    const refresh = () => setVisible(mobile.matches && !isStandalone())
    const hide = () => setVisible(false)

    refresh()
    mobile.addEventListener?.("change", refresh)
    window.addEventListener("trackdash:pwa-installed", hide)

    return () => {
      mobile.removeEventListener?.("change", refresh)
      window.removeEventListener("trackdash:pwa-installed", hide)
    }
  }, [])

  const dismiss = () => {
    window.localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <aside className="border-b border-[#dbe4ef] bg-white px-4 py-3 md:hidden" aria-label={it ? "Installa TrackDash" : "Install TrackDash"}>
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <Image
          src="/pwa/icon-v5-192.png"
          alt=""
          width={42}
          height={42}
          className="size-[42px] shrink-0 rounded-[10px]"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#102f63]">{it ? "Installa TrackDash" : "Install TrackDash"}</p>
          <p className="mt-0.5 text-xs leading-4 text-[#617087]">
            {it
              ? "Apri Collection, Scanner e mercato come un’app, senza la barra del browser."
              : "Open Collection, Scanner and market tools like an app, without the browser bar."}
          </p>
        </div>
        <Button size="sm" onClick={requestInstall} className="shrink-0 bg-[#1558e8] text-white hover:bg-[#0e49c7]">
          {it ? "Installa" : "Install"}
        </Button>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-[#6b7a90] hover:bg-[#eef3f9] hover:text-[#173d78]"
          aria-label={it ? "Non ora" : "Not now"}
          title={it ? "Non ora" : "Not now"}
        >
          <X className="size-4" />
        </button>
      </div>
    </aside>
  )
}
