"use client"

import * as React from "react"
import { CheckCircle2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { useI18n } from "@/lib/i18n"

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

function isChromiumInstallBrowser() {
  if (typeof navigator === "undefined" || isIOSFamily()) return false
  const ua = navigator.userAgent
  return /Chrome|Chromium|Edg|SamsungBrowser/i.test(ua) && !/OPR|Firefox/i.test(ua)
}

function canOfferInstall() {
  if (typeof window === "undefined" || isStandalone()) return false

  // On Chromium, expose the compact shell action only after the browser
  // has supplied a real beforeinstallprompt event. The Settings action below
  // stays available even without it so the manager can show browser-specific
  // manual instructions instead of leaving the user with no path forward.
  if (isChromiumInstallBrowser()) return Boolean(window.__trackdashInstallPrompt)

  // Safari installs through its browser-native manual flow.
  return isIOSFamily() || isMacSafari()
}

function usePwaInstallVisibility() {
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    const refresh = () => setVisible(canOfferInstall())
    const hide = () => setVisible(false)

    refresh()
    window.addEventListener("trackdash:pwa-available", refresh)
    window.addEventListener("trackdash:pwa-state-change", refresh)
    window.addEventListener("trackdash:pwa-installed", hide)
    window.addEventListener("pageshow", refresh)
    window.addEventListener("focus", refresh)

    return () => {
      window.removeEventListener("trackdash:pwa-available", refresh)
      window.removeEventListener("trackdash:pwa-state-change", refresh)
      window.removeEventListener("trackdash:pwa-installed", hide)
      window.removeEventListener("pageshow", refresh)
      window.removeEventListener("focus", refresh)
    }
  }, [])

  return visible
}

function useStandaloneState() {
  const [installed, setInstalled] = React.useState(false)

  React.useEffect(() => {
    const refresh = () => setInstalled(isStandalone())
    refresh()
    window.addEventListener("trackdash:pwa-state-change", refresh)
    window.addEventListener("trackdash:pwa-installed", refresh)
    window.addEventListener("pageshow", refresh)
    window.addEventListener("focus", refresh)
    return () => {
      window.removeEventListener("trackdash:pwa-state-change", refresh)
      window.removeEventListener("trackdash:pwa-installed", refresh)
      window.removeEventListener("pageshow", refresh)
      window.removeEventListener("focus", refresh)
    }
  }, [])

  return installed
}

function requestInstall() {
  window.dispatchEvent(new Event("trackdash:pwa-request-install"))
}

export function PwaInstallButton() {
  const { locale } = useI18n()
  const visible = usePwaInstallVisibility()

  if (!visible) return null

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
  const visible = usePwaInstallVisibility()

  if (!visible) return null

  return (
    <DropdownMenuItem onClick={requestInstall}>
      <Download />
      {locale === "it" ? "Installa TrackDash" : "Install TrackDash"}
    </DropdownMenuItem>
  )
}

export function PwaInstallSettingsButton() {
  const { locale } = useI18n()
  const installed = useStandaloneState()
  const it = locale === "it"

  return (
    <Button variant="outline" onClick={requestInstall} disabled={installed} className="min-w-36 justify-center">
      {installed ? <CheckCircle2 data-icon="inline-start" /> : <Download data-icon="inline-start" />}
      {installed ? (it ? "Già installata" : "Already installed") : (it ? "Installa TrackDash" : "Install TrackDash")}
    </Button>
  )
}
