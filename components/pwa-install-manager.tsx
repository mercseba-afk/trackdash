"use client"

import * as React from "react"
import { Download, ExternalLink, Share, SquarePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useI18n } from "@/lib/i18n"

type InstallChoice = { outcome: "accepted" | "dismissed"; platform: string }
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<InstallChoice>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
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

function isIOSFamily() {
  if (typeof navigator === "undefined") return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
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

function isAndroid() {
  return typeof navigator !== "undefined" && /android/i.test(navigator.userAgent)
}

function isFirefox() {
  return typeof navigator !== "undefined" && /firefox|fxios/i.test(navigator.userAgent)
}

function isChromiumFamily() {
  if (typeof navigator === "undefined" || isIOSFamily()) return false
  return /Chrome|Chromium|Edg|SamsungBrowser|Vivaldi|OPR/i.test(navigator.userAgent) && !/Firefox/i.test(navigator.userAgent)
}

function emitStateChange() {
  window.dispatchEvent(new Event("trackdash:pwa-state-change"))
}

export function PwaInstallManager() {
  const { locale } = useI18n()
  const it = locale === "it"
  const deferredPrompt = React.useRef<BeforeInstallPromptEvent | null>(null)
  const [nativeReadyOpen, setNativeReadyOpen] = React.useState(false)
  const [iosOpen, setIosOpen] = React.useState(false)
  const [macOpen, setMacOpen] = React.useState(false)
  const [waitingOpen, setWaitingOpen] = React.useState(false)
  const [unsupportedOpen, setUnsupportedOpen] = React.useState(false)

  const clearPrompt = React.useCallback(() => {
    deferredPrompt.current = null
    window.__trackdashInstallPrompt = null
    setNativeReadyOpen(false)
    emitStateChange()
  }, [])

  const markInstalled = React.useCallback(() => {
    deferredPrompt.current = null
    window.__trackdashInstallPrompt = null
    setNativeReadyOpen(false)
    setWaitingOpen(false)
    window.dispatchEvent(new Event("trackdash:pwa-installed"))
    emitStateChange()
  }, [])

  const runNativePrompt = React.useCallback(async () => {
    const promptEvent = deferredPrompt.current ?? window.__trackdashInstallPrompt ?? null
    if (!promptEvent) return false

    setNativeReadyOpen(false)

    try {
      await promptEvent.prompt()
      const choice = await promptEvent.userChoice
      if (choice.outcome === "accepted") markInstalled()
      else clearPrompt()
      return true
    } catch {
      clearPrompt()
      return false
    }
  }, [clearPrompt, markInstalled])

  React.useEffect(() => {
    const initialPrompt = window.__trackdashInstallPrompt ?? null
    if (initialPrompt) {
      deferredPrompt.current = initialPrompt
      setNativeReadyOpen(true)
      window.dispatchEvent(new Event("trackdash:pwa-available"))
      emitStateChange()
    }

    const onBeforeInstall = (event: BeforeInstallPromptEvent) => {
      event.preventDefault()
      deferredPrompt.current = event
      window.__trackdashInstallPrompt = event
      setWaitingOpen(false)
      setNativeReadyOpen(true)
      window.dispatchEvent(new Event("trackdash:pwa-available"))
      emitStateChange()
    }

    const onInstalled = () => markInstalled()

    const onRequest = async () => {
      if (isStandalone()) {
        markInstalled()
        return
      }

      if (deferredPrompt.current ?? window.__trackdashInstallPrompt) {
        await runNativePrompt()
        return
      }

      if (isIOSFamily()) {
        setIosOpen(true)
        return
      }

      if (isMacSafari()) {
        setMacOpen(true)
        return
      }

      if (isAndroid() && isChromiumFamily()) {
        setWaitingOpen(true)
        return
      }

      setUnsupportedOpen(true)
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall)
    window.addEventListener("appinstalled", onInstalled)
    window.addEventListener("trackdash:pwa-request-install", onRequest)

    if (isStandalone()) markInstalled()
    else emitStateChange()

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall)
      window.removeEventListener("appinstalled", onInstalled)
      window.removeEventListener("trackdash:pwa-request-install", onRequest)
    }
  }, [markInstalled, runNativePrompt])

  return (
    <>
      <Dialog open={nativeReadyOpen} onOpenChange={setNativeReadyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="size-4" />
              {it ? "Installa TrackDash" : "Install TrackDash"}
            </DialogTitle>
            <DialogDescription>
              {it
                ? "TrackDash è pronta per essere installata come vera app sul dispositivo."
                : "TrackDash is ready to be installed as a real app on this device."}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/30 p-3 text-sm leading-relaxed text-muted-foreground">
            {it
              ? "L'installazione userà il prompt nativo del browser e aprirà TrackDash in modalità standalone, con la sua icona e senza la normale barra URL."
              : "Installation will use the browser's native prompt and open TrackDash in standalone mode, with its own icon and without the normal URL bar."}
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">{it ? "Non ora" : "Not now"}</Button>} />
            <Button onClick={() => void runNativePrompt()}>{it ? "Installa ora" : "Install now"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={waitingOpen} onOpenChange={setWaitingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="size-4" />
              {it ? "Installazione PWA in preparazione" : "PWA installation is getting ready"}
            </DialogTitle>
            <DialogDescription>
              {it
                ? "TrackDash non creerà un semplice collegamento. Il pulsante di installazione diretta si attiverà solo quando il browser rende disponibile il prompt nativo della vera app PWA."
                : "TrackDash will not create a plain shortcut. Direct install becomes available only when the browser exposes the native prompt for the real PWA."}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/30 p-3 text-sm leading-relaxed text-muted-foreground">
            {it
              ? "Continua a usare TrackDash in questa scheda. Quando il browser abilita l'installazione, comparirà automaticamente il popup di installazione. Evita “Aggiungi alla schermata Home” se il browser lo presenta come semplice collegamento."
              : "Keep using TrackDash in this tab. When the browser enables installation, the install popup will appear automatically. Avoid “Add to Home Screen” when the browser offers it only as a shortcut."}
          </div>
          <DialogFooter>
            <DialogClose render={<Button>{it ? "Ho capito" : "Got it"}</Button>} />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={iosOpen} onOpenChange={setIosOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="size-4" />
              {it ? "Installa TrackDash su iPhone o iPad" : "Install TrackDash on iPhone or iPad"}
            </DialogTitle>
            <DialogDescription>
              {it
                ? "Su iOS l'installazione delle web app passa da Safari e dal comando Aggiungi alla schermata Home."
                : "On iOS, web app installation is completed in Safari with Add to Home Screen."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-1 text-sm">
            {!isSafariBrowser() ? (
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <ExternalLink className="mt-0.5 size-4 shrink-0 text-brand" />
                <p className="font-medium">1. {it ? "Apri trackdash.it in Safari" : "Open trackdash.it in Safari"}</p>
              </div>
            ) : null}
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <Share className="mt-0.5 size-4 shrink-0 text-brand" />
              <p className="font-medium">{isSafariBrowser() ? "1." : "2."} {it ? "Tocca Condividi" : "Tap Share"}</p>
            </div>
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <SquarePlus className="mt-0.5 size-4 shrink-0 text-brand" />
              <div>
                <p className="font-medium">{isSafariBrowser() ? "2." : "3."} {it ? "Scegli Aggiungi alla schermata Home" : "Choose Add to Home Screen"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{it ? "Conferma: TrackDash si aprirà dalla Home in modalità app." : "Confirm: TrackDash will open from the Home Screen in app mode."}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button>{it ? "Ho capito" : "Got it"}</Button>} />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={macOpen} onOpenChange={setMacOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="size-4" />
              {it ? "Aggiungi TrackDash al Dock" : "Add TrackDash to the Dock"}
            </DialogTitle>
            <DialogDescription>{it ? "In Safari su Mac usa File → Aggiungi al Dock." : "In Safari on Mac use File → Add to Dock."}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button>{it ? "Ho capito" : "Got it"}</Button>} />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={unsupportedOpen} onOpenChange={setUnsupportedOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="size-4" />
              {it ? "Installazione diretta non disponibile" : "Direct installation unavailable"}
            </DialogTitle>
            <DialogDescription>
              {isAndroid() && isFirefox()
                ? (it
                    ? "Firefox Android non espone a TrackDash il prompt di installazione controllabile dalla pagina. Per ottenere il flusso diretto della PWA apri trackdash.it in Chrome, Edge o Samsung Internet."
                    : "Firefox Android does not expose a page-controlled install prompt to TrackDash. For the direct PWA flow, open trackdash.it in Chrome, Edge or Samsung Internet.")
                : (it
                    ? "Questo browser non espone a TrackDash un prompt di installazione PWA controllabile dalla pagina."
                    : "This browser does not expose a page-controlled PWA install prompt to TrackDash.")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button>{it ? "Chiudi" : "Close"}</Button>} />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
