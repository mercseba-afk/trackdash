"use client"

import type { PublicLocale } from "@/lib/seo/catalog-paths"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DirectOfferDialog } from "@/components/messaging/direct-offer-dialog"

export function LegoPilotOffer({ shareId, locale }: { shareId: string; locale: PublicLocale }) {
  const it = locale === "it"
  const [open, setOpen] = useState(false)

  return (
    <section className="mt-6 space-y-2 rounded-xl border p-4">
      <h2 className="font-semibold">{it ? "Annuncio privato di prova" : "Private test listing"}</h2>
      <p className="text-sm text-muted-foreground">{it ? "Ferrari F40 sigillata · 25 € simulati" : "Sealed Ferrari F40 · €25 simulated"}</p>
      <Button onClick={() => setOpen(true)}>{it ? "Fai un’offerta di prova" : "Make a test offer"}</Button>
      <DirectOfferDialog
        target={open ? { shareId, username: it ? "venditore di prova" : "test seller", askingPrice: 25, askingCurrency: "EUR" } : null}
        locale={locale}
        onOpenChange={setOpen}
        messagesPath="/speed-champions/messages"
      />
    </section>
  )
}
