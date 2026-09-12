"use client"

import * as React from "react"
import Link from "next/link"
import { HandCoins, Handshake, Loader2, Users } from "lucide-react"
import { getReleaseCollectorsAction } from "@/lib/actions/sharing"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import { formatMoney } from "@/lib/format"
import type { Currency } from "@/lib/types"
import { DirectOfferDialog } from "@/components/messaging/direct-offer-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type CollectorRow = Awaited<ReturnType<typeof getReleaseCollectorsAction>>[number]
type OfferTarget = { username: string; shareId: string; askingPrice: number | null; askingCurrency: Currency | null }

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

export function CollectorsSection({ releaseId }: { releaseId: string }) {
  const { user } = useStore()
  const { locale } = useI18n()
  const it = locale === "it"
  const [rows, setRows] = React.useState<CollectorRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [offerTarget, setOfferTarget] = React.useState<OfferTarget | null>(null)

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

  const sorted = React.useMemo(
    () => [...rows].sort((a, b) => Number(b.shareMode === "open_to_offers") - Number(a.shareMode === "open_to_offers")),
    [rows],
  )

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4 text-muted-foreground" />
            {it ? "Copie condivise" : "Shared copies"}
            {!loading ? <Badge variant="secondary">{sorted.length}</Badge> : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> {it ? "Caricamento copie…" : "Loading shared copies…"}
            </div>
          ) : !user ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              {it
                ? "Accedi per vedere le copie condivise e fare un'offerta a chi la accetta."
                : "Sign in to see shared copies and make an offer to owners who accept them."}
            </div>
          ) : sorted.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              {it
                ? "Nessun collezionista ha ancora condiviso questa Release. Le copie restano private finché il proprietario non decide esplicitamente di condividerle."
                : "No collector has shared this Release yet. Copies stay private until their owner explicitly shares them."}
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {sorted.map((copy) => {
                const asking = copy.shareMode === "open_to_offers" && copy.askingPrice != null && copy.askingCurrency
                  ? { price: copy.askingPrice, currency: copy.askingCurrency }
                  : null
                return (
                  <div
                    key={copy.id}
                    className="flex items-center gap-2 rounded-xl border bg-background p-3 transition-colors hover:border-brand/40 hover:bg-muted/30"
                  >
                    <Link
                      href={`/collectors/${encodeURIComponent(copy.username)}`}
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      {copy.photoUrl ? (
                        <img
                          src={copy.photoUrl}
                          alt={it ? `Foto della copia di ${copy.username}` : `${copy.username}'s copy`}
                          className="h-14 w-16 shrink-0 rounded-lg border bg-muted object-cover"
                        />
                      ) : (
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted font-semibold uppercase">
                          {copy.username.slice(0, 1)}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate text-sm font-medium">
                            {copy.username}{copy.userId === user.id ? (it ? " (tu)" : " (you)") : ""}
                          </span>
                          {copy.shareMode === "open_to_offers" ? (
                            <Badge variant="secondary" className="gap-1 bg-brand/15 text-brand">
                              <Handshake className="size-3" /> {it ? "Accetta offerte" : "Open to offers"}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {conditionLabel(copy.condition, it)}{copy.country ? ` · ${copy.country}` : ""}
                        </p>
                        {copy.photoUrl ? <p className="mt-0.5 text-[10px] text-muted-foreground">{it ? "Foto reale della copia" : "Real copy photo"}</p> : null}
                        {asking ? <p className="mt-1 text-sm font-semibold text-brand">{it ? "Richiesta" : "Asking"} {formatMoney(asking.price, asking.currency)}</p> : null}
                      </div>
                    </Link>
                    {copy.userId !== user.id && copy.shareMode === "open_to_offers" ? (
                      <Button
                        size="sm"
                        className="shrink-0 gap-1.5"
                        onClick={() => setOfferTarget({
                          username: copy.username,
                          shareId: copy.id,
                          askingPrice: asking?.price ?? null,
                          askingCurrency: asking?.currency ?? null,
                        })}
                      >
                        <HandCoins className="size-3.5" /> {it ? "Offerta" : "Offer"}
                      </Button>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <DirectOfferDialog
        target={offerTarget}
        locale={it ? "it" : "en"}
        onOpenChange={(open) => { if (!open) setOfferTarget(null) }}
      />
    </>
  )
}
