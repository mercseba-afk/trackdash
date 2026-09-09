"use client"

import * as React from "react"
import Link from "next/link"
import { Search, LayoutGrid, List, SlidersHorizontal, X, Check, Heart } from "lucide-react"
import type { Product } from "@/lib/types"
import { primaryRelease } from "@/lib/data/products"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import { formatMoney } from "@/lib/format"
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

type SortKey = "name" | "year-desc" | "year-asc" | "value-desc" | "value-asc"
type View = "grid" | "list"

export function CatalogScreen({
  products,
  startingPrices = {},
}: {
  products: Product[]
  startingPrices?: Record<string, number>
}) {
  const { isInCollection, isInWishlist } = useStore()
  const { locale, t } = useI18n()
  const it = locale === "it"
  const [query, setQuery] = React.useState("")
  const [chassis, setChassis] = React.useState<string>("all")
  const [series, setSeries] = React.useState<string>("all")
  const [rarity, setRarity] = React.useState<string>("all")
  const [sort, setSort] = React.useState<SortKey>("value-desc")
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

      // Rarity filtering is strictly RELEASE-level. If a release has no
      // release-specific rarity yet, it stays unknown instead of inheriting the
      // Product compatibility/fallback rarity.
      if (
        rarity !== "all" &&
        !p.releases.some((release) => release.rarity === rarity)
      ) {
        return false
      }

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
        case "name":
          return a.name.localeCompare(b.name)
        case "year-desc":
          return (b.originalReleaseYear ?? -Infinity) - (a.originalReleaseYear ?? -Infinity)
        case "year-asc":
          return (a.originalReleaseYear ?? Infinity) - (b.originalReleaseYear ?? Infinity)
        case "value-desc": {
          const aValue = startingPrices[a.id]
          const bValue = startingPrices[b.id]
          if (aValue == null && bValue == null) return a.name.localeCompare(b.name)
          if (aValue == null) return 1
          if (bValue == null) return -1
          return bValue - aValue || a.name.localeCompare(b.name)
        }
        case "value-asc": {
          const aValue = startingPrices[a.id]
          const bValue = startingPrices[b.id]
          if (aValue == null && bValue == null) return a.name.localeCompare(b.name)
          if (aValue == null) return 1
          if (bValue == null) return -1
          return aValue - bValue || a.name.localeCompare(b.name)
        }
      }
    })
    return items
  }, [products, startingPrices, query, chassis, series, rarity, sort, ownedOnly, isInCollection])

  const hasFilters = chassis !== "all" || series !== "all" || rarity !== "all" || ownedOnly || query.trim()

  function reset() {
    setQuery("")
    setChassis("all")
    setSeries("all")
    setRarity("all")
    setOwnedOnly(false)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("catalog.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {it
            ? `${products.length} modelli nel database. Cerca, filtra e aggiungi alla collezione.`
            : `${products.length} models in the database. Search, filter and add to your collection.`}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("catalog.search")}
            className="h-10 pl-9"
            aria-label={it ? "Cerca nel catalogo" : "Search catalog"}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          <FilterSelect value={chassis} onChange={setChassis} placeholder="Chassis" options={chassisOptions} allLabel={t("catalog.allChassis")} />
          <FilterSelect value={series} onChange={setSeries} placeholder={it ? "Serie" : "Series"} options={seriesOptions} allLabel={t("catalog.allSeries")} />
          <FilterSelect
            value={rarity}
            onChange={setRarity}
            placeholder={it ? "Rarità release" : "Release rarity"}
            options={["Common", "Uncommon", "Rare", "Very Rare", "Grail"]}
            optionLabels={it ? { Common: "Comune", Uncommon: "Non comune", Rare: "Rara", "Very Rare": "Molto rara", Grail: "Grail" } : undefined}
            allLabel={t("catalog.allRarity")}
          />
          <Button variant={ownedOnly ? "default" : "outline"} size="sm" onClick={() => setOwnedOnly((v) => !v)}>
            <Check /> {it ? "Posseduti" : "Owned"}
          </Button>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={reset}>
              <X /> {it ? "Azzera" : "Clear"}
            </Button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger size="sm" className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="value-desc">{it ? "Prezzo iniziale: alto → basso" : "Starting price: high to low"}</SelectItem>
                <SelectItem value="value-asc">{it ? "Prezzo iniziale: basso → alto" : "Starting price: low to high"}</SelectItem>
                <SelectItem value="year-desc">{it ? "Più recenti" : "Newest"}</SelectItem>
                <SelectItem value="year-asc">{it ? "Più vecchi" : "Oldest"}</SelectItem>
                <SelectItem value="name">{it ? "Nome A–Z" : "Name A–Z"}</SelectItem>
              </SelectContent>
            </Select>
            <ToggleGroup value={[view]} onValueChange={(v) => v[0] && setView(v[0] as View)} className="hidden sm:flex">
              <ToggleGroupItem value="grid" aria-label={it ? "Vista griglia" : "Grid view"}><LayoutGrid /></ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label={it ? "Vista elenco" : "List view"}><List /></ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{results.length} {it ? (results.length === 1 ? "risultato" : "risultati") : (results.length === 1 ? "result" : "results")}</span>
        </div>
      </div>

      {results.length === 0 ? (
        <Empty className="rounded-lg border border-dashed border-border py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Search /></EmptyMedia>
            {products.length === 0 ? (
              <>
                <EmptyTitle>{it ? "Catalogo non disponibile" : "Catalog unavailable"}</EmptyTitle>
                <EmptyDescription>{it ? "Impossibile caricare il catalogo. Controlla la connessione e riprova." : "Couldn't load the catalog right now. Check your connection and try again."}</EmptyDescription>
              </>
            ) : (
              <>
                <EmptyTitle>{t("catalog.noResults")}</EmptyTitle>
                <EmptyDescription>{t("catalog.noResultsDesc")}</EmptyDescription>
              </>
            )}
          </EmptyHeader>
          {hasFilters && <Button variant="outline" onClick={reset}>{t("catalog.clear")}</Button>}
        </Empty>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} startingPrice={startingPrices[p.id]} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border">
          {results.map((p) => {
            const owned = isInCollection(p.id)
            const wished = isInWishlist(p.id)
            const primary = primaryRelease(p)
            const startingPrice = startingPrices[p.id]

            return (
              <div key={p.id} className="flex items-center gap-3 bg-card p-2.5">
                <Link href={`/catalog/${p.id}`}>
                  <ProductImage product={p} release={primary} size="sm" className="h-12 w-16 shrink-0" />
                </Link>
                <Link href={`/catalog/${p.id}`} className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <p className="line-clamp-2 text-sm font-medium leading-tight hover:text-brand">{p.name}</p>
                    {owned && <Check className="mt-0.5 size-3.5 shrink-0 text-success" />}
                    {p.hasMultipleReleases && (
                      <Badge variant="outline" className="shrink-0 text-[10px]">{p.releases.length} {it ? "release" : "releases"}</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {primary.itemNumber ? `#${primary.itemNumber}` : "—"} · {p.chassis ?? "—"} · orig. {p.originalReleaseYear ?? "—"}
                  </p>
                </Link>

                <div className="w-28 shrink-0 text-right">
                  {startingPrice != null ? (
                    <>
                      <p className="text-[10px] text-muted-foreground">{it ? "Da" : "From"}</p>
                      <p className="text-sm font-semibold tabular-nums">{formatMoney(startingPrice)}</p>
                    </>
                  ) : (
                    <p className="text-[11px] leading-tight text-muted-foreground">{it ? "Dati mercato in arrivo" : "Market data coming soon"}</p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <AddToWishlistDialog product={p}>
                    <Button variant="outline" size="icon-sm" aria-label={t("product.wishlist")} className={cn(wished && "border-brand text-brand")}>
                      <Heart className={cn(wished && "fill-brand")} />
                    </Button>
                  </AddToWishlistDialog>
                  <AddToCollectionDialog product={p}>
                    <Button size="icon-sm" aria-label={it ? "Aggiungi" : "Add"}><Check /></Button>
                  </AddToCollectionDialog>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
  optionLabels,
  allLabel,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: readonly string[]
  optionLabels?: Readonly<Record<string, string>>
  allLabel: string
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as string)}>
      <SelectTrigger size="sm" className={cn(value !== "all" && "border-brand/50 text-brand")} aria-label={placeholder}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map((o) => <SelectItem key={o} value={o}>{optionLabels?.[o] ?? o}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}
