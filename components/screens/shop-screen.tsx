"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight, HandCoins, Package, Search, Store } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { formatMoney } from "@/lib/format"
import type { ShopCopy } from "@/lib/server/shop"
import { DirectOfferDialog } from "@/components/messaging/direct-offer-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function CopyImage({ copy, large = false }: { copy: ShopCopy; large?: boolean }) {
  const [failed, setFailed] = React.useState(false)
  return <div className={`flex items-center justify-center overflow-hidden bg-[#f5f7fb] ${large ? "aspect-square rounded-2xl" : "aspect-[4/3]"}`}>
    {copy.imageUrl && !failed
      // Signed copy photos use their original URL, keeping the private bucket private.
      // eslint-disable-next-line @next/next/no-img-element
      ? <img src={copy.imageUrl} alt={`${copy.name} — ${copy.editionName}`} loading="lazy" className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105" onError={() => setFailed(true)} />
      : <Package className="size-16 text-slate-300" aria-hidden="true" />}
  </div>
}

const CONDITIONS: Record<string, string> = { Sealed: "Sigillato", "New / Opened": "Nuovo / Aperto", Built: "Montato", Used: "Usato", Incomplete: "Incompleto" }

export function ShopScreen({ copies, detail = false }: { copies: ShopCopy[]; detail?: boolean }) {
  const { locale } = useI18n()
  const it = locale === "it"
  const [search, setSearch] = React.useState("")
  const [offerTarget, setOfferTarget] = React.useState<ShopCopy | null>(null)
  const needle = search.trim().toLocaleLowerCase()
  const visible = copies.filter((copy) => `${copy.name} ${copy.editionName} ${copy.itemNumber ?? ""} ${copy.username}`.toLocaleLowerCase().includes(needle))
  const price = (copy: ShopCopy) => copy.askingPrice != null && copy.askingCurrency
    ? formatMoney(copy.askingPrice, copy.askingCurrency) : it ? "Su proposta" : "Make an offer"
  const condition = (copy: ShopCopy) => it ? CONDITIONS[copy.condition] ?? copy.condition : copy.condition
  const copy = copies[0]

  return <div className="space-y-6 pb-16">
    {detail && copy ? <>
      <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-brand"><ArrowLeft className="size-4" />{it ? "Torna a In vendita" : "Back to For sale"}</Link>
      <div className="grid gap-7 lg:grid-cols-[1.15fr_1fr] lg:items-start">
        <CopyImage key={copy.imageUrl} copy={copy} large />
        <div className="space-y-5 rounded-2xl border bg-white p-5 md:p-7">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">{it ? "Dai collezionisti" : "From collectors"}</p>
          <div><h1 className="text-3xl font-semibold tracking-tight text-navy">{copy.name}</h1><p className="mt-2 text-base text-muted-foreground">{copy.editionName}</p></div>
          <div className="flex flex-wrap gap-2 text-xs font-medium"><span className="rounded-full bg-brand-muted px-3 py-1.5 text-brand">{condition(copy)}</span>{copy.itemNumber ? <span className="rounded-full bg-muted px-3 py-1.5">#{copy.itemNumber}</span> : null}{copy.releaseYear ? <span className="rounded-full bg-muted px-3 py-1.5">{copy.releaseYear}</span> : null}{copy.chassis ? <span className="rounded-full bg-muted px-3 py-1.5">{copy.chassis}</span> : null}</div>
          <div className="rounded-xl bg-[#f2f6ff] p-5"><p className="text-xs font-medium text-muted-foreground">{it ? "Prezzo richiesto" : "Asking price"}</p><p className="mt-1 text-3xl font-semibold tracking-tight text-navy">{price(copy)}</p><p className="mt-3 text-sm text-muted-foreground">{it ? "Proposto da" : "Offered by"} <Link href={`/collectors/${encodeURIComponent(copy.username)}`} className="font-semibold text-brand">@{copy.username}</Link></p></div>
          <Button className="h-12 w-full gap-2" disabled={copy.isMine} onClick={() => setOfferTarget(copy)}><HandCoins className="size-4" />{copy.isMine ? (it ? "La tua copia" : "Your copy") : (it ? "Fai un’offerta" : "Make an offer")}</Button>
          <p className="text-sm leading-6 text-muted-foreground">{it ? "Invia la tua proposta e continua la trattativa nei messaggi. Concordate insieme spedizione e pagamento." : "Send your offer and continue in messages. Agree shipping and payment with the collector."}</p>
          <Link href={copy.releaseHref} className="inline-flex items-center gap-1 text-sm font-semibold text-brand">{it ? "Scopri tutti i dettagli della release" : "Explore the release details"}<ArrowUpRight className="size-4" /></Link>
        </div>
      </div>
    </> : <>
      <section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-[#edf4ff] via-white to-[#f3f7ff] p-6 md:p-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-brand"><Store className="size-4" />{it ? "Tra collezionisti" : "Collector to collector"}<span className="ml-auto rounded-full border border-blue-100 bg-white px-3 py-1 text-[10px] tracking-normal">{it ? "Anteprima" : "Preview"}</span></div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-navy md:text-4xl">{it ? "In vendita" : "For sale"}</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{it ? "La prossima release della tua collezione potrebbe essere qui. Scopri le copie disponibili e fai la tua offerta." : "Your next collectible could be here. Explore available copies and make your offer."}</p>
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-medium text-muted-foreground">{visible.length} {it ? (visible.length === 1 ? "copia disponibile" : "copie disponibili") : "available copies"}</p><div className="relative w-full sm:w-80"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input aria-label={it ? "Cerca tra le copie in vendita" : "Search copies for sale"} placeholder={it ? "Cerca modello, release o codice…" : "Search model, release or code…"} className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} /></div></div>
      {visible.length ? <div className="grid grid-cols-1 gap-5 min-[400px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visible.map((item) => <Link key={item.id} href={`/shop/${item.id}`} className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md focus-visible:outline-2 focus-visible:outline-brand">
        <CopyImage key={item.imageUrl} copy={item} />
        <div className="space-y-3 p-4"><div><p className="text-xs font-medium text-muted-foreground">{[item.itemNumber ? `#${item.itemNumber}` : null, item.releaseYear].filter(Boolean).join(" · ")}</p><h2 className="mt-1 font-semibold leading-snug text-navy">{item.name}</h2><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.editionName}</p></div><span className="inline-flex rounded-full bg-brand-muted px-2.5 py-1 text-[11px] font-medium text-brand">{condition(item)}</span><div className="border-t pt-3"><p className="text-[11px] text-muted-foreground">{it ? "Prezzo richiesto" : "Asking price"}</p><p className="mt-0.5 text-xl font-semibold text-navy">{price(item)}</p><p className="mt-2 truncate text-xs text-muted-foreground">@{item.username}</p></div></div>
      </Link>)}</div> : <div className="rounded-2xl border border-dashed p-10 text-center"><Store className="mx-auto size-9 text-brand/50" /><h2 className="mt-3 font-semibold">{it ? (needle ? "Prova un’altra ricerca" : "La vetrina aspetta le prime copie") : "Explore your collection"}</h2><p className="mt-2 text-sm text-muted-foreground">{it ? "Ne hai una da proporre? Aprila alle offerte dalla tua collezione." : "Have a copy to offer? Make it available from your collection."}</p><Button className="mt-4" render={<Link href="/collection" />}>{it ? "Vai alla collezione" : "Go to collection"}</Button></div>}
    </>}
    <DirectOfferDialog target={offerTarget ? { username: offerTarget.username, shareId: offerTarget.id, askingPrice: offerTarget.askingPrice, askingCurrency: offerTarget.askingCurrency } : null} locale={it ? "it" : "en"} onOpenChange={(open) => { if (!open) setOfferTarget(null) }} />
  </div>
}
