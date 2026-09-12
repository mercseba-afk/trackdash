"use client"

import * as React from "react"
import { Download } from "lucide-react"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { useI18n } from "@/lib/i18n"

function isStandalone() {
  if (typeof window === "undefined") return false
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

export function PwaInstallMenuItem() {
  const { locale } = useI18n()
  const [installed, setInstalled] = React.useState(true)

  React.useEffect(() => {
    const refresh = () => setInstalled(isStandalone() || localStorage.getItem("trackdash.pwa.installed") === "1")
    refresh()
    window.addEventListener("trackdash:pwa-installed", refresh)
    return () => window.removeEventListener("trackdash:pwa-installed", refresh)
  }, [])

  if (installed) return null

  return (
    <DropdownMenuItem onClick={() => window.dispatchEvent(new Event("trackdash:pwa-request-install"))}>
      <Download />
      {locale === "it" ? "Installa TrackDash" : "Install TrackDash"}
    </DropdownMenuItem>
  )
}
