"use client"

import * as React from "react"
import { Check, Clock3, HandCoins, Loader2, X } from "lucide-react"
import {
  cancelMarketplaceDealAction,
  createMarketplaceOfferAction,
  getConversationDealAction,
  reportMarketplaceSaleAction,
  respondMarketplaceOfferAction,
  respondMarketplaceSaleAction,
  snoozeMarketplaceFollowupAction,
} from "@/lib/actions/messaging"
import { createClient } from "@/lib/supabase/client"
import { useStore } from "@/lib/store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

type DealState = Awaited<ReturnType<typeof getConversationDealAction>>
type Currency = "EUR" | "USD" | "JPY" | "GBP"

interface DealPanelConversation {
  id: string
  isOwner: boolean
  offerStillOpen: boolean
  blockedByMe: boolean
  blockedByThem: boolean
  askingPrice: number | null
  askingCurrency: Currency | null
  otherUsername: string
}

function localToday() {
  const date = new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function money(value: number, currency: Currency, locale: string) {
  return new Intl.NumberFormat(locale === "it" ? "it-IT" : "en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  }).format(value)
}

function roundMoney(value: number, currency: Currency) {
  if (currency === "JPY") return Math.round(value)
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function DealPanel({
  conversation,
  locale,
  onActivity,
}: {
  conversation: DealPanelConversation
  locale: "it" | "en"
  onActivity?: () => void | Promise<void>
}) {
  const it = locale === "it"
  const { user } = useStore()
  const [state, setState] = React.useState<DealState>({ offers: [], sale: null })
  const [loading, setLoading] = React.useState(true)
  const [busy, setBusy] = React.useState(false)
  const [customOpen, setCustomOpen] = React.useState(false)
  const [customAmount, setCustomAmount] = React.useState("")
  const [customCurrency, setCustomCurrency] = React.useState<Currency>(conversation.askingCurrency ?? "EUR")
  const [saleFormOpen, setSaleFormOpen] = React.useState(false)
  const [salePrice, setSalePrice] = React.useState("")
  const [saleShipping, setSaleShipping] = React.useState("")
  const [saleDate, setSaleDate] = React.useState(localToday())

  const refresh = React.useCallback(async () => {
    const next = await getConversationDealAction(conversation.id)
    setState(next)
    return next
  }, [conversation.id])

  const afterActivity = React.useCallback(async () => {
    await refresh()
    window.dispatchEvent(new Event("trackdash:messaging-read"))
    await onActivity?.()
  }, [onActivity, refresh])

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    getConversationDealAction(conversation.id)
      .then((next) => { if (!cancelled) setState(next) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [conversation.id])

  React.useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`deal:${conversation.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "marketplace_offers", filter: `conversation_id=eq.${conversation.id}` }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "marketplace_sales", filter: `conversation_id=eq.${conversation.id}` }, () => void refresh())
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [conversation.id, refresh])

  const pendingOffer = [...state.offers].reverse().find((offer) => offer.status === "pending") ?? null
  const acceptedOffer = [...state.offers].reverse().find((offer) => offer.status === "accepted" && offer.dealStatus !== "cancelled") ?? null
  const blocked = conversation.blockedByMe || conversation.blockedByThem
  const canNegotiate = conversation.offerStillOpen && !blocked && !acceptedOffer
  const pendingMine = pendingOffer?.creatorId === user?.id
  const followupDue = Boolean(
    acceptedOffer?.dealStatus === "open" && acceptedOffer.followupDueAt && new Date(acceptedOffer.followupDueAt).getTime() <= Date.now(),
  )

  React.useEffect(() => {
    if (!acceptedOffer) return
    if (!salePrice) setSalePrice(String(state.sale?.itemPrice ?? acceptedOffer.amount))
    if (!saleShipping && state.sale?.shippingPrice != null) setSaleShipping(String(state.sale.shippingPrice))
    if (state.sale?.saleDate) setSaleDate(state.sale.saleDate)
  }, [acceptedOffer, salePrice, saleShipping, state.sale])

  async function run(action: () => Promise<unknown>, success: string) {
    if (busy) return
    setBusy(true)
    try {
      await action()
      await afterActivity()
      toast.success(success)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : it ? "Operazione non riuscita" : "Action failed")
    } finally {
      setBusy(false)
    }
  }

  async function makeOffer(amount: number, currency: Currency) {
    const rounded = roundMoney(amount, currency)
    await run(
      () => createMarketplaceOfferAction(conversation.id, rounded, currency),
      it ? `Offerta inviata: ${money(rounded, currency, locale)}` : `Offer sent: ${money(rounded, currency, locale)}`,
    )
    setCustomOpen(false)
    setCustomAmount("")
  }

  if (loading) {
    return <div className="flex items-center gap-2 rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> {it ? "Caricamento trattativa…" : "Loading deal…"}</div>
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-muted/15 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2"><HandCoins className="size-4 text-brand" /><p className="text-sm font-semibold">{it ? "Trattativa" : "Deal"}</p></div>
        {conversation.askingPrice != null && conversation.askingCurrency ? <Badge variant="outline">{it ? "Richiesta" : "Asking"} {money(conversation.askingPrice, conversation.askingCurrency, locale)}</Badge> : null}
      </div>

      {!acceptedOffer && pendingOffer ? (
        <div className="rounded-lg border bg-background p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><p className="text-xs text-muted-foreground">{pendingMine ? (it ? "La tua offerta" : "Your offer") : (it ? `Offerta di ${conversation.otherUsername}` : `Offer from ${conversation.otherUsername}`)}</p><p className="text-lg font-semibold">{money(pendingOffer.amount, pendingOffer.currency, locale)}</p></div>
            <Badge variant="secondary">{it ? "In attesa" : "Pending"}</Badge>
          </div>
          {!pendingMine ? <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" disabled={busy || blocked || !conversation.offerStillOpen} onClick={() => void run(() => respondMarketplaceOfferAction(pendingOffer.id, "accepted"), it ? "Offerta accettata" : "Offer accepted")}><Check className="size-4" /> {it ? "Accetta offerta" : "Accept offer"}</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => void run(() => respondMarketplaceOfferAction(pendingOffer.id, "rejected"), it ? "Offerta rifiutata" : "Offer declined")}><X className="size-4" /> {it ? "Rifiuta" : "Decline"}</Button><Button size="sm" variant="ghost" disabled={busy || blocked || !conversation.offerStillOpen} onClick={() => { setCustomCurrency(pendingOffer.currency); setCustomAmount(String(pendingOffer.amount)); setCustomOpen(true) }}>{it ? "Controproponi" : "Counter"}</Button></div> : <p className="mt-2 text-xs text-muted-foreground">{it ? "L'altro collezionista può accettarla, rifiutarla o fare una controproposta." : "The other collector can accept, decline or counter."}</p>}
        </div>
      ) : null}

      {!acceptedOffer && !pendingOffer && canNegotiate && !conversation.isOwner ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">{it ? "Fai un'offerta strutturata: il prezzo diventa dato di mercato solo se la vendita viene poi conclusa e confermata da entrambi." : "Make a structured offer. It becomes market evidence only if the sale is later completed and confirmed by both sides."}</p>
          {conversation.askingPrice != null && conversation.askingCurrency ? <div className="flex flex-wrap gap-2"><Button size="sm" disabled={busy} onClick={() => void makeOffer(conversation.askingPrice!, conversation.askingCurrency!)}>{it ? "Prezzo pieno" : "Full price"} · {money(conversation.askingPrice, conversation.askingCurrency, locale)}</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => void makeOffer(conversation.askingPrice! * 0.9, conversation.askingCurrency!)}>-10% · {money(roundMoney(conversation.askingPrice * 0.9, conversation.askingCurrency), conversation.askingCurrency, locale)}</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => void makeOffer(conversation.askingPrice! * 0.8, conversation.askingCurrency!)}>-20% · {money(roundMoney(conversation.askingPrice * 0.8, conversation.askingCurrency), conversation.askingCurrency, locale)}</Button><Button size="sm" variant="ghost" onClick={() => { setCustomCurrency(conversation.askingCurrency!); setCustomOpen(true) }}>{it ? "Personalizzata" : "Custom"}</Button></div> : <Button size="sm" className="w-fit" onClick={() => setCustomOpen(true)}>{it ? "Fai un'offerta" : "Make an offer"}</Button>}
        </div>
      ) : null}

      {!acceptedOffer && !pendingOffer && conversation.isOwner && conversation.offerStillOpen ? <p className="text-xs text-muted-foreground">{it ? "Il modello è aperto a offerte. Quando l'acquirente invia una proposta, potrai accettare, rifiutare o controproporre qui." : "This item is open to offers. When the buyer sends one, you can accept, decline or counter here."}</p> : null}

      {customOpen && !acceptedOffer ? <div className="grid gap-2 rounded-lg border bg-background p-3 sm:grid-cols-[1fr_110px_auto]"><Input type="number" min="0" step={customCurrency === "JPY" ? "1" : "0.01"} value={customAmount} placeholder={it ? "Importo" : "Amount"} onChange={(event) => setCustomAmount(event.target.value)} /><select className="h-9 rounded-md border bg-background px-2 text-sm" value={customCurrency} onChange={(event) => setCustomCurrency(event.target.value as Currency)}>{(["EUR","USD","JPY","GBP"] as Currency[]).map((currency) => <option key={currency}>{currency}</option>)}</select><div className="flex gap-2"><Button size="sm" disabled={busy || !customAmount || Number(customAmount) <= 0} onClick={() => void makeOffer(Number(customAmount), customCurrency)}>{it ? "Invia" : "Send"}</Button><Button size="sm" variant="ghost" onClick={() => setCustomOpen(false)}>{it ? "Chiudi" : "Close"}</Button></div></div> : null}

      {acceptedOffer ? <div className="rounded-lg border border-brand/30 bg-brand/5 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-medium text-brand">{it ? "Offerta accettata" : "Offer accepted"}</p><p className="text-xl font-semibold">{money(acceptedOffer.amount, acceptedOffer.currency, locale)}</p><p className="text-xs text-muted-foreground">{it ? "Prezzo articolo · spedizione esclusa" : "Item price · shipping excluded"}</p></div>{acceptedOffer.dealStatus === "confirmed" ? <Badge className="bg-brand/15 text-brand">{it ? "Vendita confermata" : "Sale confirmed"}</Badge> : <Badge variant="secondary">{it ? "Accordo raggiunto" : "Deal agreed"}</Badge>}</div></div> : null}

      {acceptedOffer?.dealStatus === "open" && conversation.isOwner ? <div className={`rounded-lg border p-3 ${followupDue ? "border-brand/40 bg-brand/5" : "bg-background"}`}><div className="flex items-start gap-2"><Clock3 className="mt-0.5 size-4 text-brand" /><div className="flex-1"><p className="text-sm font-medium">{followupDue ? (it ? "Avete concluso la vendita?" : "Did you complete the sale?") : (it ? "Quando concludete la vendita, registrala qui" : "When the sale is completed, record it here")}</p><p className="mt-1 text-xs text-muted-foreground">{it ? "Ci serve il prezzo finale dell'articolo, senza spedizione, per costruire dati di mercato affidabili." : "We need the final item price, excluding shipping, to build reliable market data."}</p><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" disabled={busy} onClick={() => setSaleFormOpen(true)}>{it ? "Vendita conclusa" : "Sale completed"}</Button>{followupDue ? <Button size="sm" variant="outline" disabled={busy} onClick={() => void run(() => snoozeMarketplaceFollowupAction(acceptedOffer.id), it ? "Te lo ricorderemo tra qualche giorno" : "We'll remind you again in a few days")}>{it ? "Non ancora" : "Not yet"}</Button> : null}<Button size="sm" variant="ghost" disabled={busy} onClick={() => { if (window.confirm(it ? "Confermi che la trattativa è stata annullata?" : "Confirm that this deal was cancelled?")) void run(() => cancelMarketplaceDealAction(acceptedOffer.id), it ? "Trattativa annullata" : "Deal cancelled") }}>{it ? "Annullata" : "Cancelled"}</Button></div></div></div></div> : null}

      {acceptedOffer?.dealStatus === "open" && !conversation.isOwner ? <p className="text-xs text-muted-foreground">{it ? "L'offerta è stata accettata. Pagamento e spedizione si concordano fuori da TrackDash; dopo la conclusione il venditore registrerà il prezzo finale e ti chiederemo di confermarlo." : "The offer was accepted. Payment and shipping are arranged outside TrackDash; after completion the seller records the final price and you'll be asked to confirm it."}</p> : null}

      {saleFormOpen && acceptedOffer && conversation.isOwner ? <div className="grid gap-3 rounded-lg border bg-background p-3"><div><p className="text-sm font-medium">{it ? "Registra vendita conclusa" : "Record completed sale"}</p><p className="text-xs text-muted-foreground">{it ? "Il Market Value usa solo il prezzo dell'articolo. La spedizione resta separata." : "Market Value uses the item price only. Shipping stays separate."}</p></div><div className="grid gap-2 sm:grid-cols-2"><label className="grid gap-1 text-xs text-muted-foreground">{it ? "Prezzo finale articolo" : "Final item price"}<Input type="number" min="0" step={acceptedOffer.currency === "JPY" ? "1" : "0.01"} value={salePrice} onChange={(event) => setSalePrice(event.target.value)} /></label><label className="grid gap-1 text-xs text-muted-foreground">{it ? "Spedizione (opzionale)" : "Shipping (optional)"}<Input type="number" min="0" step={acceptedOffer.currency === "JPY" ? "1" : "0.01"} value={saleShipping} onChange={(event) => setSaleShipping(event.target.value)} /></label><label className="grid gap-1 text-xs text-muted-foreground">{it ? "Data vendita" : "Sale date"}<Input type="date" max={localToday()} value={saleDate} onChange={(event) => setSaleDate(event.target.value)} /></label><label className="grid gap-1 text-xs text-muted-foreground">{it ? "Valuta" : "Currency"}<Input value={acceptedOffer.currency} disabled /></label></div><div className="flex gap-2"><Button size="sm" disabled={busy || !salePrice || Number(salePrice) <= 0 || !saleDate} onClick={() => void run(() => reportMarketplaceSaleAction({ offerId: acceptedOffer.id, itemPrice: Number(salePrice), shippingPrice: saleShipping ? Number(saleShipping) : null, currency: acceptedOffer.currency, saleDate }), it ? "Vendita registrata — attendiamo la conferma dell'acquirente" : "Sale recorded — awaiting buyer confirmation").then(() => setSaleFormOpen(false))}>{it ? "Invia conferma" : "Submit"}</Button><Button size="sm" variant="ghost" onClick={() => setSaleFormOpen(false)}>{it ? "Annulla" : "Cancel"}</Button></div></div> : null}

      {state.sale?.status === "pending_confirmation" ? <div className="rounded-lg border bg-background p-3"><p className="text-sm font-medium">{it ? "Vendita dichiarata" : "Sale reported"}</p><p className="mt-1 text-lg font-semibold">{money(state.sale.itemPrice, state.sale.currency, locale)}</p><p className="text-xs text-muted-foreground">{it ? `Prezzo articolo · ${state.sale.saleDate}${state.sale.shippingPrice != null ? ` · spedizione ${money(state.sale.shippingPrice, state.sale.currency, locale)}` : ""}` : `Item price · ${state.sale.saleDate}${state.sale.shippingPrice != null ? ` · shipping ${money(state.sale.shippingPrice, state.sale.currency, locale)}` : ""}`}</p>{!conversation.isOwner ? <div className="mt-3"><p className="mb-2 text-xs text-muted-foreground">{it ? "Confermi che questo è il prezzo finale dell'articolo, esclusa la spedizione?" : "Do you confirm this is the final item price, excluding shipping?"}</p><div className="flex flex-wrap gap-2"><Button size="sm" disabled={busy} onClick={() => void run(() => respondMarketplaceSaleAction(state.sale!.id, "confirmed"), it ? "Vendita confermata — il dato contribuirà alle statistiche TrackDash" : "Sale confirmed — this will contribute to TrackDash market statistics")}><Check className="size-4" /> {it ? "Conferma acquisto" : "Confirm purchase"}</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => void run(() => respondMarketplaceSaleAction(state.sale!.id, "disputed"), it ? "Hai segnalato che i dati non sono corretti" : "You reported incorrect sale data")}>{it ? "Dati non corretti" : "Incorrect details"}</Button></div></div> : <p className="mt-2 text-xs text-muted-foreground">{it ? "In attesa della conferma dell'acquirente." : "Waiting for buyer confirmation."}</p>}</div> : null}

      {state.sale?.status === "disputed" ? <div className="rounded-lg border border-dashed p-3"><p className="text-sm font-medium">{it ? "Dati vendita da verificare" : "Sale details need review"}</p><p className="mt-1 text-xs text-muted-foreground">{conversation.isOwner ? (it ? "L'acquirente ha indicato che i dati non sono corretti. Puoi reinviare prezzo/data corretti." : "The buyer said the details are incorrect. You can submit corrected price/date details.") : (it ? "Hai segnalato un problema con i dati. Il venditore può correggerli e reinviarli." : "You flagged the details. The seller can correct and resubmit them.")}</p>{conversation.isOwner ? <Button size="sm" className="mt-3" onClick={() => setSaleFormOpen(true)}>{it ? "Correggi dati vendita" : "Correct sale details"}</Button> : null}</div> : null}

      {state.sale?.status === "confirmed" ? <div className="rounded-lg border border-brand/30 bg-brand/5 p-3"><div className="flex items-center gap-2 text-brand"><Check className="size-4" /><p className="text-sm font-semibold">{it ? "Vendita confermata da entrambi" : "Sale confirmed by both collectors"}</p></div><p className="mt-1 text-sm">{money(state.sale.itemPrice, state.sale.currency, locale)} · {state.sale.saleDate}</p><p className="mt-1 text-xs text-muted-foreground">{it ? "Il prezzo dell'articolo entra nelle statistiche di mercato TrackDash in forma aggregata. La spedizione non influenza il Market Value." : "The item price contributes to aggregated TrackDash market statistics. Shipping does not affect Market Value."}</p></div> : null}

      {blocked ? <p className="text-xs text-muted-foreground">{it ? "Le azioni di trattativa sono limitate finché uno dei due collezionisti ha bloccato l'altro." : "Deal actions are limited while either collector has blocked the other."}</p> : null}
    </div>
  )
}
