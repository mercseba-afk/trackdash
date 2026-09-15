"use client"

import * as React from "react"
import { Download, EllipsisVertical, Share, SquarePlus } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type InstallChoice = { outcome: "accepted" | "dismissed"; platform: string }
type BrowserKind = "chrome" | "firefox" | "edge" | "samsung" | "other"

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

export function PwaInstallManager() {
  const { locale } = useI18n()
  const it = locale === "it"
  const deferredPrompt = React.useRef<BeforeInstallPromptEvent | null>(null)
  const [instructionsOpen, setInstructionsOpen] = React.useState(false)
  const [fallbackOpen, setFallbackOpen] = React.useState(false)
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

    if (isStandalone()) onInstalled()
    else localStorage.removeItem("trackdash.pwa.installed")

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
          ? "Firefox non usa il prompt automatico di TrackDash, ma puoi installare l'app direttamente dal menu del browser."
          : "Firefox does not use TrackDash's automatic install prompt, but you can install the app from the browser menu.",
        first: it ? "Apri il menu ⋮ di Firefox" : "Open Firefox's ⋮ menu",
        second: it ? "Tocca Installa" : "Tap Install",
        note: it ? "Se non vedi “Installa”, usa “Agg. a schermata principale”." : "If Install is not shown, use Add to Home Screen.",
      }
    }

    if (fallbackAndroid && fallbackBrowser === "chrome") {
      return {
        description: it
          ? "Il prompt automatico non è disponibile in questo momento, ma TrackDash può essere installata dal menu di Chrome."
          : "The automatic prompt is not available right now, but TrackDash can be installed from Chrome's menu.",
        first: it ? "Apri il menu ⋮ di Chrome" : "Open Chrome's ⋮ menu",
        second: it ? "Installa e crea scorciatoia → Installa" : "Install and create shortcut → Install",
        note: it ? "In alcune versioni la voce può comparire direttamente come “Installa app”." : "On some versions the option may appear directly as Install app.",
      }
    }

    if (!fallbackAndroid && fallbackBrowser === "chrome") {
      return {
        description: it
          ? "Il prompt automatico non è disponibile, ma puoi installare TrackDash dal menu di Chrome."
          : "The automatic prompt is not available, but you can install TrackDash from Chrome's menu.",
        first: it ? "Apri il menu ⋮ di Chrome" : "Open Chrome's ⋮ menu",
        second: it ? "Trasmetti, salva e condividi → Installa questa pagina come app" : "Cast, save and share → Install page as app",
        note: it ? "Se compare l'icona Installa nella barra degli indirizzi puoi usare direttamente quella." : "If the Install icon appears in the address bar, you can use it directly.",
      }
    }

    return {
      description: it
        ? "Questo browser non ha reso disponibile il prompt automatico. Puoi comunque installare TrackDash dal menu del browser."
        : "This browser has not exposed the automatic install prompt. You can still install TrackDash from the browser menu.",
      first: it ? "Apri il menu del browser" : "Open the browser menu",
      second: it ? "Cerca “Installa app” o “Aggiungi alla schermata Home”" : "Choose Install app or Add to Home Screen",
      note: it ? "La dicitura può cambiare leggermente in base al browser e alla versione." : "The wording may vary slightly by browser and version.",
    }
  })()

  return (
    <>
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
            <DialogTitle className="flex items-center gap-2"><Download className="size-4" />{it ? "Installa TrackDash" : "Install TrackDash"}</DialogTitle>
            <DialogDescription>{manualCopy.description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-1 text-sm">
            <div className="flex items-start gap-3 rounded-lg border p-3"><EllipsisVertical className="mt-0.5 size-4 shrink-0 text-brand" /><p className="font-medium">1. {manualCopy.first}</p></div>
            <div className="flex items-start gap-3 rounded-lg border p-3"><SquarePlus className="mt-0.5 size-4 shrink-0 text-brand" /><div><p className="font-medium">2. {manualCopy.second}</p><p className="mt-1 text-xs text-muted-foreground">{manualCopy.note}</p></div></div>
          </div>
          <p className="text-xs text-muted-foreground">{it ? "Il pulsante di TrackDash usa il prompt nativo quando il browser lo permette; queste istruzioni compaiono solo come percorso alternativo." : "TrackDash uses the native install prompt whenever the browser exposes it; these instructions are only the fallback path."}</p>
          <DialogFooter><DialogClose render={<Button>{it ? "Chiudi" : "Close"}</Button>} /></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
