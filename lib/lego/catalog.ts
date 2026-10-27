// Editorial pilot. These stable Product/Release IDs are reserved for the
// database import; the preview never writes to shared collection/market tables.
import data from "./pilot-data.json"

export type LegoStatus = "available" | "retiring_soon" | "retired" | "unknown"
export interface SpeedChampionsSet {
  setNumber: string
  productId: string
  releaseId: string
  name: string
  year: number
  carBrand: string
  carCount: number
  pieces: number
  series: string
  status: LegoStatus
  statusCheckedAt: string
  sourceUrl: string
  yearSourceUrl: string
  boxImage: string
  boxImageKind: "box_front" | "box_with_model"
  modelImage: string
}

function validateEntry(row: (typeof data)[number]): SpeedChampionsSet {
  if (!["available", "retiring_soon", "retired", "unknown"].includes(row.status))
    throw new Error(`Invalid LEGO status: ${row.setNumber}`)
  if (!["box_front", "box_with_model"].includes(row.boxImageKind))
    throw new Error(`Invalid LEGO image: ${row.setNumber}`)
  return row as SpeedChampionsSet
}

export const speedChampionsSets: readonly SpeedChampionsSet[] = data.map(validateEntry)
export const legoStatusLabels: Record<LegoStatus, string> = {
  available: "A catalogo LEGO",
  retiring_soon: "Ritiro annunciato",
  retired: "Fuori catalogo LEGO",
  unknown: "Stato da verificare",
}

export const legoStatusDescriptions: Record<LegoStatus, string> = {
  available: "Il set è ancora nel catalogo ufficiale LEGO alla data dell’ultima verifica.",
  retiring_soon: "LEGO segnala che il set sta per essere ritirato. Non è una nuova uscita e la data esatta può non essere nota.",
  retired: "LEGO ha ritirato il set dal proprio catalogo. Può ancora essere disponibile nei negozi o tra collezionisti.",
  unknown: "Lo stato nel catalogo ufficiale deve ancora essere verificato.",
}

export function speedChampionsPath(setNumber: string): string {
  return `/speed-champions/catalog/${encodeURIComponent(setNumber)}`
}

export function setImagePath(setNumber: string, view: "box" | "model"): string {
  return `/speed-champions/images/${encodeURIComponent(setNumber)}-${view}.jpg`
}

export interface LegoCatalogFilters {
  query?: string
  brand?: string
  year?: string
  status?: string
  format?: string
  sort?: string
}

export function filterSpeedChampions(
  sets: readonly SpeedChampionsSet[],
  filters: LegoCatalogFilters,
): SpeedChampionsSet[] {
  const tokens = (filters.query ?? "").trim().toLocaleLowerCase("it").split(/\s+/).filter(Boolean)
  return sets
    .filter((set) => {
      const haystack = `${set.setNumber} ${set.name} ${set.carBrand} ${set.series}`.toLocaleLowerCase("it")
      return (
        tokens.every((token) => haystack.includes(token)) &&
        (!filters.brand || set.carBrand === filters.brand) &&
        (!filters.year || String(set.year) === filters.year) &&
        (!filters.status || set.status === filters.status) &&
        (!filters.format || String(set.carCount) === filters.format)
      )
    })
    .sort((a, b) =>
      filters.sort === "name"
        ? a.name.localeCompare(b.name, "it")
        : filters.sort === "oldest"
          ? a.year - b.year || a.setNumber.localeCompare(b.setNumber)
          : b.year - a.year || b.setNumber.localeCompare(a.setNumber),
    )
}
