"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DirectOfferDialog } from "@/components/messaging/direct-offer-dialog"

export function LegoPilotOffer({ shareId }: { shareId: string }) {
  const [open, setOpen] = useState(false)

  return (
    <section className="mt-6 space-y-2 rounded-xl border p-4">
      <h2 className="font-semibold">Annuncio privato di prova</h2>
      <p className="text-sm text-muted-foreground">Ferrari F40 sigillata · 25 € simulati</p>
      <Button onClick={() => setOpen(true)}>Fai un’offerta di prova</Button>
      <DirectOfferDialog
        target={open ? { shareId, username: "venditore di prova", askingPrice: 25, askingCurrency: "EUR" } : null}
        locale="it"
        onOpenChange={setOpen}
        messagesPath="/speed-champions/messages"
      />
    </section>
  )
}
