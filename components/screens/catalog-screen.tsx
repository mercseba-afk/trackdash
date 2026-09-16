"use client"

import * as React from "react"
import Link from "next/link"
import { Check, LayoutGrid, List, PackageSearch, Search, SlidersHorizontal, X } from "lucide-react"
import { ProductImage } from "@/components/catalog/product-image"
import { ProductCard } from "@/components/product-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { primaryRelease } from "@/lib/data/products"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import type { Product } from "@/lib/types"
import { cn } from "@/lib/utils"

type SortKey = "name" | "year-desc" | "year-asc"
type View = "grid" | "list"

export function CatalogScreen({ products }: { products: Product[] }) {
  const { isInCollection, user } = useStore()
  const { locale } = useI18n()
  const it = locale === "it"
  const [query, setQuery] = React.useState("")
  const [chassis, setChassis] = React.useState("all")
  const [series, setSeries] = React.useState("all")
  const [rarity, setRarity] = React.useState("all")
  const [sort, setSort] = React.useState<SortKey>("year-desc")
  const [view, setView] = React.useState<View>("grid")
  const [ownedOnly, setOwnedOnly] = React.useState(false)

  const releaseCount = React.useMemo(() => products.reduce((sum, product) => sum + product.releases.length, 0), [products])
  const chassisOptions = React.useMemo(
    () => Array.from(
      new Set(
        products
          .map((product) => product.chassis)
          .filter((value): value is NonNullable<Product["chassis"]> => value !== undefined),
      ),
    ).sort(),
    [products],
  )
  const seriesOptions = React.useMemo(() => Array.from(new Set(products.map((product) => product.series))).sort(), [products])

  React.useEffect(() => {
    if (!user && ownedOnly) setOwnedOnly(false)
  }, [user, ownedOnly])

  const results = React.useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const items = products.filter((product) => {
      if (chassis !== "all" && product.chassis !== chassis) return false
      if (series !== "all" && product.series !== series) return false
      if (rarity !== "all" && !product.releases.some((release) => release.rarity === rarity)) return false
      if (ownedOnly && !isInCollection(product.id)) return false

      if (normalized) {
        const releaseNumbers = product.releases.map((release) => release.itemNumber ?? "").join(" ")
        const releaseNames = product.releases.map((release) => release.editionName).join(" ")
        const haystack = `${product.name} ${product.japaneseName ?? ""} ${product.series} ${product.chassis ?? ""} ${product.itemNumber ?? ""} ${releaseNumbers} ${releaseNames}`.toLowerCase()
        if (!haystack.includes(normalized)) return false
      }
      return true
    })

    return [...items].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name)
      if (sort === "year-asc") return (a.originalReleaseYear ?? Infinity) - (b.originalReleaseYear ?? Infinity)
      return (b.originalReleaseYear ?? -Infinity) - (a.originalReleaseYear ?? -Infinity)
    })
  }, [products, query, chassis, series, rarity, sort, ownedOnly, isInCollection])

  const hasFilters = Boolean(query.trim()) || chassis !== "all" || series !== "all" || rarity !== "all" || ownedOnly

  function reset() {
    setQuery("")
    setChassis("all")
    setSeries("all")
    setRarity("all")
    setOwnedOnly(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-3xl border border-[#cfdded] bg-[linear-gradient(135deg,#f8fbff_0%,#eef5ff_68%,#f8fafc_100%)] p-5 shadow-sm md:p-7">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0f4bb4]">TrackDash Catalog</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-[#081a3a] md:text-4xl">
              {it ? "Catalogo Tamiya Mini 4WD" : "Tamiya Mini 4WD Catalog"}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#53657f] md:text-[15px]">
              {it
                ? "Trova il modello, poi scegli la Release esatta: anno, Item Number, chassis ed edizione restano distinti per collezione e Price Intelligence."
                : "Find the model, then choose the exact Release. Year, Item Number, chassis and edition stay distinct for collection and Price Intelligence."}
            </p>
          </div>
          <div className="flex gap-6 rounded-2xl border border-white/80 bg-white/75 px-5 py-4 shadow-sm">
            <CatalogStat label={it ? "Modelli" : "Models"} value={products.length} />
            <div className="w-px bg-[#dfe7f0]" />
            <CatalogStat label="Release" value={releaseCount} />
          </div>
        </div>

        <div className="relative mt-6">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#6c7d94]" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={it ? "Cerca nome, Item Number (es. 95467), chassis o edizione…" : "Search name, Item Number (e.g. 95467), chassis or edition…"}
            className="h-12 rounded-xl border-[#c9d8e9] bg-white pl-12 text-base shadow-sm"
            aria-label={it ? "Cerca nel catalogo" : "Search catalog"}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-[#d8e3f0] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#718198]">
            <SlidersHorizontal className="size-3.5" /> {it ? "Filtri" : "Filters"}
          </span>
          <FilterSelect value={chassis} onChange={setChassis} options={chassisOptions} allLabel={it ? "Tutti i chassis" : "All chassis"} />
          <FilterSelect value={series} onChange={setSeries} options={seriesOptions} allLabel={it ? "Tutte le serie" : "All series"} />
          <FilterSelect
            value={rarity}
            onChange={setRarity}
            options={["Common", "Uncommon", "Rare", "Very Rare", "Grail"]}
            optionLabels={it ? { Common: "Comune", Uncommon: "Non comune", Rare: "Rara", "Very Rare": "Molto rara", Grail: "Grail" } : undefined}
            allLabel={it ? "Tutte le rarità" : "All rarity"}
          />
          {user ? (
            <Button variant={ownedOnly ? "default" : "outline"} size="sm" onClick={() => setOwnedOnly((value) => !value)}>
              <Check /> {it ? "Nella mia collezione" : "In my collection"}
            </Button>
          ) : null}
          {hasFilters ? <Button variant="ghost" size="sm" onClick={reset}><X /> {it ? "Azzera" : "Clear"}</Button> : null}

          <div className="ml-auto flex items-center gap-2">
            <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
              <SelectTrigger size="sm" className="w-40 border-[#d4deea]">
                <SelectValue>{(value: SortKey) => sortLabel(value, it)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="year-desc">{sortLabel("year-desc", it)}</SelectItem>
                <SelectItem value="year-asc">{sortLabel("year-asc", it)}</SelectItem>
                <SelectItem value="name">{sortLabel("name", it)}</SelectItem>
              </SelectContent>
            </Select>
            <ToggleGroup value={[view]} onValueChange={(value) => value[0] && setView(value[0] as View)} className="hidden sm:flex">
              <ToggleGroupItem value="grid" aria-label={it ? "Vista griglia" : "Grid view"}><LayoutGrid /></ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label={it ? "Vista elenco" : "List view"}><List /></ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[#53657f]">
          {results.length} {it ? (results.length === 1 ? "modello" : "modelli") : (results.length === 1 ? "model" : "models")}
        </p>
        {query.trim() ? <p className="text-xs text-[#7a8aa0]">{it ? `Ricerca: “${query.trim()}”` : `Search: “${query.trim()}”`}</p> : null}
      </div>

      {results.length === 0 ? (
        <Empty className="rounded-2xl border border-dashed border-[#cbd8e7] bg-white py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Search /></EmptyMedia>
            {products.length === 0 ? (
              <>
                <EmptyTitle>{it ? "Catalogo non disponibile" : "Catalog unavailable"}</EmptyTitle>
                <EmptyDescription>{it ? "Impossibile caricare il catalogo in questo momento." : "The catalog could not be loaded right now."}</EmptyDescription>
              </>
            ) : (
              <>
                <EmptyTitle>{it ? "Nessun modello trovato" : "No models found"}</EmptyTitle>
                <EmptyDescription>{it ? "Prova a modificare ricerca o filtri." : "Try changing the search or filters."}</EmptyDescription>
              </>
            )}
          </EmptyHeader>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {hasFilters ? <Button variant="outline" onClick={reset}>{it ? "Azzera filtri" : "Clear filters"}</Button> : null}
            {products.length > 0 && query.trim() ? (
              <Button variant="ghost" render={<Link href={`/support?category=model_release_request&query=${encodeURIComponent(query.trim())}`} />}>
                <PackageSearch /> {it ? "Richiedi l'inserimento" : "Request this model"}
              </Button>
            ) : null}
          </div>
        </Empty>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#d8e3f0] bg-white shadow-sm">
          {results.map((product, index) => (
            <CatalogListRow key={product.id} product={product} owned={isInCollection(product.id)} border={index > 0} it={it} />
          ))}
        </div>
      )}
    </div>
  )
}

function CatalogListRow({ product, owned, border, it }: { product: Product; owned: boolean; border: boolean; it: boolean }) {
  const release = primaryRelease(product)
  const href = `/catalog/${product.id}`

  return (
    <article className={cn("flex items-center gap-4 p-3 sm:p-4", border && "border-t border-[#e5ebf2]")}>
      <Link href={href} className="shrink-0">
        <ProductImage product={product} release={release} size="sm" className="h-16 w-20 rounded-xl sm:h-20 sm:w-28" />
      </Link>
      <Link href={href} className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold text-[#081a3a] hover:text-[#0f4bb4]">{product.name}</p>
          {owned ? <Badge className="gap-1 bg-success/15 text-success"><Check className="size-3" />{it ? "In collezione" : "Owned"}</Badge> : null}
        </div>
        <p className="mt-1 text-xs text-[#718198]">{product.series} · {product.originalReleaseYear ?? "—"} · {product.chassis ?? "—"}</p>
        <p className="mt-1 text-xs font-medium text-[#53657f]">{product.releases.length} {it ? "Release distinte" : "distinct Releases"}</p>
      </Link>
      <Button size="sm" variant="outline" render={<Link href={href} />} className="shrink-0">{it ? "Vedi" : "View"}</Button>
    </article>
  )
}

function CatalogStat({ label, value }: { label: string; value: number }) {
  return <div><p className="text-2xl font-semibold tabular-nums text-[#081a3a]">{value}</p><p className="text-xs text-[#718198]">{label}</p></div>
}

function FilterSelect({ value, onChange, options, optionLabels, allLabel }: {
  value: string
  onChange: (value: string) => void
  options: readonly string[]
  optionLabels?: Readonly<Record<string, string>>
  allLabel: string
}) {
  const labelFor = (selected: string) => selected === "all" ? allLabel : (optionLabels?.[selected] ?? selected)
  return (
    <Select value={value} onValueChange={(selected) => onChange(selected as string)}>
      <SelectTrigger size="sm" className={cn("border-[#d4deea]", value !== "all" && "border-[#9ebce4] bg-[#f2f7ff] text-[#0f4bb4]")}>
        <SelectValue>{(selected: string) => labelFor(selected)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map((option) => <SelectItem key={option} value={option}>{labelFor(option)}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

function sortLabel(value: SortKey, it: boolean): string {
  if (value === "year-desc") return it ? "Più recenti" : "Newest"
  if (value === "year-asc") return it ? "Più vecchi" : "Oldest"
  return it ? "Nome A–Z" : "Name A–Z"
}
