"use client"

import * as React from "react"
import { Download, EllipsisVertical, Search, Share, SquarePlus } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type InstallChoice = { outcome: "accepted" | "dismissed"; platform: string }
type BrowserKind = "chrome" | "firefox" | "edge" | "samsung" | "safari" | "other"
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

function isIOSFamily() {
  if (typeof navigator === "undefined") return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
}

function isAndroid() {
  if (typeof navigator === "undefined") return false
  return /android/i.test(navigator.userAgent)
}

function isSafariBrowser() {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent
  return /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|Edg|EdgiOS|OPR|Firefox|FxiOS/i.test(ua)
}

function isMacSafari() {
  if (typeof navigator === "undefined" || isIOSFamily()) return false
  return /Macintosh|Mac OS X/i.test(navigator.userAgent) && isSafariBrowser()
}

function detectBrowser(): BrowserKind {
  if (typeof navigator === "undefined") return "other"
  const ua = navigator.userAgent
  if (/firefox|fxios/i.test(ua)) return "firefox"
  if (/samsungbrowser/i.test(ua)) return "samsung"
  if (/edg|edga|edgios/i.test(ua)) return "edge"
  if (/chrome|crios/i.test(ua)) return "chrome"
  if (isSafariBrowser()) return "safari"
  return "other"
}

function emitStateChange() {
  window.dispatchEvent(new Event("trackdash:pwa-state-change"))
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
  const [iosInstructionsOpen, setIosInstructionsOpen] = React.useState(false)
  const [macInstructionsOpen, setMacInstructionsOpen] = React.useState(false)
  const [fallbackOpen, setFallbackOpen] = React.useState(false)
  const [alreadyInstalledOpen, setAlreadyInstalledOpen] = React.useState(false)
  const [fallbackBrowser, setFallbackBrowser] = React.useState<BrowserKind>("other")
  const [fallbackAndroid, setFallbackAndroid] = React.useState(false)
  const [iosSafari, setIosSafari] = React.useState(false)

  React.useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {})
    }

    if (window.__trackdashInstallPrompt) {
      deferredPrompt.current = window.__trackdashInstallPrompt
      window.dispatchEvent(new Event("trackdash:pwa-available"))
      emitStateChange()
    }

    const onBeforeInstall = (event: BeforeInstallPromptEvent) => {
      event.preventDefault()
      deferredPrompt.current = event
      window.__trackdashInstallPrompt = event
      window.dispatchEvent(new Event("trackdash:pwa-available"))
      emitStateChange()
    }

    const onInstalled = () => {
      deferredPrompt.current = null
      window.__trackdashInstallPrompt = null
      localStorage.setItem("trackdash.pwa.installed", "1")
      window.dispatchEvent(new Event("trackdash:pwa-installed"))
      emitStateChange()
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
          emitStateChange()
          return
        } catch {
          deferredPrompt.current = null
          window.__trackdashInstallPrompt = null
          emitStateChange()
        }
      }

      if (isIOSFamily()) {
        setIosSafari(isSafariBrowser())
        setIosInstructionsOpen(true)
      } else if (isMacSafari()) {
        setMacInstructionsOpen(true)
      } else {
        showManualInstructions()
      }
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
        else emitStateChange()
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
          ? "Per l'installazione più completa di TrackDash su Android consigliamo Chrome o Samsung Internet."
          : "For the most complete TrackDash installation on Android, use Chrome or Samsung Internet.",
        first: it ? "Apri trackdash.it in Chrome" : "Open trackdash.it in Chrome",
        second: it ? "Usa “Installa TrackDash” quando compare" : "Use Install TrackDash when it appears",
        note: it ? "Chrome mostra il comando quando ha verificato che la PWA è installabile." : "Chrome shows the command after it has verified that the PWA is installable.",
      }
    }

    if (fallbackAndroid && (fallbackBrowser === "chrome" || fallbackBrowser === "edge" || fallbackBrowser === "samsung")) {
      return {
        description: it
          ? "Il browser non ha ancora reso disponibile il prompt nativo di installazione in questa scheda."
          : "The browser has not exposed its native install prompt in this tab yet.",
        first: it ? "Continua a usare TrackDash per qualche secondo" : "Keep using TrackDash for a few seconds",
        second: it ? "Quando “Installa TrackDash” ricompare, toccalo" : "When Install TrackDash appears again, tap it",
        note: it ? "Il pulsante viene mostrato solo quando il browser conferma che può aprire il vero flusso di installazione." : "The button is shown only when the browser confirms that it can open the real install flow.",
      }
    }

    if (!fallbackAndroid && (fallbackBrowser === "chrome" || fallbackBrowser === "edge")) {
      return {
        description: it
          ? "Il prompt nativo non è disponibile in questo momento. Chrome ed Edge lo espongono solo quando la pagina soddisfa i criteri di installazione."
          : "The native prompt is not available right now. Chrome and Edge expose it only after the page meets their install criteria.",
        first: it ? "Continua a usare TrackDash e riprova più tardi" : "Keep using TrackDash and try again shortly",
        second: it ? "Puoi anche cercare “Installa” nel menu del browser" : "You can also look for Install in the browser menu",
        note: it ? "Quando il prompt nativo è disponibile, il pulsante TrackDash lo apre direttamente." : "When the native prompt is available, the TrackDash button opens it directly.",
      }
    }

    return {
      description: it
        ? "Questo browser non espone un prompt di installazione controllabile dal sito."
        : "This browser does not expose an install prompt that the site can trigger.",
      first: it ? "Apri il menu del browser" : "Open the browser menu",
      second: it ? "Cerca una voce per installare o aggiungere TrackDash come app" : "Look for an option to install or add TrackDash as an app",
      note: it ? "Su Android, Chrome è il percorso consigliato per l'installazione PWA." : "On Android, Chrome is the recommended path for PWA installation.",
    }
  })()

  return (
    <>
      <Dialog open={alreadyInstalledOpen} onOpenChange={setAlreadyInstalledOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Download className="size-4" />{it ? "TrackDash è già installata" : "TrackDash is already installed"}</DialogTitle>
            <DialogDescription>{it ? "Il browser vede già TrackDash come app installata su questo dispositivo e non propone una seconda installazione." : "The browser already sees TrackDash as installed on this device, so it will not offer a second installation."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-1 text-sm">
            <div className="flex items-start gap-3 rounded-lg border p-3"><Search className="mt-0.5 size-4 shrink-0 text-brand" /><div><p className="font-medium">1. {it ? "Cerca TrackDash tra le app del dispositivo" : "Find TrackDash in your device's apps"}</p><p className="text-xs text-muted-foreground">{it ? "Puoi cercarla anche dalle impostazioni delle app." : "You can also look for it in app settings."}</p></div></div>
            <div className="flex items-start gap-3 rounded-lg border p-3"><SquarePlus className="mt-0.5 size-4 shrink-0 text-brand" /><div><p className="font-medium">2. {it ? "Aprila oppure rimetti la sua icona nella Home" : "Open it or add its icon back to the Home screen"}</p><p className="text-xs text-muted-foreground">{it ? "La versione installata si apre in modalità app." : "The installed version opens in app mode."}</p></div></div>
          </div>
          <DialogFooter><DialogClose render={<Button>{it ? "Ho capito" : "Got it"}</Button>} /></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={iosInstructionsOpen} onOpenChange={setIosInstructionsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Download className="size-4" />{it ? "Installa TrackDash su iPhone o iPad" : "Install TrackDash on iPhone or iPad"}</DialogTitle>
            <DialogDescription>
              {iosSafari
                ? (it ? "Su iPhone e iPad Safari installa TrackDash dal menu Condividi." : "On iPhone and iPad, Safari installs TrackDash from the Share menu.")
                : (it ? "Su iPhone e iPad l'installazione della web app va completata in Safari." : "On iPhone and iPad, web app installation must be completed in Safari.")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-1 text-sm">
            {!iosSafari ? (
              <div className="flex items-start gap-3 rounded-lg border p-3"><Share className="mt-0.5 size-4 shrink-0 text-brand" /><div><p className="font-medium">1. {it ? "Apri trackdash.it in Safari" : "Open trackdash.it in Safari"}</p><p className="text-xs text-muted-foreground">{it ? "Chrome, Edge e Firefox su iOS non possono aprire il prompt PWA nativo." : "Chrome, Edge and Firefox on iOS cannot open the native PWA install prompt."}</p></div></div>
            ) : null}
            <div className="flex items-start gap-3 rounded-lg border p-3"><Share className="mt-0.5 size-4 shrink-0 text-brand" /><div><p className="font-medium">{iosSafari ? "1." : "2."} {it ? "Tocca Condividi" : "Tap Share"}</p><p className="text-xs text-muted-foreground">{it ? "È il pulsante con il quadrato e la freccia verso l'alto." : "It's the square button with the upward arrow."}</p></div></div>
            <div className="flex items-start gap-3 rounded-lg border p-3"><SquarePlus className="mt-0.5 size-4 shrink-0 text-brand" /><div><p className="font-medium">{iosSafari ? "2." : "3."} {it ? "Aggiungi alla schermata Home" : "Add to Home Screen"}</p><p className="text-xs text-muted-foreground">{it ? "Conferma e TrackDash si aprirà dalla Home come app." : "Confirm and TrackDash will open from your Home Screen like an app."}</p></div></div>
          </div>
          <DialogFooter><DialogClose render={<Button>{it ? "Ho capito" : "Got it"}</Button>} /></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={macInstructionsOpen} onOpenChange={setMacInstructionsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Download className="size-4" />{it ? "Aggiungi TrackDash al Dock" : "Add TrackDash to the Dock"}</DialogTitle>
            <DialogDescription>{it ? "Su Safari per Mac l'installazione non usa il prompt di Chrome: macOS crea la web app tramite “Aggiungi al Dock”." : "Safari on Mac does not use Chrome's install prompt: macOS creates the web app through Add to Dock."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-1 text-sm">
            <div className="flex items-start gap-3 rounded-lg border p-3"><EllipsisVertical className="mt-0.5 size-4 shrink-0 text-brand" /><p className="font-medium">1. {it ? "In Safari scegli File → Aggiungi al Dock" : "In Safari choose File → Add to Dock"}</p></div>
            <div className="flex items-start gap-3 rounded-lg border p-3"><SquarePlus className="mt-0.5 size-4 shrink-0 text-brand" /><div><p className="font-medium">2. {it ? "Conferma con Aggiungi" : "Confirm with Add"}</p><p className="mt-1 text-xs text-muted-foreground">{it ? "TrackDash verrà salvata tra le applicazioni e sarà avviabile dal Dock o da Spotlight." : "TrackDash will be saved with your applications and can be launched from the Dock or Spotlight."}</p></div></div>
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
          <DialogFooter><DialogClose render={<Button>{it ? "Chiudi" : "Close"}</Button>} /></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
