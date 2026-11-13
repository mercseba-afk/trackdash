"use client"

import { useEffect, useState } from "react"
import { Switch } from "@/components/ui/switch"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { registerPushPilot, sendPushPilot, unregisterPushPilot } from "@/lib/actions/push-pilot"

export function PushPilot({ publicKey, onboarding = false }: { publicKey: string; onboarding?: boolean }) {
  const { locale } = useI18n()
  const it = locale === "it"
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>()
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState("")
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    if (!("serviceWorker" in navigator && "PushManager" in window && "Notification" in window)) {
      setSupported(false)
      return
    }
    void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then(() => navigator.serviceWorker.ready)
      .then(async (ready) => {
        const current = await ready.pushManager.getSubscription()
        setSubscription(current)
        if (current && !await registerPushPilot(current.toJSON() as Parameters<typeof registerPushPilot>[0])) {
          setMessage("Avvisi automatici non attivati. Ricarica la pagina per riprovare.")
        }
        setRegistration(ready)
      })
      .catch(() => setMessage("Impossibile inizializzare le notifiche. Ricarica la pagina."))
  }, [])

  async function run(action: () => Promise<void>) {
    setPending(true)
    setMessage("")
    try {
      await action()
    } catch {
      setMessage("Controlla il permesso per le notifiche nelle impostazioni del dispositivo e riprova.")
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="mx-auto my-6 max-w-2xl space-y-3 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold">{it ? "Notifiche push" : "Push notifications"}</h2>
          <p className="text-sm text-muted-foreground">
            {supported
              ? (it ? "Ricevi offerte e novità del catalogo su questo dispositivo." : "Get offers and catalog updates on this device.")
              : (it ? "Su iPhone e iPad, aggiungi TrackDash alla schermata Home e aprilo da lì." : "On iPhone and iPad, add TrackDash to the Home Screen and open it there.")}
          </p>
        </div>
        {supported && <Switch aria-label={it ? "Notifiche push su questo dispositivo" : "Push notifications on this device"}
          checked={Boolean(subscription)} disabled={pending || !registration}
          onCheckedChange={(enabled) => void run(async () => {
            if (enabled && registration) {
              const base64 = publicKey.replace(/-/g, "+").replace(/_/g, "/")
              const applicationServerKey = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
              const current = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })
              if (!await registerPushPilot(current.toJSON() as Parameters<typeof registerPushPilot>[0])) {
                await current.unsubscribe()
                throw new Error("Subscription registration failed")
              }
              setSubscription(current)
            } else if (subscription) {
              const removed = await unregisterPushPilot(subscription.endpoint)
              const unsubscribed = await subscription.unsubscribe()
              if (!removed && !unsubscribed) throw new Error("Could not unsubscribe")
              setSubscription(null)
            }
          })} />}
      </div>
      {!onboarding && subscription && (
        <Button variant="outline" disabled={pending} onClick={() => void run(async () => {
          const result = await sendPushPilot(subscription.toJSON() as Parameters<typeof sendPushPilot>[0])
          if (result === "expired") {
            await unregisterPushPilot(subscription.endpoint)
            await subscription.unsubscribe()
            setSubscription(null)
          }
          setMessage(result === "sent"
            ? (it ? "Test inviato al servizio push." : "Test sent to the push service.")
            : (it ? "Invio non riuscito. Controlla che le notifiche siano attive." : "Send failed. Check that notifications are enabled."))
        })}>{it ? "Invia una notifica di prova" : "Send a test notification"}</Button>
      )}
      {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
    </section>
  )
}
