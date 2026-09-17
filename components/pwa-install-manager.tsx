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
  if (/chrome|chromium|crios/i.test(ua)) return "chrome"
  if (isSafariBrowser()) return "safari"
  return "other"
}

function isChromiumInstallBrowser(browser: BrowserKind) {
  if (isIOSFamily()) return false
  return browser === "chrome" || browser === "edge" || browser === "samsung"
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
  const [installReady, setInstallReady] = React.useState(false)
  const [iosInstructionsOpen, setIosInstructionsOpen] = React.useState(false)
  const [macInstructionsOpen, setMacInstructionsOpen] = React.useState(false)
  const [fallbackOpen, setFallbackOpen] = React.useState(false)
  const [alreadyInstalledOpen, setAlreadyInstalledOpen] = React.useState(false)
  const [fallbackBrowser, setFallbackBrowser] = React.useState<BrowserKind>("other")
  const [fallbackAndroid, setFallbackAndroid] = React.useState(false)
  const [iosSafari, setIosSafari] = React.useState(false)

  const clearPrompt = React.useCallback(() => {
    deferredPrompt.current = null
    window.__trackdashInstallPrompt = null
    setInstallReady(false)
    emitStateChange()
  }, [])

  const markInstalled = React.useCallback(() => {
    deferredPrompt.current = null
    window.__trackdashInstallPrompt = null
    setInstallReady(false)
    setFallbackOpen(false)
    localStorage.setItem("trackdash.pwa.installed", "1")
    window.dispatchEvent(new Event("trackdash:pwa-installed"))
    emitStateChange()
  }, [])

  const runNativePrompt = React.useCallback(async () => {
    const storedPrompt = deferredPrompt.current ?? window.__trackdashInstallPrompt ?? null
    if (!storedPrompt) return false

    try {
      await storedPrompt.prompt()
      const choice = await storedPrompt.userChoice
      if (choice.outcome === "accepted") markInstalled()
      else clearPrompt()
      return true
    } catch {
      clearPrompt()
      return false
    }
  }, [clearPrompt, markInstalled])

  React.useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).then(() => navigator.serviceWorker.ready).then(() => emitStateChange()).catch(() => {})
    }

    const initialPrompt = window.__trackdashInstallPrompt ?? null
    if (initialPrompt) {
      deferredPrompt.current = initialPrompt
      setInstallReady(true)
      window.dispatchEvent(new Event("trackdash:pwa-available"))
      emitStateChange()
    }

    const onBeforeInstall = (event: BeforeInstallPromptEvent) => {
      event.preventDefault()
      deferredPrompt.current = event
      window.__trackdashInstallPrompt = event
      setInstallReady(true)
      window.dispatchEvent(new Event("trackdash:pwa-available"))
      emitStateChange()
    }

    const onInstalled = () => markInstalled()

    const showManualInstructions = () => {
      setFallbackBrowser(detectBrowser())
      setFallbackAndroid(isAndroid())
      setFallbackOpen(true)
    }

    const onRequest = async () => {
      if (isStandalone()) {
        markInstalled()
        return
      }

      if (await hasInstalledTrackDashPwa()) {
        markInstalled()
        setAlreadyInstalledOpen(true)
        return
      }

      if (deferredPrompt.current ?? window.__trackdashInstallPrompt) {
        await runNativePrompt()
        return
      }

      if (isIOSFamily()) {
        setIosSafari(isSafariBrowser())
        setIosInstructionsOpen(true)
        return
      }

      if (isMacSafari()) {
        setMacInstructionsOpen(true)
        return
      }

      // A site cannot force Chromium to expose beforeinstallprompt. If Chrome,
      // Edge or Samsung Internet has not supplied it for this tab, show an
      // actionable browser-menu fallback immediately instead of trapping the
      // user behind an indefinitely disabled "Not ready yet" button.
      showManualInstructions()
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall)
    window.addEventListener("appinstalled", onInstalled)
    window.addEventListener("trackdash:pwa-request-install", onRequest)

    if (isStandalone()) {
      markInstalled()
    } else {
      localStorage.removeItem("trackdash.pwa.installed")
      void hasInstalledTrackDashPwa().then((installed) => {
        if (installed) markInstalled()
        else emitStateChange()
      })
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall)
      window.removeEventListener("appinstalled", onInstalled)
      window.removeEventListener("trackdash:pwa-request-install", onRequest)
    }
  }, [markInstalled, runNativePrompt])

  const manualCopy = (() => {
    if (fallbackAndroid && fallbackBrowser === "firefox") {
      return {
        description: it
          ? "Firefox su Android non espone il prompt PWA usato da TrackDash. Per l'installazione completa apri il sito in Chrome o Samsung Internet."
          : "Firefox on Android does not expose the PWA prompt TrackDash uses. For the full installation, open the site in Chrome or Samsung Internet.",
        first: it ? "Apri trackdash.it in Chrome" : "Open trackdash.it in Chrome",
        second: it ? "Apri il menu ⋮ e cerca Installa app" : "Open the ⋮ menu and look for Install app",
        note: it ? "Quando Chrome rende disponibile il prompt nativo, il pulsante TrackDash lo aprirà direttamente." : "When Chrome exposes the native prompt, the TrackDash button will open it directly.",
      }
    }

    if (fallbackAndroid && isChromiumInstallBrowser(fallbackBrowser)) {
      return {
        description: it
          ? "Il browser non ha fornito a TrackDash il prompt nativo di installazione in questa scheda. Non serve lasciare una finestra in attesa."
          : "The browser has not supplied TrackDash with its native install prompt in this tab. You do not need to leave a window waiting.",
        first: it ? "Apri il menu ⋮ del browser" : "Open the browser's ⋮ menu",
        second: it ? "Tocca Installa app, se disponibile" : "Tap Install app, if available",
        note: it
          ? "Se Installa app non compare, il browser non sta offrendo l'installazione in questo momento. Continua a usare TrackDash e riprova dal menu più tardi."
          : "If Install app is not shown, the browser is not offering installation right now. Keep using TrackDash and try again from the menu later.",
      }
    }

    if (!fallbackAndroid && (fallbackBrowser === "chrome" || fallbackBrowser === "edge")) {
      return {
        description: it
          ? "Il prompt nativo non è disponibile in questa scheda, ma puoi controllare direttamente il comando del browser."
          : "The native prompt is not available in this tab, but you can check the browser command directly.",
        first: it ? "Apri il menu del browser" : "Open the browser menu",
        second: it ? "Cerca Installa TrackDash o Installa app" : "Look for Install TrackDash or Install app",
        note: it ? "Se il comando non compare, il browser non sta offrendo l'installazione in questo momento." : "If the command is missing, the browser is not offering installation right now.",
      }
    }

    return {
      description: it ? "Questo browser non espone un prompt PWA controllabile dal sito." : "This browser does not expose a PWA prompt the site can trigger.",
      first: it ? "Apri il menu del browser" : "Open the browser menu",
      second: it ? "Cerca Installa app o Aggiungi alla schermata Home" : "Look for Install app or Add to Home Screen",
      note: it ? "Su Android consigliamo Chrome o Samsung Internet." : "On Android, Chrome or Samsung Internet is recommended.",
    }
  })()

  return (
    <>
      <Dialog open={alreadyInstalledOpen} onOpenChange={setAlreadyInstalledOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Download className="size-4" />{it ? "TrackDash è già installata" : "TrackDash is already installed"}</DialogTitle>
            <DialogDescription>{it ? "Il dispositivo vede già TrackDash come app installata e non propone una seconda installazione." : "This device already sees TrackDash as installed and will not offer a second installation."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-1 text-sm">
            <div className="flex items-start gap-3 rounded-lg border p-3"><Search className="mt-0.5 size-4 shrink-0 text-brand" /><div><p className="font-medium">1. {it ? "Cerca TrackDash tra le app del dispositivo" : "Find TrackDash in your device's apps"}</p><p className="text-xs text-muted-foreground">{it ? "Su Android puoi cercarla anche in Impostazioni → App." : "On Android you can also find it in Settings → Apps."}</p></div></div>
            <div className="flex items-start gap-3 rounded-lg border p-3"><SquarePlus className="mt-0.5 size-4 shrink-0 text-brand" /><div><p className="font-medium">2. {it ? "Aprila oppure rimetti la sua icona nella Home" : "Open it or add its icon back to the Home screen"}</p><p className="text-xs text-muted-foreground">{it ? "La PWA installata si apre senza la normale barra URL." : "The installed PWA opens without the normal URL bar."}</p></div></div>
          </div>
          <DialogFooter><DialogClose render={<Button>{it ? "Ho capito" : "Got it"}</Button>} /></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={iosInstructionsOpen} onOpenChange={setIosInstructionsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Download className="size-4" />{it ? "Installa TrackDash su iPhone o iPad" : "Install TrackDash on iPhone or iPad"}</DialogTitle>
            <DialogDescription>{iosSafari ? (it ? "Safari installa TrackDash dal menu Condividi." : "Safari installs TrackDash from the Share menu.") : (it ? "Su iPhone e iPad completa l'installazione in Safari." : "On iPhone and iPad, complete installation in Safari.")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-1 text-sm">
            {!iosSafari ? <div className="flex items-start gap-3 rounded-lg border p-3"><Share className="mt-0.5 size-4 shrink-0 text-brand" /><div><p className="font-medium">1. {it ? "Apri trackdash.it in Safari" : "Open trackdash.it in Safari"}</p><p className="text-xs text-muted-foreground">{it ? "Su iOS gli altri browser non espongono il flusso PWA nativo." : "On iOS, other browsers do not expose the native PWA flow."}</p></div></div> : null}
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
            <DialogDescription>{it ? "Safari su Mac usa il comando Aggiungi al Dock invece del prompt di Chrome." : "Safari on Mac uses Add to Dock instead of Chrome's install prompt."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-1 text-sm">
            <div className="flex items-start gap-3 rounded-lg border p-3"><EllipsisVertical className="mt-0.5 size-4 shrink-0 text-brand" /><p className="font-medium">1. {it ? "In Safari scegli File → Aggiungi al Dock" : "In Safari choose File → Add to Dock"}</p></div>
            <div className="flex items-start gap-3 rounded-lg border p-3"><SquarePlus className="mt-0.5 size-4 shrink-0 text-brand" /><div><p className="font-medium">2. {it ? "Conferma con Aggiungi" : "Confirm with Add"}</p><p className="mt-1 text-xs text-muted-foreground">{it ? "TrackDash sarà disponibile tra le applicazioni e dal Dock o Spotlight." : "TrackDash will be available with your applications and from the Dock or Spotlight."}</p></div></div>
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
          <DialogFooter>
            <DialogClose render={<Button variant="outline">{it ? "Chiudi" : "Close"}</Button>} />
            {installReady ? <Button onClick={() => void runNativePrompt()}>{it ? "Installa ora" : "Install now"}</Button> : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
