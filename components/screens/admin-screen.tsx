"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Activity,
  Boxes,
  CalendarPlus,
  ChartNoAxesColumnIncreasing,
  CreditCard,
  Handshake,
  MessageCircle,
  ShieldCheck,
  Trash2,
  UserRoundCog,
  Users,
} from "lucide-react"
import { deleteAdminUserAction, updateAdminUserAction } from "@/lib/actions/admin"
import type { AdminDashboardData, AdminUserRow } from "@/lib/admin/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

function fmtDate(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

function planBadge(user: AdminUserRow) {
  if (user.plan === "free") return <Badge variant="secondary">Free</Badge>
  const healthy = user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing"
  return <Badge variant={healthy ? "default" : "secondary"}>Pro · {user.subscriptionStatus}</Badge>
}

function paymentLabel(user: AdminUserRow) {
  if (user.plan === "free") return "Non applicabile"
  const labels: Record<string, string> = {
    pending: "In attesa",
    paid: "Regolare",
    failed: "Pagamento fallito",
    refunded: "Rimborsato",
    not_applicable: "Non applicabile",
  }
  return labels[user.paymentStatus] ?? user.paymentStatus
}

function AdminMetric({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string
  value: string | number
  note?: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card className="border-border/70">
      <CardContent className="flex items-start justify-between gap-3 pt-5">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
          {note ? <p className="mt-1 text-[11px] text-muted-foreground">{note}</p> : null}
        </div>
        <span className="grid size-9 place-items-center rounded-xl bg-brand/10 text-brand">
          <Icon className="size-4" />
        </span>
      </CardContent>
    </Card>
  )
}

function UserEditor({
  user,
  onSaved,
  onDeleted,
}: {
  user: AdminUserRow
  onSaved: () => void
  onDeleted: () => void
}) {
  const [draft, setDraft] = React.useState(user)
  const [saving, startSaving] = React.useTransition()
  const [deleting, startDeleting] = React.useTransition()

  React.useEffect(() => setDraft(user), [user])

  function save() {
    startSaving(async () => {
      try {
        await updateAdminUserAction({
          userId: draft.id,
          email: draft.email,
          username: draft.username,
          country: draft.country,
          plan: draft.plan,
          subscriptionStatus: draft.subscriptionStatus,
          billingProvider: draft.billingProvider,
          paymentStatus: draft.paymentStatus,
          adminNotes: draft.adminNotes,
        })
        toast.success("Account aggiornato")
        onSaved()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Aggiornamento non riuscito")
      }
    })
  }

  function remove() {
    if (user.isAdmin) return
    const confirmed = window.confirm(
      "Eliminare definitivamente l'account " + user.email + "? Verranno rimossi anche i dati collegati all'account.",
    )
    if (!confirmed) return

    startDeleting(async () => {
      try {
        await deleteAdminUserAction(user.id)
        toast.success("Account eliminato")
        onDeleted()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Eliminazione non riuscita")
      }
    })
  }

  const pro = draft.plan === "pro"

  return (
    <details className="group rounded-xl border border-border/70 bg-background">
      <summary className="flex cursor-pointer list-none flex-col gap-3 p-4 marker:hidden sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium">{user.username}</p>
            {user.isAdmin ? <Badge className="gap-1"><ShieldCheck className="size-3" /> Admin</Badge> : null}
            {planBadge(user)}
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-1 text-xs text-muted-foreground sm:flex sm:items-center">
          <span><strong className="font-medium text-foreground">{user.collectionCount}</strong> pezzi</span>
          <span>Ultimo accesso {fmtDate(user.lastSignInAt)}</span>
        </div>
      </summary>

      <div className="border-t border-border/70 p-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="grid gap-1.5 text-xs font-medium">
            Email
            <Input
              type="email"
              disabled={user.isAdmin}
              value={draft.email}
              onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
            />
          </label>
          <label className="grid gap-1.5 text-xs font-medium">
            Username
            <Input
              value={draft.username}
              onChange={(event) => setDraft((current) => ({ ...current, username: event.target.value }))}
            />
          </label>
          <label className="grid gap-1.5 text-xs font-medium">
            Paese
            <Input
              value={draft.country}
              onChange={(event) => setDraft((current) => ({ ...current, country: event.target.value }))}
              placeholder="Non impostato"
            />
          </label>
          <label className="grid gap-1.5 text-xs font-medium">
            Piano
            <select
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={draft.plan}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  plan: event.target.value as AdminUserRow["plan"],
                  ...(event.target.value === "free"
                    ? { subscriptionStatus: "inactive", billingProvider: "none", paymentStatus: "not_applicable" }
                    : {}),
                }))
              }
            >
              <option value="free">Free</option>
              <option value="pro">Pro</option>
            </select>
          </label>

          <label className="grid gap-1.5 text-xs font-medium">
            Stato abbonamento
            <select
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none disabled:opacity-50"
              disabled={!pro}
              value={draft.subscriptionStatus}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  subscriptionStatus: event.target.value as AdminUserRow["subscriptionStatus"],
                }))
              }
            >
              <option value="inactive">Inattivo</option>
              <option value="trialing">Trial</option>
              <option value="active">Attivo</option>
              <option value="past_due">Pagamento scaduto</option>
              <option value="canceled">Cancellato</option>
            </select>
          </label>

          <label className="grid gap-1.5 text-xs font-medium">
            Provider billing
            <select
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none disabled:opacity-50"
              disabled={!pro}
              value={draft.billingProvider}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  billingProvider: event.target.value as AdminUserRow["billingProvider"],
                }))
              }
            >
              <option value="none">Nessuno</option>
              <option value="manual">Manuale</option>
              <option value="stripe">Stripe</option>
              <option value="app_store">App Store</option>
              <option value="play_store">Google Play</option>
            </select>
          </label>

          <label className="grid gap-1.5 text-xs font-medium">
            Stato pagamento
            <select
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none disabled:opacity-50"
              disabled={!pro}
              value={draft.paymentStatus}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  paymentStatus: event.target.value as AdminUserRow["paymentStatus"],
                }))
              }
            >
              <option value="not_applicable">Non applicabile</option>
              <option value="pending">In attesa</option>
              <option value="paid">Regolare / pagato</option>
              <option value="failed">Pagamento fallito</option>
              <option value="refunded">Rimborsato</option>
            </select>
          </label>

          <div className="rounded-lg bg-muted/45 p-3 text-xs text-muted-foreground">
            <p>Registrato: <span className="font-medium text-foreground">{fmtDate(user.createdAt)}</span></p>
            <p className="mt-1">Ultimo pagamento: <span className="font-medium text-foreground">{fmtDate(user.lastPaymentAt)}</span></p>
            <p className="mt-1">Prossimo pagamento: <span className="font-medium text-foreground">{fmtDate(user.nextPaymentAt)}</span></p>
          </div>

          <label className="grid gap-1.5 text-xs font-medium lg:col-span-2">
            Note amministrative
            <textarea
              className="min-h-20 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={draft.adminNotes}
              maxLength={2000}
              onChange={(event) => setDraft((current) => ({ ...current, adminNotes: event.target.value }))}
              placeholder="Note interne, non visibili all'utente"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
          <p className="text-xs text-muted-foreground">
            Pagamento: <span className="font-medium text-foreground">{paymentLabel(draft)}</span>
          </p>
          <div className="flex gap-2">
            {!user.isAdmin ? (
              <Button variant="outline" onClick={remove} disabled={saving || deleting}>
                <Trash2 data-icon="inline-start" />
                {deleting ? "Eliminazione…" : "Elimina account"}
              </Button>
            ) : null}
            <Button onClick={save} disabled={saving || deleting}>
              <UserRoundCog data-icon="inline-start" />
              {saving ? "Salvataggio…" : "Salva modifiche"}
            </Button>
          </div>
        </div>
      </div>
    </details>
  )
}

export function AdminScreen({ initialData }: { initialData: AdminDashboardData }) {
  const router = useRouter()
  const [data, setData] = React.useState(initialData)
  const [query, setQuery] = React.useState("")

  React.useEffect(() => setData(initialData), [initialData])

  const filteredUsers = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return data.users
    return data.users.filter((user) =>
      [user.email, user.username, user.country, user.plan, user.subscriptionStatus]
        .join(" ")
        .toLowerCase()
        .includes(q),
    )
  }, [data.users, query])

  const maxTraffic = Math.max(1, ...data.dailyTraffic.map((row) => row.pageViews))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-brand" />
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Area riservata</p>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Admin TrackDash</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Account, utilizzo della piattaforma e predisposizione Free/Pro in un unico punto.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Aggiornato {fmtDate(data.generatedAt)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <AdminMetric label="Account" value={data.stats.totalAccounts} note={data.stats.new30d + " nuovi / 30 gg"} icon={Users} />
        <AdminMetric label="Attivi 7 gg" value={data.stats.active7d} note={data.stats.active30d + " attivi / 30 gg"} icon={Activity} />
        <AdminMetric label="Nuovi 7 gg" value={data.stats.new7d} note="registrazioni recenti" icon={CalendarPlus} />
        <AdminMetric label="Collezionisti" value={data.stats.collectorsWithItems} note={data.stats.collectionPieces + " pezzi totali"} icon={Boxes} />
        <AdminMetric label="Page view 7 gg" value={data.stats.pageViews7d} note={data.stats.pageViews30d + " / 30 gg"} icon={ChartNoAxesColumnIncreasing} />
        <AdminMetric label="Pro attivi" value={data.stats.proActive} note="trial + attivi" icon={CreditCard} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Handshake className="size-4 text-brand" />
            Community e marketplace
          </CardTitle>
          <CardDescription>
            Comportamento reale degli utenti: conversazioni, messaggi, offerte, vendite dichiarate e vendite confermate da entrambe le parti.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <AdminMetric
            label="Messaggi"
            value={data.community.messagesTotal}
            note={data.community.messages7d + " ultimi 7 gg · " + data.community.messages30d + " ultimi 30 gg"}
            icon={MessageCircle}
          />
          <AdminMetric
            label="Conversazioni"
            value={data.community.conversationsTotal}
            note={data.community.conversationsAccepted + " accettate"}
            icon={MessageCircle}
          />
          <AdminMetric
            label="Offerte"
            value={data.community.offersTotal}
            note={data.community.offersAccepted + " accettate · " + data.community.offersOpen + " aperte"}
            icon={Handshake}
          />
          <AdminMetric
            label="Tasso accettazione"
            value={data.community.offerAcceptanceRate + "%"}
            note="offerte accettate / offerte totali"
            icon={Activity}
          />
          <AdminMetric
            label="Vendite dichiarate"
            value={data.community.salesReported}
            note={data.community.salesDisputed + " contestate"}
            icon={Handshake}
          />
          <AdminMetric
            label="Vendite confermate"
            value={data.community.salesConfirmed}
            note={data.community.saleConfirmationRate + "% delle vendite dichiarate"}
            icon={ShieldCheck}
          />
          <AdminMetric
            label="Passaggi proprietà"
            value={data.community.ownershipTransfers}
            note="copie trasferite tra Collection"
            icon={Boxes}
          />
          <div className="rounded-xl border border-dashed border-border/70 p-4 text-xs leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">Funnel vendita</p>
            <p className="mt-2">
              Offerta → accettazione → venditore segnala la vendita → compratore conferma → TrackDash trasferisce la copia nella Collection del compratore.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Utilizzo dell'app</CardTitle>
          <CardDescription>
            Page view aggregate, senza IP, user agent o cronologia associata al singolo account. Non sono visitatori unici; il conteggio parte dalla pubblicazione di questa funzione.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <div>
            <p className="mb-3 text-xs font-medium text-muted-foreground">Ultimi 14 giorni</p>
            <div className="flex h-36 items-end gap-1.5 rounded-xl border border-border/60 bg-muted/20 p-3">
              {data.dailyTraffic.map((row) => (
                <div key={row.day} className="group flex h-full min-w-0 flex-1 items-end">
                  <div
                    className="w-full rounded-t bg-brand/70 transition-colors group-hover:bg-brand"
                    style={{ height: Math.max(row.pageViews > 0 ? 6 : 1, (row.pageViews / maxTraffic) * 100) + "%" }}
                    title={row.day + ": " + row.pageViews + " visualizzazioni"}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
              <span>{data.dailyTraffic[0]?.day ?? "—"}</span>
              <span>{data.dailyTraffic.at(-1)?.day ?? "—"}</span>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-medium text-muted-foreground">Pagine più viste · 30 giorni</p>
            <div className="flex flex-col gap-2">
              {data.topRoutes.length === 0 ? (
                <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  I dati inizieranno a comparire dalle prossime visualizzazioni.
                </p>
              ) : data.topRoutes.map((route, index) => (
                <div key={route.path} className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2">
                  <span className="w-4 text-center font-mono text-[10px] text-muted-foreground">{index + 1}</span>
                  <code className="min-w-0 flex-1 truncate text-xs">{route.path}</code>
                  <strong className="text-xs tabular-nums">{route.pageViews}</strong>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="text-base">Account registrati</CardTitle>
            <CardDescription>
              Puoi modificare dati account e piano, oppure eliminare un account non amministratore.
            </CardDescription>
          </div>
          <Input
            className="w-full sm:max-w-xs"
            type="search"
            placeholder="Cerca email, username, piano…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">{data.users.filter((user) => user.plan === "free").length} Free</Badge>
            <Badge variant="secondary">{data.users.filter((user) => user.plan === "pro").length} Pro</Badge>
            <span className="self-center">{filteredUsers.length} account mostrati</span>
          </div>

          {filteredUsers.map((user) => (
            <UserEditor
              key={user.id}
              user={user}
              onSaved={() => router.refresh()}
              onDeleted={() => router.refresh()}
            />
          ))}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Free / Pro: predisposto</CardTitle>
          <CardDescription>
            Piano, stato abbonamento, provider, stato pagamento e date billing sono già modellati. Per ora nessun pagamento viene addebitato:
            quando sceglieremo provider, prezzi e regole Pro collegheremo il checkout a questa struttura senza rifare gli account.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
