"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight, HandCoins, Package, Search, Store, UserRound } from "lucide-react"
import { useStore } from "@/lib/store"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useI18n } from "@/lib/i18n"
import { formatMoney } from "@/lib/format"
import type { ShopCopy } from "@/lib/server/shop"
import { DirectOfferDialog } from "@/components/messaging/direct-offer-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function CopyImage({ copy, large = false }: { copy: ShopCopy; large?: boolean }) {
  const [imageIndex, setImageIndex] = React.useState(0)
  const imageUrls = [...new Set([copy.imageUrl, copy.fallbackImageUrl].filter((url): url is string => Boolean(url)))]
  const imageUrl = imageUrls[imageIndex]
  return <div className={`flex items-center justify-center overflow-hidden bg-white ${large ? "aspect-square rounded-2xl" : "aspect-[4/3]"}`}>
    {imageUrl
      // Signed copy photos use their original URL, keeping the private bucket private.
      // eslint-disable-next-line @next/next/no-img-element
      ? <img src={imageUrl} alt={`${copy.name} — ${copy.editionName}`} loading="lazy" className="h-full w-full object-contain p-1 transition-transform duration-300 group-hover:scale-105" onError={() => setImageIndex((index) => index + 1)} />
      : <Package className="size-16 text-slate-300" aria-hidden="true" />}
  </div>
}

const CONDITIONS: Record<string, string> = { Sealed: "Sigillato", "New / Opened": "Nuovo / Aperto", Built: "Montato", Used: "Usato", Incomplete: "Incompleto" }

export function ShopScreen({ copies, detail = false }: { copies: ShopCopy[]; detail?: boolean }) {
  const { locale } = useI18n()
  const { user, hydrated } = useStore()
  const [authPrompt, setAuthPrompt] = React.useState(false)
  const it = locale === "it"
  const [search, setSearch] = React.useState("")
  const [offerTarget, setOfferTarget] = React.useState<ShopCopy | null>(null)
  const needle = search.trim().toLocaleLowerCase()
  const visible = copies.filter((copy) => `${copy.name} ${copy.editionName} ${copy.itemNumber ?? ""} ${copy.username}`.toLocaleLowerCase().includes(needle))
  const price = (copy: ShopCopy) => copy.askingPrice != null && copy.askingCurrency
    ? formatMoney(copy.askingPrice, copy.askingCurrency) : it ? "Su proposta" : "Make an offer"
  const condition = (copy: ShopCopy) => it ? CONDITIONS[copy.condition] ?? copy.condition : copy.condition
  const copy = copies[0]
  const returnTo = copy ? `/shop/${copy.id}?offer=1` : "/shop"
  const signupHref = `/signup?next=${encodeURIComponent(returnTo)}`
  const loginHref = `/login?next=${encodeURIComponent(returnTo)}`
  React.useEffect(() => {
    if (!detail || !copy || !hydrated || !user || copy.isMine) return
    if (new URLSearchParams(window.location.search).get("offer") === "1") {
      setOfferTarget(copy)
      window.history.replaceState(window.history.state, "", `/shop/${copy.id}`)
    }
  }, [detail, copy, hydrated, user])
  function makeOffer() {
    if (!hydrated) return
    if (!user) setAuthPrompt(true)
    else if (copy && !copy.isMine) setOfferTarget(copy)
  }

  return <div className="space-y-6 pb-16">
    {detail && copy ? <>
      <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-brand"><ArrowLeft className="size-4" />{it ? "Torna al mercatino" : "Back to marketplace"}</Link>
      <div className="grid gap-7 lg:grid-cols-[1.15fr_1fr] lg:items-start">
        <CopyImage key={copy.imageUrl} copy={copy} large />
        <div className="space-y-5 rounded-2xl border bg-white p-5 md:p-7">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">{it ? "Dai collezionisti" : "From collectors"}</p>
          <div><h1 className="text-3xl font-semibold tracking-tight text-navy">{copy.name}</h1><p className="mt-2 text-base text-muted-foreground">{copy.editionName}</p></div>
          <div className="flex flex-wrap gap-2 text-xs font-medium"><span className="rounded-full bg-brand-muted px-3 py-1.5 text-brand">{condition(copy)}</span>{copy.itemNumber ? <span className="rounded-full bg-muted px-3 py-1.5">#{copy.itemNumber}</span> : null}{copy.releaseYear ? <span className="rounded-full bg-muted px-3 py-1.5">{copy.releaseYear}</span> : null}{copy.chassis ? <span className="rounded-full bg-muted px-3 py-1.5">{copy.chassis}</span> : null}</div>
          <div className="rounded-xl bg-[#f2f6ff] p-5"><p className="text-xs font-medium text-muted-foreground">{it ? "Prezzo richiesto" : "Asking price"}</p><p className={copy.askingPrice != null ? "mt-1 text-3xl font-semibold tracking-tight text-navy" : "mt-2 text-lg font-medium text-slate-600"}>{price(copy)}</p><p className="mt-3 text-sm text-muted-foreground">{it ? "Proposto da" : "Offered by"} <Link href={`/collectors/${encodeURIComponent(copy.username)}`} className="font-medium text-brand">{copy.username}</Link></p></div>
          <Button className="h-12 w-full gap-2" disabled={copy.isMine || !hydrated} onClick={makeOffer}><HandCoins className="size-4" />{copy.isMine ? (it ? "La tua copia" : "Your copy") : (it ? "Fai un’offerta" : "Make an offer")}</Button>
          <p className="text-sm leading-6 text-muted-foreground">{it ? "Invia la tua proposta e continua la trattativa nei messaggi. Concordate insieme spedizione e pagamento." : "Send your offer and continue in messages. Agree shipping and payment with the collector."}</p>
          <Link href={copy.releaseHref} className="inline-flex items-center gap-1 text-sm font-semibold text-brand">{it ? "Scopri tutti i dettagli della release" : "Explore the release details"}<ArrowUpRight className="size-4" /></Link>
        </div>
      </div>
    </> : <>
      <section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-[#edf4ff] via-white to-[#f3f7ff] p-6 md:p-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-brand"><Store className="size-4" />{it ? "Tra collezionisti" : "Collector to collector"}</div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-navy md:text-4xl">{it ? "Mini 4WD in vendita tra collezionisti" : "Mini 4WD for sale by collectors"}</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{it ? "Scopri le release disponibili, confronta i prezzi richiesti e contatta i collezionisti. Crea un account gratuito per fare la tua offerta." : "Explore available releases, compare asking prices and connect with collectors. Create a free account to make your offer."}</p>
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-medium text-muted-foreground">{visible.length} {it ? (visible.length === 1 ? "copia disponibile" : "copie disponibili") : "available copies"}</p><div className="relative w-full sm:w-80"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input aria-label={it ? "Cerca tra le copie in vendita" : "Search copies for sale"} placeholder={it ? "Cerca modello, release o codice…" : "Search model, release or code…"} className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} /></div></div>
      {visible.length ? (
        <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((item) => (
            <Link
              key={item.id}
              href={`/shop/${item.id}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md focus-visible:outline-2 focus-visible:outline-brand"
            >
              <CopyImage key={item.imageUrl} copy={item} />
              <div className="flex flex-1 flex-col px-3 pb-4 pt-3 sm:px-4">
                <p className="text-[11px] font-medium tracking-wide text-muted-foreground">
                  {[item.itemNumber ? `#${item.itemNumber}` : null, item.releaseYear].filter(Boolean).join(" · ")}
                </p>
                <h2 className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-navy sm:text-base sm:leading-5">
                  {item.name}
                </h2>
                <p className="mt-1 line-clamp-2 min-h-[2.25rem] text-xs leading-[1.125rem] text-muted-foreground">
                  {item.editionName}
                </p>
                <span className="mt-3 inline-flex w-fit rounded-full bg-brand-muted px-2.5 py-1 text-[10px] font-medium text-brand">
                  {condition(item)}
                </span>
                <div className="mt-auto pt-3">
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-[10px] font-medium text-muted-foreground">{it ? "Prezzo richiesto" : "Asking price"}</p>
                    <p className={`mt-1 flex min-h-7 items-center ${item.askingPrice != null ? "text-xl font-semibold tracking-tight text-navy" : "text-sm font-medium text-slate-600"}`}>
                      {price(item)}
                    </p>
                    <div className="mt-3 flex min-w-0 items-center gap-2 text-[11px] text-slate-500">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-100"><UserRound className="size-3" aria-hidden="true" /></span>
                      <span className="truncate">{item.username}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : <div className="rounded-2xl border border-dashed p-10 text-center"><Store className="mx-auto size-9 text-brand/50" /><h2 className="mt-3 font-semibold">{it ? (needle ? "Prova un’altra ricerca" : "La vetrina aspetta le prime copie") : "Explore your collection"}</h2><p className="mt-2 text-sm text-muted-foreground">{it ? "Ne hai una da proporre? Aprila alle offerte dalla tua collezione." : "Have a copy to offer? Make it available from your collection."}</p><Button className="mt-4" render={<Link href="/collection" />}>{it ? "Vai alla collezione" : "Go to collection"}</Button></div>}
    </>}
    {!detail ? <div className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-[#f2f6ff] p-5 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="font-semibold text-navy">{it ? "Hai delle release da vendere?" : "Have releases to sell?"}</p><p className="mt-1 text-sm text-muted-foreground">{it ? "Aggiungile alla tua collezione e fai il tuo prezzo." : "Add them to your collection and set your price."}</p></div>
      <Button render={<Link href={user ? "/collection" : "/signup?next=%2Fcollection"} />}>{user ? (it ? "Vai alla collezione" : "Go to collection") : (it ? "Crea account gratuito" : "Create free account")}</Button>
    </div> : null}
    <Dialog open={authPrompt} onOpenChange={setAuthPrompt}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{it ? "Ti interessa questa release?" : "Interested in this release?"}</DialogTitle>
          <DialogDescription>{it ? "Crea un account gratuito e contatta il collezionista. Fai la tua offerta e continua la trattativa nei messaggi." : "Create a free account to contact the collector. Make your offer and continue in messages."}</DialogDescription>
        </DialogHeader>
        <Button render={<Link href={signupHref} />}>{it ? "Crea account gratuito" : "Create free account"}</Button>
        <Button variant="outline" render={<Link href={loginHref} />}>{it ? "Hai già un account? Accedi" : "Already have an account? Sign in"}</Button>
      </DialogContent>
    </Dialog>
    <DirectOfferDialog target={user && offerTarget ? { username: offerTarget.username, shareId: offerTarget.id, askingPrice: offerTarget.askingPrice, askingCurrency: offerTarget.askingCurrency } : null} locale={it ? "it" : "en"} onOpenChange={(open) => { if (!open) setOfferTarget(null) }} />
  </div>
}
