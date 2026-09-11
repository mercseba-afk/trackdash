"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Boxes, Handshake, ImageIcon, Loader2, UserRound } from "lucide-react"
import { getSharedCollectionByUsernameAction } from "@/lib/actions/sharing"
import { useI18n } from "@/lib/i18n"
import { formatMoney } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

type SharedCollection = Awaited<ReturnType<typeof getSharedCollectionByUsernameAction>>

function conditionLabel(value: string, it: boolean) {
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

export function SharedCollectionScreen({ username }: { username: string }) {
  const { locale } = useI18n()
  const it = locale === "it"
  const [data, setData] = React.useState<SharedCollection>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)

    getSharedCollectionByUsernameAction(username)
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [username])

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> {it ? "Caricamento collezione condivisa…" : "Loading shared collection…"}
      </div>
    )
  }

  if (!data) {
    return (
      <Empty className="rounded-lg border border-dashed border-border py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UserRound />
          </EmptyMedia>
          <EmptyTitle>{it ? "Collezione condivisa non trovata" : "Shared collection not found"}</EmptyTitle>
          <EmptyDescription>
            {it ? "Questo collezionista non ha modelli condivisi al momento oppure la vetrina non è più disponibile." : "This collector has no items shared right now, or the showcase is no longer available."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const openToOffers = data.shares.filter((share) => share.shareMode === "open_to_offers").length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-muted text-xl font-semibold uppercase">
          {data.profile.username.slice(0, 1)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {it ? `Collezione di ${data.profile.username}` : `${data.profile.username}'s collection`}
          </h1>
          <p className="text-sm text-muted-foreground">
            {data.profile.country ? `${data.profile.country} · ` : ""}
            {it ? "Qui sono visibili solo i modelli che questo collezionista ha scelto esplicitamente di condividere." : "Only items this collector explicitly chose to share are visible here."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1.5">
            <Boxes className="size-3.5" /> {data.shares.length} {it ? "condivisi" : "shared"}
          </Badge>
          {openToOffers > 0 ? (
            <Badge variant="secondary" className="gap-1.5 bg-brand/15 text-brand">
              <Handshake className="size-3.5" /> {openToOffers} {it ? "accettano offerte" : "open to offers"}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data.shares.map((share) => (
          <Card key={share.id} className="overflow-hidden py-0">
            <Link href={`/catalog/${share.product.id}/releases/${share.release.id}`} className="flex h-full flex-col">
              <SharedReleaseImage
                url={share.imageUrl}
                alt={`${share.product.name} — ${share.release.editionName}`}
              />
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{conditionLabel(share.condition, it)}</Badge>
                  {share.shareMode === "open_to_offers" ? (
                    <Badge variant="secondary" className="gap-1 bg-brand/15 text-brand">
                      <Handshake className="size-3" /> {it ? "Accetta offerte" : "Open to offers"}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">{it ? "Condiviso" : "Shared"}</Badge>
                  )}
                </div>
                <div>
                  <p className="font-medium leading-tight">{share.release.editionName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {share.product.name} · #{share.release.itemNumber ?? "—"} · {share.release.releaseYear ?? "—"}
                  </p>
                  {share.shareMode === "open_to_offers" && share.askingPrice != null && share.askingCurrency ? (
                    <p className="mt-2 text-sm font-semibold text-brand">
                      {it ? "Richiesta" : "Asking"} {formatMoney(share.askingPrice, share.askingCurrency)}
                    </p>
                  ) : null}
                </div>
              </div>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  )
}

function SharedReleaseImage({ url, alt }: { url?: string; alt: string }) {
  const [failed, setFailed] = React.useState(false)

  React.useEffect(() => {
    setFailed(false)
  }, [url])

  if (!url || failed) {
    return (
      <div className="grid aspect-[4/3] w-full place-items-center bg-muted text-muted-foreground">
        <ImageIcon className="size-8" />
      </div>
    )
  }

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
      <Image
        src={url}
        alt={alt}
        fill
        sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
        className="object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  )
}
