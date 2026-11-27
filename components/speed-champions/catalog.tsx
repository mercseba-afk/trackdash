"use client"
import type { PublicLocale } from "@/lib/seo/catalog-paths"
import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Search, X } from "lucide-react"
import {
  filterSpeedChampions,
  speedChampionsPath,
  speedChampionsSets,
  speedChampionsSetName,
  setImagePath,
  type LegoCatalogFilters,
} from "@/lib/lego/catalog"
import { localizedLegoStatusLabels, localizedLegoCondition } from "@/lib/lego/locale"
import { formatLegoPrice } from "@/lib/lego/price-format"
import type { LegoMarketSummary } from "@/lib/lego/market"
import { SetImage } from "./set-image"
import { LegoStatusBadge, LegoStatusLegend } from "./status-badge"

const brands = [...new Set(speedChampionsSets.map((set) => set.carBrand))].sort()
const years = [...new Set(speedChampionsSets.map((set) => set.year))].sort((a, b) => b - a)
const selectClass =
  "mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600"

export function SpeedChampionsCatalog({ marketSummaries, locale, initialQuery }: { marketSummaries: Record<string, LegoMarketSummary>; locale: PublicLocale; initialQuery: string }) {
  const copy = (it: string, en: string) => locale === "it" ? it : en
  const [filters, setFilters] = useState<LegoCatalogFilters>({ query: initialQuery })
  const [showFilters, setShowFilters] = useState(false)
  const results = filterSpeedChampions(speedChampionsSets, filters, locale)
  const update = (key: keyof LegoCatalogFilters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }))
  const filtered = Boolean(filters.query || filters.brand || filters.year || filters.status || filters.format)
  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-3xl bg-[#102843] px-6 py-6 text-white sm:px-9 sm:py-9">
        <div
          className="absolute -right-16 -top-24 size-80 rounded-full border-[45px] border-white/5"
          aria-hidden="true"
        />
        <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
          TrackDash · LEGO Speed Champions
        </p>
        <h1 className="relative mt-3 max-w-2xl text-2xl font-semibold tracking-tight sm:text-4xl">
          {copy("Le auto che ami.", "The cars you love.")}
          <br />
          {copy("Un set alla volta.", "One set at a time.")}
        </h1>
        <p className="relative mt-4 max-w-xl text-sm leading-6 text-slate-200">
          {copy("Esplora le confezioni, ritrova il codice esatto e scopri i set usciti dal catalogo LEGO.", "Explore the sets, find the exact set number and see which models LEGO has retired.")}
        </p>
        <div className="relative mt-7 flex flex-wrap gap-6 text-sm">
          <span>
            <strong className="text-xl">{speedChampionsSets.length}</strong> {copy("set in catalogo", "sets in the catalogue")}
          </span>
          <span>
            <strong className="text-xl">{brands.length}</strong> {copy("marchi auto", "car brands")}
          </span>
          <span>{copy("Dal 2019 al 2025", "2019 to 2025")}</span>
        </div>
      </section>
      <section aria-label={copy("Ricerca e filtri", "Search and filters")} className="rounded-2xl border border-slate-200 bg-white p-5">
        <label htmlFor="lego-search" className="text-sm font-semibold">
          {copy("Trova il prossimo set", "Find your next set")}
        </label>
        <div className="relative mt-2">
          <Search aria-hidden="true" className="absolute left-3 top-3.5 size-5 text-slate-400" />
          <input
            id="lego-search"
            type="search"
            value={filters.query ?? ""}
            onChange={(e) => update("query", e.target.value)}
            placeholder={copy("Codice, auto o serie: 76934, Ferrari, Formula 1…", "Set number, car or series: 76934, Ferrari, Formula 1…")}
            className="h-12 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm focus-visible:outline-2 focus-visible:outline-blue-600"
          />
        </div>
        <button
          type="button"
          className="mt-4 text-sm font-medium text-blue-700 lg:hidden"
          aria-expanded={showFilters}
          aria-controls="lego-filters"
          onClick={() => setShowFilters((value) => !value)}
        >
          {showFilters ? copy("Nascondi filtri", "Hide filters") : copy("Filtra per marchio, anno e confezione", "Filter by brand, year and set format")}
        </button>
        <div
          id="lego-filters"
          className={`${showFilters ? "grid" : "hidden lg:grid"} mt-4 grid-cols-2 gap-3 lg:grid-cols-4`}
        >
          <label className="text-xs font-medium text-slate-600">
            {copy("Marchio auto", "Car brand")}
            <select
              className={selectClass}
              value={filters.brand ?? ""}
              onChange={(e) => update("brand", e.target.value)}
            >
              <option value="">{copy("Tutti i marchi", "All brands")}</option>
              {brands.map((brand) => (
                <option key={brand}>{brand}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            {copy("Anno", "Year")}
            <select className={selectClass} value={filters.year ?? ""} onChange={(e) => update("year", e.target.value)}>
              <option value="">{copy("Tutti gli anni", "All years")}</option>
              {years.map((year) => (
                <option key={year}>{year}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            {copy("Catalogo LEGO", "LEGO catalogue status")}
            <select
              className={selectClass}
              value={filters.status ?? ""}
              onChange={(e) => update("status", e.target.value)}
            >
              <option value="">{copy("Tutti gli stati", "All statuses")}</option>
              {Object.entries(localizedLegoStatusLabels(locale)).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            {copy("Confezione", "Set format")}
            <select
              className={selectClass}
              value={filters.format ?? ""}
              onChange={(e) => update("format", e.target.value)}
            >
              <option value="">{copy("Tutti i set", "All sets")}</option>
              <option value="1">{copy("Una auto", "One car")}</option>
              <option value="2">{copy("Due auto", "Two cars")}</option>
            </select>
          </label>
        </div>
      </section>
      <LegoStatusLegend locale={locale} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm font-semibold">
          {results.length} {copy("set", results.length === 1 ? "set" : "sets")} {filtered ? copy("trovati", "found") : copy("da esplorare", "to explore")}
        </p>
        <div className="flex items-center gap-3">
          {filtered && (
            <button
              type="button"
              onClick={() => setFilters({})}
              className="flex items-center gap-1 text-sm text-blue-700"
            >
              <X className="size-4" />
              {copy("Azzera filtri", "Clear filters")}
            </button>
          )}
          <label className="text-sm">
            <span className="sr-only">{copy("Ordina i set", "Sort sets")}</span>
            <select
              className="rounded-lg border border-slate-200 bg-white p-2"
              value={filters.sort ?? "newest"}
              onChange={(e) => update("sort", e.target.value)}
            >
              <option value="newest">{copy("Più recenti", "Newest")}</option>
              <option value="oldest">{copy("Meno recenti", "Oldest")}</option>
              <option value="name">{copy("Nome A–Z", "Name A–Z")}</option>
            </select>
          </label>
        </div>
      </div>
      {results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <h2 className="text-lg font-semibold">{copy("Nessun set trovato", "No sets found")}</h2>
          <p className="mt-2 text-sm text-slate-500">{copy("Prova un altro codice o rimuovi qualche filtro.", "Try another set number or remove a filter.")}</p>
          <button type="button" onClick={() => setFilters({})} className="mt-4 text-sm font-semibold text-blue-700">
            {copy("Mostra tutti i set", "Show all sets")}
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((set, index) => {
            const market = marketSummaries[set.setNumber]
            return (
              <Link
                key={set.setNumber}
                href={speedChampionsPath(set.setNumber, locale)}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                <div className="relative aspect-[4/3]">
                  <SetImage
                    eager={index === 0}
                    src={setImagePath(set.setNumber, "box")}
                    alt=""
                  />
                </div>
                <div className="flex flex-1 flex-col border-t border-slate-100 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
                    <span className="font-mono">#{set.setNumber}</span>
                    <span aria-hidden="true">·</span>
                    <span>{set.year} · {set.pieces} {copy("pezzi", "pieces")}</span>
                    {set.carCount === 2 && <span>· {copy("2 auto", "2 cars")}</span>}
                  </div>
                  <h2 className="mt-1.5 text-lg font-semibold leading-snug tracking-tight">{speedChampionsSetName(set, locale)}</h2>
                  <div className="mt-2.5 flex">
                    <LegoStatusBadge status={set.status} locale={locale} />
                  </div>
                  <div className="mt-auto pt-4">
                    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-t border-slate-200 pt-3">
                      <div>
                        <p className="text-xs text-slate-600">{copy("Prezzi negli annunci", "Asking prices")}</p>
                        <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900">
                          {market?.askingLowCents != null ? `${copy("Da", "From")} ${formatLegoPrice(market.askingLowCents, locale)}` : copy("Non abbiamo un prezzo richiesto", "No asking price recorded")}
                        </p>
                        {market?.askingCount > 0 && <p className="mt-0.5 text-xs text-slate-600">{localizedLegoCondition(market.condition, locale)} · {copy("spedizione esclusa", "shipping excluded")}</p>}
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 group-hover:underline">
                        {copy("Vedi scheda", "View set")} <ArrowRight className="size-4" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
      <p className="text-xs leading-5 text-slate-500">
        {copy("Il catalogo include una selezione di set. Lo stato ufficiale si riferisce alla data indicata nella scheda di ogni set.", "The catalogue covers a selection of sets. Official status is current as of the date shown on each set page.")}
      </p>
    </div>
  )
}
