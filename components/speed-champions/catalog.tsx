"use client"
import { useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Search, X } from "lucide-react"
import {
  filterSpeedChampions,
  legoStatusLabels,
  speedChampionsPath,
  speedChampionsSets,
  setImagePath,
  type LegoCatalogFilters,
} from "@/lib/lego/catalog"
import { SetImage } from "./set-image"

const brands = [...new Set(speedChampionsSets.map((set) => set.carBrand))].sort()
const years = [...new Set(speedChampionsSets.map((set) => set.year))].sort((a, b) => b - a)
const selectClass =
  "mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600"

export function SpeedChampionsCatalog() {
  const [filters, setFilters] = useState<LegoCatalogFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const results = filterSpeedChampions(speedChampionsSets, filters)
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
          Le auto che ami.
          <br />
          Un set alla volta.
        </h1>
        <p className="relative mt-4 max-w-xl text-sm leading-6 text-slate-200">
          Esplora le confezioni, ritrova il codice esatto e scopri i set usciti dal catalogo LEGO.
        </p>
        <div className="relative mt-7 flex flex-wrap gap-6 text-sm">
          <span>
            <strong className="text-xl">{speedChampionsSets.length}</strong> set nel pilota
          </span>
          <span>
            <strong className="text-xl">{brands.length}</strong> marchi auto
          </span>
          <span>Dal 2019 al 2025</span>
        </div>
      </section>
      <section aria-label="Ricerca e filtri" className="rounded-2xl border border-slate-200 bg-white p-5">
        <label htmlFor="lego-search" className="text-sm font-semibold">
          Trova il prossimo set
        </label>
        <div className="relative mt-2">
          <Search aria-hidden="true" className="absolute left-3 top-3.5 size-5 text-slate-400" />
          <input
            id="lego-search"
            type="search"
            value={filters.query ?? ""}
            onChange={(e) => update("query", e.target.value)}
            placeholder="Codice, auto o serie: 76934, Ferrari, Formula 1…"
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
          {showFilters ? "Nascondi filtri" : "Filtra per marchio, anno e confezione"}
        </button>
        <div
          id="lego-filters"
          className={`${showFilters ? "grid" : "hidden lg:grid"} mt-4 grid-cols-2 gap-3 lg:grid-cols-4`}
        >
          <label className="text-xs font-medium text-slate-600">
            Marchio auto
            <select
              className={selectClass}
              value={filters.brand ?? ""}
              onChange={(e) => update("brand", e.target.value)}
            >
              <option value="">Tutti i marchi</option>
              {brands.map((brand) => (
                <option key={brand}>{brand}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            Anno
            <select className={selectClass} value={filters.year ?? ""} onChange={(e) => update("year", e.target.value)}>
              <option value="">Tutti gli anni</option>
              {years.map((year) => (
                <option key={year}>{year}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            Catalogo LEGO
            <select
              className={selectClass}
              value={filters.status ?? ""}
              onChange={(e) => update("status", e.target.value)}
            >
              <option value="">Tutti gli stati</option>
              {Object.entries(legoStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            Confezione
            <select
              className={selectClass}
              value={filters.format ?? ""}
              onChange={(e) => update("format", e.target.value)}
            >
              <option value="">Tutti i set</option>
              <option value="1">Una auto</option>
              <option value="2">Due auto</option>
            </select>
          </label>
        </div>
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm font-semibold">
          {results.length} set {filtered ? "trovati" : "da esplorare"}
        </p>
        <div className="flex items-center gap-3">
          {filtered && (
            <button
              type="button"
              onClick={() => setFilters({})}
              className="flex items-center gap-1 text-sm text-blue-700"
            >
              <X className="size-4" />
              Azzera filtri
            </button>
          )}
          <label className="text-sm">
            <span className="sr-only">Ordina i set</span>
            <select
              className="rounded-lg border border-slate-200 bg-white p-2"
              value={filters.sort ?? "newest"}
              onChange={(e) => update("sort", e.target.value)}
            >
              <option value="newest">Più recenti</option>
              <option value="oldest">Meno recenti</option>
              <option value="name">Nome A–Z</option>
            </select>
          </label>
        </div>
      </div>
      {results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <h2 className="text-lg font-semibold">Nessun set trovato</h2>
          <p className="mt-2 text-sm text-slate-500">Prova un altro codice o rimuovi qualche filtro.</p>
          <button type="button" onClick={() => setFilters({})} className="mt-4 text-sm font-semibold text-blue-700">
            Mostra tutti i set
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((set, index) => (
            <Link
              key={set.setNumber}
              href={speedChampionsPath(set.setNumber)}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <div className="relative aspect-[4/3]">
                <SetImage
                  eager={index === 0}
                  src={setImagePath(set.setNumber, "box")}
                  alt={`Scatola LEGO Speed Champions ${set.setNumber} — ${set.name}`}
                />
                <span className="absolute left-4 top-3 rounded-md bg-white/95 px-2 py-1 font-mono text-xs font-semibold text-slate-700">
                  #{set.setNumber}
                </span>
              </div>
              <div className="flex flex-1 flex-col border-t border-slate-100 p-5">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="font-semibold uppercase tracking-wider text-blue-700">{set.carBrand}</span>
                  <span>
                    {set.year} · {set.pieces} pezzi
                  </span>
                </div>
                <h2 className="mt-2 text-lg font-semibold leading-snug">{set.name}</h2>
                <p className="mt-2 text-xs text-slate-500">
                  {set.series} · {set.carCount === 2 ? "2 auto, 1 confezione" : "1 auto"}
                </p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-5">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${set.status === "retired" ? "bg-slate-100 text-slate-600" : set.status === "retiring_soon" ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}
                  >
                    {legoStatusLabels[set.status]}
                  </span>
                  <ArrowUpRight className="size-5 text-blue-600" aria-hidden="true" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      <p className="text-xs leading-5 text-slate-500">
        Selezione pilota, non catalogo completo. Stato ufficiale verificato il 26 ottobre 2026: “fuori catalogo” non
        significa introvabile nei negozi e non garantisce un aumento di valore.
      </p>
    </div>
  )
}
