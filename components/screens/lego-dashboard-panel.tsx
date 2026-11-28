"use client"

import Link from "next/link"
import { ArrowRight, Boxes, CircleDollarSign, Heart, Tags } from "lucide-react"
import { SetImage } from "@/components/speed-champions/set-image"
import { LegoStatusBadge } from "@/components/speed-champions/status-badge"
import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatLegoPrice } from "@/lib/lego/price-format"
import { setImagePath, speedChampionsPath, speedChampionsSetName, type SpeedChampionsSet } from "@/lib/lego/catalog"
import type { LegoMarketSummary } from "@/lib/lego/market"
import type { LegoListItem } from "@/lib/lego/personal-list-types"
import { localizePublicPath } from "@/lib/seo/catalog-paths"
import { useI18n } from "@/lib/i18n"

export type LegoDashboardEntry = {
  item: LegoListItem
  set: SpeedChampionsSet
  market: LegoMarketSummary | null
  observedSales: number
}

export function LegoDashboardPanel({ collection, wishlist }: { collection: LegoDashboardEntry[]; wishlist: LegoDashboardEntry[] }) {
  const { locale } = useI18n()
  const it = locale === "it"
  const copy = (italian: string, english: string) => it ? italian : english
  const copies = collection.reduce((total, entry) => total + entry.item.quantity, 0)
  const tracked = [...collection, ...wishlist].filter((entry, index, all) =>
    all.findIndex((candidate) => candidate.set.setNumber === entry.set.setNumber) === index,
  )
  const withMarketData = tracked.filter((entry) => entry.market?.askingCount || entry.observedSales)
  const marketRows = withMarketData.slice(0, 5)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">LEGO Speed Champions</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">{copy("Il tuo riepilogo LEGO", "Your LEGO overview")}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{copy("Collezione, wishlist e dati di mercato disponibili per i tuoi set.", "Your collection, wishlist and available market data for saved sets.")}</p>
        </div>
        <Button variant="outline" size="sm" render={<Link href={localizePublicPath("/speed-champions/catalog", locale)} />}>{copy("Esplora il catalogo", "Explore catalog")} <ArrowRight /></Button>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={copy("Set in collezione", "Sets collected")} value={collection.length} icon={Boxes} />
        <StatCard label={copy("Copie", "Copies")} value={copies} icon={Tags} />
        <StatCard label={copy("Set desiderati", "Sets wanted")} value={wishlist.length} icon={Heart} />
        <StatCard label={copy("Set con dati di mercato", "Sets with market data")} value={withMarketData.length} icon={CircleDollarSign} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SavedSetsCard kind="collection" title={copy("La tua collezione", "Your collection")} empty={copy("Non hai ancora aggiunto set LEGO alla collezione.", "You haven't added any LEGO sets to your collection yet.")} entries={collection} locale={locale} />
        <SavedSetsCard kind="wishlist" title={copy("La tua wishlist", "Your wishlist")} empty={copy("Non hai ancora aggiunto set LEGO ai desideri.", "You haven't added any LEGO sets to your wishlist yet.")} entries={wishlist} locale={locale} />
      </div>

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">{copy("Mercato dei tuoi set", "Market for your sets")}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">{copy("Prezzi richiesti e vendite osservate. I prezzi richiesti non sono una stima del valore.", "Asking prices and observed sales. Asking prices are not a valuation.")}</p>
          </div>
          <Button variant="ghost" size="sm" render={<Link href={localizePublicPath("/speed-champions/market", locale)} />}>{copy("Tutti i dati", "All market data")} <ArrowRight /></Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {tracked.length === 0 ? <p className="py-3 text-sm text-muted-foreground">{copy("Aggiungi un set alla collezione o alla wishlist per seguirne i dati.", "Add a set to your collection or wishlist to follow its data.")}</p>
            : marketRows.length === 0 ? <p className="py-3 text-sm text-muted-foreground">{copy("Per i tuoi set non sono ancora disponibili prezzi richiesti o vendite osservate.", "No asking prices or observed sales are available for your sets yet.")}</p>
              : marketRows.map(({ set, market, observedSales }) => <Link key={set.setNumber} href={speedChampionsPath(set.setNumber, locale)} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 px-3 py-2.5 transition-colors hover:bg-accent">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">#{set.setNumber} · {speedChampionsSetName(set, locale)}</span>
                <span className="text-right text-xs text-muted-foreground">
                  {market?.askingLowCents != null ? `${copy("Annunci da", "Asking from")} ${formatLegoPrice(market.askingLowCents, locale)}` : copy("Nessun prezzo richiesto", "No asking price")}
                  {observedSales > 0 ? ` · ${observedSales} ${copy("vendite osservate", "observed sales")}` : ""}
                </span>
              </Link>)}
        </CardContent>
      </Card>
    </div>
  )
}

function SavedSetsCard({ kind, title, empty, entries, locale }: { kind: "collection" | "wishlist"; title: string; empty: string; entries: LegoDashboardEntry[]; locale: "it" | "en" }) {
  const it = locale === "it"
  const href = localizePublicPath(kind === "wishlist" ? "/speed-champions/wishlist" : "/speed-champions/collection", locale)
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button variant="ghost" size="sm" render={<Link href={href} />}>{it ? "Gestisci" : "Manage"} <ArrowRight /></Button>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : <div className="grid gap-2 sm:grid-cols-2">
          {entries.slice(0, 4).map(({ item, set, market }) => <Link key={set.setNumber} href={speedChampionsPath(set.setNumber, locale)} className="flex min-w-0 items-center gap-3 rounded-lg border border-border/70 p-2 transition-colors hover:bg-accent">
            <span className="size-14 shrink-0 overflow-hidden rounded-md border bg-white"><SetImage src={setImagePath(set.setNumber, "box")} alt="" thumbnail sizes="56px" /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{speedChampionsSetName(set, locale)}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">#{set.setNumber}{item.kind === "collection" ? ` · ${item.quantity} ${it ? "copie" : item.quantity === 1 ? "copy" : "copies"}` : " · Wishlist"}</span>
              {market?.askingLowCents != null && <span className="mt-0.5 block text-xs font-semibold">{it ? "Annunci da" : "Asking from"} {formatLegoPrice(market.askingLowCents, locale)}</span>}
            </span>
            <LegoStatusBadge status={set.status} locale={locale} />
          </Link>)}
        </div>}
      </CardContent>
    </Card>
  )
}
