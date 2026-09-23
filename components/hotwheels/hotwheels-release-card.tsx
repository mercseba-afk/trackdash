"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ProductImage } from "@/components/catalog/product-image"
import type { HotWheelsPilotEntry } from "@/lib/actions/hotwheels"
import { useI18n } from "@/lib/i18n"

function identifierLabel(scheme: string, it: boolean) {
  if (scheme === "mattel_sku") return "Mattel SKU"
  if (scheme === "mattel_toy_number") return it ? "Codice Mattel" : "Mattel toy #"
  if (scheme === "upc_a") return "UPC-A"
  return scheme
}

export function HotWheelsReleaseCard({ entry }: { entry: HotWheelsPilotEntry }) {
  const { locale } = useI18n()
  const it = locale === "it"
  const { product, release, details, primaryIdentifier } = entry
  const href = `/hotwheels/catalog/${product.id}/releases/${release.id}`
  const secondaryValue = details.collectorNumber ?? details.seriesPosition ?? details.mixCode ?? "—"
  const secondaryLabel = details.collectorNumber
    ? (it ? "N. collezione" : "Collector no.")
    : details.seriesPosition
      ? (it ? "Posizione" : "Position")
      : "Mix"

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_8px_26px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
      <Link href={href} className="relative block overflow-hidden border-b border-border/50 bg-gradient-to-br from-white via-muted/10 to-brand/5">
        <ProductImage
          product={product}
          release={release}
          className="aspect-[4/3] w-full rounded-none transition-transform duration-300 group-hover:scale-[1.025]"
        />
        <span className="absolute right-2.5 top-2.5 inline-flex items-center rounded-full border border-white/80 bg-white/90 px-2 py-1 text-[10px] font-semibold tabular-nums text-foreground shadow-sm backdrop-blur-sm">
          {release.releaseYear ?? "—"}
        </span>
        {details.chaseType ? (
          <span className="absolute left-2.5 top-2.5 inline-flex rounded-full bg-brand-red px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-white shadow-sm">
            {details.chaseType}
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <Link href={href} className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-brand/80">{details.lineName}</p>
            {details.subseries ? <span className="text-[10px] text-muted-foreground">· {details.subseries}</span> : null}
          </div>
          <h3 className="mt-1 line-clamp-2 text-[14px] font-semibold leading-[1.15rem] tracking-tight text-foreground transition-colors group-hover:text-brand sm:text-base sm:leading-5">
            {release.editionName}
          </h3>
          <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">{product.name}</p>

          <div className="mt-3 grid grid-cols-2 gap-1.5">
            <span className="flex min-w-0 flex-col rounded-xl border border-border/60 bg-muted/20 px-2.5 py-2">
              <span className="truncate text-[8px] font-medium uppercase tracking-[0.07em] text-muted-foreground">
                {primaryIdentifier ? identifierLabel(primaryIdentifier.scheme, it) : (it ? "Codice" : "Code")}
              </span>
              <strong className="mt-0.5 truncate font-mono text-[11px] font-semibold text-foreground">
                {primaryIdentifier?.value ?? "—"}
              </strong>
            </span>
            <span className="flex min-w-0 flex-col rounded-xl border border-border/60 bg-muted/20 px-2.5 py-2">
              <span className="truncate text-[8px] font-medium uppercase tracking-[0.07em] text-muted-foreground">{secondaryLabel}</span>
              <strong className="mt-0.5 truncate text-[11px] font-semibold text-foreground">{secondaryValue}</strong>
            </span>
          </div>

          <div className="mt-2 flex min-h-5 flex-wrap gap-1">
            {details.variationCode ? (
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[9px] font-semibold text-brand">
                Var. {details.variationCode}
              </span>
            ) : null}
            {details.mixCode ? (
              <span className="rounded-full border border-border px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
                Mix {details.mixCode}
              </span>
            ) : null}
          </div>
        </Link>

        <Link
          href={href}
          className="mt-auto inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-brand px-3 text-xs font-semibold text-white transition hover:bg-[#0e49c7]"
        >
          {it ? "Vedi Release" : "View Release"}
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </article>
  )
}
