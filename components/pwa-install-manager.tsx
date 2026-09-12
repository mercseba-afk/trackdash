"use client"

import * as React from "react"
import { Download, Share, SquarePlus } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type InstallChoice = { outcome: "accepted" | "dismissed"; platform: string }

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<InstallChoice>
}

declare global {
  interface WindowEventMap {
    "beforeinstallprompt": BeforeInstallPromptEvent
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

export function PwaInstallManager() {
  const { locale } = useI18n()
  const it = locale === "it"
  const deferredPrompt = React.useRef<BeforeInstallPromptEvent | null>(null)
  const [instructionsOpen, setInstructionsOpen] = React.useState(false)
  const [fallbackOpen, setFallbackOpen] = React.useState(false)

  React.useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {})
    }

    const onBeforeInstall = (event: BeforeInstallPromptEvent) => {
      event.preventDefault()
      deferredPrompt.current = event
      window.dispatchEvent(new Event("trackdash:pwa-available"))
    }

    const onInstalled = () => {
      deferredPrompt.current = null
      localStorage.setItem("trackdash.pwa.installed", "1")
      window.dispatchEvent(new Event("trackdash:pwa-installed"))
    }

    const onRequest = async () => {
      if (isStandalone()) {
        onInstalled()
        return
      }

      if (deferredPrompt.current) {
        const prompt = deferredPrompt.current
        await prompt.prompt()
        const choice = await prompt.userChoice
        if (choice.outcome === "accepted") onInstalled()
        deferredPrompt.current = null
        return
      }

      if (isIOS()) setInstructionsOpen(true)
      else setFallbackOpen(true)
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall)
    window.addEventListener("appinstalled", onInstalled)
    window.addEventListener("trackdash:pwa-request-install", onRequest)

    if (isStandalone()) onInstalled()

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall)
      window.removeEventListener("appinstalled", onInstalled)
      window.removeEventListener("trackdash:pwa-request-install", onRequest)
    }
  }, [])

  return (
    <>
      <Dialog open={instructionsOpen} onOpenChange={setInstructionsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Download className="size-4" />{it ? "Installa TrackDash" : "Install TrackDash"}</DialogTitle>
            <DialogDescription>{it ? "Su iPhone e iPad l'installazione passa dal menu Condividi di Safari." : "On iPhone and iPad, installation uses Safari's Share menu."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-1 text-sm">
            <div className="flex items-start gap-3 rounded-lg border p-3"><Share className="mt-0.5 size-4 shrink-0 text-brand" /><div><p className="font-medium">1. {it ? "Tocca Condividi" : "Tap Share"}</p><p className="text-xs text-muted-foreground">{it ? "Il pulsante con il quadrato e la freccia verso l'alto." : "The square button with the upward arrow."}</p></div></div>
            <div className="flex items-start gap-3 rounded-lg border p-3"><SquarePlus className="mt-0.5 size-4 shrink-0 text-brand" /><div><p className="font-medium">2. {it ? "Aggiungi alla schermata Home" : "Add to Home Screen"}</p><p className="text-xs text-muted-foreground">{it ? "Conferma e TrackDash si aprirà come un'app." : "Confirm and TrackDash will open like an app."}</p></div></div>
          </div>
          <DialogFooter><DialogClose render={<Button>{it ? "Ho capito" : "Got it"}</Button>} /></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={fallbackOpen} onOpenChange={setFallbackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{it ? "Installa TrackDash" : "Install TrackDash"}</DialogTitle>
            <DialogDescription>{it ? "Il browser non ha ancora reso disponibile il prompt automatico." : "The browser has not made the automatic install prompt available yet."}</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{it ? "Apri il menu del browser e scegli “Installa app” o “Aggiungi alla schermata Home”. Se l'opzione non compare, usa TrackDash ancora qualche volta e riprova." : "Open your browser menu and choose “Install app” or “Add to Home Screen”. If it is not available yet, use TrackDash a little longer and try again."}</p>
          <DialogFooter><DialogClose render={<Button>{it ? "Chiudi" : "Close"}</Button>} /></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
