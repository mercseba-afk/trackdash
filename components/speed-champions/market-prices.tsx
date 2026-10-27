import { ExternalLink } from "lucide-react"
import { formatLegoPrice, getLegoAskingPrices } from "@/lib/lego/market"

export function LegoMarketPrices({ setNumber, asOf }: { setNumber: string; asOf: string }) {
  const prices = getLegoAskingPrices(setNumber, asOf)
  return <section className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-5">
    <h2 className="font-semibold">Prezzi richiesti su eBay</h2>
    {prices.length ? <>
      <p className="mt-3 text-2xl font-bold text-sky-900">{formatLegoPrice(prices[0].itemPriceCents)}{prices.length > 1 && ` – ${formatLegoPrice(prices[prices.length - 1].itemPriceCents)}`}</p>
      <p className="mt-1 text-xs text-slate-600">{prices.length} {prices.length === 1 ? "inserzione osservata" : "inserzioni osservate"} · venditori in Italia · controllo del 27/10/2026</p>
      <ul className="mt-4 space-y-3">{prices.map(price => <li key={price.itemId} className="rounded-xl border border-sky-100 bg-white p-3 text-sm">
        <a href={price.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-blue-700">{formatLegoPrice(price.itemPriceCents)} · {price.seller}<ExternalLink aria-hidden="true" className="size-3" /></a>
        <p className="mt-1 text-xs text-slate-600">{price.condition} · {price.itemLocation}</p>
        {price.displayedBuyerFeeCents > 0 && <p className="mt-1 text-xs text-slate-500">Protezione acquisti mostrata al controllo: +{formatLegoPrice(price.displayedBuyerFeeCents)}; può variare.</p>}
      </li>)}</ul>
      <p className="mt-3 text-xs leading-5 text-slate-600">Prezzi dell’oggetto, esclusi spedizione ed eventuali costi di protezione acquisti. Campione iniziale verificato manualmente, non tutte le offerte disponibili. Controlla prezzo totale e disponibilità su eBay. Le osservazioni scadono dopo 15 giorni senza aggiornamento.</p>
    </> : <p className="mt-2 text-sm leading-6 text-slate-600">Nessuna richiesta recente verificata nel nostro campione. Questo non indica assenza di scambi o di valore del set.</p>}
    <div className="mt-4 border-t border-sky-200 pt-4"><h3 className="text-sm font-semibold">Valore da vendite concluse: da rilevare</h3><p className="mt-1 text-xs leading-5 text-slate-600">Le richieste dei venditori non sono prezzi di vendita confermati. Il valore e il trend saranno disponibili quando avremo vendite concluse comparabili per codice e condizioni.</p></div>
  </section>
}
