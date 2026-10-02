"use client"

import Link from "next/link"
import { useI18n } from "@/lib/i18n"
import { releaseTypeLabel } from "@/lib/i18n/catalog-labels"
import { productPublicPath, releasePublicPath } from "@/lib/seo/catalog-paths"
import type { Product, ProductRelease } from "@/lib/types"

export function ReleaseFamilyLinks({
  product,
  releases,
}: {
  product: Product
  releases: ProductRelease[]
}) {
  const { locale } = useI18n()
  const it = locale === "it"

  if (releases.length === 0) return null

  return (
    <section
      className="mt-2 rounded-3xl border border-border/70 bg-card p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] md:p-6"
      aria-labelledby="related-releases-title"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">
        {it ? "Famiglia di release" : "Release family"}
      </p>
      <div className="mt-1 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 id="related-releases-title" className="text-xl font-semibold tracking-tight text-foreground">
            {it ? `Altre release di ${product.name}` : `Other ${product.name} releases`}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            {it
              ? "Confronta originali, ristampe ed edizioni speciali senza mescolare anni o Item Number diversi."
              : "Compare originals, reissues and special editions without mixing different years or Item Numbers."}
          </p>
        </div>
        <Link href={productPublicPath(product, locale)} className="text-sm font-semibold text-brand hover:underline">
          {it ? `Vedi il modello ${product.name}` : `View ${product.name} model`} →
        </Link>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {releases.map((release) => (
          <Link
            key={release.id}
            href={releasePublicPath(product, release, locale)}
            className="group rounded-2xl border border-border/70 bg-muted/15 p-3.5 transition-colors hover:border-brand/30 hover:bg-brand/5"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand/80">
              {release.itemNumber ? `Tamiya ${release.itemNumber}` : "Tamiya Mini 4WD"}
            </p>
            <h3 className="mt-1 text-sm font-semibold leading-snug text-foreground group-hover:text-brand">
              {release.editionName}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {[release.releaseYear, release.chassis, releaseTypeLabel(release.releaseType, it)].filter(Boolean).join(" · ")}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
