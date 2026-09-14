"use client"

import * as React from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { useI18n } from "@/lib/i18n"

function isStandalone() {
  if (typeof window === "undefined") return false
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

function usePwaInstalledState() {
  const [installed, setInstalled] = React.useState(true)

  React.useEffect(() => {
    const refresh = () => setInstalled(isStandalone())
    const markInstalled = () => setInstalled(true)

    refresh()
    window.addEventListener("trackdash:pwa-installed", markInstalled)
    window.addEventListener("pageshow", refresh)
    window.addEventListener("focus", refresh)

    return () => {
      window.removeEventListener("trackdash:pwa-installed", markInstalled)
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
  const installed = usePwaInstalledState()

  if (installed) return null

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
  const installed = usePwaInstalledState()

  if (installed) return null

  return (
    <DropdownMenuItem onClick={requestInstall}>
      <Download />
      {locale === "it" ? "Installa TrackDash" : "Install TrackDash"}
    </DropdownMenuItem>
  )
}
