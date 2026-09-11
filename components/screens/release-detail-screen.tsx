"use client"

import Link from "next/link"
import { ArrowLeft, Check, Heart, Plus } from "lucide-react"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import { conditionUsesNewUnbuiltReference } from "@/lib/analytics"
import { formatDate, formatMoney, formatPercent } from "@/lib/format"
import type { Condition, Product, ProductRelease } from "@/lib/types"
import type { ReleaseMarketSignalView } from "@/lib/market/view-types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ProductImage } from "@/components/catalog/product-image"
import { MarketSignalCard } from "@/components/market-bits"
import { MarketDataEmptyCard } from "@/components/market-data-empty-card"
import { AddToCollectionDialog, AddToWishlistDialog } from "@/components/add-item-dialogs"
import { CollectorsSection } from "@/components/collectors-section"
import { cn } from "@/lib/utils"

export function ReleaseDetailScreen({
  product,
  release,
  marketSignal,
  localizedDescription,
}: {
  product: Product
  release: ProductRelease
  marketSignal?: ReleaseMarketSignalView | null
  localizedDescription?: { en: string | null; it: string | null }
}) {
  const { collection } = useStore()
  const { locale } = useI18n()
  const it = locale === "it"
  const mine = collection.filter((item) => item.productId === product.id && item.releaseId === release.id)
  const hasExactImage = (release.images?.length ?? 0) > 0
  const publicDescription = it
    ? localizedDescription?.it ?? localizedDescription?.en ?? product.description
    : localizedDescription?.en ?? product.description

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" render={<Link href={`/catalog/${product.id}`} />} className="-ml-2 w-fit text-muted-foreground">
        <ArrowLeft data-icon="inline-start" /> {it ? `Torna a ${product.name}` : `Back to ${product.name}`}
      </Button>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-3">
          <ProductImage product={product} release={release} className="aspect-[4/3] w-full rounded-xl border" size="lg" />
          <p className="text-xs text-muted-foreground">
            {hasExactImage
              ? (it ? "Immagine esatta di questa release." : "Exact image for this release.")
              : (it ? "L'immagine esatta di questa release non è ancora disponibile: viene mostrata l'immagine del modello." : "Exact image for this release is not available yet — showing the model image instead.")}
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{product.series}</Badge>
              <Badge variant="outline">{releaseTypeLabel(release.releaseType, it)}</Badge>
              {release.isOriginal
                ? <Badge variant="outline">{it ? "Release originale" : "Original release"}</Badge>
                : <Badge variant="secondary" className="bg-brand/15 text-brand">{it ? "Riedizione / edizione" : "Reissue / edition"}</Badge>}
              <ProductionBadge status={release.productionStatus} it={it} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-3xl">{release.editionName}</h1>
            <p className="text-sm text-muted-foreground">
              {it ? "Release di" : "Release of"}{" "}
              <Link href={`/catalog/${product.id}`} className="font-medium text-foreground hover:text-brand hover:underline">{product.name}</Link>
            </p>
            {publicDescription ? <p className="leading-relaxed text-muted-foreground text-pretty">{publicDescription}</p> : null}
          </div>

          {marketSignal ? (
            <MarketSignalCard
              signal={marketSignal}
              title={it ? "Valore attuale stimato" : "Estimated current value"}
              rarity={release.rarity ?? null}
            />
          ) : (
            <MarketDataEmptyCard title={it ? "Valore attuale stimato" : "Estimated current value"} />
          )}

          {mine.length > 0 ? (
            <OwnedCopiesCard copies={mine} marketSignal={marketSignal} it={it} />
          ) : null}

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border bg-card p-4 text-sm">
            <Spec label={it ? "Codice articolo" : "Item no."} value={release.itemNumber ? `#${release.itemNumber}` : "—"} />
            <Spec label={it ? "Data di uscita" : "Release date"} value={release.releaseDate ? formatDate(release.releaseDate) : release.releaseYear ? String(release.releaseYear) : "—"} />
            <Spec label="Chassis" value={release.chassis ?? "—"} />
            <Spec label={it ? "Colore" : "Color"} value={colorLabel(release.color, it)} />
            <Spec label={it ? "Mercato" : "Market"} value={marketLabel(release.countryMarket, it)} />
            <Spec label={it ? "Tipo edizione" : "Edition type"} value={editionTypeLabel(release.editionType, it)} />
            <Spec label={it ? "Produzione" : "Production"} value={productionStatusLabel(release.productionStatus, it)} />
            <Spec label="JAN barcode" value={release.barcodeJAN ?? "—"} />
            <Spec label="MSRP" value={formatReleaseMsrp(release)} />
          </div>

          <div className="flex flex-wrap gap-2">
            <AddToCollectionDialog product={product} defaultReleaseId={release.id}>
              <Button className="gap-1.5"><Plus className="size-4" /> {it ? "Aggiungi alla collezione" : "Add to collection"}</Button>
            </AddToCollectionDialog>
            <AddToWishlistDialog product={product} defaultReleaseId={release.id}>
              <Button variant="outline" className="gap-1.5"><Heart className="size-4" /> {it ? "Wishlist" : "Wishlist"}</Button>
            </AddToWishlistDialog>
          </div>
        </div>
      </div>

      <div id="collectors" className="scroll-mt-24">
        <CollectorsSection releaseId={release.id} />
      </div>
    </div>
  )
}

function OwnedCopiesCard({
  copies,
  marketSignal,
  it,
}: {
  copies: ReturnType<typeof useStore>["collection"]
  marketSignal?: ReleaseMarketSignalView | null
  it: boolean
}) {
  const currentValue = marketSignal?.valueEUR ?? null

  return (
    <div className="rounded-lg border border-success/30 bg-success/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Check className="size-4 text-success" />
        <p className="text-sm font-semibold">{it ? (copies.length === 1 ? "La tua copia" : "Le tue copie") : (copies.length === 1 ? "Your copy" : "Your copies")}</p>
        <Badge variant="secondary">{copies.length}</Badge>
      </div>
      <div className="grid gap-2">
        {copies.map((copy, index) => {
          const comparable = conditionUsesNewUnbuiltReference(copy.condition)
          const personalGain = comparable && currentValue != null && copy.acquisitionCurrency === "EUR" && copy.acquisitionPrice > 0
            ? currentValue - copy.acquisitionPrice
            : null
          const personalGainPercent = personalGain != null && copy.acquisitionPrice > 0
            ? (personalGain / copy.acquisitionPrice) * 100
            : null

          return (
            <div key={copy.id} className="rounded-md border border-border/70 bg-background/70 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium">{copies.length > 1 ? `${it ? "Copia" : "Copy"} ${index + 1} · ` : ""}{conditionLabel(copy.condition, it)}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {copy.acquisitionDate ? `${it ? "Acquistata" : "Acquired"} ${formatDate(copy.acquisitionDate)}` : (it ? "Data acquisto non indicata" : "Purchase date not provided")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{it ? "Pagato" : "Paid"}</p>
                  <p className="text-sm font-medium tabular-nums">{copy.acquisitionPrice > 0 ? formatMoney(copy.acquisitionPrice, copy.acquisitionCurrency) : "—"}</p>
                </div>
              </div>
              {comparable && currentValue != null ? (
                <div className="mt-3 flex items-end justify-between gap-3 border-t border-border/70 pt-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{it ? "Valore attuale" : "Current value"}</p>
                    <p className="text-sm font-semibold tabular-nums">{formatMoney(currentValue)}</p>
                  </div>
                  {personalGain != null && personalGainPercent != null ? (
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{it ? "Rendimento" : "Performance"}</p>
                      <p className={cn("text-sm font-semibold tabular-nums", personalGain > 0 ? "text-success" : personalGain < 0 ? "text-destructive" : "text-muted-foreground")}>
                        {personalGain > 0 ? "+" : ""}{formatMoney(personalGain)} · {formatPercent(personalGainPercent)}
                      </p>
                    </div>
                  ) : copy.acquisitionPrice > 0 && copy.acquisitionCurrency !== "EUR" ? (
                    <p className="max-w-44 text-right text-[11px] leading-tight text-muted-foreground">{it ? "Rendimento disponibile con FX storico" : "Performance available with historical FX"}</p>
                  ) : null}
                </div>
              ) : (
                <p className="mt-2 border-t border-border/70 pt-2 text-[11px] text-muted-foreground">
                  {comparable
                    ? (it ? "Valore R3 non ancora consolidato per questa release." : "R3 value is not consolidated for this release yet.")
                    : (it ? "La condizione della tua copia non è confrontata con il valore R3 dei kit nuovi/non montati." : "Your copy's condition is not compared with the R3 new/unbuilt reference.")}
                </p>
              )}
            </div>
          )
        })}
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">{it ? "Questi dati sono privati e visibili solo nella tua sessione." : "These details are private and visible only in your session."}</p>
    </div>
  )
}

function conditionLabel(value: Condition, it: boolean) {
  if (!it) return value
  const labels: Record<Condition, string> = {
    Sealed: "Sigillato",
    "New / Opened": "Nuovo / Aperto",
    Built: "Montato",
    Used: "Usato",
    Incomplete: "Incompleto",
  }
  return labels[value]
}

function ProductionBadge({ status, it }: { status: ProductRelease["productionStatus"]; it: boolean }) {
  if (status === "unknown") return null
  if (status === "discontinued") return <Badge variant="secondary">{it ? "Fuori produzione" : "Discontinued"}</Badge>
  if (status === "active") return <Badge variant="outline">{it ? "In produzione" : "In production"}</Badge>
  return <Badge variant="outline">{it ? "Annunciata" : "Announced"}</Badge>
}

function Spec({ label, value }: { label: string; value: string }) {
  return <div className="flex flex-col gap-0.5"><span className="text-xs text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>
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
    "Color Special": "Edizione colore speciale",
    "Clear Body": "Carrozzeria trasparente",
    Premium: "Premium",
    "Chassis Variant": "Variante chassis",
    Other: "Altro",
  }
  return labels[value]
}

function editionTypeLabel(value: ProductRelease["editionType"], it: boolean): string {
  if (!it) return humanize(value)
  const labels: Record<ProductRelease["editionType"], string> = {
    original: "Originale",
    premium: "Premium",
    color_special: "Edizione colore speciale",
    limited: "Edizione limitata",
    anniversary: "Edizione anniversario",
    japan_cup: "Edizione Japan Cup",
    reissue: "Riedizione",
    special: "Edizione speciale",
    other: "Altro",
  }
  return labels[value]
}

function productionStatusLabel(value: ProductRelease["productionStatus"], it: boolean): string {
  const labels = it
    ? { announced: "Annunciata", active: "In produzione", discontinued: "Fuori produzione", unknown: "Da verificare" }
    : { announced: "Announced", active: "In production", discontinued: "Discontinued", unknown: "Status to verify" }
  return labels[value]
}

function colorLabel(value: string | undefined, it: boolean): string {
  if (!value) return "—"
  if (!it) return value
  const labels: Record<string, string> = {
    Black: "Nero",
    White: "Bianco",
    Red: "Rosso",
    Blue: "Blu",
    Yellow: "Giallo",
    Green: "Verde",
    Purple: "Viola",
    Orange: "Arancione",
    Pink: "Rosa",
    Silver: "Argento",
    Gold: "Oro",
    Clear: "Trasparente",
    "Smoke Black": "Nero smoke",
    "Silver Plated": "Cromato argento",
  }
  return labels[value] ?? value
}

function marketLabel(value: string | undefined, it: boolean): string {
  if (!value) return "—"
  if (!it) return value
  const labels: Record<string, string> = {
    Japan: "Giappone",
    Europe: "Europa",
    Global: "Globale",
    USA: "USA",
  }
  return labels[value] ?? value
}

function humanize(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase())
}

function formatReleaseMsrp(release: ProductRelease): string {
  if (release.msrpEUR !== undefined) return formatMoney(release.msrpEUR, "EUR")
  if (release.msrpJPY !== undefined) return formatMoney(release.msrpJPY, "JPY")
  return "—"
}
