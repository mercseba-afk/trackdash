"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Heart,
  Layers3,
  LockKeyhole,
  Plus,
  UsersRound,
  Handshake,
} from "lucide-react"
import { AddToCollectionDialog, AddToWishlistDialog } from "@/components/add-item-dialogs"
import { ProductImage } from "@/components/catalog/product-image"
import { MarketSignalInline } from "@/components/market-signal-inline"
import { ProductCard } from "@/components/product-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { primaryRelease } from "@/lib/data/products"
import { formatDate, formatMoney } from "@/lib/format"
import { useI18n } from "@/lib/i18n"
import { useMarketSignals } from "@/lib/market/context"
import { useStore } from "@/lib/store"
import type { Product, ProductRelease } from "@/lib/types"
import { cn } from "@/lib/utils"

type CommunityCount = {
  releaseId: string
  collectors: number
  openToOffers: number
}

export function ProductDetailScreen({
  product,
  related,
  descriptionIt,
  communityCounts,
}: {
  product: Product
  related: Product[]
  descriptionIt?: string | null
  communityCounts: CommunityCount[]
}) {
  const { collection, user, isInWishlist } = useStore()
  const { locale } = useI18n()
  const marketSignals = useMarketSignals()
  const it = locale === "it"
  const primary = primaryRelease(product)
  const releases = React.useMemo(() => sortReleasesForDisplay(product.releases), [product.releases])
  const community = React.useMemo(
    () => new Map(communityCounts.map((row) => [row.releaseId, row])),
    [communityCounts],
  )
  const ownedByRelease = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const item of collection) {
      if (item.productId !== product.id) continue
      map.set(item.releaseId, (map.get(item.releaseId) ?? 0) + 1)
    }
    return map
  }, [collection, product.id])
  const mine = collection.filter((item) => item.productId === product.id)
  const wished = isInWishlist(product.id)
  const publicDescription = it && descriptionIt ? descriptionIt : product.description
  const productPath = `/catalog/${product.id}`
  const loginHref = `/login?next=${encodeURIComponent(productPath)}`

  const valuedReleases = releases.filter((release) => marketSignals[release.id]?.valueEUR != null).length
  const offerReleases = communityCounts.filter((row) => row.openToOffers > 0).length

  return (
    <div className="flex flex-col gap-8 pb-8">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/catalog" />}
        className="-ml-2 w-fit text-[#607089] hover:text-[#0f4bb4]"
      >
        <ArrowLeft data-icon="inline-start" /> {it ? "Torna al catalogo" : "Back to catalog"}
      </Button>

      <section className="grid gap-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)] lg:items-start">
        <div className="overflow-hidden rounded-2xl border border-[#d8e3f0] bg-white p-3 shadow-sm">
          <ProductImage product={product} release={primary} className="aspect-[4/3] w-full rounded-xl" size="lg" />
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="bg-[#eef4ff] text-[#0f4bb4]">{product.series}</Badge>
              {product.hasMultipleReleases ? (
                <Badge variant="outline" className="border-[#ccd8e7] text-[#53657f]">
                  {product.releases.length} {it ? "Release" : "Releases"}
                </Badge>
              ) : null}
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-balance text-[#081a3a] md:text-4xl">{product.name}</h1>
            {product.japaneseName ? <p className="mt-1 text-sm text-[#718198]">{product.japaneseName}</p> : null}
            {publicDescription ? <p className="mt-4 max-w-2xl text-[15px] leading-7 text-pretty text-[#53657f]">{publicDescription}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-[#d8e3f0] bg-white p-4 shadow-sm sm:grid-cols-4">
            <SummaryMetric label={it ? "Prima uscita" : "First release"} value={String(product.originalReleaseYear ?? "—")} />
            <SummaryMetric label={it ? "Chassis originale" : "Original chassis"} value={product.chassis ?? "—"} />
            <SummaryMetric label={it ? "Release valorizzate" : "Valued Releases"} value={`${valuedReleases}/${releases.length}`} />
            <SummaryMetric label={it ? "Aperte a offerte" : "Open to offers"} value={String(offerReleases)} />
          </div>

          <div className="flex flex-wrap gap-2">
            {user ? (
              <>
                <AddToCollectionDialog product={product}>
                  <Button className="gap-1.5"><Plus className="size-4" /> {it ? "Aggiungi alla collezione" : "Add to collection"}</Button>
                </AddToCollectionDialog>
                <AddToWishlistDialog product={product}>
                  <Button variant="outline" className={cn("gap-1.5", wished && "border-[#1558e8] text-[#1558e8]")}>
                    <Heart className={cn("size-4", wished && "fill-current")} /> {wished ? (it ? "In Wishlist" : "On Wishlist") : "Wishlist"}
                  </Button>
                </AddToWishlistDialog>
              </>
            ) : (
              <>
                <Button render={<Link href={loginHref} />} className="gap-1.5">
                  <LockKeyhole className="size-4" /> {it ? "Accedi per aggiungere" : "Sign in to add"}
                </Button>
                <Button variant="outline" render={<Link href={loginHref} />} className="gap-1.5">
                  <Heart className="size-4" /> Wishlist
                </Button>
              </>
            )}
          </div>

          <p className="text-xs leading-5 text-[#718198]">
            {it
              ? "Il modello raccoglie più Release distinte. Valore di mercato, disponibilità e offerte sono sempre attribuiti alla singola Release, non al nome generico del modello."
              : "A model can contain multiple distinct Releases. Market value, availability and offers always belong to the exact Release, not the generic model name."}
          </p>
        </div>
      </section>

      <section id="releases" className="scroll-mt-24">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f4bb4]">{it ? "Identità esatta" : "Exact identity"}</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#081a3a]">{it ? "Release ed edizioni" : "Releases & editions"}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#607089]">
              {it ? "Scegli l'edizione corretta per vedere Market Value, offerte TrackDash e disponibilità di mercato." : "Choose the correct edition to see Market Value, TrackDash offers and market availability."}
            </p>
          </div>
          <Badge variant="secondary" className="w-fit bg-[#eef4ff] text-[#0f4bb4]">{releases.length} {it ? "Release" : "Releases"}</Badge>
        </div>

        <div className="mt-5 grid gap-4">
          {releases.map((release) => (
            <ReleaseCard
              key={release.id}
              product={product}
              release={release}
              ownedCount={ownedByRelease.get(release.id) ?? 0}
              community={community.get(release.id)}
              signal={marketSignals[release.id] ?? null}
              user={Boolean(user)}
              it={it}
            />
          ))}
        </div>
      </section>

      {mine.length > 0 ? (
        <section className="rounded-2xl border border-[#d8e3f0] bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-center gap-2">
            <Check className="size-4 text-success" />
            <h2 className="text-lg font-semibold text-[#081a3a]">{it ? "Le tue copie di questo modello" : "Your copies of this model"}</h2>
            <Badge variant="secondary">{mine.length}</Badge>
          </div>
          <div className="mt-4 grid gap-2">
            {mine.map((item) => {
              const release = product.releases.find((candidate) => candidate.id === item.releaseId) ?? primary
              const signal = marketSignals[release.id] ?? null
              return (
                <div key={item.id} className="flex items-center gap-3 rounded-xl border border-[#e0e7f0] bg-[#fbfcfe] p-3">
                  <ProductImage product={product} release={release} size="sm" className="size-12 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#1b2f4d]">{release.editionName}</p>
                    <p className="mt-0.5 text-xs text-[#718198]">{item.condition}{item.acquisitionDate ? ` · ${formatDate(item.acquisitionDate)}` : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wide text-[#8391a4]">Market Value</p>
                    <p className="text-sm font-semibold tabular-nums text-[#081a3a]">{signal?.valueEUR != null ? formatMoney(signal.valueEUR) : "—"}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section>
          <div className="flex items-center gap-2">
            <Layers3 className="size-4 text-[#0f4bb4]" />
            <h2 className="text-xl font-semibold text-[#081a3a]">{it ? "Modelli correlati" : "Related models"}</h2>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((relatedProduct) => <ProductCard key={relatedProduct.id} product={relatedProduct} />)}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function ReleaseCard({
  product,
  release,
  ownedCount,
  community,
  signal,
  user,
  it,
}: {
  product: Product
  release: ProductRelease
  ownedCount: number
  community?: CommunityCount
  signal: ReturnType<typeof useMarketSignals>[string] | null
  user: boolean
  it: boolean
}) {
  const releaseHref = `/catalog/${product.id}/releases/${release.id}`
  const offersHref = `${releaseHref}#trackdash-offers`
  const loginHref = `/login?next=${encodeURIComponent(releaseHref)}`

  return (
    <article className="overflow-hidden rounded-2xl border border-[#d8e3f0] bg-white shadow-sm transition hover:border-[#b7cbea] hover:shadow-md">
      <div className="grid gap-0 md:grid-cols-[190px_minmax(0,1fr)_220px]">
        <Link href={releaseHref} className="block bg-[#f6f8fb] p-3">
          <ProductImage product={product} release={release} className="aspect-[4/3] h-full min-h-36 w-full rounded-xl" size="md" />
        </Link>

        <div className="flex min-w-0 flex-col p-4 md:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={release.isOriginal ? "outline" : "secondary"} className={release.isOriginal ? "border-[#cdd8e5]" : "bg-[#eef4ff] text-[#0f4bb4]"}>
              {release.isOriginal ? (it ? "Originale" : "Original") : releaseTypeLabel(release.releaseType, it)}
            </Badge>
            {release.productionStatus === "discontinued" ? <Badge variant="secondary">{it ? "Fuori produzione" : "Discontinued"}</Badge> : null}
            {ownedCount > 0 ? <Badge className="gap-1 bg-success/15 text-success"><Check className="size-3" />{ownedCount} {it ? "tue" : "owned"}</Badge> : null}
          </div>

          <Link href={releaseHref} className="mt-3 w-fit max-w-full text-lg font-semibold leading-snug text-[#081a3a] hover:text-[#0f4bb4] hover:underline">
            {release.editionName}
          </Link>
          <p className="mt-1 text-sm text-[#718198]">
            {release.itemNumber ? `#${release.itemNumber}` : "—"} · {release.releaseYear ?? "—"} · {release.chassis ?? "—"}
          </p>

          {community && community.collectors > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#dce5ef] bg-[#f8fafc] px-2.5 py-1.5 text-xs font-medium text-[#53657f]">
                <UsersRound className="size-3.5" /> {community.collectors} {it ? (community.collectors === 1 ? "collezionista" : "collezionisti") : (community.collectors === 1 ? "collector" : "collectors")}
              </span>
              {community.openToOffers > 0 ? (
                <Link href={offersHref} className="inline-flex items-center gap-1.5 rounded-lg border border-[#bcd1f0] bg-[#eef5ff] px-2.5 py-1.5 text-xs font-semibold text-[#0f4bb4] hover:bg-[#e2edff]">
                  <Handshake className="size-3.5" /> {community.openToOffers} {it ? "aperto a offerte" : "open to offers"}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col justify-between gap-4 border-t border-[#e1e8f0] bg-[#fbfcfe] p-4 md:border-l md:border-t-0 md:p-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8391a4]">Market Value</p>
            <div className="mt-1"><MarketSignalInline signal={signal} showStartingPrice /></div>
          </div>

          <div className="flex flex-col gap-2">
            <Button size="sm" render={<Link href={releaseHref} />} className="w-full justify-between">
              {it ? "Vedi Release" : "View Release"} <ArrowRight className="size-4" />
            </Button>
            {user ? (
              <AddToCollectionDialog product={product} defaultReleaseId={release.id}>
                <Button size="sm" variant="outline" className="w-full gap-1.5">
                  <Plus className="size-4" /> {ownedCount > 0 ? (it ? "Aggiungi un'altra" : "Add another") : (it ? "Aggiungi alla collezione" : "Add to collection")}
                </Button>
              </AddToCollectionDialog>
            ) : (
              <Button size="sm" variant="outline" render={<Link href={loginHref} />} className="w-full gap-1.5">
                <LockKeyhole className="size-4" /> {it ? "Accedi per aggiungere" : "Sign in to add"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#8391a4]">{label}</p>
      <p className="mt-1 text-base font-semibold text-[#1b2f4d]">{value}</p>
    </div>
  )
}

function releaseTypeLabel(value: ProductRelease["releaseType"], it: boolean): string {
  if (!it) return value
  const labels: Record<ProductRelease["releaseType"], string> = {
    Original: "Originale",
    Reissue: "Riedizione",
    "Special Edition": "Edizione speciale",
    "Limited Edition": "Edizione limitata",
    "Anniversary Edition": "Edizione anniversario",
    "Japan Cup Edition": "Edizione Japan Cup",
    "Color Special": "Color Special",
    "Clear Body": "Carrozzeria trasparente",
    Premium: "Premium",
    "Chassis Variant": "Variante chassis",
    Other: "Altro",
  }
  return labels[value]
}

function sortReleasesForDisplay(releases: ProductRelease[]): ProductRelease[] {
  return [...releases].sort((a, b) => {
    if (a.isOriginal !== b.isOriginal) return a.isOriginal ? -1 : 1
    const yearA = a.releaseYear ?? Number.MAX_SAFE_INTEGER
    const yearB = b.releaseYear ?? Number.MAX_SAFE_INTEGER
    if (yearA !== yearB) return yearA - yearB
    const dateA = a.releaseDate ?? "9999-12-31"
    const dateB = b.releaseDate ?? "9999-12-31"
    if (dateA !== dateB) return dateA.localeCompare(dateB)
    return a.editionName.localeCompare(b.editionName)
  })
}
