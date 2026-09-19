"use client"

import Link from "next/link"
import { ArrowRight, Boxes, ScanLine, Search, ShieldCheck } from "lucide-react"
import { ProductImage } from "@/components/catalog/product-image"
import { useI18n } from "@/lib/i18n"
import { useMarketSignals } from "@/lib/market/context"
import { formatMoney } from "@/lib/format"
import type { Product, ProductRelease } from "@/lib/types"

function releaseHref(product: Product, release: ProductRelease) {
  return `/catalog/${product.id}/releases/${release.id}`
}

function confidenceLabel(value: "low" | "medium" | "high", it: boolean) {
  if (!it) return value === "high" ? "High reliability" : value === "medium" ? "Medium reliability" : "Low reliability"
  if (value === "high") return "Affidabilità alta"
  if (value === "medium") return "Affidabilità media"
  return "Affidabilità bassa"
}

export function PublicHomeScreen({ products }: { products: Product[] }) {
  const { locale } = useI18n()
  const it = locale === "it"
  const signals = useMarketSignals()

  const releases = products.flatMap((product) =>
    product.releases.map((release) => ({ product, release, signal: signals[release.id] })),
  )

  const featured = releases.find(({ release }) => release.itemNumber === "95467") ?? releases[0]
  const catalogPreview = releases
    .filter(({ release }) => Boolean(release.itemNumber))
    .sort((a, b) => (b.signal?.valueEUR ?? 0) - (a.signal?.valueEUR ?? 0))
    .slice(0, 4)

  const availableNow = releases
    .filter(({ release, signal }) => Boolean(release.itemNumber) && signal?.startingItemPriceEUR != null && signal.currentOfferCount > 0)
    .sort((a, b) => (a.signal?.startingItemPriceEUR ?? Number.POSITIVE_INFINITY) - (b.signal?.startingItemPriceEUR ?? Number.POSITIVE_INFINITY))
    .slice(0, 4)

  const featuredSignal = featured?.signal ?? null

  return (
    <div className="overflow-hidden bg-background">
      <section className="relative border-b border-line bg-white">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-brand" />
        <div className="mx-auto grid min-h-[640px] w-full max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.04fr_.96fr] lg:px-8 lg:py-20">
          <div className="relative z-10 max-w-2xl">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:text-[11px]">
              {it ? "LA CASA DIGITALE DEI COLLEZIONISTI MINI 4WD" : "THE DIGITAL HOME FOR MINI 4WD COLLECTORS"}
            </p>
            <h1 className="mt-5 max-w-[760px] text-[clamp(3.2rem,14vw,5.2rem)] font-semibold leading-[.87] tracking-[-0.075em] text-ink lg:text-[clamp(4.8rem,7vw,6.3rem)]">
              {it ? "Trova la versione esatta." : "Find the exact version."}
              <span className="block text-brand">{it ? "Segui il suo valore." : "Track its value."}</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
              {it
                ? "TrackDash ti aiuta a riconoscere il modello e la sua Release — cioè la specifica versione o edizione —, aggiungerla alla collezione e capire quanto vale oggi."
                : "TrackDash helps you identify the exact version of your Mini 4WD, add it to your collection and understand what it is worth today."}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/catalog" className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-brand px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0e49c7]">
                {it ? "Esplora il catalogo" : "Explore the catalog"} <ArrowRight className="size-4" />
              </Link>
              <Link href="/market" className="inline-flex h-12 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-navy transition hover:bg-brand-muted">
                {it ? "Scopri i valori di mercato" : "Explore market values"}
              </Link>
            </div>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              {it ? "Catalogo e valori sono consultabili da tutti. Crea un account per collezione, wishlist e scanner." : "Catalog and market values are open to everyone. Create an account for your collection, wishlist and scanner."}
            </p>
          </div>

          <div className="relative min-h-[430px] overflow-hidden border border-line bg-brand-muted p-5 sm:p-7 md:p-8">
            <div className="absolute right-[-70px] top-8 h-px w-72 -rotate-[18deg] bg-brand-red" />
            <div className="absolute right-[-55px] top-16 h-px w-80 -rotate-[18deg] bg-brand/20" />
            {featured ? (
              <>
                <div className="flex h-[240px] items-center justify-center overflow-hidden sm:h-[265px]">
                  <ProductImage product={featured.product} release={featured.release} className="h-full w-full border-0 bg-transparent object-contain" />
                </div>
                <div className="border-l-2 border-brand-red pl-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{it ? "RELEASE IN EVIDENZA" : "FEATURED RELEASE"}</p>
                  <Link href={releaseHref(featured.product, featured.release)} className="mt-1 block text-sm font-semibold text-ink hover:text-brand">
                    Tamiya {featured.release.itemNumber ?? "—"} · {featured.release.editionName}
                  </Link>
                </div>
                <div className="mt-5 bg-navy p-5 text-white">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/70">Market Value</span>
                    {featuredSignal ? <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#80e0b6]">● {confidenceLabel(featuredSignal.confidenceLabel, it)}</span> : null}
                  </div>
                  <div className="mt-3 text-4xl font-semibold tracking-[-0.06em]">
                    {featuredSignal?.valueEUR != null ? formatMoney(featuredSignal.valueEUR) : (it ? "Dati in arrivo" : "Data coming soon")}
                  </div>
                  <div className="mt-4 flex flex-wrap items-end justify-between gap-2 border-t border-white/20 pt-3 text-xs text-white/75">
                    <span>
                      {featuredSignal?.lowEUR != null && featuredSignal?.highEUR != null
                        ? `${it ? "Range" : "Typical range"} ${formatMoney(featuredSignal.lowEUR)}–${formatMoney(featuredSignal.highEUR)}`
                        : (it ? "Mostriamo una stima solo quando ci sono abbastanza dati." : "We show an estimate only when there is enough data.")}
                    </span>
                    {featuredSignal?.recentSoldUnits3m != null && featuredSignal.recentSoldUnits3m > 0 ? <strong>{featuredSignal.recentSoldUnits3m} {it ? "vendite recenti" : "recent sales"}</strong> : null}
                  </div>
                </div>
              </>
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">{it ? "Catalogo in caricamento" : "Catalog loading"}</div>
            )}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-[#eef4fb]">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{it ? "UN SOLO POSTO, QUATTRO FUNZIONI" : "ONE CLEAR PLACE"}</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-[.95] tracking-[-0.06em] text-ink md:text-6xl">
            {it ? "Pensato per il modo in cui collezioni davvero." : "Built around how collectors actually use it."}
          </h2>

          <div className="mt-10 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            <Feature number="01" icon={Search} title={it ? "Catalogo" : "Catalog"} text={it ? "Cerca il modello e scegli la Release corretta: la specifica uscita per anno, codice articolo, chassis o edizione." : "Find the model and choose the right Release: the specific issue by year, item number, chassis or edition."} />
            <Feature number="02" icon={Boxes} title={it ? "Collezione" : "Collection"} text={it ? "Salva le Mini 4WD che possiedi e guarda il valore stimato della tua collezione." : "Save the Mini 4WD you own and see the estimated value of your collection."} />
            <Feature number="03" icon={ScanLine} title="Scanner" text={it ? "Scansiona il codice sulla scatola oppure cercalo manualmente per arrivare più velocemente alla Release corretta." : "Scan the code on the box or search it manually to reach the correct Release faster."} />
            <Feature number="04" icon={ShieldCheck} title={it ? "Valore di mercato" : "Market value"} text={it ? "Una stima chiara basata sui dati disponibili, senza confondere annunci e vendite concluse." : "A clear estimate based on available data, without confusing listings with completed sales."} />
          </div>
        </div>
      </section>

      {featured ? (
        <section className="border-y border-line bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
              <div>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{it ? "DENTRO TRACKDASH" : "INSIDE TRACKDASH"}</p>
                <h2 className="mt-4 text-4xl font-semibold leading-[.95] tracking-[-0.06em] text-ink md:text-6xl">
                  {it ? "Una scheda per ogni versione, non un prezzo generico." : "One page for each version, not one generic price."}
                </h2>
                <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
                  {it
                    ? "Lo stesso modello può avere ristampe ed edizioni speciali diverse. TrackDash le tiene separate, così sai esattamente cosa hai e quale valore stai guardando."
                    : "The same model can have different reissues and special editions. TrackDash keeps them separate, so you know exactly what you own and which value you are looking at."}
                </p>
              </div>
              <Link href={releaseHref(featured.product, featured.release)} className="inline-flex items-center gap-2 justify-self-start text-sm font-semibold text-brand lg:justify-self-end">
                {it ? "Apri questa Release" : "Open this Release"} <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="mt-10 overflow-hidden border border-line bg-[#f7f9fc] shadow-[0_18px_55px_rgba(11,50,117,0.08)]">
              <div className="flex items-center justify-between border-b border-line bg-white px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-brand-red" />
                  <span className="size-2 rounded-full bg-[#d59a00]" />
                  <span className="size-2 rounded-full bg-[#23865f]" />
                </div>
                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{it ? "TrackDash · Scheda Release" : "TrackDash · Release details"}</span>
              </div>

              <div className="grid lg:grid-cols-[.9fr_1.1fr]">
                <div className="flex min-h-[300px] items-center justify-center border-b border-line bg-brand-muted p-6 sm:min-h-[390px] sm:p-10 lg:border-b-0 lg:border-r">
                  <ProductImage product={featured.product} release={featured.release} className="h-full max-h-[360px] w-full border-0 bg-transparent object-contain" />
                </div>

                <div className="p-5 sm:p-7 lg:p-9">
                  <div className="border-l-2 border-brand-red pl-3">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Tamiya {featured.release.itemNumber ?? "—"}</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-[-0.045em] text-ink sm:text-3xl">{featured.release.editionName}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{featured.release.releaseYear ?? "—"} · {featured.release.chassis ?? featured.product.chassis ?? "—"}</p>
                  </div>

                  <div className="mt-7 grid gap-px bg-line sm:grid-cols-2">
                    <PreviewCell label={it ? "Valore stimato" : "Estimated value"} value={featuredSignal?.valueEUR != null ? formatMoney(featuredSignal.valueEUR) : (it ? "Dati in arrivo" : "Data coming soon")} detail={featuredSignal ? confidenceLabel(featuredSignal.confidenceLabel, it) : (it ? "In attesa di più dati" : "Waiting for more data")} />
                    <PreviewCell label={it ? "Fascia indicativa" : "Estimated range"} value={featuredSignal?.lowEUR != null && featuredSignal?.highEUR != null ? `${formatMoney(featuredSignal.lowEUR)}–${formatMoney(featuredSignal.highEUR)}` : "—"} detail={it ? "Una lettura semplice del valore possibile" : "A simple view of the possible value"} />
                    <PreviewCell label={it ? "Disponibile da" : "Available from"} value={featuredSignal?.startingItemPriceEUR != null ? formatMoney(featuredSignal.startingItemPriceEUR) : "—"} detail={it ? "Prezzo più basso trovato, spedizione esclusa" : "Lowest price found, shipping excluded"} />
                    <PreviewCell label={it ? "Offerte trovate" : "Offers found"} value={featuredSignal ? String(featuredSignal.currentOfferCount) : "—"} detail={it ? "Annunci disponibili in questo momento" : "Listings available right now"} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-navy text-white">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[.85fr_1.15fr] lg:px-8 lg:py-20">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">Price Intelligence</p>
            <h2 className="mt-4 text-4xl font-semibold leading-[.95] tracking-[-0.06em] md:text-6xl">
              {it ? "Capisci quanto vale oggi." : "Understand what it is worth today."}
            </h2>
            <p className="mt-6 max-w-lg text-sm leading-6 text-white/75 md:text-base">
              {it
                ? "TrackDash confronta vendite concluse, prezzi nei negozi e annunci attivi. Se i dati non bastano, te lo dice: niente valori inventati."
                : "TrackDash compares completed sales, store prices and active listings. If there is not enough data, it says so instead of inventing a value."}
            </p>
            <Link href="/market" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-white underline decoration-brand-red decoration-2 underline-offset-4">
              {it ? "Scopri come leggiamo il mercato" : "See how we read the market"} <ArrowRight className="size-4" />
            </Link>
          </div>

          {featuredSignal && featured ? (
            <div className="grid gap-px bg-white/20 sm:grid-cols-2">
              <MarketCell label={it ? "Valore stimato" : "Estimated value"} value={featuredSignal.valueEUR != null ? formatMoney(featuredSignal.valueEUR) : (it ? "Dati in arrivo" : "Data coming soon")} detail={confidenceLabel(featuredSignal.confidenceLabel, it)} />
              <MarketCell label={it ? "Vendite concluse" : "Completed sales"} value={featuredSignal.soldAnchorEUR != null ? formatMoney(featuredSignal.soldAnchorEUR) : "—"} detail={`${featuredSignal.soldUnits} ${it ? "vendite osservate" : "observed sales"}`} />
              <MarketCell label={it ? "Disponibilità attuale" : "Available now"} value={featuredSignal.startingItemPriceEUR != null ? `${it ? "Da" : "From"} ${formatMoney(featuredSignal.startingItemPriceEUR)}` : "—"} detail={it ? "Prezzo più basso trovato ora" : "Lowest price found now"} />
              <MarketCell label={it ? "Range" : "Typical range"} value={featuredSignal.lowEUR != null && featuredSignal.highEUR != null ? `${formatMoney(featuredSignal.lowEUR)}–${formatMoney(featuredSignal.highEUR)}` : "—"} detail={it ? "Fascia indicativa del valore" : "Estimated value range"} />
            </div>
          ) : null}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{it ? "DAL CATALOGO" : "FROM THE CATALOG"}</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.055em] text-ink md:text-5xl">{it ? "Un modello può avere più Release." : "One model can have multiple Releases."}</h2>
            </div>
            <Link href="/catalog" className="inline-flex items-center gap-2 text-sm font-semibold text-brand">{it ? "Vedi tutto il catalogo" : "View the full catalog"} <ArrowRight className="size-4" /></Link>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {catalogPreview.map(({ product, release, signal }) => (
              <Link key={release.id} href={releaseHref(product, release)} className="group overflow-hidden border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-navy/10">
                <div className="aspect-[4/3] bg-brand-muted p-4">
                  <ProductImage product={product} release={release} className="h-full w-full border-0 bg-transparent object-contain" />
                </div>
                <div className="p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Tamiya {release.itemNumber ?? "—"}</p>
                  <h3 className="mt-2 line-clamp-2 text-lg font-semibold tracking-[-0.035em] text-ink group-hover:text-brand">{release.editionName}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{release.releaseYear ?? "—"} · {release.chassis ?? product.chassis ?? "—"}</p>
                  <div className="mt-4 border-t border-line pt-3 text-sm font-semibold text-navy">
                    {signal?.valueEUR != null ? `${formatMoney(signal.valueEUR)} ${it ? "valore stimato" : "estimated value"}` : (it ? "Dati di mercato in arrivo" : "Market data coming soon")}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-[#eef4fb]">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_.9fr] lg:px-8 lg:py-20">
          <div className="border border-line bg-white p-7 sm:p-9 lg:p-10">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{it ? "LA TUA COLLEZIONE" : "YOUR COLLECTION"}</p>
            <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-[.95] tracking-[-0.055em] text-ink md:text-5xl">{it ? "Quello che possiedi, finalmente ordinato per Release." : "What you own, finally organised by exact Release."}</h2>
            <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">{it ? "Aggiungi le Release che possiedi, tieni separate le diverse copie e guarda il valore stimato della tua collezione in un colpo d'occhio." : "Add the Releases you own, keep different copies separate and see the estimated value of your collection at a glance."}</p>
            <Link href="/login?next=%2Fcollection" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-brand">{it ? "Apri la tua collezione" : "Open your collection"} <ArrowRight className="size-4" /></Link>
          </div>

          <div className="relative overflow-hidden bg-brand p-7 text-white sm:p-9 lg:p-10">
            <div className="absolute right-[-35px] top-8 h-1 w-48 -rotate-[19deg] bg-brand-red" />
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">{it ? "VALORE COLLEZIONE" : "COLLECTION VALUE"}</p>
            <div className="mt-8 grid gap-px bg-white/25 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <CollectionMetric value={it ? "Release" : "Releases"} label={it ? "versioni esatte, non modelli generici" : "exact versions, not generic models"} />
              <CollectionMetric value={it ? "Valore oggi" : "Value today"} label={it ? "stima della tua collezione" : "estimated collection value"} />
              <CollectionMetric value="Wishlist" label={it ? "tieni d'occhio ciò che cerchi" : "keep track of what you want"} />
              <CollectionMetric value={it ? "Copie" : "Copies"} label={it ? "gestisci più esemplari della stessa Release" : "manage multiple copies of the same Release"} />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[.82fr_1.18fr] lg:px-8 lg:py-20">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Scanner</p>
            <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-[.95] tracking-[-0.055em] text-ink md:text-5xl">{it ? "Una scansione. La Release giusta." : "One scan. The right Release."}</h2>
            <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">{it ? "Scansiona il codice sulla scatola oppure inseriscilo manualmente. TrackDash ti porta alla versione corretta quando può identificarla con certezza." : "Scan the code on the box or enter it manually. TrackDash takes you to the correct version when it can identify it confidently."}</p>
            <Link href="/login?next=%2Fscanner" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-brand">{it ? "Apri Scanner" : "Open Scanner"} <ArrowRight className="size-4" /></Link>
          </div>

          <div className="relative overflow-hidden border border-line bg-navy p-5 text-white sm:p-8">
            <div className="absolute left-[-55px] top-14 h-px w-60 rotate-[18deg] bg-brand-red" />
            <div className="relative mx-auto max-w-lg border border-white/25 bg-[#123f8f] p-5 sm:p-7">
              <div className="flex items-center justify-between gap-3 border-b border-white/20 pb-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/65">{it ? "CODICE ARTICOLO · ITEM NUMBER" : "ITEM NUMBER"}</span>
                <span className="text-xs font-semibold text-[#80e0b6]">● {it ? "PRONTO" : "READY"}</span>
              </div>
              <div className="my-8 grid min-h-40 place-items-center border border-white/25 bg-[#0b3275] font-mono text-5xl font-semibold tracking-[0.12em] sm:text-6xl">95467</div>
              <div className="flex items-center justify-between gap-4 text-xs text-white/70">
                <span>{it ? "Identificazione Release" : "Release identification"}</span>
                <span className="font-semibold text-white">Tamiya</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {availableNow.length > 0 ? (
        <section className="border-t border-line bg-[#eef4fb]">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{it ? "DISPONIBILI ORA" : "AVAILABLE NOW"}</p>
                <h2 className="mt-3 max-w-2xl text-4xl font-semibold leading-[.96] tracking-[-0.055em] text-ink md:text-5xl">{it ? "Release che puoi trovare sul mercato adesso." : "Releases you can find on the market right now."}</h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">{it ? "Qui trovi le Release con almeno un annuncio attivo. Mostriamo il prezzo più basso trovato, spedizione esclusa." : "Here you can see Releases with at least one active listing. We show the lowest price found, shipping excluded."}</p>
              </div>
              <Link href="/catalog" className="inline-flex items-center gap-2 text-sm font-semibold text-brand">{it ? "Esplora tutte le Release" : "Explore all Releases"} <ArrowRight className="size-4" /></Link>
            </div>

            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {availableNow.map(({ product, release, signal }) => (
                <Link key={release.id} href={releaseHref(product, release)} className="group overflow-hidden border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-navy/10">
                  <div className="aspect-[4/3] bg-white p-4">
                    <ProductImage product={product} release={release} className="h-full w-full border-0 bg-transparent object-contain" />
                  </div>
                  <div className="border-t border-line p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Tamiya {release.itemNumber ?? "—"}</p>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-success">● {it ? "Disponibile" : "Available"}</span>
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-lg font-semibold tracking-[-0.035em] text-ink group-hover:text-brand">{release.editionName}</h3>
                    <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-3">
                      <div>
                        <span className="block font-mono text-[9px] uppercase tracking-[0.13em] text-muted-foreground">{it ? "DA" : "FROM"}</span>
                        <strong className="mt-1 block text-xl font-semibold tracking-[-0.04em] text-navy">{signal?.startingItemPriceEUR != null ? formatMoney(signal.startingItemPriceEUR) : "—"}</strong>
                      </div>
                      <div className="text-right text-[11px] leading-5 text-muted-foreground">
                        <div>{signal?.currentOfferCount ?? 0} {it ? "offerte" : "offers"}</div>
                        {signal?.recentSoldUnits3m != null && signal.recentSoldUnits3m > 0 ? <div>{signal.recentSoldUnits3m} {it ? "vendite recenti" : "recent sales"}</div> : null}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}

function Feature({ number, icon: Icon, title, text }: { number: string; icon: React.ComponentType<{ className?: string }>; title: string; text: string }) {
  return (
    <article className="min-h-56 bg-white p-6">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-bold tracking-[0.16em] text-brand-red">{number}</span>
        <Icon className="size-5 text-brand" />
      </div>
      <h3 className="mt-10 text-xl font-semibold tracking-[-0.04em] text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </article>
  )
}

function PreviewCell({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="min-h-36 bg-white p-5">
      <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <strong className="mt-4 block text-2xl font-semibold tracking-[-0.045em] text-ink">{value}</strong>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  )
}

function MarketCell({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="min-h-44 bg-white p-6 text-ink">
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{label}</span>
      <strong className="mt-5 block text-2xl font-semibold tracking-[-0.045em]">{value}</strong>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  )
}

function CollectionMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-h-28 bg-[#0b3275] p-5">
      <strong className="block text-2xl font-semibold tracking-[-0.045em] text-white">{value}</strong>
      <span className="mt-2 block text-xs leading-5 text-white/70">{label}</span>
    </div>
  )
}
