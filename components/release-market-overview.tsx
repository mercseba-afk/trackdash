"use client"

import { BadgeCheck, BarChart3, Tag } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatMoney } from "@/lib/format"
import { useI18n } from "@/lib/i18n"
import type { ReleaseMarketSignalView } from "@/lib/market/view-types"
import { observedMarketPrice } from "@/lib/market/presentation"

// The Release is a collector-facing price reference, not a statistics report.
// Public MV, SOLD and ASK remain separate in the canonical data everywhere.
// If SOLD and ASK exist, the two useful references are the only big numbers.
// A numeric Market Value is a fallback here, NOT a third copy of SOLD.
function MarketReference({
  kind,
  price,
  count,
  it,
  compact,
}: {
  kind: "ask" | "sold"
  price: number
  count: number
  it: boolean
  compact: boolean
}) {
  const ask = kind === "ask"
  return (
    <div className={
      ask
        ? "rounded-2xl border border-amber-200 bg-amber-50/80 p-4"
        : "rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4"
    }>
      <p className={
        ask
          ? "inline-flex items-center gap-1.5 text-sm font-semibold text-amber-900"
          : "inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-900"
      }>
        {ask ? <Tag className="size-4" /> : <BadgeCheck className="size-4" />}
        {ask
          ? (it ? "Prezzo richiesto più basso" : "Lowest asking price")
          : (it ? "Vendite concluse" : "Completed sales")}
      </p>
      <p className={
        compact
          ? "mt-2 text-2xl font-semibold tabular-nums text-foreground"
          : "mt-2 text-3xl font-semibold tracking-[-0.035em] tabular-nums text-foreground"
      }>
        {ask ? formatMoney(price) : `≈ ${formatMoney(price)}`}
      </p>
      <p className={ask ? "mt-2 text-xs leading-relaxed text-amber-800" : "mt-2 text-xs leading-relaxed text-emerald-800"}>
        {ask
          ? count > 0
            ? (it
                ? `Il minimo tra ${count} ${count === 1 ? "annuncio attivo" : "annunci attivi"} verificati. È una richiesta, non una vendita.`
                : `Lowest among ${count} verified active ${count === 1 ? "listing" : "listings"}. An asking price, not a sale.`)
            : (it ? "Richiesta del venditore, non una vendita." : "Seller's asking price, not a completed sale.")
          : count > 0
            ? (it
                ? `Riferimento da ${count} ${count === 1 ? "vendita conclusa osservata" : "vendite concluse osservate"}.`
                : `Reference from ${count} observed completed ${count === 1 ? "sale" : "sales"}.`)
            : (it ? "Riferimento da vendite concluse osservate." : "Reference from observed completed sales.")}
      </p>
    </div>
  )
}

export function ReleaseMarketOverview({
  signal,
  compact = false,
}: {
  signal?: ReleaseMarketSignalView | null
  compact?: boolean
}) {
  const { locale } = useI18n()
  const it = locale === "it"
  // Only the TTL-valid current purchasable price, never a stale ASK anchor.
  const askPrice = observedMarketPrice(signal)
  const hasAsk = askPrice != null && askPrice > 0
  const soldPrice = signal?.soldAnchorEUR ?? null
  const hasSold = soldPrice != null && soldPrice > 0
  const hasValue = signal?.valueEUR != null && signal.valueEUR > 0

  return (
    <Card className="overflow-hidden border-border/70 bg-white shadow-sm">
      <CardContent className={compact ? "p-4" : "p-5 md:p-6"}>
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-brand" />
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
            {it ? "Mercato" : "Market"}
          </p>
        </div>

        {hasSold || hasAsk ? (
          <div className={hasSold && hasAsk ? "mt-4 grid gap-3 sm:grid-cols-2" : "mt-4 grid gap-3"}>
            {hasSold ? (
              <MarketReference
                kind="sold"
                price={soldPrice!}
                count={signal?.soldUnits ?? 0}
                compact={compact}
                it={it}
              />
            ) : null}
            {hasAsk ? (
              <MarketReference
                kind="ask"
                price={askPrice!}
                count={signal?.currentOfferCount ?? 0}
                compact={compact}
                it={it}
              />
            ) : null}
          </div>
        ) : null}

        {!hasSold && !hasAsk && hasValue ? (
          <div className="mt-4 rounded-2xl border border-brand/20 bg-brand/5 p-4">
            <p className="text-sm font-medium text-brand">{it ? "Valore stimato" : "Estimated value"}</p>
            <p className={compact ? "mt-2 text-2xl font-semibold tabular-nums" : "mt-2 text-3xl font-semibold tabular-nums"}>
              ≈ {formatMoney(signal!.valueEUR!)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {it ? "Stima TrackDash basata sulle evidenze disponibili." : "TrackDash estimate based on available evidence."}
            </p>
          </div>
        ) : null}

        {!hasSold && !hasAsk && !hasValue ? (
          <div className="mt-4">
            <p className="text-lg font-semibold">{it ? "Mercato in osservazione" : "Market under observation"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {it ? "Non ci sono ancora prezzi verificabili da mostrare." : "No verifiable prices are available yet."}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
