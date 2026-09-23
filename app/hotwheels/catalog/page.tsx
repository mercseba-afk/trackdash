import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PublicShell } from "@/components/public-shell"
import { fetchCatalogProductsForVertical } from "@/lib/actions/catalog"
import { COLLECTIBLE_VERTICALS } from "@/lib/verticals"

export const revalidate = 45

export const metadata: Metadata = {
  title: "Hot Wheels Catalog | TrackDash",
  description: "TrackDash Hot Wheels collector catalog.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function HotWheelsCatalogPage() {
  const vertical = COLLECTIBLE_VERTICALS.hotwheels

  if (!vertical.publicEnabled) notFound()

  const products = await fetchCatalogProductsForVertical("hotwheels")

  return (
    <PublicShell>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-6 lg:px-8">
        <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">TRACKDASH · HOT WHEELS</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Hot Wheels Catalog</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Exact collector Releases, kept separate from the Mini 4WD catalog while the Hot Wheels pilot is validated.
          </p>
          <div className="mt-6 inline-flex rounded-2xl border border-border/70 bg-muted/30 px-4 py-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Pilot catalog</p>
              <p className="mt-0.5 text-2xl font-semibold tabular-nums text-foreground">{products.length}</p>
              <p className="text-xs text-muted-foreground">tracked models</p>
            </div>
          </div>
        </section>

        {products.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-border bg-card px-5 py-12 text-center">
            <h2 className="text-lg font-semibold text-foreground">Catalog foundation ready</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              The first pilot Releases are still being validated before this vertical is opened publicly.
            </p>
          </section>
        ) : null}
      </div>
    </PublicShell>
  )
}
