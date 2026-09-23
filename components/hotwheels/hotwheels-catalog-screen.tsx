"use client"

import { HotWheelsReleaseCard } from "@/components/hotwheels/hotwheels-release-card"
import type { HotWheelsPilotEntry } from "@/lib/actions/hotwheels"
import { useI18n } from "@/lib/i18n"

export function HotWheelsCatalogScreen({ entries }: { entries: HotWheelsPilotEntry[] }) {
  const { locale } = useI18n()
  const it = locale === "it"
  const castingCount = new Set(entries.map((entry) => entry.product.id)).size

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl border border-brand/10 bg-gradient-to-br from-white via-white to-brand/5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-5 px-5 py-6 sm:px-7 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-8">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">TRACKDASH · HOT WHEELS PILOT</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {it ? "Release da collezione identificate con precisione" : "Exact collector Releases"}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {it
                ? "Catalogo costruito partendo dalla Release esatta: casting, linea, variante, codice Mattel e dettagli collezionistici prima di collegare i dati di mercato."
                : "Release-first catalog for collector Hot Wheels: casting, line, variation, Mattel identifier and collector details are verified before market data is attached."}
            </p>
          </div>
          <div className="shrink-0 rounded-2xl border border-border/60 bg-white/80 px-5 py-4 shadow-sm backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {it ? "Catalogo pilota" : "Pilot catalog"}
            </p>
            <p className="mt-0.5 text-3xl font-semibold tabular-nums text-foreground">{entries.length}</p>
            <p className="text-xs text-muted-foreground">
              {it
                ? `${entries.length} Release · ${castingCount} Casting`
                : `${entries.length} Releases · ${castingCount} Castings`}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <HotWheelsReleaseCard key={entry.release.id} entry={entry} />
        ))}
      </section>

      <section className="rounded-2xl border border-dashed border-border bg-card px-5 py-5 text-sm leading-relaxed text-muted-foreground">
        {it
          ? "Le immagini canoniche e i prezzi di mercato non vengono pubblicati finché non sono verificati. Il pilot sta validando identità esatta, provenienza delle fonti e struttura multi-verticale."
          : "Canonical images and market prices are not published until verified. The pilot is validating exact identity, source provenance and the multi-vertical catalog structure."}
      </section>
    </div>
  )
}
