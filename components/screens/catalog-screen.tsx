"use client"

import * as React from "react"
import Link from "next/link"
import { Search, LayoutGrid, List, SlidersHorizontal, X, Check, Heart, PackageSearch } from "lucide-react"
import type { Product } from "@/lib/types"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import { ProductCard } from "@/components/product-card"
import { ProductImage } from "@/components/catalog/product-image"
import { AddToCollectionDialog, AddToWishlistDialog } from "@/components/add-item-dialogs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { cn } from "@/lib/utils"

type SortKey = "name" | "year-desc" | "year-asc"
type View = "grid" | "list"

export function CatalogScreen({ products, initialQuery = "" }: { products: Product[]; initialQuery?: string }) {
  const { isInCollection, isInWishlist } = useStore()
  const { locale, t } = useI18n()
  const it = locale === "it"
  const [query, setQuery] = React.useState(initialQuery)
  const [chassis, setChassis] = React.useState<string>("all")
  const [series, setSeries] = React.useState<string>("all")
  const [rarity, setRarity] = React.useState<string>("all")
  const [sort, setSort] = React.useState<SortKey>("year-asc")
  const [view, setView] = React.useState<View>("grid")
  const [ownedOnly, setOwnedOnly] = React.useState(false)

  const chassisOptions = React.useMemo(
    () => Array.from(new Set(products.map((p) => p.chassis).filter((c): c is NonNullable<typeof c> => Boolean(c)))),
    [products],
  )
  const seriesOptions = React.useMemo(() => Array.from(new Set(products.map((p) => p.series))), [products])

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    let items = products.filter((p) => {
      if (chassis !== "all" && p.chassis !== chassis) return false
      if (series !== "all" && p.series !== series) return false
      if (rarity !== "all" && !p.releases.some((release) => release.rarity === rarity)) return false
      if (ownedOnly && !isInCollection(p.id)) return false
      if (q) {
        const itemNumbers = p.releases.map((r) => r.itemNumber ?? "").join(" ")
        const releaseNames = p.releases.map((r) => r.editionName).join(" ")
        const hay = `${p.name} ${p.japaneseName ?? ""} ${p.chassis ?? ""} ${p.series} ${p.itemNumber ?? ""} ${itemNumbers} ${releaseNames}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })

    items = items.sort((a, b) => {
      switch (sort) {
        case "name": return a.name.localeCompare(b.name)
        case "year-desc": return (b.originalReleaseYear ?? -Infinity) - (a.originalReleaseYear ?? -Infinity)
        case "year-asc": return (a.originalReleaseYear ?? Infinity) - (b.originalReleaseYear ?? Infinity)
      }
    })
    return items
  }, [products, query, chassis, series, rarity, sort, ownedOnly, isInCollection])

  const hasFilters = chassis !== "all" || series !== "all" || rarity !== "all" || ownedOnly || query.trim()
  const sortLabel = (value: SortKey) => value === "year-desc"
    ? (it ? "Più recenti" : "Newest")
    : value === "year-asc"
      ? (it ? "Più vecchi" : "Oldest")
      : (it ? "Nome A–Z" : "Name A–Z")

  function reset() {
    setQuery("")
    setChassis("all")
    setSeries("all")
    setRarity("all")
    setOwnedOnly(false)
  }

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <section className="overflow-hidden rounded-3xl border border-brand/10 bg-gradient-to-br from-white via-white to-brand/5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-7">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">TRACKDASH · MINI 4WD</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{t("catalog.title")}</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {it
                ? `${products.length} modelli Mini 4WD. Ogni scheda separa le diverse Release per anno, Item Number, chassis ed edizione.`
                : `${products.length} Mini 4WD models. Each page separates Releases by year, Item Number, chassis and edition.`}
            </p>
          </div>

          <div className="shrink-0 rounded-2xl border border-border/60 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{it ? "Nel catalogo" : "In catalog"}</p>
            <p className="mt-0.5 text-2xl font-semibold tabular-nums text-foreground">{products.length}</p>
            <p className="text-xs text-muted-foreground">{it ? "modelli censiti" : "tracked models"}</p>
          </div>
        </div>

        <div className="border-t border-brand/10 bg-white/70 p-3 sm:p-4 lg:px-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("catalog.search")}
              className="h-12 rounded-xl border-border/70 bg-white pl-10 pr-10 text-sm shadow-sm focus-visible:border-brand/40"
              aria-label={it ? "Cerca nel catalogo" : "Search catalog"}
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={it ? "Cancella ricerca" : "Clear search"}
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-3.5 shadow-[0_8px_26px_rgba(15,23,42,0.035)] sm:p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand"><SlidersHorizontal className="size-4" /></span>
            <div>
              <p className="text-sm font-semibold text-foreground">{it ? "Filtra il catalogo" : "Filter catalog"}</p>
              <p className="text-[11px] text-muted-foreground">{it ? "Trova più velocemente il modello o la Release che stai cercando." : "Find the model or Release you are looking for faster."}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect value={chassis} onChange={setChassis} placeholder="Chassis" options={chassisOptions} allLabel={t("catalog.allChassis")} />
            <FilterSelect value={series} onChange={setSeries} placeholder={it ? "Serie" : "Series"} options={seriesOptions} allLabel={t("catalog.allSeries")} />
            <FilterSelect value={rarity} onChange={setRarity} placeholder={it ? "Rarità" : "Rarity"} options={["Common", "Uncommon", "Rare", "Very Rare", "Grail"]} optionLabels={it ? { Common: "Comune", Uncommon: "Non comune", Rare: "Rara", "Very Rare": "Molto rara", Grail: "Grail" } : undefined} allLabel={t("catalog.allRarity")} />
            <Button variant={ownedOnly ? "default" : "outline"} size="sm" className="rounded-xl" onClick={() => setOwnedOnly((v) => !v)}><Check /> {it ? "Posseduti" : "Owned"}</Button>
            {hasFilters && <Button variant="ghost" size="sm" className="rounded-xl" onClick={reset}><X /> {it ? "Azzera" : "Clear"}</Button>}
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {results.length} {it ? (results.length === 1 ? "risultato" : "risultati") : (results.length === 1 ? "result" : "results")}
          </p>
          {hasFilters ? <p className="text-xs text-muted-foreground">{it ? "Filtri attivi" : "Active filters"}</p> : null}
        </div>

        <div className="flex items-center gap-2">
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger size="sm" className="min-w-0 flex-1 rounded-xl sm:w-40 sm:flex-none"><SelectValue>{(value: SortKey) => sortLabel(value)}</SelectValue></SelectTrigger>
            <SelectContent>
              <SelectItem value="year-desc">{sortLabel("year-desc")}</SelectItem>
              <SelectItem value="year-asc">{sortLabel("year-asc")}</SelectItem>
              <SelectItem value="name">{sortLabel("name")}</SelectItem>
            </SelectContent>
          </Select>
          <ToggleGroup value={[view]} onValueChange={(v) => v[0] && setView(v[0] as View)} className="flex rounded-xl border border-border/70 bg-card p-0.5">
            <ToggleGroupItem value="grid" aria-label={it ? "Vista griglia" : "Grid view"} className="rounded-lg"><LayoutGrid /></ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label={it ? "Vista elenco" : "List view"} className="rounded-lg"><List /></ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {results.length === 0 ? (
        <Empty className="rounded-2xl border border-dashed border-border bg-card py-16 shadow-sm">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Search /></EmptyMedia>
            {products.length === 0 ? (
              <><EmptyTitle>{it ? "Catalogo non disponibile" : "Catalog unavailable"}</EmptyTitle><EmptyDescription>{it ? "Impossibile caricare il catalogo. Controlla la connessione e riprova." : "Couldn't load the catalog right now. Check your connection and try again."}</EmptyDescription></>
            ) : (
              <><EmptyTitle>{t("catalog.noResults")}</EmptyTitle><EmptyDescription>{t("catalog.noResultsDesc")}</EmptyDescription></>
            )}
          </EmptyHeader>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {hasFilters && <Button variant="outline" className="rounded-xl" onClick={reset}>{t("catalog.clear")}</Button>}
            {products.length > 0 && query.trim() ? (
              <Button variant="ghost" className="rounded-xl" render={<Link href={`/support?category=model_release_request&query=${encodeURIComponent(query.trim())}`} />}><PackageSearch /> {it ? "Non trovi il modello? Richiedine l'inserimento" : "Can't find it? Request this model"}</Button>
            ) : null}
          </div>
        </Empty>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">{results.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {results.map((p) => {
            const owned = isInCollection(p.id)
            const wished = isInWishlist(p.id)
            return (
              <div key={p.id} className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3 shadow-[0_6px_20px_rgba(15,23,42,0.03)] transition-colors hover:border-brand/25 sm:gap-4 sm:p-3.5">
                <Link href={`/catalog/${p.id}`} className="overflow-hidden rounded-xl border border-border/50 bg-muted/20"><ProductImage product={p} size="sm" className="h-16 w-20 shrink-0 sm:h-20 sm:w-28" /></Link>
                <Link href={`/catalog/${p.id}`} className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand/80">{p.series}</p>
                  <div className="mt-0.5 flex flex-wrap items-start gap-1.5 sm:gap-2">
                    <p className="line-clamp-2 text-sm font-semibold leading-tight text-foreground transition-colors group-hover:text-brand sm:text-base">{p.name}</p>
                    {owned && <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success"><Check className="size-3" />{it ? "In collezione" : "Owned"}</span>}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                    <span>{p.originalReleaseYear ?? "—"}</span>
                    <span>·</span>
                    <span>Chassis {p.chassis ?? "—"}</span>
                    <span>·</span>
                    <span className="font-medium text-foreground">{p.releases.length} {it ? "release" : p.releases.length === 1 ? "release" : "releases"}</span>
                  </div>
                </Link>
                <div className="flex shrink-0 items-center gap-1.5">
                  <AddToWishlistDialog product={p}><Button variant="outline" size="icon-sm" aria-label={t("product.wishlist")} className={cn("rounded-xl", wished && "border-brand text-brand")}><Heart className={cn(wished && "fill-brand")} /></Button></AddToWishlistDialog>
                  <AddToCollectionDialog product={p}><Button size="icon-sm" className="rounded-xl" aria-label={it ? "Aggiungi" : "Add"}><Check /></Button></AddToCollectionDialog>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FilterSelect({ value, onChange, placeholder, options, optionLabels, allLabel }: { value: string; onChange: (v: string) => void; placeholder: string; options: readonly string[]; optionLabels?: Readonly<Record<string, string>>; allLabel: string }) {
  const labelFor = (selected: string) => selected === "all" ? allLabel : (optionLabels?.[selected] ?? selected)
  return (
    <Select value={value} onValueChange={(v) => onChange(v as string)}>
      <SelectTrigger size="sm" className={cn("rounded-xl bg-white", value !== "all" && "border-brand/50 bg-brand/5 text-brand")} aria-label={placeholder}>
        <SelectValue>{(selected: string) => labelFor(selected)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map((option) => <SelectItem key={option} value={option}>{labelFor(option)}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}
