"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BadgeCheck, HandCoins, Handshake, LockKeyhole, UsersRound } from "lucide-react"
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
      <section id="trackdash-offers" className="scroll-mt-24 rounded-2xl border border-[#bfd4f3] bg-[#f4f8ff] p-5 shadow-[0_12px_32px_rgba(15,75,180,0.08)] md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-[#0f4bb4]">
              <UsersRound className="size-4" /> {it ? "SCAMBI TRA COLLEZIONISTI" : "COLLECTOR TO COLLECTOR"}
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#081a3a] md:text-2xl">
              {sorted.length > 0
                ? (it ? "Fai un’offerta a un collezionista" : "Make an offer to a collector")
                : (it ? "Nessuna copia disponibile dai collezionisti" : "No collector copies available")}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#607089]">
              {sorted.length > 0
                ? (it
                    ? "Questa Release è disponibile anche da altri collezionisti TrackDash. Scegli una copia, contatta il proprietario e invia la tua proposta. L’eventuale prezzo richiesto è l’ASK del collezionista, non il Market Value."
                    : "This Release is also available from other TrackDash collectors. Choose a copy, contact the owner and send your offer. Any asking price shown is the collector’s ASK, not the Market Value.")
                : (it
                    ? "Quando un collezionista renderà disponibile una copia di questa Release, qui potrai contattarlo e inviargli un’offerta."
                    : "When a collector makes a copy of this Release available, you’ll be able to contact them and send an offer here.")}
            </p>
          </div>
          {sorted.length > 0 ? (
            <Badge variant="secondary" className="w-fit border border-[#c6d9f5] bg-white px-3 py-1.5 text-[#0f4bb4]">
              {it
                ? (sorted.length === 1 ? "1 copia disponibile da un collezionista" : `${sorted.length} copie disponibili dai collezionisti`)
                : (sorted.length === 1 ? "1 copy available from a collector" : `${sorted.length} copies available from collectors`)}
            </Badge>
          ) : null}
        </div>

        {sorted.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-[#cbd8e7] bg-[#f8fafc] px-4 py-5 text-sm text-[#607089]">
            {it
              ? "Nessun collezionista ha ancora aperto questa Release alle offerte su TrackDash."
              : "No collector has opened this Release to offers on TrackDash yet."}
          </div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {sorted.map((offer) => {
              const isMine = Boolean(user && user.username === offer.username)
              const hasAsk = offer.askingPrice != null && offer.askingCurrency != null

              return (
                <article key={offer.id} className="relative overflow-hidden rounded-xl border border-[#bcd2f2] bg-white p-4 shadow-[0_8px_24px_rgba(15,75,180,0.06)]">
                  <div className="absolute inset-x-0 top-0 h-1 bg-[#0f5fe8]" />
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="truncate font-semibold text-[#081a3a]">@{offer.username}</span>
                        <Badge variant="secondary" className="gap-1 border border-[#c5daf8] bg-[#edf5ff] text-[#0f4bb4]">
                          <BadgeCheck className="size-3" /> {it ? "Ha questa Release" : "Owns this Release"}
                        </Badge>
                        <Badge variant="outline" className="border-[#cdd9e8] text-[#52647e]">
                          {conditionLabel(offer.condition, it)}
                        </Badge>
                        <Badge variant="secondary" className="gap-1 bg-[#eef7f3] text-[#16734f]">
                          <Handshake className="size-3" /> {it ? "Disponibile alle offerte" : "Open to offers"}
                        </Badge>
                      </div>
                      <div className="mt-3">
                        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#7b8ba3]">
                          {it ? "Prezzo richiesto" : "Asking price"}
                        </p>
                        <p className="mt-1 text-xl font-semibold tabular-nums text-[#081a3a]">
                          {hasAsk ? formatMoney(offer.askingPrice!, offer.askingCurrency!) : (it ? "Su proposta" : "Make an offer")}
                        </p>
                      </div>
                    </div>

                    {isMine ? (
                      <Button size="sm" variant="outline" disabled className="w-full shrink-0 sm:w-auto">
                        {it ? "La tua copia" : "Your copy"}
                      </Button>
                    ) : user ? (
                      <Button
                        size="sm"
                        className="w-full shrink-0 gap-1.5 bg-[#0f5fe8] hover:bg-[#0d50c5] sm:w-auto"
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
                      <Button size="sm" render={<Link href={loginHref} />} className="w-full shrink-0 gap-1.5 bg-[#0f5fe8] hover:bg-[#0d50c5] sm:w-auto">
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
