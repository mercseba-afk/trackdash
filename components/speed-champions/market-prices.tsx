import { Card, CardContent } from "@/components/ui/card"
import { formatLegoPrice } from "@/lib/lego/price-format"
import { getLegoAskingPrices, getLegoObservedSales, type LegoMarketSummary } from "@/lib/lego/market"

const dateFormat = new Intl.DateTimeFormat("it-IT", {
  day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
})
const countryNames = new Intl.DisplayNames("it", { type: "region" })

export function LegoMarketPrices({ setNumber, asOf, market }: { setNumber: string; asOf: string; market: LegoMarketSummary }) {
  const sales = getLegoObservedSales(setNumber, asOf)
  const asks = market.automated ? [] : getLegoAskingPrices(setNumber, asOf)
  const pickupOnly = asks.length > 0 && asks.every(row => row.pickupOnly)
  const shipping = asks.length === 1 ? asks[0].shippingPriceCents : null
  const saleCount = sales.length === 1 ? "1 vendita conclusa" : `${sales.length} vendite concluse`

  return (
    <Card className="mt-6 overflow-hidden border-border/70 bg-muted/30 shadow-sm">
      <CardContent className="space-y-3 p-5 md:p-6">
        <h2 className="text-sm font-semibold">Mercato</h2>
        <div className="divide-y divide-border/60 rounded-xl border border-border/70 bg-background/80">
          <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">Riferimento mercato</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {sales.length ? `${saleCount} · stima non disponibile` : "Nessuna vendita osservata"}
              </p>
            </div>
            <span className="shrink-0 text-lg font-semibold tabular-nums">—</span>
          </div>
          <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">Prezzi negli annunci</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {market.observedAt
                  ? `${market.condition} · Italia · ${dateFormat.format(new Date(market.observedAt))}`
                  : "Non abbiamo un prezzo richiesto"}
              </p>
              {shipping != null && (
                <p className="mt-1 text-xs text-muted-foreground">Spedizione indicata: {formatLegoPrice(shipping)}</p>
              )}
            </div>
            {market.askingLowCents !== null && (
              <div className="shrink-0 text-right">
                <p className="text-lg font-semibold tabular-nums">
                  {formatLegoPrice(market.askingLowCents)}
                  {market.askingHighCents != null && market.askingHighCents !== market.askingLowCents
                    && ` – ${formatLegoPrice(market.askingHighCents)}`}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {pickupOnly ? "Solo ritiro a mano" : "Spedizione esclusa"}
                </p>
              </div>
            )}
          </div>
        </div>
        {sales.length > 0 && (
          <section className="px-3 sm:px-4">
            <h3 className="text-sm font-medium">Vendite concluse osservate</h3>
            <ul className="mt-1 divide-y divide-border/60 text-xs">
              {sales.map(sale => (
                <li key={sale.itemId} className="flex flex-wrap justify-between gap-x-3 py-2">
                  <span className="text-muted-foreground">
                    {dateFormat.format(new Date(sale.soldAt))} · {countryNames.of(sale.sellerCountry)}
                  </span>
                  <span className="font-medium tabular-nums">{formatLegoPrice(sale.itemPriceCents)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-muted-foreground">Set dichiarati nuovi · spedizione esclusa</p>
          </section>
        )}
      </CardContent>
    </Card>
  )
}
