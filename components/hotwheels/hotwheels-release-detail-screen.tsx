"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ProductImage } from "@/components/catalog/product-image"
import type { HotWheelsPilotEntry } from "@/lib/actions/hotwheels"
import { useI18n } from "@/lib/i18n"

function identifierLabel(scheme: string, it: boolean) {
  if (scheme === "mattel_sku") return "Mattel SKU"
  if (scheme === "mattel_toy_number") return it ? "Codice Mattel" : "Mattel toy number"
  return scheme
}

function sourceLabel(type: string, it: boolean) {
  if (type === "official_manufacturer") return it ? "Fonte ufficiale Mattel" : "Mattel official source"
  if (type === "trusted_secondary") return it ? "Fonte collezionistica verificata" : "Trusted collector reference"
  return it ? "Fonte di riferimento" : "Reference source"
}

export function HotWheelsReleaseDetailScreen({ entry }: { entry: HotWheelsPilotEntry }) {
  const { locale } = useI18n()
  const it = locale === "it"
  const { product, release, details, primaryIdentifier, sources, subvariants } = entry

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 lg:px-8">
      <Link href="/hotwheels/catalog" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-brand">
        <ArrowLeft className="size-4" /> {it ? "Torna al catalogo Hot Wheels" : "Back to Hot Wheels catalog"}
      </Link>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <ProductImage product={product} release={release} size="lg" className="aspect-[4/3] w-full rounded-3xl bg-muted/20" />

        <div className="flex flex-col gap-5">
          <div>
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-brand">{details.lineName}</span>
              {details.subseries ? <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">{details.subseries}</span> : null}
              {details.chaseType ? <span className="rounded-full border border-brand-red/20 bg-brand-red/5 px-2.5 py-1 text-[10px] font-bold text-brand-red">{details.chaseType}</span> : null}
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{release.editionName}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{product.name}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Fact label={primaryIdentifier ? identifierLabel(primaryIdentifier.scheme, it) : (it ? "Identificatore" : "Identifier")} value={primaryIdentifier?.value ?? "—"} mono />
            <Fact label={it ? "Anno Release" : "Release year"} value={release.releaseYear?.toString() ?? "—"} />
            <Fact label={it ? "Colore" : "Color"} value={release.color ?? (it ? "Da verificare" : "To verify")} />
            <Fact label={it ? "Posizione serie" : "Series position"} value={details.seriesPosition ?? "—"} />
            <Fact label={it ? "N. collezione" : "Collector no."} value={details.collectorNumber ?? "—"} />
            <Fact label="Mix" value={details.mixCode ? `Mix ${details.mixCode}` : "—"} />
            {details.variationCode ? <Fact label={it ? "Codice variante" : "Variation code"} value={details.variationCode} /> : null}
            {details.wheelType ? <Fact label={it ? "Ruote" : "Wheels"} value={details.wheelType} /> : null}
            {details.countryOfManufacture ? <Fact label={it ? "Produzione" : "Made in"} value={details.countryOfManufacture} /> : null}
          </div>

          {details.packagingVariant || details.exclusivity ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {details.packagingVariant ? (
                <InfoBlock label={it ? "Packaging" : "Packaging"} value={details.packagingVariant} />
              ) : null}
              {details.exclusivity ? (
                <InfoBlock label={it ? "Esclusività" : "Exclusivity"} value={details.exclusivity} />
              ) : null}
            </div>
          ) : null}

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Market Intelligence</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {it ? "Initial Scan non ancora eseguito" : "Initial scan not run yet"}
                </p>
              </div>
              <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">Pilot</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {it
                ? "ASK, SOLD, Valore stimato e trend verranno collegati solo dopo aver validato il matching della Release esatta."
                : "ASK, SOLD, Market Value and trend will be attached only after exact-release matching has been validated."}
            </p>
          </div>

          {subvariants.length > 0 ? (
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {it ? "Subvarianti note" : "Known subvariants"}
              </p>
              <div className="mt-2 flex flex-col gap-2">
                {subvariants.map((subvariant) => (
                  <div key={subvariant.id} className="rounded-xl border border-border/70 px-3 py-2.5">
                    <p className="text-sm font-semibold text-foreground">{subvariant.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[subvariant.wheelType, subvariant.packagingVariant, subvariant.countryOfManufacture].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {it ? "Fonti identità" : "Identity sources"}
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {sources.map((source) => (
                source.sourceUrl ? (
                  <a
                    key={source.id}
                    href={source.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground transition hover:border-brand/30 hover:text-brand"
                  >
                    {sourceLabel(source.sourceType, it)}
                  </a>
                ) : null
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Fact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-3.5">
      <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-semibold text-foreground ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}
