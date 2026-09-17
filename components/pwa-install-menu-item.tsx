"use client"

import * as React from "react"
import { CheckCircle2, Download, LoaderCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { useI18n } from "@/lib/i18n"

type PwaState = "installed" | "ready" | "manual" | "waiting" | "unsupported"

function isStandalone() {
  if (typeof window === "undefined") return false
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

function isIOSFamily() {
  if (typeof navigator === "undefined") return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
}

function isMacSafari() {
  if (typeof navigator === "undefined" || isIOSFamily()) return false
  const ua = navigator.userAgent
  return /Macintosh|Mac OS X/i.test(ua) && /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|Edg|OPR|Firefox|FxiOS/i.test(ua)
}

function isAndroidChromium() {
  if (typeof navigator === "undefined" || isIOSFamily()) return false
  const ua = navigator.userAgent
  return /Android/i.test(ua) && /Chrome|Chromium|Edg|SamsungBrowser|Vivaldi|OPR/i.test(ua) && !/Firefox/i.test(ua)
}

function readPwaState(): PwaState {
  if (typeof window === "undefined") return "waiting"
  if (isStandalone()) return "installed"
  if (window.__trackdashInstallPrompt) return "ready"
  if (isIOSFamily() || isMacSafari()) return "manual"
  if (isAndroidChromium()) return "waiting"
  return "unsupported"
}

function usePwaState() {
  const [state, setState] = React.useState<PwaState>("waiting")

  React.useEffect(() => {
    const refresh = () => setState(readPwaState())
    refresh()
    window.addEventListener("trackdash:pwa-available", refresh)
    window.addEventListener("trackdash:pwa-state-change", refresh)
    window.addEventListener("trackdash:pwa-installed", refresh)
    window.addEventListener("pageshow", refresh)
    window.addEventListener("focus", refresh)

    return () => {
      window.removeEventListener("trackdash:pwa-available", refresh)
      window.removeEventListener("trackdash:pwa-state-change", refresh)
      window.removeEventListener("trackdash:pwa-installed", refresh)
      window.removeEventListener("pageshow", refresh)
      window.removeEventListener("focus", refresh)
    }
  }, [])

  return state
}

function requestInstall() {
  window.dispatchEvent(new Event("trackdash:pwa-request-install"))
}

export function PwaInstallButton() {
  const { locale } = useI18n()
  const state = usePwaState()

  // Never advertise a direct install on Chromium until the browser has
  // actually supplied beforeinstallprompt. This prevents a shortcut flow
  // from being presented as if it were the real standalone PWA install.
  if (state !== "ready" && state !== "manual") return null

  const label = locale === "it" ? "Installa TrackDash" : "Install TrackDash"

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      onClick={requestInstall}
      className="text-brand hover:bg-brand/10 hover:text-brand"
    >
      <Download />
    </Button>
  )
}

export function PwaInstallMenuItem() {
  const { locale } = useI18n()
  const state = usePwaState()

  if (state !== "ready" && state !== "manual") return null

  return (
    <DropdownMenuItem onClick={requestInstall}>
      <Download />
      {locale === "it" ? "Installa TrackDash" : "Install TrackDash"}
    </DropdownMenuItem>
  )
}

export function PwaInstallSettingsButton() {
  const { locale } = useI18n()
  const state = usePwaState()
  const it = locale === "it"

  if (state === "installed") {
    return (
      <Button variant="outline" disabled className="min-w-36 justify-center">
        <CheckCircle2 data-icon="inline-start" />
        {it ? "Già installata" : "Already installed"}
      </Button>
    )
  }

  if (state === "waiting") {
    return (
      <Button variant="outline" disabled className="min-w-44 justify-center">
        <LoaderCircle data-icon="inline-start" className="animate-spin" />
        {it ? "Installazione in preparazione" : "Preparing installation"}
      </Button>
    )
  }

  return (
    <Button variant="outline" onClick={requestInstall} className="min-w-36 justify-center">
      <Download data-icon="inline-start" />
      {state === "unsupported"
        ? (it ? "Info installazione" : "Installation info")
        : (it ? "Installa TrackDash" : "Install TrackDash")}
    </Button>
  )
}
