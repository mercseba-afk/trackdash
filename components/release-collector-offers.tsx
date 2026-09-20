"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { HandCoins, Handshake, LockKeyhole, UsersRound } from "lucide-react"
import { DirectOfferDialog } from "@/components/messaging/direct-offer-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import { formatMoney } from "@/lib/format"
import { useStore } from "@/lib/store"
import type { Condition, Currency } from "@/lib/types"

type PublicReleaseOffer = {
  id: string
  username: string
  condition: Condition
  askingPrice: number | null
  askingCurrency: Currency | null
  updatedAt: string
}

type OfferTarget = {
  username: string
  shareId: string
  askingPrice: number | null
  askingCurrency: Currency | null
}

export function ReleaseCollectorOffers({ offers }: { offers: PublicReleaseOffer[] }) {
  const { user } = useStore()
  const { locale } = useI18n()
  const pathname = usePathname()
  const it = locale === "it"
  const [offerTarget, setOfferTarget] = React.useState<OfferTarget | null>(null)

  const sorted = React.useMemo(
    () => [...offers].sort((a, b) => {
      if (a.askingPrice != null && b.askingPrice != null) return a.askingPrice - b.askingPrice
      if (a.askingPrice != null) return -1
      if (b.askingPrice != null) return 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    }),
    [offers],
  )

  const loginHref = `/login?next=${encodeURIComponent(`${pathname || "/catalog"}#trackdash-offers`)}`

  return (
    <>
      <section id="trackdash-offers" className="scroll-mt-24 rounded-2xl border border-[#d8e3f0] bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-[#0f4bb4]">
              <UsersRound className="size-4" /> {it ? "SCAMBI TRA COLLEZIONISTI" : "COLLECTOR TO COLLECTOR"}
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#081a3a] md:text-2xl">
              {it ? "Offerte dei collezionisti" : "Collector offers"}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#607089]">
              {it
                ? "Qui trovi le copie che altri collezionisti hanno aperto alle offerte. Il prezzo richiesto è un ASK del collezionista, non il Market Value."
                : "Here you can find copies other collectors have opened to offers. An asking price is the collector's ASK, not the TrackDash Market Value."}
            </p>
          </div>
          <Badge variant="secondary" className="w-fit bg-[#eef4ff] text-[#0f4bb4]">
            {sorted.length} {it ? (sorted.length === 1 ? "copia aperta a offerte" : "copie aperte a offerte") : (sorted.length === 1 ? "copy open to offers" : "copies open to offers")}
          </Badge>
        </div>

        {sorted.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-[#cbd8e7] bg-[#f8fafc] px-4 py-5 text-sm text-[#607089]">
            {it
              ? "Nessun collezionista ha ancora aperto questa Release alle offerte su TrackDash."
              : "No collector has opened this Release to offers on TrackDash yet."}
          </div>
        ) : (
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {sorted.map((offer) => {
              const isMine = Boolean(user && user.username === offer.username)
              const hasAsk = offer.askingPrice != null && offer.askingCurrency != null

              return (
                <article key={offer.id} className="rounded-xl border border-[#dbe4ef] bg-[#fbfcfe] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-semibold text-[#081a3a]">@{offer.username}</span>
                        <Badge variant="outline" className="border-[#cdd9e8] text-[#52647e]">
                          {conditionLabel(offer.condition, it)}
                        </Badge>
                        <Badge variant="secondary" className="gap-1 bg-[#edf5ff] text-[#0f4bb4]">
                          <Handshake className="size-3" /> {it ? "Aperto a offerte" : "Open to offers"}
                        </Badge>
                      </div>
                      <div className="mt-3">
                        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#7b8ba3]">
                          {it ? "Richiesta del collezionista" : "Collector ask"}
                        </p>
                        <p className="mt-1 text-xl font-semibold tabular-nums text-[#081a3a]">
                          {hasAsk ? formatMoney(offer.askingPrice!, offer.askingCurrency!) : (it ? "Su proposta" : "Make an offer")}
                        </p>
                      </div>
                    </div>

                    {isMine ? (
                      <Button size="sm" variant="outline" disabled className="shrink-0">
                        {it ? "La tua copia" : "Your copy"}
                      </Button>
                    ) : user ? (
                      <Button
                        size="sm"
                        className="shrink-0 gap-1.5"
                        onClick={() => setOfferTarget({
                          username: offer.username,
                          shareId: offer.id,
                          askingPrice: offer.askingPrice,
                          askingCurrency: offer.askingCurrency,
                        })}
                      >
                        <HandCoins className="size-3.5" /> {it ? "Fai un'offerta" : "Make offer"}
                      </Button>
                    ) : (
                      <Button size="sm" render={<Link href={loginHref} />} className="shrink-0 gap-1.5">
                        <LockKeyhole className="size-3.5" /> {it ? "Accedi per offrire" : "Sign in to offer"}
                      </Button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <DirectOfferDialog
        target={offerTarget}
        locale={it ? "it" : "en"}
        onOpenChange={(open) => { if (!open) setOfferTarget(null) }}
      />
    </>
  )
}

function conditionLabel(value: Condition, it: boolean): string {
  if (!it) return value
  const labels: Record<Condition, string> = {
    Sealed: "Sigillato",
    "New / Opened": "Nuovo / Aperto",
    Built: "Montato",
    Used: "Usato",
    Incomplete: "Incompleto",
  }
  return labels[value]
}
