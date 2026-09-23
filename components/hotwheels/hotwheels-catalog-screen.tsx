"use client"

import * as React from "react"
import Link from "next/link"
import { LayoutGrid, List, Search, SlidersHorizontal, X } from "lucide-react"
import { HotWheelsReleaseCard } from "@/components/hotwheels/hotwheels-release-card"
import { ProductImage } from "@/components/catalog/product-image"
import type { HotWheelsPilotEntry } from "@/lib/actions/hotwheels"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { cn } from "@/lib/utils"

type SortKey = "year-desc" | "year-asc" | "name"
type View = "grid" | "list"

export function HotWheelsCatalogScreen({
  entries,
  initialQuery = "",
}: {
  entries: HotWheelsPilotEntry[]
  initialQuery?: string
}) {
  const { locale } = useI18n()
  const it = locale === "it"
  const [query, setQuery] = React.useState(initialQuery)
  const [line, setLine] = React.useState("all")
  const [subseries, setSubseries] = React.useState("all")
  const [year, setYear] = React.useState("all")
  const [sort, setSort] = React.useState<SortKey>("year-desc")
  const [view, setView] = React.useState<View>("grid")

  const castingCount = React.useMemo(() => new Set(entries.map((entry) => entry.product.id)).size, [entries])
  const lineOptions = React.useMemo(
    () => Array.from(new Set(entries.map((entry) => entry.details.lineName).filter(Boolean))).sort(),
    [entries],
  )
  const subseriesOptions = React.useMemo(
    () => Array.from(new Set(entries.map((entry) => entry.details.subseries).filter((value): value is string => Boolean(value)))).sort(),
    [entries],
  )
  const yearOptions = React.useMemo(
    () => Array.from(new Set(entries.map((entry) => entry.release.releaseYear).filter((value): value is number => typeof value === "number")))
      .sort((a, b) => b - a)
      .map(String),
    [entries],
  )

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = entries.filter((entry) => {
      if (line !== "all" && entry.details.lineName !== line) return false
      if (subseries !== "all" && entry.details.subseries !== subseries) return false
      if (year !== "all" && String(entry.release.releaseYear ?? "") !== year) return false

      if (q) {
        const identifiers = entry.identifiers.map((identifier) => identifier.value).join(" ")
        const hay = [
          entry.product.name,
          entry.release.editionName,
          entry.release.releaseYear,
          entry.release.color,
          entry.details.lineName,
          entry.details.subseries,
          entry.details.collectorNumber,
          entry.details.seriesPosition,
          entry.details.mixCode,
          entry.details.variationCode,
          entry.details.chaseType,
          identifiers,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()

        if (!hay.includes(q)) return false
      }

      return true
    })

    return filtered.sort((a, b) => {
      if (sort === "name") return a.release.editionName.localeCompare(b.release.editionName)
      const aYear = a.release.releaseYear
      const bYear = b.release.releaseYear
      if (sort === "year-asc") return (aYear ?? Infinity) - (bYear ?? Infinity)
      return (bYear ?? -Infinity) - (aYear ?? -Infinity)
    })
  }, [entries, line, query, sort, subseries, year])

  const hasFilters = query.trim() || line !== "all" || subseries !== "all" || year !== "all"

  function reset() {
    setQuery("")
    setLine("all")
    setSubseries("all")
    setYear("all")
  }

  const sortLabel = (value: SortKey) => value === "year-desc"
    ? (it ? "Più recenti" : "Newest")
    : value === "year-asc"
      ? (it ? "Più vecchie" : "Oldest")
      : (it ? "Nome A–Z" : "Name A–Z")

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-8 md:gap-6 md:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl border border-brand/10 bg-gradient-to-br from-white via-white to-brand/5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-7">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">TRACKDASH · HOT WHEELS BETA</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {it ? "Catalogo Hot Wheels" : "Hot Wheels Catalog"}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {it
                ? `${entries.length} Release Hot Wheels verificate. Ogni scheda distingue casting, linea, anno, codice Mattel, variante e dettagli collezionistici.`
                : `${entries.length} verified Hot Wheels Releases. Each page separates casting, line, year, Mattel identifier, variation and collector details.`}
            </p>
          </div>

          <div className="shrink-0 rounded-2xl border border-border/60 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {it ? "Nel catalogo beta" : "In beta catalog"}
            </p>
            <p className="mt-0.5 text-2xl font-semibold tabular-nums text-foreground">{entries.length}</p>
            <p className="text-xs text-muted-foreground">
              {it ? `${entries.length} Release · ${castingCount} casting` : `${entries.length} Releases · ${castingCount} castings`}
            </p>
          </div>
        </div>

        <div className="border-t border-brand/10 bg-white/70 p-3 sm:p-4 lg:px-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={it ? "Cerca casting, Release, codice Mattel, serie…" : "Search casting, Release, Mattel code, series…"}
              className="h-12 rounded-xl border-border/70 bg-white pl-10 pr-10 text-sm shadow-sm focus-visible:border-brand/40"
              aria-label={it ? "Cerca nel catalogo Hot Wheels" : "Search Hot Wheels catalog"}
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
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <SlidersHorizontal className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">{it ? "Filtra il catalogo" : "Filter catalog"}</p>
              <p className="text-[11px] text-muted-foreground">
                {it ? "Filtra per linea, subserie o anno della Release." : "Filter by line, subseries or Release year."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              value={line}
              onChange={setLine}
              placeholder={it ? "Linea" : "Line"}
              options={lineOptions}
              allLabel={it ? "Tutte le linee" : "All lines"}
            />
            <FilterSelect
              value={subseries}
              onChange={setSubseries}
              placeholder={it ? "Subserie" : "Subseries"}
              options={subseriesOptions}
              allLabel={it ? "Tutte le subserie" : "All subseries"}
            />
            <FilterSelect
              value={year}
              onChange={setYear}
              placeholder={it ? "Anno" : "Year"}
              options={yearOptions}
              allLabel={it ? "Tutti gli anni" : "All years"}
            />
            {hasFilters ? (
              <Button variant="ghost" size="sm" className="rounded-xl" onClick={reset}>
                <X /> {it ? "Azzera" : "Clear"}
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {results.length} {it ? (results.length === 1 ? "risultato" : "risultati") : (results.length === 1 ? "result" : "results")}
          </p>
          <p className="text-xs text-muted-foreground">
            {hasFilters
              ? (it ? "Filtri attivi" : "Active filters")
              : (it ? "Catalogo Release-first: ogni card è una Release precisa." : "Release-first catalog: every card is one exact Release.")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
            <SelectTrigger size="sm" className="min-w-0 flex-1 rounded-xl sm:w-40 sm:flex-none">
              <SelectValue>{(value: SortKey) => sortLabel(value)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="year-desc">{sortLabel("year-desc")}</SelectItem>
              <SelectItem value="year-asc">{sortLabel("year-asc")}</SelectItem>
              <SelectItem value="name">{sortLabel("name")}</SelectItem>
            </SelectContent>
          </Select>
          <ToggleGroup
            value={[view]}
            onValueChange={(value) => value[0] && setView(value[0] as View)}
            className="flex rounded-xl border border-border/70 bg-card p-0.5"
          >
            <ToggleGroupItem value="grid" aria-label={it ? "Vista griglia" : "Grid view"} className="rounded-lg">
              <LayoutGrid />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label={it ? "Vista elenco" : "List view"} className="rounded-lg">
              <List />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {results.length === 0 ? (
        <Empty className="rounded-2xl border border-dashed border-border bg-card py-16 shadow-sm">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Search /></EmptyMedia>
            <EmptyTitle>{it ? "Nessuna Release trovata" : "No Releases found"}</EmptyTitle>
            <EmptyDescription>
              {it ? "Prova a modificare la ricerca o ad azzerare i filtri." : "Try changing your search or clearing the filters."}
            </EmptyDescription>
          </EmptyHeader>
          {hasFilters ? (
            <Button variant="outline" className="rounded-xl" onClick={reset}>
              {it ? "Azzera filtri" : "Clear filters"}
            </Button>
          ) : null}
        </Empty>
      ) : view === "grid" ? (
        <section className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
          {results.map((entry) => <HotWheelsReleaseCard key={entry.release.id} entry={entry} />)}
        </section>
      ) : (
        <section className="flex flex-col gap-2.5">
          {results.map((entry) => {
            const href = `/hotwheels/catalog/${entry.product.id}/releases/${entry.release.id}`
            return (
              <Link
                key={entry.release.id}
                href={href}
                className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3 shadow-[0_6px_20px_rgba(15,23,42,0.03)] transition-colors hover:border-brand/25 sm:gap-4 sm:p-3.5"
              >
                <ProductImage
                  product={entry.product}
                  release={entry.release}
                  size="sm"
                  className="h-16 w-20 shrink-0 rounded-xl border border-border/50 bg-muted/20 sm:h-20 sm:w-28"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand/80">
                    {entry.details.lineName}{entry.details.subseries ? ` · ${entry.details.subseries}` : ""}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm font-semibold leading-tight text-foreground transition-colors group-hover:text-brand sm:text-base">
                    {entry.release.editionName}
                  </p>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">{entry.product.name}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                    <span>{entry.release.releaseYear ?? "—"}</span>
                    <span>·</span>
                    <span className="font-mono">{entry.primaryIdentifier?.value ?? "—"}</span>
                    {entry.details.seriesPosition ? <><span>·</span><span>{entry.details.seriesPosition}</span></> : null}
                    {entry.details.mixCode ? <><span>·</span><span>Mix {entry.details.mixCode}</span></> : null}
                  </div>
                </div>
              </Link>
            )
          })}
        </section>
      )}

      <section className="rounded-2xl border border-dashed border-border bg-card px-5 py-4 text-xs leading-relaxed text-muted-foreground">
        {it
          ? "Beta privata: immagini e Market Intelligence vengono mostrate solo quando la singola Release è verificata. Collection e Scanner Hot Wheels restano volutamente disattivati in questa fase."
          : "Private beta: images and Market Intelligence are shown only when the exact Release is verified. Hot Wheels Collection and Scanner intentionally remain disabled in this phase."}
      </section>
    </div>
  )
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
  allLabel,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  options: readonly string[]
  allLabel: string
}) {
  const labelFor = (selected: string) => selected === "all" ? allLabel : selected

  return (
    <Select value={value} onValueChange={(selected) => onChange(selected as string)}>
      <SelectTrigger
        size="sm"
        className={cn("rounded-xl bg-white", value !== "all" && "border-brand/50 bg-brand/5 text-brand")}
        aria-label={placeholder}
      >
        <SelectValue>{(selected: string) => labelFor(selected)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}
