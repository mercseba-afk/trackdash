"use client"

import Link from "next/link"
import { ArrowLeft, Check, ExternalLink, Heart, Info, Plus } from "lucide-react"
import { getReleaseEstimate } from "@/lib/data/market"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import { enrichCollection, itemsForProduct } from "@/lib/analytics"
import { formatDate, formatMoney } from "@/lib/format"
import type { Product, ProductRelease } from "@/lib/types"
import type { ReleaseMarketSignalView } from "@/lib/market/view-types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProductImage } from "@/components/catalog/product-image"
import { MarketEstimateCard, MarketSignalCard, RarityBadge } from "@/components/market-bits"
import { AddToCollectionDialog, AddToWishlistDialog } from "@/components/add-item-dialogs"
import { CollectorsSection } from "@/components/collectors-section"

export function ReleaseDetailScreen({
  product,
  release,
  marketSignal,
}: {
  product: Product
  release: ProductRelease
  marketSignal?: ReleaseMarketSignalView | null
}) {
  const { collection } = useStore()
  const { locale } = useI18n()
  const it = locale === "it"
  const owned = enrichCollection(collection)
  const mine = itemsForProduct(owned, product.id).filter((item) => item.release.id === release.id)
  const demoEstimate = getReleaseEstimate(product, release)
  const hasExactImage = (release.images?.length ?? 0) > 0

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" render={<Link href={`/catalog/${product.id}`} />} className="-ml-2 w-fit text-muted-foreground">
        <ArrowLeft data-icon="inline-start" /> {it ? `Torna a ${product.name}` : `Back to ${product.name}`}
      </Button>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-3">
          <ProductImage product={product} release={release} className="aspect-[4/3] w-full rounded-xl border" size="lg" />
          <p className="text-xs text-muted-foreground">{hasExactImage ? (it ? "Immagine esatta di questa release." : "Exact image for this release.") : (it ? "L'immagine esatta di questa release non è ancora disponibile: viene mostrata l'immagine del modello." : "Exact image for this release is not available yet — showing the model image instead.")}</p>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{product.series}</Badge>
              <Badge variant="outline">{release.releaseType}</Badge>
              {release.isOriginal ? <Badge variant="outline">{it ? "Release originale" : "Original release"}</Badge> : <Badge variant="secondary" className="bg-brand/15 text-brand">{it ? "Riedizione / edizione" : "Reissue / edition"}</Badge>}
              <RarityBadge rarity={release.rarity ?? product.rarity} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-3xl">{release.editionName}</h1>
            <p className="text-sm text-muted-foreground">{it ? "Release di" : "Release of"}{" "}<Link href={`/catalog/${product.id}`} className="font-medium text-foreground hover:text-brand hover:underline">{product.name}</Link></p>
            {product.description ? <p className="leading-relaxed text-muted-foreground text-pretty">{product.description}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border bg-card p-4 text-sm">
            <Spec label={it ? "Codice articolo" : "Item no."} value={release.itemNumber ? `#${release.itemNumber}` : "—"} />
            <Spec label={it ? "Data di uscita" : "Release date"} value={release.releaseDate ? formatDate(release.releaseDate) : release.releaseYear ? String(release.releaseYear) : "—"} />
            <Spec label="Chassis" value={release.chassis ?? "—"} />
            <Spec label={it ? "Colore" : "Color"} value={release.color ?? "—"} />
            <Spec label={it ? "Mercato" : "Market"} value={release.countryMarket ?? "—"} />
            <Spec label={it ? "Tipo edizione" : "Edition type"} value={humanize(release.editionType)} />
            <Spec label={it ? "Produzione" : "Production"} value={humanize(release.productionStatus)} />
            <Spec label={it ? "Verifica" : "Verification"} value={humanize(release.verificationStatus)} />
            <Spec label="JAN barcode" value={release.barcodeJAN ?? "—"} />
            <Spec label="MSRP" value={formatReleaseMsrp(release)} />
          </div>

          <div className="flex flex-wrap gap-2">
            <AddToCollectionDialog product={product} defaultReleaseId={release.id}><Button className="gap-1.5"><Plus className="size-4" /> {it ? "Aggiungi questa release" : "Add this release"}</Button></AddToCollectionDialog>
            <AddToWishlistDialog product={product} defaultReleaseId={release.id}><Button variant="outline" className="gap-1.5"><Heart className="size-4" /> {it ? "Aggiungi release ai desideri" : "Wishlist this release"}</Button></AddToWishlistDialog>
          </div>

          {mine.length > 0 ? <div className="rounded-lg border border-success/40 bg-success/5 px-3 py-2 text-sm text-success"><Check className="mr-1 inline size-4" />{it ? `Possiedi ${mine.length} ${mine.length === 1 ? "copia" : "copie"} di questa release esatta.` : `You own ${mine.length} ${mine.length === 1 ? "copy" : "copies"} of this exact release.`}</div> : null}
        </div>
      </div>

      <div id="collectors" className="scroll-mt-24"><CollectorsSection releaseId={release.id} /></div>

      <div className="grid gap-4 lg:grid-cols-2">
        {marketSignal ? (
          <MarketSignalCard signal={marketSignal} title={it ? "Valore di mercato — questa release" : "Market value — this release"} msrp={release.msrpEUR} />
        ) : (
          <MarketEstimateCard estimate={demoEstimate} title={it ? "Valore di mercato — questa release" : "Market value — this release"} msrp={release.msrpEUR} />
        )}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Info className="size-4 text-muted-foreground" /> {it ? "Valutazione specifica della release" : "Release-specific valuation"}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p>{it ? "Questa stima è legata a questa specifica release commerciale, non solo al modello. Edizioni diverse possono avere rarità, età e valore di mercato differenti anche se condividono lo stesso Product." : "This estimate is tied to this exact commercial release, not just to the parent model. Different editions can have different rarity, age and market value even when they share the same Product."}</p>
            <p>
              {marketSignal
                ? (it
                    ? "Il valore R3 combina retail realmente disponibile, marketplace a prezzo fisso attivo e vendite concluse. I prezzi esauriti restano nello storico ma non entrano nel mercato corrente; la spedizione è conservata separatamente e non viene sommata al valore del modello."
                    : "The R3 value combines genuinely available retail, active fixed-price marketplace offers, and completed sales. Out-of-stock prices remain historical only; shipping is stored separately and is not added to the collectible value.")
                : (it
                    ? "I dati reali di mercato per questa release non sono ancora sufficientemente collegati alla superficie pubblica. Nessuna stima demo viene mostrata come valore reale."
                    : "Real market evidence for this release is not yet connected to the public surface. Demo estimates are never shown as real market value.")}
            </p>
          </CardContent>
        </Card>
      </div>

      {release.notes ? <Card><CardHeader><CardTitle className="text-base">{it ? "Note sulla release" : "Release notes"}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{release.notes}</CardContent></Card> : null}

      {release.sources.length > 0 ? (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base">{it ? "Fonti e verifica" : "Sources & verification"}<Badge variant="secondary">{release.sources.length}</Badge></CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            {release.sources.map((source) => (
              <div key={source.id} className="rounded-lg border border-border bg-background p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{humanize(source.sourceType)}</Badge>{source.checkedAt ? <span className="text-xs text-muted-foreground">{it ? "Controllata" : "Checked"} {formatDate(source.checkedAt)}</span> : null}</div>
                  {source.sourceUrl ? <a href={source.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">{it ? "Apri fonte" : "Open source"} <ExternalLink className="size-3" /></a> : null}
                </div>
                {source.verifiedFields.length > 0 ? <p className="mt-2 text-xs text-muted-foreground">{it ? "Verifica" : "Verifies"}: {source.verifiedFields.map(humanize).join(", ")}</p> : null}
                {source.notes ? <p className="mt-1 text-xs text-muted-foreground">{source.notes}</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

function Spec({ label, value }: { label: string; value: string }) { return <div className="flex flex-col gap-0.5"><span className="text-xs text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div> }
function humanize(value: string): string { return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase()) }
function formatReleaseMsrp(release: ProductRelease): string { if (release.msrpEUR !== undefined) return formatMoney(release.msrpEUR, "EUR"); if (release.msrpJPY !== undefined) return formatMoney(release.msrpJPY, "JPY"); return "—" }
