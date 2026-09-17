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

function isIOS() {
  if (typeof navigator === "undefined") return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
}

function isAndroid() {
  if (typeof navigator === "undefined") return false
  return /android/i.test(navigator.userAgent)
}

function isMacOS() {
  if (typeof navigator === "undefined" || isIOS()) return false
  return /macintosh|mac os x/i.test(navigator.userAgent)
}

function detectBrowser(): BrowserKind {
  if (typeof navigator === "undefined") return "other"
  const ua = navigator.userAgent
  if (/firefox|fxios/i.test(ua)) return "firefox"
  if (/samsungbrowser/i.test(ua)) return "samsung"
  if (/edg|edga|edgios/i.test(ua)) return "edge"
  if (/chrome|crios/i.test(ua)) return "chrome"
  if (/safari/i.test(ua)) return "safari"
  return "other"
}

function supportsDeferredInstallPrompt(browser: BrowserKind) {
  return browser === "chrome" || browser === "edge" || browser === "samsung"
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
  const [instructionsOpen, setInstructionsOpen] = React.useState(false)
  const [macSafariOpen, setMacSafariOpen] = React.useState(false)
  const [waitingOpen, setWaitingOpen] = React.useState(false)
  const [waitingBrowser, setWaitingBrowser] = React.useState<BrowserKind>("other")
  const [waitingAndroid, setWaitingAndroid] = React.useState(false)
  const [fallbackOpen, setFallbackOpen] = React.useState(false)
  const [alreadyInstalledOpen, setAlreadyInstalledOpen] = React.useState(false)
  const [fallbackBrowser, setFallbackBrowser] = React.useState<BrowserKind>("other")
  const [fallbackAndroid, setFallbackAndroid] = React.useState(false)

  React.useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {})
    }

    const initialPrompt = window.__trackdashInstallPrompt ?? null
    if (initialPrompt) {
      deferredPrompt.current = initialPrompt
      setInstallReady(true)
      window.dispatchEvent(new Event("trackdash:pwa-available"))
    }

    const onBeforeInstall = (event: BeforeInstallPromptEvent) => {
      event.preventDefault()
      deferredPrompt.current = event
      window.__trackdashInstallPrompt = event
      setInstallReady(true)
      window.dispatchEvent(new Event("trackdash:pwa-available"))
    }

    const onInstalled = () => {
      deferredPrompt.current = null
      window.__trackdashInstallPrompt = null
      setInstallReady(false)
      setWaitingOpen(false)
      localStorage.setItem("trackdash.pwa.installed", "1")
      window.dispatchEvent(new Event("trackdash:pwa-installed"))
    }

    const clearConsumedPrompt = () => {
      deferredPrompt.current = null
      window.__trackdashInstallPrompt = null
      setInstallReady(false)
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
          else clearConsumedPrompt()
          return
        } catch {
          clearConsumedPrompt()
        }
      }

      if (isIOS()) {
        setInstructionsOpen(true)
        return
      }

      const browser = detectBrowser()
      if (isMacOS() && browser === "safari") {
        setMacSafariOpen(true)
        return
      }

      if (supportsDeferredInstallPrompt(browser)) {
        setWaitingBrowser(browser)
        setWaitingAndroid(isAndroid())
        setWaitingOpen(true)
        return
      }

      showManualInstructions()
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall)
    window.addEventListener("appinstalled", onInstalled)
    window.addEventListener("trackdash:pwa-request-install", onRequest)

    if (isStandalone()) {
      onInstalled()
    } else {
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

  const requestInstallAgain = () => {
    window.dispatchEvent(new Event("trackdash:pwa-request-install"))
  }

  const waitingCopy = (() => {
    if (waitingAndroid) {
      return {
        title: it ? "Preparazione installazione" : "Preparing installation",
        description: installReady
          ? it
            ? "TrackDash è pronta per essere installata come app sul telefono."
            : "TrackDash is ready to be installed as an app on your phone."
          : it
            ? "Chrome abilita il prompt PWA solo dopo un minimo di utilizzo della pagina. Il primo tocco è già contato: lascia TrackDash aperta per qualche secondo e il pulsante qui sotto si attiverà automaticamente."
            : "Chrome enables the PWA prompt only after a small amount of page engagement. Your first tap already counts: keep TrackDash open for a short while and the button below will enable automatically.",
        note: it
          ? "Se dopo circa un minuto non diventa disponibile, aggiorna una volta la pagina oppure usa ⋮ → Installa app. Non serve creare una semplice scorciatoia."
          : "If it is still unavailable after about a minute, reload the page once or use ⋮ → Install app. You do not need to create a plain shortcut.",
      }
    }

    return {
      title: it ? "Preparazione installazione" : "Preparing installation",
      description: installReady
        ? it
          ? "Il browser ha reso disponibile il vero prompt di installazione di TrackDash."
          : "The browser has made TrackDash's native install prompt available."
        : it
          ? "Il browser non ha ancora reso disponibile il prompt PWA. Lascialo aperto per qualche secondo: appena diventa disponibile, potrai installare TrackDash da qui."
          : "The browser has not exposed the PWA prompt yet. Keep this open for a short while: as soon as it becomes available, you can install TrackDash from here.",
      note: it
        ? "In alternativa puoi usare il comando Installa app dal menu del browser quando compare."
        : "You can also use the browser's Install app command when it appears.",
    }
  })()

  const manualCopy = (() => {
    if (fallbackAndroid && fallbackBrowser === "firefox") {
      return {
        description: it
          ? "Firefox su Android può aggiungere TrackDash alla schermata Home, ma non offre la stessa installazione WebAPK di Chrome. Per avere TrackDash come vera app standalone usa Chrome o Samsung Internet."
          : "Firefox on Android can add TrackDash to the Home screen, but it does not provide the same WebAPK installation as Chrome. For the full standalone app experience, use Chrome or Samsung Internet.",
        first: it ? "Apri TrackDash in Chrome" : "Open TrackDash in Chrome",
        second: it ? "Usa Installa TrackDash o la voce “Installa app” di Chrome" : "Use Install TrackDash or Chrome's Install app option",
        note: it ? "Evita una semplice scorciatoia se mantiene la barra URL." : "Avoid a plain shortcut if it keeps the address bar.",
      }
    }

    return {
      description: it
        ? "Questo browser non espone un prompt di installazione richiamabile direttamente dal sito. Puoi comunque installare TrackDash usando il comando del browser."
        : "This browser does not expose an install prompt that the site can trigger directly. You can still install TrackDash using the browser command.",
      first: it ? "Apri il menu del browser" : "Open the browser menu",
      second: it ? "Cerca “Installa app”, “Aggiungi alla Home” o una voce equivalente" : "Look for Install app, Add to Home Screen, or an equivalent option",
      note: it ? "Una vera installazione deve aprire TrackDash come app standalone." : "A real installation should open TrackDash as a standalone app.",
    }
  })()

  return (
    <>
      <Dialog open={alreadyInstalledOpen} onOpenChange={setAlreadyInstalledOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Download className="size-4" />{it ? "TrackDash è già installata" : "TrackDash is already installed"}</DialogTitle>
            <DialogDescription>{it ? "Il dispositivo vede già TrackDash come app installata e per questo non propone un secondo prompt." : "This device already sees TrackDash as an installed app, so it will not offer a second install prompt."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-1 text-sm">
            <div className="flex items-start gap-3 rounded-lg border p-3"><Search className="mt-0.5 size-4 shrink-0 text-brand" /><div><p className="font-medium">1. {it ? "Cerca TrackDash tra tutte le app del dispositivo" : "Find TrackDash in your device's app list"}</p><p className="text-xs text-muted-foreground">{it ? "Su Android puoi anche andare in Impostazioni → App e cercare TrackDash." : "On Android you can also open Settings → Apps and look for TrackDash."}</p></div></div>
            <div className="flex items-start gap-3 rounded-lg border p-3"><SquarePlus className="mt-0.5 size-4 shrink-0 text-brand" /><div><p className="font-medium">2. {it ? "Aprila oppure rimetti la sua icona nella Home" : "Open it or add its icon back to the Home screen"}</p><p className="text-xs text-muted-foreground">{it ? "L'app standalone si apre senza la normale barra URL del browser." : "The standalone app opens without the browser's normal address bar."}</p></div></div>
          </div>
          <DialogFooter><DialogClose render={<Button>{it ? "Ho capito" : "Got it"}</Button>} /></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={waitingOpen} onOpenChange={setWaitingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Download className="size-4" />{waitingCopy.title}</DialogTitle>
            <DialogDescription>{waitingCopy.description}</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border p-3 text-sm">
            <div className="flex items-start gap-3">
              <span className={`mt-1.5 size-2 shrink-0 rounded-full ${installReady ? "bg-emerald-500" : "animate-pulse bg-brand"}`} />
              <div>
                <p className="font-medium">
                  {installReady
                    ? it ? "Installazione pronta" : "Installation ready"
                    : it ? "In attesa del browser…" : "Waiting for the browser…"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{waitingCopy.note}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">{it ? "Chiudi" : "Close"}</Button>} />
            <Button onClick={requestInstallAgain} disabled={!installReady}>
              {installReady ? (it ? "Installa ora" : "Install now") : (it ? "Non ancora disponibile" : "Not ready yet")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={instructionsOpen} onOpenChange={setInstructionsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Download className="size-4" />{it ? "Installa TrackDash" : "Install TrackDash"}</DialogTitle>
            <DialogDescription>{it ? "Su iPhone e iPad l'installazione passa da Safari e dal menu Condividi." : "On iPhone and iPad, installation uses Safari and the Share menu."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-1 text-sm">
            <div className="flex items-start gap-3 rounded-lg border p-3"><Share className="mt-0.5 size-4 shrink-0 text-brand" /><div><p className="font-medium">1. {it ? "Apri TrackDash in Safari e tocca Condividi" : "Open TrackDash in Safari and tap Share"}</p><p className="text-xs text-muted-foreground">{it ? "Se sei in Chrome o Edge su iPhone/iPad, apri prima questa pagina in Safari." : "If you are using Chrome or Edge on iPhone/iPad, open this page in Safari first."}</p></div></div>
            <div className="flex items-start gap-3 rounded-lg border p-3"><SquarePlus className="mt-0.5 size-4 shrink-0 text-brand" /><div><p className="font-medium">2. {it ? "Aggiungi alla schermata Home" : "Add to Home Screen"}</p><p className="text-xs text-muted-foreground">{it ? "Conferma e TrackDash si aprirà come un'app." : "Confirm and TrackDash will open like an app."}</p></div></div>
          </div>
          <DialogFooter><DialogClose render={<Button>{it ? "Ho capito" : "Got it"}</Button>} /></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={macSafariOpen} onOpenChange={setMacSafariOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Download className="size-4" />{it ? "Installa TrackDash su Mac" : "Install TrackDash on Mac"}</DialogTitle>
            <DialogDescription>{it ? "Safari su macOS non espone il prompt automatico usato da Chrome. Da macOS Sonoma in poi puoi creare una vera web app direttamente da Safari." : "Safari on macOS does not expose Chrome's automatic install prompt. On macOS Sonoma or later you can create a real web app directly from Safari."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-1 text-sm">
            <div className="flex items-start gap-3 rounded-lg border p-3"><EllipsisVertical className="mt-0.5 size-4 shrink-0 text-brand" /><p className="font-medium">1. {it ? "In Safari scegli File → Aggiungi al Dock" : "In Safari choose File → Add to Dock"}</p></div>
            <div className="flex items-start gap-3 rounded-lg border p-3"><SquarePlus className="mt-0.5 size-4 shrink-0 text-brand" /><div><p className="font-medium">2. {it ? "Conferma “Aggiungi”" : "Confirm Add"}</p><p className="mt-1 text-xs text-muted-foreground">{it ? "TrackDash comparirà nel Dock e nella cartella Applicazioni come web app separata da Safari." : "TrackDash will appear in the Dock and Applications folder as a web app separate from Safari."}</p></div></div>
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
