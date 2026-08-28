import type { CollectorLevel, Currency, Rarity } from "@/lib/types"

const CURRENCY_LOCALE: Record<Currency, string> = {
  EUR: "de-DE",
  USD: "en-US",
  JPY: "ja-JP",
  GBP: "en-GB",
}

export function formatMoney(value: number, currency: Currency = "EUR"): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE[currency], {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "JPY" ? 0 : value % 1 === 0 ? 0 : 2,
  }).format(value)
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : ""
  return `${sign}${value}%`
}

// Gamified collector level derived from collection size. Deliberately gentle —
// it rewards engagement without turning the app into a childish game.
const LEVELS: Array<{ level: CollectorLevel; min: number }> = [
  { level: "Expert", min: 60 },
  { level: "Enthusiast", min: 25 },
  { level: "Collector", min: 8 },
  { level: "Starter", min: 0 },
]

export function collectorLevel(count: number): {
  level: CollectorLevel
  next?: CollectorLevel
  toNext: number
  progress: number
} {
  const current = LEVELS.find((l) => count >= l.min) ?? LEVELS[LEVELS.length - 1]
  const idx = LEVELS.findIndex((l) => l.level === current.level)
  const next = idx > 0 ? LEVELS[idx - 1] : undefined
  const toNext = next ? next.min - count : 0
  const span = next ? next.min - current.min : 1
  const progress = next ? Math.min(100, Math.round(((count - current.min) / span) * 100)) : 100
  return { level: current.level, next: next?.level, toNext, progress }
}

export const RARITY_STYLE: Record<Rarity, string> = {
  Common: "bg-muted text-muted-foreground",
  Uncommon: "bg-success/15 text-success",
  Rare: "bg-brand/15 text-brand",
  "Very Rare": "bg-warning/20 text-warning",
  Grail: "bg-foreground text-background",
}

export function initials(name: string): string {
  return name
    .split(/[\s_@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("")
}
