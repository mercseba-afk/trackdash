"use client"

import * as React from "react"
import { Search, SlidersHorizontal, X } from "lucide-react"
import {
  PRODUCTS,
  CHASSIS_OPTIONS,
  SERIES_OPTIONS,
} from "@/lib/data/products"
import type { Product } from "@/lib/types"
import { getMarketEstimate } from "@/lib/data/market"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ProductCard } from "@/components/product-card"

type SortKey = "relevant" | "value-desc" | "value-asc" | "year-desc" | "year-asc"

const RARITY_ORDER = ["Grail", "Very Rare", "Rare", "Uncommon", "Common"]

export default function BrowsePage() {
  const [query, setQuery] = React.useState("")
  const [series, setSeries] = React.useState("all")
  const [chassis, setChassis] = React.useState("all")
  const [sort, setSort] = React.useState<SortKey>("relevant")

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    let list: Product[] = PRODUCTS.filter((p) => {
      if (series !== "all" && p.series !== series) return false
      if (chassis !== "all" && p.chassis !== chassis) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.japaneseName?.includes(query.trim()) ||
        p.tamiyaItemNumber.includes(q) ||
        p.series.toLowerCase().includes(q) ||
        p.chassis.toLowerCase().includes(q)
      )
    })

    const val = (p: Product) => getMarketEstimate(p).value
    switch (sort) {
      case "value-desc":
        list = [...list].sort((a, b) => val(b) - val(a))
        break
      case "value-asc":
        list = [...list].sort((a, b) => val(a) - val(b))
        break
      case "year-desc":
        list = [...list].sort((a, b) => b.releaseYear - a.releaseYear)
        break
      case "year-asc":
        list = [...list].sort((a, b) => a.releaseYear - b.releaseYear)
        break
      default:
        list = [...list].sort(
          (a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity),
        )
    }
    return list
  }, [query, series, chassis, sort])

  const hasFilters = series !== "all" || chassis !== "all" || query.trim() !== ""

  function reset() {
    setQuery("")
    setSeries("all")
    setChassis("all")
    setSort("relevant")
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Catalog</h1>
        <p className="text-sm text-muted-foreground">
          {PRODUCTS.length} models in the demo database · real Tamiya releases
        </p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-3">
        <InputGroup>
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search by name, item number, series or chassis…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <InputGroupAddon align="inline-end">
              <Button variant="ghost" size="icon-xs" onClick={() => setQuery("")} aria-label="Clear">
                <X />
              </Button>
            </InputGroupAddon>
          )}
        </InputGroup>

        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <SlidersHorizontal className="size-3.5" />
            Filter
          </span>
          <Select value={series} onValueChange={setSeries}>
            <SelectTrigger size="sm" className="w-auto min-w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All series</SelectItem>
                {SERIES_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select value={chassis} onValueChange={setChassis}>
            <SelectTrigger size="sm" className="w-auto min-w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All chassis</SelectItem>
                {CHASSIS_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger size="sm" className="w-auto min-w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="relevant">Sort: Rarity</SelectItem>
                <SelectItem value="value-desc">Value: High → Low</SelectItem>
                <SelectItem value="value-asc">Value: Low → High</SelectItem>
                <SelectItem value="year-desc">Newest first</SelectItem>
                <SelectItem value="year-asc">Oldest first</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={reset}>
              <X data-icon="inline-start" />
              Clear
            </Button>
          )}

          <Badge variant="secondary" className="ml-auto">
            {results.length} result{results.length === 1 ? "" : "s"}
          </Badge>
        </div>
      </div>

      {results.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Search />
            </EmptyMedia>
            <EmptyTitle>No models found</EmptyTitle>
            <EmptyDescription>
              Try a different search term or clear your filters.
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={reset}>
            Clear filters
          </Button>
        </Empty>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
