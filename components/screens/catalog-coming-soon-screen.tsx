import Link from "next/link"
import { ArrowLeft, BellRing, Clock3, Sparkles } from "lucide-react"
import type { Product } from "@/lib/types"
import { ProductImage } from "@/components/catalog/product-image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function CatalogComingSoonScreen({ product }: { product: Product }) {
  return (
    <div className="mx-auto max-w-3xl py-6 sm:py-10">
      <Link href="/catalog" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" />
        Torna al catalogo
      </Link>

      <section className="mt-5 overflow-hidden rounded-3xl border border-brand/10 bg-gradient-to-br from-white via-white to-brand/5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
        <div className="grid gap-0 sm:grid-cols-[0.9fr_1.1fr]">
          <div className="relative min-h-60 border-b border-border/60 bg-muted/15 sm:border-b-0 sm:border-r">
            <ProductImage product={product} className="h-full min-h-60 w-full grayscale-[0.18] opacity-80" />
            <Badge className="absolute left-4 top-4 bg-white/95 text-brand shadow-sm" variant="outline">
              In arrivo
            </Badge>
          </div>

          <div className="flex flex-col justify-center p-5 sm:p-7">
            <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <Sparkles className="size-5" />
            </div>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-brand">TRACKDASH · CATALOGO IN ESPANSIONE</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{product.name}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Stiamo verificando release, immagini e dati di mercato prima di pubblicare la famiglia completa.
            </p>

            <div className="mt-5 space-y-2 rounded-2xl border border-border/70 bg-white/80 p-3.5 text-sm">
              <p className="flex items-start gap-2 text-foreground">
                <Clock3 className="mt-0.5 size-4 shrink-0 text-brand" />
                <span>Preferiamo pubblicare meno famiglie, ma con identità e dati più affidabili.</span>
              </p>
              <p className="flex items-start gap-2 text-muted-foreground">
                <BellRing className="mt-0.5 size-4 shrink-0" />
                <span>Quando questa famiglia sarà pronta comparirà una notifica in TrackDash.</span>
              </p>
            </div>

            <Button className="mt-5 w-full sm:w-auto" render={<Link href="/catalog" />}>
              Esplora le famiglie disponibili
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
