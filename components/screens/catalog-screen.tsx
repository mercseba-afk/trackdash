"use client"

import * as React from "react"
import Link from "next/link"
import { Search, LayoutGrid, List, SlidersHorizontal, X, Check, Heart } from "lucide-react"
import type { Product } from "@/lib/types"
import { primaryRelease } from "@/lib/data/products"
import { getProductEstimate } from "@/lib/data/market"
import { useStore } from "@/lib/store"
import { formatMoney } from "@/lib/format"
import { ProductCard } from "@/components/product-card"
import { ProductImage } from "@/components/catalog/product-image"
import { RarityBadge, TrendIndicator } from "@/components/market-bits"
import { AddToCollectionDialog, AddToWishlistDialog } from "@/components/add-item-dialogs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { cn } from "@/lib/utils"

type SortKey = "name" | "year-desc" | "year-asc" | "value-desc" | "value-asc" | "rarity"
type View = "grid" | "list"

const RARITY_RANK: Record<Product["rarity"], number> = {
  Grail: 5,
  "Very Rare": 4,
  Rare: 3,
  Uncommon: 2,
  Common: 1,
}

export function CatalogScreen({ products }: { products: Product[] }) {
  const { isInCollection, isInWishlist } = useStore()
  const [query, setQuery] = React.useState("")
  const [chassis, setChassis] = React.useState<string>("all")
  const [series, setSeries] = React.useState<string>("all")
  const [rarity, setRarity] = React.useState<string>("all")
  const [sort, setSort] = React.useState<SortKey>("value-desc")
  const [view, setView] = React.useState<View>("grid")
  const [ownedOnly, setOwnedOnly] = React.useState(false)

  // Derived from whatever the server actually fetched, rather than a
  // static module constant, so these stay accurate if the catalog ever
  // grows beyond exactly what lib/data/products.ts seeds today.
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
      if (rarity !== "all" && p.rarity !== rarity) return false
      if (ownedOnly && !isInCollection(p.id)) return false
      if (q) {
        const itemNumbers = p.releases.map((r) => r.itemNumber).join(" ")
        const hay = `${p.name} ${p.japaneseName ?? ""} ${p.chassis} ${p.series} ${p.itemNumber} ${itemNumbers}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    items = items.sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name)
        case "year-desc":
          // Catalog Model V2 hardening (point 2): products with an unknown
          // year sort to the end, never crash. Treat undefined as -Infinity
          // for desc (oldest-known first from the top means unknowns last).
          return (b.originalReleaseYear ?? -Infinity) - (a.originalReleaseYear ?? -Infinity)
        case "year-asc":
          return (a.originalReleaseYear ?? Infinity) - (b.originalReleaseYear ?? Infinity)
        case "value-desc":
          return getProductEstimate(b).value - getProductEstimate(a).value
        case "value-asc":
          return getProductEstimate(a).value - getProductEstimate(b).value
        case "rarity":
          return RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity]
      }
    })
    return items
  }, [products, query, chassis, series, rarity, sort, ownedOnly, isInCollection])

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
        <h1 className="text-2xl font-semibold tracking-tight">Catalog</h1>
        <p className="text-sm text-muted-foreground">
          {products.length} models in the database. Search, filter and add to your collection.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, chassis, series or item number…"
            className="h-10 pl-9"
            aria-label="Search catalog"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          <FilterSelect value={chassis} onChange={setChassis} placeholder="Chassis" options={chassisOptions} />
          <FilterSelect value={series} onChange={setSeries} placeholder="Series" options={seriesOptions} />
          <FilterSelect
            value={rarity}
            onChange={setRarity}
            placeholder="Rarity"
            options={["Common", "Uncommon", "Rare", "Very Rare", "Grail"]}
          />
          <Button
            variant={ownedOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setOwnedOnly((v) => !v)}
          >
            <Check /> Owned
          </Button>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={reset}>
              <X /> Clear
            </Button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger size="sm" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="value-desc">Value: high to low</SelectItem>
                <SelectItem value="value-asc">Value: low to high</SelectItem>
                <SelectItem value="rarity">Rarity</SelectItem>
                <SelectItem value="year-desc">Newest</SelectItem>
                <SelectItem value="year-asc">Oldest</SelectItem>
                <SelectItem value="name">Name A–Z</SelectItem>
              </SelectContent>
            </Select>
            <ToggleGroup
              value={[view]}
              onValueChange={(v) => v[0] && setView(v[0] as View)}
              className="hidden sm:flex"
            >
              <ToggleGroupItem value="grid" aria-label="Grid view">
                <LayoutGrid />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <List />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {results.length} {results.length === 1 ? "result" : "results"}
          </span>
        </div>
      </div>

      {results.length === 0 ? (
        <Empty className="rounded-lg border border-dashed border-border py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Search />
            </EmptyMedia>
            {products.length === 0 ? (
              <>
                <EmptyTitle>Catalog unavailable</EmptyTitle>
                <EmptyDescription>
                  Couldn't load the catalog right now. Check your connection and try again.
                </EmptyDescription>
              </>
            ) : (
              <>
                <EmptyTitle>No models match</EmptyTitle>
                <EmptyDescription>Try removing a filter or searching for something else.</EmptyDescription>
              </>
            )}
          </EmptyHeader>
          {hasFilters && (
            <Button variant="outline" onClick={reset}>
              Clear filters
            </Button>
          )}
        </Empty>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border">
          {results.map((p) => {
            const est = getProductEstimate(p)
            const owned = isInCollection(p.id)
            const wished = isInWishlist(p.id)
            const primary = primaryRelease(p)
            return (
              <div key={p.id} className="flex items-center gap-3 bg-card p-2.5">
                <Link href={`/catalog/${p.id}`}>
                  <ProductImage product={p} release={primary} size="sm" className="h-12 w-16 shrink-0" />
                </Link>
                <Link href={`/catalog/${p.id}`} className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium hover:text-brand">{p.name}</p>
                    {owned && <Check className="size-3.5 text-success" />}
                    {p.hasMultipleReleases && (
                      <Badge variant="outline" className="text-[10px]">
                        {p.releases.length} releases
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    #{primary.itemNumber} · {p.chassis} · orig. {p.originalReleaseYear}
                  </p>
                </Link>
                <div className="hidden sm:block">
                  <RarityBadge rarity={p.rarity} />
                </div>
                <div className="w-24 text-right">
                  <p className="text-sm font-semibold tabular-nums">{formatMoney(est.value)}</p>
                  <TrendIndicator value={est.trend90d} className="justify-end text-xs" />
                </div>
                <div className="flex items-center gap-1">
                  <AddToWishlistDialog product={p}>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label="Wishlist"
                      className={cn(wished && "border-brand text-brand")}
                    >
                      <Heart className={cn(wished && "fill-brand")} />
                    </Button>
                  </AddToWishlistDialog>
                  <AddToCollectionDialog product={p}>
                    <Button size="icon-sm" aria-label="Add">
                      <Check />
                    </Button>
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
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: readonly string[]
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as string)}>
      <SelectTrigger size="sm" className={cn(value !== "all" && "border-brand/50 text-brand")}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {placeholder.toLowerCase()}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
