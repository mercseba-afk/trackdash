"use client"

import Link from "next/link"
import { ArrowLeft, BarChart3, Check, Heart, Info, LockKeyhole, Plus, ShoppingBag, Tag } from "lucide-react"
import { AddToCollectionDialog, AddToWishlistDialog } from "@/components/add-item-dialogs"
import { ProductImage } from "@/components/catalog/product-image"
import { ReleaseCollectorOffers } from "@/components/release-collector-offers"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { conditionUsesNewUnbuiltReference } from "@/lib/analytics"
import { formatDate, formatMoney, formatPercent } from "@/lib/format"
import { useI18n } from "@/lib/i18n"
import type { ReleaseMarketSignalView } from "@/lib/market/view-types"
import { useStore } from "@/lib/store"
import type { Condition, Currency, Product, ProductRelease } from "@/lib/types"
import { cn } from "@/lib/utils"

type PublicCollectorOffer = {
  id: string
  username: string
  condition: Condition
  askingPrice: number | null
  askingCurrency: Currency | null
  updatedAt: string
}

export function ReleaseDetailScreen({
  product,
  release,
  marketSignal,
  localizedDescription,
  collectorOffers,
}: {
  product: Product
  release: ProductRelease
  marketSignal?: ReleaseMarketSignalView | null
  localizedDescription?: { en: string | null; it: string | null }
  collectorOffers: PublicCollectorOffer[]
}) {
  const { collection, user } = useStore()
  const { locale } = useI18n()
  const it = locale === "it"
  const mine = collection.filter((item) => item.productId === product.id && item.releaseId === release.id)
  const hasExactImage = (release.images?.length ?? 0) > 0
  const publicDescription = it
    ? localizedDescription?.it ?? localizedDescription?.en ?? product.description
    : localizedDescription?.en ?? product.description
  const releasePath = `/catalog/${product.id}/releases/${release.id}`
  const loginHref = `/login?next=${encodeURIComponent(releasePath)}`
  const showAdvancedMarketEvidence = Boolean(user)

  return (
    <div className="flex flex-col gap-7 pb-8">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href={`/catalog/${product.id}`} />}
        className="-ml-2 w-fit text-[#607089] hover:text-[#0f4bb4]"
      >
        <ArrowLeft data-icon="inline-start" /> {it ? `Torna a ${product.name}` : `Back to ${product.name}`}
      </Button>

      <section className="grid gap-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)] lg:items-start">
        <div className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-2xl border border-[#d8e3f0] bg-white p-3 shadow-sm">
            <ProductImage product={product} release={release} className="aspect-[4/3] w-full rounded-xl" size="lg" />
          </div>
          <p className="px-1 text-xs leading-5 text-[#718198]">
            {hasExactImage
              ? (it ? "Immagine esatta della Release." : "Exact image for this Release.")
              : (it
                  ? "L'immagine esatta della Release non è ancora disponibile: viene mostrata l'immagine del modello."
                  : "The exact Release image is not available yet, so the model image is shown instead.")}
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="bg-[#eef4ff] text-[#0f4bb4]">{product.series}</Badge>
              <Badge variant="outline" className="border-[#ccd8e7] text-[#53657f]">{releaseTypeLabel(release.releaseType, it)}</Badge>
              {release.itemNumber ? (
                <Badge variant="outline" className="border-[#ccd8e7] font-mono text-[#53657f]">#{release.itemNumber}</Badge>
              ) : null}
              <ProductionBadge status={release.productionStatus} it={it} />
            </div>

            <p className="mt-4 text-sm font-medium text-[#0f4bb4]">{product.name}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-[-0.035em] text-balance text-[#081a3a] md:text-4xl">
              {release.editionName}
            </h1>
            <p className="mt-2 text-sm text-[#718198]">
              {release.releaseYear ? `${release.releaseYear} · ` : ""}{release.chassis ?? (it ? "Chassis da verificare" : "Chassis to verify")}
            </p>
            {publicDescription ? (
              <p className="mt-4 max-w-2xl text-[15px] leading-7 text-pretty text-[#53657f]">{publicDescription}</p>
            ) : null}
          </div>

          <MarketValuePanel signal={marketSignal} it={it} showAdvanced={showAdvancedMarketEvidence} />

          <div className="flex flex-wrap gap-2">
            {user ? (
              <>
                <AddToCollectionDialog product={product} defaultReleaseId={release.id}>
                  <Button className="gap-1.5"><Plus className="size-4" /> {it ? "Aggiungi alla collezione" : "Add to collection"}</Button>
                </AddToCollectionDialog>
                <AddToWishlistDialog product={product} defaultReleaseId={release.id}>
                  <Button variant="outline" className="gap-1.5"><Heart className="size-4" /> Wishlist</Button>
                </AddToWishlistDialog>
              </>
            ) : (
              <>
                <Button render={<Link href={loginHref} />} className="gap-1.5">
                  <LockKeyhole className="size-4" /> {it ? "Accedi e aggiungi alla collezione" : "Sign in and add to collection"}
                </Button>
                <Button variant="outline" render={<Link href={loginHref} />} className="gap-1.5">
                  <Heart className="size-4" /> Wishlist
                </Button>
              </>
            )}
          </div>

          {mine.length > 0 ? <OwnedCopiesCard copies={mine} marketSignal={marketSignal} it={it} /> : null}
        </div>
      </section>

      <ReleaseCollectorOffers offers={collectorOffers} />

      <section className="grid gap-5 lg:grid-cols-2">
        <ExternalAvailabilityCard signal={marketSignal} it={it} showAdvanced={showAdvancedMarketEvidence} />
        <PriceIntelligenceCard
          signal={marketSignal}
          it={it}
          authenticated={showAdvancedMarketEvidence}
          loginHref={loginHref}
        />
      </section>

      <section className="rounded-2xl border border-[#d8e3f0] bg-white p-5 shadow-sm md:p-6">
        <div className="flex items-center gap-2">
          <Tag className="size-4 text-[#0f4bb4]" />
          <h2 className="text-lg font-semibold text-[#081a3a]">{it ? "Dettagli della Release" : "Release details"}</h2>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-x-7 gap-y-5 text-sm sm:grid-cols-3 lg:grid-cols-5">
          <Spec label={it ? "Codice articolo" : "Item no."} value={release.itemNumber ? `#${release.itemNumber}` : "—"} />
          <Spec label={it ? "Data di uscita" : "Release date"} value={release.releaseDate ? formatDate(release.releaseDate) : release.releaseYear ? String(release.releaseYear) : "—"} />
          <Spec label="Chassis" value={release.chassis ?? "—"} />
          <Spec label={it ? "Colore" : "Color"} value={colorLabel(release.color, it)} />
          <Spec label={it ? "Mercato" : "Market"} value={marketLabel(release.countryMarket, it)} />
          <Spec label={it ? "Tipo edizione" : "Edition type"} value={editionTypeLabel(release.editionType, it)} />
          <Spec label={it ? "Produzione" : "Production"} value={productionStatusLabel(release.productionStatus, it)} />
          <Spec label="JAN barcode" value={release.barcodeJAN ?? "—"} />
          <Spec label="MSRP" value={formatReleaseMsrp(release)} />
          <Spec label={it ? "Rarità" : "Rarity"} value={release.rarity ?? "—"} />
        </div>
      </section>
    </div>
  )
}

function MarketValuePanel({
  signal,
  it,
  showAdvanced,
}: {
  signal?: ReleaseMarketSignalView | null
  it: boolean
  showAdvanced: boolean
}) {
  if (!signal || signal.valueEUR == null) {
    return (
      <div className="rounded-2xl border border-[#d8e3f0] bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#0f4bb4]">Market Value</p>
        <p className="mt-2 text-2xl font-semibold text-[#081a3a]">{it ? "Valore non ancora consolidato" : "Value not consolidated yet"}</p>
        <p className="mt-2 text-sm leading-6 text-[#718198]">
          {it ? "TrackDash non mostra un valore finché le evidenze disponibili non sono sufficienti." : "TrackDash withholds the value until the available evidence is sufficient."}
        </p>
      </div>
    )
  }

  const range = signal.lowEUR != null && signal.highEUR != null
    ? signal.lowEUR === signal.highEUR
      ? formatMoney(signal.lowEUR)
      : `${formatMoney(signal.lowEUR)} – ${formatMoney(signal.highEUR)}`
    : "—"

  return (
    <div className="rounded-2xl border border-[#bfd2ee] bg-[linear-gradient(135deg,#f7fbff_0%,#eef5ff_100%)] p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f4bb4]">TrackDash Market Value</p>
          <p className="mt-2 text-4xl font-semibold tracking-[-0.04em] tabular-nums text-[#081a3a]">{formatMoney(signal.valueEUR)}</p>
          <p className="mt-1 text-sm text-[#607089]">{it ? "Valore attuale stimato · Kit nuovo / completo / non montato" : "Estimated current value · New / complete / unbuilt kit"}</p>
        </div>
        <ConfidenceBadge value={signal.confidenceLabel} it={it} />
      </div>

      <div className={cn("mt-5 grid grid-cols-2 gap-3", showAdvanced ? "sm:grid-cols-4" : "sm:grid-cols-2")}>
        <Metric label={it ? "Range" : "Range"} value={range} />
        {showAdvanced ? <Metric label={it ? "Vendite osservate" : "Observed sold"} value={String(signal.soldUnits)} /> : null}
        {showAdvanced ? <Metric label={it ? "Offerte correnti" : "Current offers"} value={String(signal.currentOfferCount)} /> : null}
        <Metric
          label={it ? "Trend" : "Trend"}
          value={signal.trendPercent != null ? formatPercent(signal.trendPercent) : "—"}
        />
      </div>

      <p className="mt-4 flex gap-2 text-xs leading-5 text-[#667991]">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        {it
          ? "Il Market Value è una stima TrackDash: le richieste dei venditori restano separate dalle vendite concluse e non possono gonfiare da sole il valore."
          : "Market Value is a TrackDash estimate: seller asks stay separate from completed sales and cannot inflate the value on their own."}
      </p>
    </div>
  )
}

function ExternalAvailabilityCard({
  signal,
  it,
  showAdvanced,
}: {
  signal?: ReleaseMarketSignalView | null
  it: boolean
  showAdvanced: boolean
}) {
  const current = signal?.currentOfferCount ?? 0
  const starting = signal?.startingItemPriceEUR ?? null

  return (
    <section className="rounded-2xl border border-[#d8e3f0] bg-white p-5 shadow-sm md:p-6">
      <div className="flex items-center gap-2">
        <ShoppingBag className="size-4 text-[#0f4bb4]" />
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0f4bb4]">{it ? "Mercato esterno" : "External market"}</p>
      </div>
      <h2 className="mt-2 text-xl font-semibold text-[#081a3a]">{it ? "Altre disponibilità sul mercato" : "Other market availability"}</h2>

      {current > 0 && starting != null ? (
        <div className="mt-5 rounded-xl border border-[#dce5ef] bg-[#f8fafc] p-4">
          <p className="text-sm text-[#607089]">{it ? "Prezzo articolo più basso rilevato" : "Lowest observed item price"}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-[#081a3a]">{it ? "Da" : "From"} {formatMoney(starting)}</p>
          <p className="mt-1 text-xs text-[#718198]">
            {showAdvanced
              ? `${current} ${it ? "offerte correnti qualificate · spedizione esclusa" : "qualified current offers · shipping excluded"}`
              : (it ? "Spedizione esclusa" : "Shipping excluded")}
          </p>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-[#cbd8e7] bg-[#f8fafc] p-4 text-sm leading-6 text-[#607089]">
          {it
            ? "Nessuna disponibilità esterna qualificata è attualmente mostrata per questa Release. Gli ASK anomali o non sufficientemente affidabili restano fuori dalla superficie pubblica."
            : "No qualified external availability is currently shown for this Release. Anomalous or insufficiently reliable asks stay off the public surface."}
        </div>
      )}

      <p className="mt-4 text-xs leading-5 text-[#7a8aa0]">
        {it ? "Le disponibilità esterne sono secondarie rispetto alle offerte dei collezionisti TrackDash." : "External availability is secondary to TrackDash collector offers."}
      </p>
    </section>
  )
}

function PriceIntelligenceCard({
  signal,
  it,
  authenticated,
  loginHref,
}: {
  signal?: ReleaseMarketSignalView | null
  it: boolean
  authenticated: boolean
  loginHref: string
}) {
  return (
    <section className="rounded-2xl border border-[#d8e3f0] bg-white p-5 shadow-sm md:p-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="size-4 text-[#0f4bb4]" />
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0f4bb4]">Price Intelligence</p>
      </div>
      <h2 className="mt-2 text-xl font-semibold text-[#081a3a]">{it ? "Da cosa nasce il valore" : "What supports the value"}</h2>

      {authenticated ? (
        signal ? (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <AnchorMetric label={it ? "Venduto" : "Sold"} value={signal.soldAnchorEUR} count={signal.soldUnits} />
            <AnchorMetric label="Retail" value={signal.retailAnchorEUR} count={signal.retailSourceCount} />
            <AnchorMetric label={it ? "ASK attive" : "Active ASK"} value={signal.activeAnchorEUR} count={signal.activeOfferCount} />
            <Metric label={it ? "Aggiornato" : "Updated"} value={formatDate(signal.computedAt)} />
          </div>
        ) : (
          <p className="mt-5 text-sm leading-6 text-[#607089]">{it ? "Dati di mercato non ancora disponibili." : "Market evidence is not available yet."}</p>
        )
      ) : (
        <div className="mt-5 rounded-xl border border-[#dce5ef] bg-[#f8fafc] p-4">
          <div className="flex items-start gap-3">
            <LockKeyhole className="mt-0.5 size-4 shrink-0 text-[#0f4bb4]" />
            <div>
              <p className="text-sm font-semibold text-[#1b2f4d]">{it ? "Dettaglio dei segnali riservato agli utenti" : "Signal details are available to signed-in users"}</p>
              <p className="mt-1 text-xs leading-5 text-[#718198]">
                {it
                  ? "Market Value, range, trend e prezzo “Da” restano pubblici. Accedi per vedere gli anchor Sold, Retail e ASK che supportano il valore."
                  : "Market Value, range, trend and the From price stay public. Sign in to see the Sold, Retail and ASK anchors supporting the value."}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {!authenticated ? (
          <Button size="sm" render={<Link href={loginHref} />}>
            <LockKeyhole className="size-4" /> {it ? "Accedi ai dettagli" : "Sign in for details"}
          </Button>
        ) : null}
        <Button variant="outline" size="sm" render={<Link href="/market" />}>
          {it ? "Vedi il metodo Price Intelligence" : "View Price Intelligence method"}
        </Button>
      </div>
    </section>
  )
}

function AnchorMetric({ label, value, count }: { label: string; value: number | null; count: number }) {
  return (
    <div className="rounded-xl border border-[#e0e7f0] bg-[#fbfcfe] p-3">
      <p className="text-xs text-[#718198]">{label}</p>
      <p className="mt-1 font-semibold tabular-nums text-[#081a3a]">{value != null ? formatMoney(value) : "—"}</p>
      <p className="mt-0.5 text-[11px] text-[#8a98aa]">{count} {count === 1 ? "signal" : "signals"}</p>
    </div>
  )
}

function ConfidenceBadge({ value, it }: { value: ReleaseMarketSignalView["confidenceLabel"]; it: boolean }) {
  const label = value === "high"
    ? (it ? "Affidabilità alta" : "High confidence")
    : value === "medium"
      ? (it ? "Affidabilità media" : "Medium confidence")
      : (it ? "Affidabilità bassa" : "Low confidence")
  return <Badge variant="outline" className="border-[#aac4e9] bg-white/70 text-[#0f4bb4]">{label}</Badge>
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/80 bg-white/70 p-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#7a8aa0]">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-[#081a3a]">{value}</p>
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
    <div className="rounded-xl border border-success/30 bg-success/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Check className="size-4 text-success" />
        <p className="text-sm font-semibold">{it ? (copies.length === 1 ? "La tua copia" : "Le tue copie") : (copies.length === 1 ? "Your copy" : "Your copies")}</p>
        <Badge variant="secondary">{copies.length}</Badge>
      </div>
      <div className="grid gap-2">
        {copies.map((copy, index) => {
          const comparable = conditionUsesNewUnbuiltReference(copy.condition)
          const acquisitionBasisEUR = copy.acquisitionPriceEUR ?? null
          const personalGain = comparable && currentValue != null && acquisitionBasisEUR != null && acquisitionBasisEUR > 0
            ? currentValue - acquisitionBasisEUR
            : null
          const personalGainPercent = personalGain != null && acquisitionBasisEUR != null && acquisitionBasisEUR > 0
            ? (personalGain / acquisitionBasisEUR) * 100
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
                  {copy.acquisitionCurrency !== "EUR" && acquisitionBasisEUR != null ? (
                    <p className="mt-0.5 text-[10px] tabular-nums text-muted-foreground">
                      {it ? "Base storica" : "Historical basis"} {formatMoney(acquisitionBasisEUR)}{copy.acquisitionFxRateDate ? ` · ECB ${formatDate(copy.acquisitionFxRateDate)}` : ""}
                    </p>
                  ) : null}
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
                    <p className="max-w-44 text-right text-[11px] leading-tight text-muted-foreground">
                      {copy.acquisitionDate
                        ? (it ? "Cambio storico ECB non disponibile." : "Historical ECB rate unavailable.")
                        : (it ? "Aggiungi la data d'acquisto per calcolare il rendimento." : "Add the purchase date to calculate performance.")}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="mt-2 border-t border-border/70 pt-2 text-[11px] text-muted-foreground">
                  {comparable
                    ? (it ? "Valore R3 non ancora consolidato per questa Release." : "R3 value is not consolidated for this Release yet.")
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
  return <div className="flex flex-col gap-1"><span className="text-xs text-[#7a8aa0]">{label}</span><span className="font-medium text-[#1b2f4d]">{value}</span></div>
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
