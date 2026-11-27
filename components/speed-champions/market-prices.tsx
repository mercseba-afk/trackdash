import type { PublicLocale } from "@/lib/seo/catalog-paths"
import { localizedLegoCondition } from "@/lib/lego/locale"
import { Card, CardContent } from "@/components/ui/card"
import { formatLegoPrice } from "@/lib/lego/price-format"
import { getLegoAskingPrices, getLegoObservedSales, type LegoMarketSummary } from "@/lib/lego/market"

export function LegoMarketPrices({ setNumber, asOf, market, locale }: {
  setNumber: string
  asOf: string
  market: LegoMarketSummary
  locale: PublicLocale
}) {
  const copy = (it: string, en: string) => locale === "it" ? it : en
  const dateFormat = new Intl.DateTimeFormat(copy("it-IT", "en-GB"), {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  })
  const countryNames = new Intl.DisplayNames(locale, { type: "region" })
  const sales = getLegoObservedSales(setNumber, asOf)
  const asks = market.automated ? [] : getLegoAskingPrices(setNumber, asOf)
  const pickupOnly = asks.length > 0 && asks.every(row => row.pickupOnly)
  const shipping = asks.length === 1 ? asks[0].shippingPriceCents : null
  const saleCount = sales.length === 1 ? copy("1 vendita conclusa", "1 completed sale") : `${sales.length} ${copy("vendite concluse", "completed sales")}`

  return (
    <Card className="mt-6 overflow-hidden border-border/70 bg-muted/30 shadow-sm">
      <CardContent className="space-y-3 p-5 md:p-6">
        <h2 className="text-sm font-semibold">{copy("Mercato", "Market")}</h2>
        <div className="divide-y divide-border/60 rounded-xl border border-border/70 bg-background/80">
          <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">{copy("Riferimento mercato", "Market reference")}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {sales.length ? `${saleCount} · ${copy("stima non disponibile", "estimate unavailable")}` : copy("Nessuna vendita osservata", "No observed sales")}
              </p>
            </div>
            <span className="shrink-0 text-lg font-semibold tabular-nums">—</span>
          </div>
          <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">{copy("Prezzi negli annunci", "Asking prices")}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {market.observedAt
                  ? `${localizedLegoCondition(market.condition, locale)} · ${countryNames.of("IT")} · ${dateFormat.format(new Date(market.observedAt))}`
                  : copy("Non abbiamo un prezzo richiesto", "No asking price recorded")}
              </p>
              {shipping != null && (
                <p className="mt-1 text-xs text-muted-foreground">{copy("Spedizione indicata", "Listed shipping")}: {formatLegoPrice(shipping, locale)}</p>
              )}
            </div>
            {market.askingLowCents !== null && (
              <div className="shrink-0 text-right">
                <p className="text-lg font-semibold tabular-nums">
                  {formatLegoPrice(market.askingLowCents, locale)}
                  {market.askingHighCents != null && market.askingHighCents !== market.askingLowCents
                    && ` – ${formatLegoPrice(market.askingHighCents, locale)}`}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {pickupOnly ? copy("Solo ritiro a mano", "Collection only") : copy("Spedizione esclusa", "Shipping excluded")}
                </p>
              </div>
            )}
          </div>
        </div>
        {sales.length > 0 && (
          <section className="px-3 sm:px-4">
            <h3 className="text-sm font-medium">{copy("Vendite concluse osservate", "Observed sales")}</h3>
            <ul className="mt-1 divide-y divide-border/60 text-xs">
              {sales.map(sale => (
                <li key={sale.itemId} className="flex flex-wrap justify-between gap-x-3 py-2">
                  <span className="text-muted-foreground">
                    {dateFormat.format(new Date(sale.soldAt))} · {countryNames.of(sale.sellerCountry)}
                  </span>
                  <span className="font-medium tabular-nums">{formatLegoPrice(sale.itemPriceCents, locale)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-muted-foreground">{copy("Set dichiarati nuovi · spedizione esclusa", "Listed as new · shipping excluded")}</p>
          </section>
        )}
      </CardContent>
    </Card>
  )
}
