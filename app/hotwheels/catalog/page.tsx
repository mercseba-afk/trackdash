import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { HotWheelsPilotShell } from "@/components/hotwheels/hotwheels-pilot-shell"
import { HotWheelsReleaseCard } from "@/components/hotwheels/hotwheels-release-card"
import { fetchHotWheelsPilotCatalog } from "@/lib/actions/hotwheels"
import { isVerticalRouteEnabled } from "@/lib/server/vertical-gates"

export const revalidate = 45

export const metadata: Metadata = {
  title: "Hot Wheels Pilot Catalog | TrackDash",
  description: "Private TrackDash pilot catalog for exact Hot Wheels collector Releases.",
  robots: { index: false, follow: false },
}

export default async function HotWheelsCatalogPage() {
  if (!isVerticalRouteEnabled("hotwheels")) notFound()

  const entries = await fetchHotWheelsPilotCatalog()

  return (
    <HotWheelsPilotShell>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl border border-brand/10 bg-gradient-to-br from-white via-white to-brand/5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-5 px-5 py-6 sm:px-7 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-8">
            <div className="max-w-2xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">TRACKDASH · HOT WHEELS PILOT</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Exact collector Releases</h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Release-first catalog for Premium, RLC, Elite 64 and chase cars. Each entry is tracked by exact Mattel identifier before market data is attached.
              </p>
            </div>
            <div className="shrink-0 rounded-2xl border border-border/60 bg-white/80 px-5 py-4 shadow-sm backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Pilot catalog</p>
              <p className="mt-0.5 text-3xl font-semibold tabular-nums text-foreground">{entries.length}</p>
              <p className="text-xs text-muted-foreground">verified Releases</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <HotWheelsReleaseCard key={entry.release.id} entry={entry} />
          ))}
        </section>

        <section className="rounded-2xl border border-dashed border-border bg-card px-5 py-5 text-sm leading-relaxed text-muted-foreground">
          Canonical product images and market prices are intentionally not published yet. The pilot currently validates exact identity, source provenance and the multi-vertical catalog flow.
        </section>
      </div>
    </HotWheelsPilotShell>
  )
}
