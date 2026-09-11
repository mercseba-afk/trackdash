import type { Currency } from "@/lib/types"

export const ECB_FX_SOURCE = "ecb_reference" as const

export type FxSource = typeof ECB_FX_SOURCE

export interface HistoricalFxRate {
  currency: Exclude<Currency, "EUR">
  requestedDate: string
  rateDate: string
  unitsPerEUR: number
  rateToEUR: number
  source: FxSource
}

export interface HistoricalEurBasis {
  amountEUR: number | null
  fxRateToEUR: number | null
  fxRateDate: string | null
  fxSource: FxSource | null
}

type FetchLike = typeof fetch

const SUPPORTED_FOREIGN_CURRENCIES = new Set<Exclude<Currency, "EUR">>(["USD", "JPY", "GBP"])
const rateCache = new Map<string, Promise<HistoricalFxRate | null>>()

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function round8(value: number): number {
  return Math.round((value + Number.EPSILON) * 100_000_000) / 100_000_000
}

function isoDate(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : value
}

function shiftUtcDate(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ""
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"'
        index += 1
      } else {
        quoted = !quoted
      }
      continue
    }
    if (char === "," && !quoted) {
      cells.push(current)
      current = ""
      continue
    }
    current += char
  }
  cells.push(current)
  return cells
}

export function parseEcbDailyCsv(
  csv: string,
  currency: Exclude<Currency, "EUR">,
  requestedDate: string,
): HistoricalFxRate | null {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length < 2) return null

  const headers = parseCsvLine(lines[0])
  const dateIndex = headers.indexOf("TIME_PERIOD")
  const valueIndex = headers.indexOf("OBS_VALUE")
  if (dateIndex < 0 || valueIndex < 0) return null

  let best: { date: string; unitsPerEUR: number } | null = null
  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line)
    const date = cells[dateIndex]
    const unitsPerEUR = Number(cells[valueIndex])
    if (!isoDate(date) || date > requestedDate || !Number.isFinite(unitsPerEUR) || unitsPerEUR <= 0) continue
    if (!best || date > best.date) best = { date, unitsPerEUR }
  }

  if (!best) return null
  return {
    currency,
    requestedDate,
    rateDate: best.date,
    unitsPerEUR: best.unitsPerEUR,
    // DB provenance columns are numeric(18,8). Persist and calculate from the
    // same 8-decimal multiplier so the DB integrity check can never differ by
    // one cent because PostgreSQL rounded the rate after JS used more digits.
    rateToEUR: round8(1 / best.unitsPerEUR),
    source: ECB_FX_SOURCE,
  }
}

async function fetchHistoricalRate(
  currency: Exclude<Currency, "EUR">,
  requestedDate: string,
  fetcher: FetchLike,
): Promise<HistoricalFxRate | null> {
  // ECB publishes reference rates only on working/TARGET days. Looking back
  // ten calendar days safely covers weekends and ordinary holiday closures;
  // the latest observation on or before the purchase/sale date is selected.
  const startPeriod = shiftUtcDate(requestedDate, -10)
  const url = new URL(`https://data-api.ecb.europa.eu/service/data/EXR/D.${currency}.EUR.SP00.A`)
  url.searchParams.set("startPeriod", startPeriod)
  url.searchParams.set("endPeriod", requestedDate)
  url.searchParams.set("detail", "dataonly")
  url.searchParams.set("format", "csvdata")

  try {
    const response = await fetcher(url, {
      headers: { Accept: "text/csv" },
      signal: AbortSignal.timeout(8_000),
    })
    if (!response.ok) return null
    return parseEcbDailyCsv(await response.text(), currency, requestedDate)
  } catch {
    // FX is an enhancement, never a reason to block collection entry or market
    // ingestion. Callers fail closed and keep the native amount untouched.
    return null
  }
}

export async function getHistoricalRateToEUR(
  currency: Currency,
  requestedDate: string,
  fetcher: FetchLike = fetch,
): Promise<HistoricalFxRate | null> {
  const date = isoDate(requestedDate)
  if (!date || currency === "EUR" || !SUPPORTED_FOREIGN_CURRENCIES.has(currency as Exclude<Currency, "EUR">)) {
    return null
  }

  const foreignCurrency = currency as Exclude<Currency, "EUR">
  const cacheKey = `${foreignCurrency}|${date}`
  if (fetcher !== fetch) return fetchHistoricalRate(foreignCurrency, date, fetcher)

  const cached = rateCache.get(cacheKey)
  if (cached) return cached
  const pending = fetchHistoricalRate(foreignCurrency, date, fetcher)
  rateCache.set(cacheKey, pending)
  return pending
}

export async function resolveHistoricalEurBasis(
  amount: number,
  currency: Currency,
  acquisitionDate: string | null | undefined,
  fetcher: FetchLike = fetch,
): Promise<HistoricalEurBasis> {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { amountEUR: null, fxRateToEUR: null, fxRateDate: null, fxSource: null }
  }

  if (currency === "EUR") {
    return { amountEUR: round2(amount), fxRateToEUR: null, fxRateDate: null, fxSource: null }
  }

  const requestedDate = acquisitionDate ? isoDate(acquisitionDate.slice(0, 10)) : null
  if (!requestedDate) {
    return { amountEUR: null, fxRateToEUR: null, fxRateDate: null, fxSource: null }
  }

  const rate = await getHistoricalRateToEUR(currency, requestedDate, fetcher)
  if (!rate) {
    return { amountEUR: null, fxRateToEUR: null, fxRateDate: null, fxSource: null }
  }

  return {
    amountEUR: round2(amount * rate.rateToEUR),
    fxRateToEUR: rate.rateToEUR,
    fxRateDate: rate.rateDate,
    fxSource: rate.source,
  }
}

export async function enrichMarketObservationFx<T extends {
  price?: number | null
  currency?: string | null
  soldOn?: string | null
  fxRateToEUR?: number | null
  fxRateDate?: string | null
}>(observation: T, fetcher: FetchLike = fetch): Promise<T> {
  const currency = observation.currency?.toUpperCase() as Currency | undefined
  if (!currency || currency === "EUR" || observation.fxRateToEUR || observation.fxRateDate) return observation
  if (!observation.price || observation.price <= 0 || !observation.soldOn) return observation
  if (!SUPPORTED_FOREIGN_CURRENCIES.has(currency as Exclude<Currency, "EUR">)) return observation

  const rate = await getHistoricalRateToEUR(currency, observation.soldOn.slice(0, 10), fetcher)
  if (!rate) return observation

  return {
    ...observation,
    fxRateToEUR: rate.rateToEUR,
    fxRateDate: rate.rateDate,
  }
}
