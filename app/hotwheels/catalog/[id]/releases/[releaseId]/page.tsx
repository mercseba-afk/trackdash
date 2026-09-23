import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { notFound } from "next/navigation"
import { ProductImage } from "@/components/catalog/product-image"
import { HotWheelsPilotShell } from "@/components/hotwheels/hotwheels-pilot-shell"
import { fetchHotWheelsPilotRelease } from "@/lib/actions/hotwheels"
import { isVerticalRouteEnabled } from "@/lib/server/vertical-gates"

export const revalidate = 45

type PageParams = Promise<{ id: string; releaseId: string }>

function sourceLabel(type: string) {
  if (type === "official_manufacturer") return "Mattel official"
  if (type === "trusted_secondary") return "Collector reference"
  return "Reference"
}

function identifierLabel(scheme: string) {
  if (scheme === "mattel_sku") return "Mattel SKU"
  if (scheme === "mattel_toy_number") return "Mattel toy number"
  return scheme
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  if (!isVerticalRouteEnabled("hotwheels")) {
    return { title: "Not found | TrackDash", robots: { index: false, follow: false } }
  }

  const { releaseId } = await params
  const entry = await fetchHotWheelsPilotRelease(releaseId)
  if (!entry) return { title: "Release not found | TrackDash", robots: { index: false, follow: false } }

  return {
    title: `${entry.release.editionName} | Hot Wheels Pilot | TrackDash`,
    description: `TrackDash pilot identity page for ${entry.release.editionName}.`,
    robots: { index: false, follow: false },
  }
}

export default async function HotWheelsReleasePage({ params }: { params: PageParams }) {
  if (!isVerticalRouteEnabled("hotwheels")) notFound()

  const { id, releaseId } = await params
  const entry = await fetchHotWheelsPilotRelease(releaseId)
  if (!entry || entry.product.id !== id) notFound()

  const { product, release, details, primaryIdentifier, sources } = entry

  return (
    <HotWheelsPilotShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 lg:px-8">
        <Link href="/hotwheels/catalog" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-brand">
          <ArrowLeft className="size-4" /> Back to Hot Wheels catalog
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
              <Fact label={primaryIdentifier ? identifierLabel(primaryIdentifier.scheme) : "Identifier"} value={primaryIdentifier?.value ?? "—"} mono />
              <Fact label="Release year" value={release.releaseYear?.toString() ?? "—"} />
              <Fact label="Color" value={release.color ?? "To verify"} />
              <Fact label="Series position" value={details.seriesPosition ?? "—"} />
              <Fact label="Collector no." value={details.collectorNumber ?? "—"} />
              <Fact label="Mix" value={details.mixCode ? `Mix ${details.mixCode}` : "—"} />
            </div>

            {details.packagingVariant ? (
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Packaging</p>
                <p className="mt-1 text-sm font-medium text-foreground">{details.packagingVariant}</p>
              </div>
            ) : null}

            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Market Intelligence</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">Initial scan not run yet</p>
                </div>
                <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">Pilot</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                ASK, SOLD, Market Value and trend will be attached only after exact-release matching has been validated.
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Identity sources</p>
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
                      {sourceLabel(source.sourceType)}
                    </a>
                  ) : null
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </HotWheelsPilotShell>
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
