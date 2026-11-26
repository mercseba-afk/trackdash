import { formatLegoPrice } from "@/lib/lego/price-format"
import { getLegoAskingPrices, getLegoObservedSales, getPublicLegoMarketSummary } from "@/lib/lego/market"

export function LegoMarketPrices({ setNumber, asOf }: { setNumber: string; asOf: string }) {
  const market = getPublicLegoMarketSummary(setNumber, asOf)
  const sales = getLegoObservedSales(setNumber, asOf)
  const asks = getLegoAskingPrices(setNumber, asOf)
  const pickupOnly = asks.length > 0 && asks.every(row => row.pickupOnly)
  return (
    <section className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-5" aria-label="Dati di mercato">
      <h2 className="font-semibold">Prezzo richiesto</h2>
      {market.askingLowCents !== null ? (
        <>
          <p className="mt-3 text-2xl font-bold text-sky-900">
            {formatLegoPrice(market.askingLowCents)}
            {market.askingHighCents !== market.askingLowCents && ` – ${formatLegoPrice(market.askingHighCents!)}`}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            {market.condition} · {market.askingCount} {market.askingCount === 1 ? "osservazione" : "osservazioni"} · Italia
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {market.askingCount > 1 ? "Intervallo delle richieste nel campione verificato." : "Richiesta nel campione verificato."} {pickupOnly ? "Solo ritiro a mano." : "Spedizione esclusa."} Eventuali costi di protezione acquisti esclusi.
            Ultima verifica: {market.observedAt!.split("-").reverse().join("/")}.
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm text-slate-600">Non disponibile: dati recenti insufficienti.</p>
      )}
      <dl className="mt-5 grid gap-4 border-t border-sky-200 pt-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-semibold">Vendite osservate</dt>
          <dd className="mt-1 text-sm text-slate-600">
            {sales.length > 0 ? (
              <ul className="space-y-1">
                {sales.map(sale => (
                  <li key={sale.itemId}>
                    <span className="font-medium">{formatLegoPrice(sale.itemPriceCents)}</span>
                    {" · "}{sale.soldAt.split("-").reverse().join("/")}
                    {" · "}{sale.sellerCountry === "IT" ? "Italia" : "Germania"}
                  </li>
                ))}
              </ul>
            ) : "In attesa di vendite verificabili"}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-semibold">Riferimento di mercato</dt>
          <dd className="mt-1 text-sm text-slate-600">Non disponibile</dd>
        </div>
      </dl>
      <p className="mt-4 text-xs leading-5 text-slate-500">
        Le vendite osservate si riferiscono a set dichiarati nuovi e riportano il prezzo esposto, spedizione esclusa. Il riferimento di mercato richiede vendite comparabili per codice e condizioni. I dati richiesti non aggiornati da 15 giorni vengono esclusi.
      </p>
    </section>
  )
}
