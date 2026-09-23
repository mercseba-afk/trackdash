"use client"

import Link from "next/link"
import { ProductImage } from "@/components/catalog/product-image"
import type { HotWheelsPilotEntry } from "@/lib/actions/hotwheels"
import { useI18n } from "@/lib/i18n"

function identifierLabel(scheme: string, it: boolean) {
  if (scheme === "mattel_sku") return "Mattel SKU"
  if (scheme === "mattel_toy_number") return it ? "Codice Mattel" : "Mattel toy #"
  return scheme
}

export function HotWheelsReleaseCard({ entry }: { entry: HotWheelsPilotEntry }) {
  const { locale } = useI18n()
  const it = locale === "it"
  const { product, release, details, primaryIdentifier } = entry

  return (
    <Link
      href={`/hotwheels/catalog/${product.id}/releases/${release.id}`}
      className="group overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[0_14px_32px_rgba(15,23,42,0.08)]"
    >
      <ProductImage product={product} release={release} className="aspect-[4/3] w-full rounded-none bg-muted/20" />
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-brand/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-brand">
            {details.lineName}
          </span>
          {details.subseries ? (
            <span className="rounded-full border border-border px-2 py-1 text-[10px] font-semibold text-muted-foreground">
              {details.subseries}
            </span>
          ) : null}
          {details.chaseType ? (
            <span className="rounded-full border border-brand-red/20 bg-brand-red/5 px-2 py-1 text-[10px] font-bold text-brand-red">
              {details.chaseType}
            </span>
          ) : null}
        </div>

        <div>
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-brand">
            {release.editionName}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {release.releaseYear ?? (it ? "Anno da verificare" : "Year to verify")}
          </p>
        </div>

        <div className="flex items-end justify-between gap-3 border-t border-border/60 pt-3">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {primaryIdentifier ? identifierLabel(primaryIdentifier.scheme, it) : (it ? "Identificatore" : "Identifier")}
            </p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">
              {primaryIdentifier?.value ?? "—"}
            </p>
          </div>
          <div className="text-right text-[11px] text-muted-foreground">
            {details.variationCode ? <p>{it ? "Var." : "Var."} {details.variationCode}</p> : null}
            {details.seriesPosition ? <p>{details.seriesPosition}</p> : null}
            {details.mixCode ? <p>Mix {details.mixCode}</p> : null}
          </div>
        </div>
      </div>
    </Link>
  )
}
