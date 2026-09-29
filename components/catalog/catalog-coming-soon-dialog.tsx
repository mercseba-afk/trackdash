"use client"

import * as React from "react"
import { BellRing, Clock3, Sparkles } from "lucide-react"
import type { Product } from "@/lib/types"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function CatalogComingSoonDialog({
  product,
  trigger,
}: {
  product: Product
  trigger: React.ReactNode
}) {
  const { locale } = useI18n()
  const it = locale === "it"

  return (
    <Dialog>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 inline-flex size-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <Sparkles className="size-5" />
          </div>
          <DialogTitle>
            {it ? `${product.name} è in arrivo` : `${product.name} is coming soon`}
          </DialogTitle>
          <DialogDescription className="leading-relaxed">
            {it
              ? "Stiamo verificando release, immagini e dati di mercato prima di pubblicare la famiglia completa."
              : "We are verifying releases, images and market data before publishing the complete family."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 rounded-2xl border border-brand/10 bg-brand/5 p-3.5 text-sm">
          <p className="flex items-start gap-2 text-foreground">
            <Clock3 className="mt-0.5 size-4 shrink-0 text-brand" />
            <span>
              {it
                ? "Il catalogo TrackDash viene ampliato progressivamente: preferiamo pubblicare meno famiglie, ma con identità affidabili."
                : "TrackDash is expanding the catalog progressively: fewer families first, with more reliable identities."}
            </span>
          </p>
          <p className="flex items-start gap-2 text-muted-foreground">
            <BellRing className="mt-0.5 size-4 shrink-0" />
            <span>
              {it
                ? "Quando questa famiglia sarà pronta comparirà una notifica in TrackDash."
                : "When this family is ready, TrackDash will show a notification."}
            </span>
          </p>
        </div>

        <DialogFooter>
          <DialogClose render={<Button className="w-full sm:w-auto">{it ? "Ho capito" : "Got it"}</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
