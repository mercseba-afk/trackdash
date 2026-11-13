"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { registerPushPilot, sendPushPilot, unregisterPushPilot } from "@/lib/actions/push-pilot"

export function PushPilot({ publicKey }: { publicKey: string }) {
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
      <h2 className="font-semibold">Notifiche push · Prova</h2>
      {supported ? (
        <div className="flex flex-wrap gap-2">
          {subscription ? (
            <>
              <Button disabled={pending} onClick={() => void run(async () => {
                const result = await sendPushPilot(subscription.toJSON() as Parameters<typeof sendPushPilot>[0])
                if (result === "expired") {
                  await subscription.unsubscribe()
                  setSubscription(null)
                }
                setMessage(result === "sent" ? "Test inviato al servizio push."
                  : result === "expired" ? "Iscrizione scaduta. Attiva di nuovo le notifiche."
                  : "Invio non riuscito. Riprova tra poco.")
              })}>Invia una notifica di prova</Button>
              <Button variant="outline" disabled={pending} onClick={() => void run(async () => {
                const removed = await unregisterPushPilot(subscription.endpoint)
                const unsubscribed = await subscription.unsubscribe()
                if (!removed && !unsubscribed) throw new Error("Could not unsubscribe")
                setSubscription(null)
              })}>Disattiva su questo dispositivo</Button>
            </>
          ) : (
            <Button disabled={pending || !registration} onClick={() => void run(async () => {
              if (!registration) return
              const base64 = publicKey.replace(/-/g, "+").replace(/_/g, "/")
              const applicationServerKey = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
              const current = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })
              setSubscription(current)
              const registered = await registerPushPilot(current.toJSON() as Parameters<typeof registerPushPilot>[0])
              setMessage(registered ? "Avvisi automatici attivi su questo dispositivo." : "Ricarica la pagina per attivare gli avvisi automatici.")
            })}>Attiva notifiche push</Button>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Su iPhone e iPad, aggiungi TrackDash alla schermata Home e aprilo da lì.</p>
      )}
      {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
    </section>
  )
}
