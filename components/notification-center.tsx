"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  CheckCheck,
  CircleCheckBig,
  HandCoins,
  LifeBuoy,
  Loader2,
  Megaphone,
  ReceiptText,
  RefreshCw,
} from "lucide-react"
import {
  getNotificationsAction,
  getUnreadNotificationCountAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
  type AppNotification,
} from "@/lib/actions/notifications"
import { createClient } from "@/lib/supabase/client"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const CURRENT_BUILD_VERSION = process.env.NEXT_PUBLIC_TRACKDASH_BUILD_SHA ?? "development"
const UPDATE_POLL_MS = 60_000
const UPDATE_PENDING_KEY = "trackdash.update.pendingVersion"
const UPDATE_READ_KEY = "trackdash.update.readVersion"

function getSessionBuildVersion() {
  if (typeof window === "undefined") return CURRENT_BUILD_VERSION
  const runtimeWindow = window as Window & { __trackdashSessionBuildVersion?: string }
  runtimeWindow.__trackdashSessionBuildVersion ??= CURRENT_BUILD_VERSION
  return runtimeWindow.__trackdashSessionBuildVersion
}

function asText(value: unknown): string | null {
  return typeof value === "string" ? value : null
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function money(metadata: Record<string, unknown>): string | null {
  const amount = asNumber(metadata.amount) ?? asNumber(metadata.itemPrice)
  const currency = asText(metadata.currency)
  if (amount == null || !currency) return null
  try {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

function copyFor(notification: AppNotification, it: boolean) {
  const amount = money(notification.metadata)
  const subject = asText(notification.metadata.subject)
  const status = asText(notification.metadata.status)

  switch (notification.type) {
    case "marketplace_offer_received":
      return {
        title: it ? "Nuova offerta" : "New offer",
        body: amount ? (it ? `Hai ricevuto un'offerta di ${amount}.` : `You received an offer of ${amount}.`) : (it ? "Hai ricevuto una nuova offerta." : "You received a new offer."),
        icon: HandCoins,
      }
    case "marketplace_counteroffer_received":
      return {
        title: it ? "Controproposta" : "Counteroffer",
        body: amount ? (it ? `Nuova controproposta: ${amount}.` : `New counteroffer: ${amount}.`) : (it ? "Hai ricevuto una controproposta." : "You received a counteroffer."),
        icon: HandCoins,
      }
    case "marketplace_offer_accepted":
      return {
        title: it ? "Offerta accettata" : "Offer accepted",
        body: amount ? (it ? `L'offerta di ${amount} è stata accettata.` : `Your ${amount} offer was accepted.`) : (it ? "La tua offerta è stata accettata." : "Your offer was accepted."),
        icon: CircleCheckBig,
      }
    case "marketplace_sale_followup_due":
      return {
        title: it ? "Vendita da confermare" : "Sale to confirm",
        body: it ? "Conferma se lo scambio si è concluso, così TrackDash può chiudere correttamente il deal." : "Confirm whether the exchange was completed so TrackDash can close the deal correctly.",
        icon: ReceiptText,
      }
    case "marketplace_sale_confirmation_due":
      return {
        title: it ? "Conferma l'acquisto" : "Confirm purchase",
        body: amount ? (it ? `Il venditore ha registrato la vendita a ${amount}. Conferma o segnala un problema.` : `The seller reported the sale at ${amount}. Confirm it or report an issue.`) : (it ? "Il venditore ha registrato la vendita. Conferma o segnala un problema." : "The seller reported the sale. Confirm it or report an issue."),
        icon: ReceiptText,
      }
    case "marketplace_sale_confirmed":
      return {
        title: it ? "Vendita confermata" : "Sale confirmed",
        body: it ? "L'acquirente ha confermato la vendita e il trasferimento della copia è stato completato." : "The buyer confirmed the sale and the copy transfer is complete.",
        icon: CircleCheckBig,
      }
    case "support_status_changed":
      return {
        title: it ? "Aggiornamento assistenza" : "Support update",
        body: subject
          ? (it ? `“${subject}” è ora: ${status ?? "aggiornata"}.` : `“${subject}” is now: ${status ?? "updated"}.`)
          : (it ? "La tua richiesta di assistenza è stata aggiornata." : "Your support request was updated."),
        icon: LifeBuoy,
      }
    default:
      return {
        title: notification.title ?? (it ? "Aggiornamento TrackDash" : "TrackDash update"),
        body: notification.body ?? (it ? "C'è una novità per te." : "There is an update for you."),
        icon: Megaphone,
      }
  }
}

function NotificationRow({
  notification,
  it,
  onOpen,
}: {
  notification: AppNotification
  it: boolean
  onOpen: (notification: AppNotification) => void
}) {
  const copy = copyFor(notification, it)
  const Icon = copy.icon
  const date = new Date(notification.createdAt)

  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent",
        !notification.readAt && "bg-brand/5",
      )}
    >
      <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-full", notification.readAt ? "bg-muted text-muted-foreground" : "bg-brand/10 text-brand")}>
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{copy.title}</span>
          {!notification.readAt ? <span className="size-1.5 shrink-0 rounded-full bg-brand" /> : null}
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{copy.body}</span>
        <span className="mt-1 block text-[10px] text-muted-foreground">
          {date.toLocaleString(it ? "it-IT" : "en-US", { dateStyle: "short", timeStyle: "short" })}
        </span>
      </span>
    </button>
  )
}

function UpdateNotificationRow({
  it,
  read,
  onApply,
}: {
  it: boolean
  read: boolean
  onApply: () => void
}) {
  return (
    <button
      type="button"
      onClick={onApply}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent",
        !read && "bg-brand/5",
      )}
    >
      <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-full", read ? "bg-muted text-muted-foreground" : "bg-brand/10 text-brand")}>
        <RefreshCw className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{it ? "Nuovo aggiornamento disponibile" : "New update available"}</span>
          {!read ? <span className="size-1.5 shrink-0 rounded-full bg-brand" /> : null}
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
          {it ? "È disponibile una nuova versione di TrackDash." : "A new version of TrackDash is available."}
        </span>
        <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-brand">
          <RefreshCw className="size-3" /> {it ? "Aggiorna ora" : "Update now"}
        </span>
      </span>
    </button>
  )
}

export function NotificationCenter() {
  const { user } = useStore()
  const { locale } = useI18n()
  const it = locale === "it"
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [rows, setRows] = React.useState<AppNotification[]>([])
  const [unread, setUnread] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [availableVersion, setAvailableVersion] = React.useState<string | null>(null)
  const [updateRead, setUpdateRead] = React.useState(false)

  const refresh = React.useCallback(async () => {
    if (!user) {
      setRows([])
      setUnread(0)
      return
    }
    try {
      const [nextRows, nextUnread] = await Promise.all([
        getNotificationsAction(),
        getUnreadNotificationCountAction(),
      ])
      setRows(nextRows)
      setUnread(nextUnread)
    } catch {
      // The shell must stay usable if notifications are temporarily unavailable.
    }
  }, [user])

  const checkAppVersion = React.useCallback(async () => {
    const sessionBuildVersion = getSessionBuildVersion()
    if (sessionBuildVersion === "development") return

    const storedPendingVersion = localStorage.getItem(UPDATE_PENDING_KEY)
    if (storedPendingVersion) {
      setAvailableVersion(storedPendingVersion)
      setUpdateRead(localStorage.getItem(UPDATE_READ_KEY) === storedPendingVersion)
    }

    try {
      const response = await fetch(`/api/version?ts=${Date.now()}`, { cache: "no-store" })
      if (!response.ok) return
      const payload = await response.json() as { version?: unknown }
      const latestVersion = typeof payload.version === "string" ? payload.version : null
      if (!latestVersion || latestVersion === "development") return

      if (latestVersion !== sessionBuildVersion) {
        if (storedPendingVersion !== latestVersion) {
          localStorage.setItem(UPDATE_PENDING_KEY, latestVersion)
          localStorage.removeItem(UPDATE_READ_KEY)
          setUpdateRead(false)
        }
        setAvailableVersion(latestVersion)
        return
      }

      // If a pending update was already detected, keep it visible until the
      // user explicitly applies/acknowledges it. This survives route changes
      // and even a framework-triggered document refresh during a deployment.
      if (!storedPendingVersion) {
        setAvailableVersion(null)
        setUpdateRead(false)
      }
    } catch {
      // Update checks must never affect normal app usage.
    }
  }, [])

  React.useEffect(() => {
    void refresh()
    void checkAppVersion()
    if (!user) return

    const supabase = createClient()
    const channel = supabase
      .channel(`notification-center:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => void refresh(),
      )
      .subscribe()

    const onFocus = () => {
      void refresh()
      void checkAppVersion()
    }
    const interval = window.setInterval(() => void checkAppVersion(), UPDATE_POLL_MS)

    window.addEventListener("focus", onFocus)
    return () => {
      window.removeEventListener("focus", onFocus)
      window.clearInterval(interval)
      void supabase.removeChannel(channel)
    }
  }, [checkAppVersion, refresh, user])

  React.useEffect(() => {
    if (open) {
      setLoading(true)
      void Promise.all([refresh(), checkAppVersion()]).finally(() => setLoading(false))
    }
  }, [checkAppVersion, open, refresh])

  if (!user) return null

  const updateUnread = availableVersion && !updateRead ? 1 : 0
  const totalUnread = unread + updateUnread

  async function openNotification(notification: AppNotification) {
    if (!notification.readAt) {
      setRows((current) => current.map((row) => row.id === notification.id ? { ...row, readAt: new Date().toISOString() } : row))
      setUnread((current) => Math.max(0, current - 1))
      try { await markNotificationReadAction(notification.id) } catch { void refresh() }
    }
    setOpen(false)
    if (notification.href) router.push(notification.href)
  }

  async function applyAppUpdate() {
    setUpdateRead(true)
    setOpen(false)
    localStorage.removeItem(UPDATE_PENDING_KEY)
    localStorage.removeItem(UPDATE_READ_KEY)
    try {
      const registration = await navigator.serviceWorker?.getRegistration()
      await registration?.update()
    } catch {
      // A hard reload below is enough even if the service-worker update check fails.
    }
    window.location.reload()
  }

  async function markAll() {
    const now = new Date().toISOString()
    setRows((current) => current.map((row) => ({ ...row, readAt: row.readAt ?? now })))
    setUnread(0)
    setUpdateRead(true)
    if (availableVersion) localStorage.setItem(UPDATE_READ_KEY, availableVersion)
    try { await markAllNotificationsReadAction() } catch { void refresh() }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" className="relative mr-2" aria-label={it ? "Notifiche" : "Notifications"} />
        }
      >
        <Bell />
        {totalUnread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-semibold leading-none text-white shadow-sm">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[calc(100vw-2rem)] max-w-96 gap-0 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <div>
            <p className="text-sm font-semibold">{it ? "Notifiche" : "Notifications"}</p>
            <p className="text-[11px] text-muted-foreground">{it ? "Solo eventi che richiedono attenzione." : "Only events that need your attention."}</p>
          </div>
          {totalUnread > 0 ? (
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-xs" onClick={() => void markAll()}>
              <CheckCheck className="size-3.5" /> {it ? "Segna tutte" : "Mark all"}
            </Button>
          ) : null}
        </div>
        <div className="max-h-[min(65vh,32rem)] overflow-y-auto p-1.5">
          {loading && rows.length === 0 && !availableVersion ? (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground"><Loader2 className="size-4 animate-spin" />{it ? "Caricamento…" : "Loading…"}</div>
          ) : rows.length === 0 && !availableVersion ? (
            <div className="px-4 py-8 text-center"><Bell className="mx-auto mb-2 size-5 text-muted-foreground" /><p className="text-sm font-medium">{it ? "Tutto tranquillo" : "All quiet"}</p><p className="mt-1 text-xs text-muted-foreground">{it ? "Le offerte e gli aggiornamenti importanti compariranno qui." : "Offers and important updates will appear here."}</p></div>
          ) : (
            <>
              {availableVersion ? <UpdateNotificationRow it={it} read={updateRead} onApply={() => void applyAppUpdate()} /> : null}
              {rows.map((notification) => (
                <NotificationRow key={notification.id} notification={notification} it={it} onOpen={(row) => void openNotification(row)} />
              ))}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
