"use client"

import * as React from "react"
import { Download, EllipsisVertical, Search, Share, SquarePlus } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type InstallChoice = { outcome: "accepted" | "dismissed"; platform: string }
type BrowserKind = "chrome" | "firefox" | "edge" | "samsung" | "other"
type InstalledRelatedApp = { platform?: string; id?: string; url?: string; version?: string }

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<InstallChoice>
}

declare global {
  interface WindowEventMap {
    "beforeinstallprompt": BeforeInstallPromptEvent
  }
  interface Window {
    __trackdashInstallPrompt?: BeforeInstallPromptEvent | null
  }
  interface Navigator {
    standalone?: boolean
    getInstalledRelatedApps?: () => Promise<InstalledRelatedApp[]>
  }
}

function isStandalone() {
  if (typeof window === "undefined") return false
  return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true
}

function isIOS() {
  if (typeof navigator === "undefined") return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isAndroid() {
  if (typeof navigator === "undefined") return false
  return /android/i.test(navigator.userAgent)
}

function detectBrowser(): BrowserKind {
  if (typeof navigator === "undefined") return "other"
  const ua = navigator.userAgent
  if (/firefox|fxios/i.test(ua)) return "firefox"
  if (/samsungbrowser/i.test(ua)) return "samsung"
  if (/edg|edga|edgios/i.test(ua)) return "edge"
  if (/chrome|crios/i.test(ua)) return "chrome"
  return "other"
}

async function hasInstalledTrackDashPwa() {
  if (isStandalone()) return true
  if (typeof navigator === "undefined" || typeof navigator.getInstalledRelatedApps !== "function") return false

  try {
    const relatedApps = await navigator.getInstalledRelatedApps()
    return relatedApps.some((app) => app.platform === "webapp")
  } catch {
    return false
  }
}

export function PwaInstallManager() {
  const { locale } = useI18n()
  const it = locale === "it"
  const deferredPrompt = React.useRef<BeforeInstallPromptEvent | null>(null)
  const [instructionsOpen, setInstructionsOpen] = React.useState(false)
  const [fallbackOpen, setFallbackOpen] = React.useState(false)
  const [alreadyInstalledOpen, setAlreadyInstalledOpen] = React.useState(false)
  const [fallbackBrowser, setFallbackBrowser] = React.useState<BrowserKind>("other")
  const [fallbackAndroid, setFallbackAndroid] = React.useState(false)

  React.useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {})
    }

    if (window.__trackdashInstallPrompt) {
      deferredPrompt.current = window.__trackdashInstallPrompt
      window.dispatchEvent(new Event("trackdash:pwa-available"))
    }

    const onBeforeInstall = (event: BeforeInstallPromptEvent) => {
      event.preventDefault()
      deferredPrompt.current = event
      window.__trackdashInstallPrompt = event
      window.dispatchEvent(new Event("trackdash:pwa-available"))
    }

    const onInstalled = () => {
      deferredPrompt.current = null
      window.__trackdashInstallPrompt = null
      localStorage.setItem("trackdash.pwa.installed", "1")
      window.dispatchEvent(new Event("trackdash:pwa-installed"))
    }

    const showManualInstructions = () => {
      setFallbackBrowser(detectBrowser())
      setFallbackAndroid(isAndroid())
      setFallbackOpen(true)
    }

    const onRequest = async () => {
      if (isStandalone()) {
        onInstalled()
        return
      }

      if (await hasInstalledTrackDashPwa()) {
        onInstalled()
        setAlreadyInstalledOpen(true)
        return
      }

      const storedPrompt = deferredPrompt.current ?? window.__trackdashInstallPrompt ?? null
      if (storedPrompt) {
        try {
          await storedPrompt.prompt()
          const choice = await storedPrompt.userChoice
          if (choice.outcome === "accepted") onInstalled()
          deferredPrompt.current = null
          window.__trackdashInstallPrompt = null
          return
        } catch {
          deferredPrompt.current = null
          window.__trackdashInstallPrompt = null
        }
      }

      if (isIOS()) setInstructionsOpen(true)
      else showManualInstructions()
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall)
    window.addEventListener("appinstalled", onInstalled)
    window.addEventListener("trackdash:pwa-request-install", onRequest)

    if (isStandalone()) {
      onInstalled()
    } else {
      localStorage.removeItem("trackdash.pwa.installed")
      void hasInstalledTrackDashPwa().then((installed) => {
        if (installed) onInstalled()
      })
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall)
      window.removeEventListener("appinstalled", onInstalled)
      window.removeEventListener("trackdash:pwa-request-install", onRequest)
    }
  }, [])

  const manualCopy = (() => {
    if (fallbackAndroid && fallbackBrowser === "firefox") {
      return {
        description: it
          ? "Firefox su Android può aggiungere TrackDash alla schermata Home, ma non offre la stessa installazione WebAPK di Chrome. Per avere TrackDash come vera app standalone usa Chrome o Samsung Internet."
          : "Firefox on Android can add TrackDash to the Home screen, but it does not provide the same WebAPK installation as Chrome. For the full standalone app experience, use Chrome or Samsung Internet.",
        first: it ? "Apri TrackDash in Chrome" : "Open TrackDash in Chrome",
        second: it ? "Usa Installa TrackDash o la voce “Installa app” di Chrome" : "Use Install TrackDash or Chrome's Install app option",
        note: it ? "Evita “Aggiungi alla schermata Home” se crea soltanto una scorciatoia con la barra URL." : "Avoid Add to Home Screen when it only creates a browser shortcut with an address bar.",
      }
    }

    if (fallbackAndroid && fallbackBrowser === "chrome") {
      return {
        description: it
          ? "Chrome non ha reso disponibile il prompt PWA in questa scheda. Non creare una semplice scorciatoia: non è equivalente all'app TrackDash installata."
          : "Chrome has not exposed the PWA install prompt in this tab. Do not create a plain shortcut: it is not equivalent to the installed TrackDash app.",
        first: it ? "Apri il menu ⋮ di Chrome" : "Open Chrome's ⋮ menu",
        second: it ? "Usa solo “Installa app” / “Installa TrackDash” se presente" : "Use only Install app / Install TrackDash if it is available",
        note: it ? "Se vedi solo “Crea scorciatoia” o “Aggiungi alla schermata Home”, chiudi il menu: quello aprirebbe TrackDash come sito web." : "If you only see Create shortcut or Add to Home Screen, close the menu: that would open TrackDash as a normal website.",
      }
    }

    if (!fallbackAndroid && fallbackBrowser === "chrome") {
      return {
        description: it
          ? "Il prompt automatico non è disponibile, ma su Chrome desktop puoi installare TrackDash come app dal menu del browser."
          : "The automatic prompt is not available, but on desktop Chrome you can install TrackDash as an app from the browser menu.",
        first: it ? "Apri il menu ⋮ di Chrome" : "Open Chrome's ⋮ menu",
        second: it ? "Trasmetti, salva e condividi → Installa questa pagina come app" : "Cast, save and share → Install page as app",
        note: it ? "Se compare l'icona Installa nella barra degli indirizzi puoi usare direttamente quella." : "If the Install icon appears in the address bar, you can use it directly.",
      }
    }

    return {
      description: it
        ? "Questo browser non ha reso disponibile il prompt di installazione come app. Una scorciatoia web non offre la stessa esperienza standalone di TrackDash."
        : "This browser has not exposed the app install prompt. A web shortcut does not provide the same standalone TrackDash experience.",
      first: it ? "Cerca una voce “Installa app” nel menu del browser" : "Look for an Install app option in the browser menu",
      second: it ? "Se compare solo una scorciatoia, usa Chrome o Samsung Internet su Android" : "If only a shortcut is offered, use Chrome or Samsung Internet on Android",
      note: it ? "L'obiettivo è aprire TrackDash senza barra URL e con l'icona ufficiale dell'app." : "The goal is to open TrackDash without an address bar and with the official app icon.",
    }
  })()

  return (
    <>
      <Dialog open={alreadyInstalledOpen} onOpenChange={setAlreadyInstalledOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Download className="size-4" />{it ? "TrackDash è già installata" : "TrackDash is already installed"}</DialogTitle>
            <DialogDescription>{it ? "Chrome vede già la vera app TrackDash sul telefono e per questo non propone un secondo prompt di installazione." : "Chrome already sees the real TrackDash app on this device, so it will not offer a second install prompt."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-1 text-sm">
            <div className="flex items-start gap-3 rounded-lg border p-3"><Search className="mt-0.5 size-4 shrink-0 text-brand" /><div><p className="font-medium">1. {it ? "Cerca TrackDash tra tutte le app del telefono" : "Find TrackDash in your phone's app drawer"}</p><p className="text-xs text-muted-foreground">{it ? "Oppure vai in Impostazioni → App e cerca TrackDash." : "Or open Settings → Apps and look for TrackDash."}</p></div></div>
            <div className="flex items-start gap-3 rounded-lg border p-3"><SquarePlus className="mt-0.5 size-4 shrink-0 text-brand" /><div><p className="font-medium">2. {it ? "Aprila oppure rimetti la sua icona nella Home" : "Open it or add its icon back to the Home screen"}</p><p className="text-xs text-muted-foreground">{it ? "Quella è l'app standalone: niente barra URL e icona TrackDash corretta." : "That is the standalone app: no address bar and the correct TrackDash icon."}</p></div></div>
          </div>
          <p className="text-xs text-muted-foreground">{it ? "Se vuoi reinstallarla da zero, disinstalla TrackDash da Impostazioni → App (non limitarti a rimuovere l'icona dalla Home), poi torna in Chrome, aggiorna TrackDash e premi di nuovo Installa TrackDash." : "To reinstall from scratch, uninstall TrackDash from Settings → Apps (do not only remove its Home icon), then return to Chrome, reload TrackDash and tap Install TrackDash again."}</p>
          <DialogFooter><DialogClose render={<Button>{it ? "Ho capito" : "Got it"}</Button>} /></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={instructionsOpen} onOpenChange={setInstructionsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Download className="size-4" />{it ? "Installa TrackDash" : "Install TrackDash"}</DialogTitle>
            <DialogDescription>{it ? "Su iPhone e iPad l'installazione passa da Safari e dal menu Condividi." : "On iPhone and iPad, installation uses Safari and the Share menu."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-1 text-sm">
            <div className="flex items-start gap-3 rounded-lg border p-3"><Share className="mt-0.5 size-4 shrink-0 text-brand" /><div><p className="font-medium">1. {it ? "Apri TrackDash in Safari e tocca Condividi" : "Open TrackDash in Safari and tap Share"}</p><p className="text-xs text-muted-foreground">{it ? "Il pulsante con il quadrato e la freccia verso l'alto." : "The square button with the upward arrow."}</p></div></div>
            <div className="flex items-start gap-3 rounded-lg border p-3"><SquarePlus className="mt-0.5 size-4 shrink-0 text-brand" /><div><p className="font-medium">2. {it ? "Aggiungi alla schermata Home" : "Add to Home Screen"}</p><p className="text-xs text-muted-foreground">{it ? "Conferma e TrackDash si aprirà come un'app." : "Confirm and TrackDash will open like an app."}</p></div></div>
          </div>
          <DialogFooter><DialogClose render={<Button>{it ? "Ho capito" : "Got it"}</Button>} /></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={fallbackOpen} onOpenChange={setFallbackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Download className="size-4" />{it ? "Installa TrackDash come app" : "Install TrackDash as an app"}</DialogTitle>
            <DialogDescription>{manualCopy.description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-1 text-sm">
            <div className="flex items-start gap-3 rounded-lg border p-3"><EllipsisVertical className="mt-0.5 size-4 shrink-0 text-brand" /><p className="font-medium">1. {manualCopy.first}</p></div>
            <div className="flex items-start gap-3 rounded-lg border p-3"><SquarePlus className="mt-0.5 size-4 shrink-0 text-brand" /><div><p className="font-medium">2. {manualCopy.second}</p><p className="mt-1 text-xs text-muted-foreground">{manualCopy.note}</p></div></div>
          </div>
          <p className="text-xs text-muted-foreground">{it ? "TrackDash considera riuscita l'installazione solo quando il browser crea la vera PWA/app standalone, non una semplice scorciatoia web." : "TrackDash only treats installation as complete when the browser creates the real standalone PWA/app, not a plain web shortcut."}</p>
          <DialogFooter><DialogClose render={<Button>{it ? "Chiudi" : "Close"}</Button>} /></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
