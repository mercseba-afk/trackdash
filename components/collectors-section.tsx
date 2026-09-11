"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Handshake, Loader2, MessageCircle, Users } from "lucide-react"
import { getReleaseCollectorsAction } from "@/lib/actions/sharing"
import { createConversationRequestAction } from "@/lib/actions/messaging"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import { formatMoney } from "@/lib/format"
import type { Currency } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

type CollectorRow = Awaited<ReturnType<typeof getReleaseCollectorsAction>>[number]

type PublicAsk = { price: number; currency: Currency }

function conditionLabel(value: string, it: boolean): string {
  if (!it) return value
  const labels: Record<string, string> = {
    Sealed: "Sigillato",
    "New / Opened": "Nuovo / Aperto",
    Built: "Montato",
    Used: "Usato",
    Incomplete: "Incompleto",
  }
  return labels[value] ?? value
}

function compactAsk(asks: PublicAsk[]): PublicAsk | null {
  if (asks.length === 0) return null
  const currencies = new Set(asks.map((ask) => ask.currency))
  if (currencies.size !== 1) return null
  return asks.reduce((lowest, current) => current.price < lowest.price ? current : lowest)
}

export function CollectorsSection({ releaseId }: { releaseId: string }) {
  const { user } = useStore()
  const { locale } = useI18n()
  const it = locale === "it"
  const router = useRouter()
  const [rows, setRows] = React.useState<CollectorRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [requestTarget, setRequestTarget] = React.useState<{ username: string; shareId: string } | null>(null)
  const [requestText, setRequestText] = React.useState("")
  const [sending, setSending] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)

    getReleaseCollectorsAction(releaseId)
      .then((result) => {
        if (!cancelled) setRows(result)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [releaseId])

  const collectors = React.useMemo(() => {
    const grouped = new Map<
      string,
      CollectorRow & { copies: number; conditions: Set<string>; openToOffers: boolean; openShareId?: string; asks: PublicAsk[] }
    >()

    for (const row of rows) {
      const publicAsk = row.shareMode === "open_to_offers" && row.askingPrice != null && row.askingCurrency
        ? { price: row.askingPrice, currency: row.askingCurrency }
        : null
      const existing = grouped.get(row.userId)
      if (existing) {
        existing.copies += 1
        existing.conditions.add(row.condition)
        existing.openToOffers ||= row.shareMode === "open_to_offers"
        if (!existing.openShareId && row.shareMode === "open_to_offers") existing.openShareId = row.id
        if (publicAsk) existing.asks.push(publicAsk)
      } else {
        grouped.set(row.userId, {
          ...row,
          copies: 1,
          conditions: new Set([row.condition]),
          openToOffers: row.shareMode === "open_to_offers",
          openShareId: row.shareMode === "open_to_offers" ? row.id : undefined,
          asks: publicAsk ? [publicAsk] : [],
        })
      }
    }

    return [...grouped.values()].sort((a, b) => Number(b.openToOffers) - Number(a.openToOffers))
  }, [rows])

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4 text-muted-foreground" />
            {it ? "Collezionisti" : "Collectors"}
            {!loading ? <Badge variant="secondary">{collectors.length}</Badge> : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> {it ? "Caricamento collezionisti…" : "Loading shared collectors…"}
            </div>
          ) : !user ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              {it
                ? "Accedi per vedere i collezionisti che hanno condiviso questa release e contattare chi accetta offerte."
                : "Sign in to see collectors who shared this release and contact owners who are open to offers."}
            </div>
          ) : collectors.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              {it
                ? "Nessun collezionista ha ancora condiviso questa release. I modelli restano privati finché il proprietario non decide esplicitamente di condividerli."
                : "No collector has shared this release yet. Collection items stay private unless their owner explicitly shares them."}
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {collectors.map((collector) => {
                const asking = compactAsk(collector.asks)
                return (
                  <div
                    key={collector.userId}
                    className="flex items-center gap-2 rounded-lg border bg-background p-3 transition-colors hover:border-brand/40 hover:bg-muted/30"
                  >
                    <Link
                      href={`/collectors/${encodeURIComponent(collector.username)}`}
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted font-semibold uppercase">
                        {collector.username.slice(0, 1)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate text-sm font-medium">
                            {collector.username}{collector.userId === user.id ? (it ? " (tu)" : " (you)") : ""}
                          </span>
                          {collector.openToOffers ? (
                            <Badge variant="secondary" className="gap-1 bg-brand/15 text-brand">
                              <Handshake className="size-3" /> {it ? "Accetta offerte" : "Open to offers"}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {[...collector.conditions].map((condition) => conditionLabel(condition, it)).join(" / ")}
                          {collector.copies > 1 ? ` · ${collector.copies} ${it ? "copie condivise" : "shared copies"}` : ""}
                          {collector.country ? ` · ${collector.country}` : ""}
                        </p>
                        {asking ? <p className="mt-0.5 text-xs font-medium text-brand">{it ? "Richiesta" : "Asking"} {formatMoney(asking.price, asking.currency)}</p> : null}
                      </div>
                    </Link>
                    {collector.userId !== user.id && collector.openShareId ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 gap-1"
                        onClick={() => {
                          setRequestTarget({ username: collector.username, shareId: collector.openShareId! })
                          setRequestText("")
                        }}
                      >
                        <MessageCircle className="size-3.5" /> {it ? "Messaggio" : "Message"}
                      </Button>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(requestTarget)} onOpenChange={(open) => !open && setRequestTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{it ? "Contatta" : "Contact"} {requestTarget?.username}</DialogTitle>
            <DialogDescription>
              {it
                ? "Invia una richiesta iniziale per questa release esatta. Il collezionista dovrà accettarla prima che si apra la chat."
                : "Send an initial request about this exact release. The collector must accept before a chat opens."}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={requestText}
            maxLength={1000}
            placeholder={it ? "Ciao, ho visto che accetti offerte per questa release…" : "Hi, I saw you're open to offers for this release…"}
            onChange={(event) => setRequestText(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">{requestText.trim().length}/1000</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestTarget(null)} disabled={sending}>{it ? "Annulla" : "Cancel"}</Button>
            <Button
              disabled={sending || !requestText.trim() || !requestTarget}
              onClick={async () => {
                if (!requestTarget) return
                setSending(true)
                try {
                  const conversation = await createConversationRequestAction(requestTarget.shareId, requestText)
                  toast.success(it ? "Richiesta inviata" : "Request sent")
                  setRequestTarget(null)
                  router.push(`/messages?conversation=${conversation.id}`)
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : it ? "Impossibile inviare la richiesta" : "Couldn't send request")
                } finally {
                  setSending(false)
                }
              }}
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
              {it ? "Invia richiesta" : "Send request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
