"use client"

import * as React from "react"
import { CheckCircle2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { useI18n } from "@/lib/i18n"

const INSTALLED_MARKER = "trackdash.pwa.installed"

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

function isMobileInstallSurface() {
  if (typeof navigator === "undefined") return false
  if (isIOSFamily()) return true
  return /android|mobile/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1
}

function hasKnownInstalledMarker() {
  if (typeof window === "undefined") return false
  try {
    return window.localStorage.getItem(INSTALLED_MARKER) === "1"
  } catch {
    return false
  }
}

function canOfferInstall() {
  if (typeof window === "undefined" || isStandalone() || hasKnownInstalledMarker()) return false

  // Chromium exposes a native prompt only after beforeinstallprompt. Safari
  // uses a browser-native manual flow.
  if (isChromiumInstallBrowser()) return Boolean(window.__trackdashInstallPrompt)
  return isIOSFamily() || isMacSafari()
}

function canShowShellInstallAction() {
  if (typeof window === "undefined" || isStandalone() || hasKnownInstalledMarker()) return false

  // On phones/tablets the install affordance stays visible even when the
  // browser has not exposed a native prompt. PwaInstallManager already owns
  // the safe fallback flow and will show browser-specific instructions.
  return canOfferInstall() || isMobileInstallSurface()
}

function usePwaInstallVisibility() {
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    const refresh = () => setVisible(canShowShellInstallAction())
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
    const refresh = () => setInstalled(isStandalone() || hasKnownInstalledMarker())
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
