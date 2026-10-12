"use client"

import * as React from "react"
import Link from "next/link"
import { Boxes, Coins, Eye, Globe2, Handshake, Layers, LockKeyhole, Pencil, Plus, Search, Sparkles, Tag, Trash2, TrendingUp } from "lucide-react"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import { useMarketSignals } from "@/lib/market/context"
import { observedMarketOfferOrigin, observedMarketReferenceIsHistorical, observedMarketReferencePrice } from "@/lib/market/presentation"
import { enrichCollection, portfolioSummary, type EnrichedCollectionItem } from "@/lib/analytics"
import { formatMoney } from "@/lib/format"
import type { CollectionItem, Condition, Currency, Product } from "@/lib/types"
import { CONDITIONS, CURRENCIES } from "@/lib/types"
import { getMyCollectionSharesAction, saveCollectionItemAndShareAction, type CollectionOfferTerms, type CollectionVisibility } from "@/lib/actions/sharing"
import { StatCard } from "@/components/stat-card"
import { ProductImage } from "@/components/catalog/product-image"
import { TrendIndicator } from "@/components/market-bits"
import { MarketPricePanelShell } from "@/components/market-price-panel-shell"
import { CollectionItemPhotosButton } from "@/components/collection-item-photos-button"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const FREE_COLLECTION_LIMIT = 50

type SortKey = "recent" | "value-desc" | "value-asc" | "name"
type ConditionFilter = "all" | Condition
type MyShare = Awaited<ReturnType<typeof getMyCollectionSharesAction>>[number]
type Visibility = CollectionVisibility

function visibilityLabel(value: Visibility, it: boolean) {
  if (value === "open_to_offers") return it ? "Offerte" : "Offers"
  if (value === "showcase") return it ? "Condiviso" : "Shared"
  return it ? "Privato" : "Private"
}
function visibilityLongLabel(value: Visibility, it: boolean) {
  if (value === "open_to_offers") return it ? "Aperto a offerte" : "Open to offers"
  if (value === "showcase") return it ? "Condiviso nella vetrina" : "Shared in collector showcase"
  return it ? "Privato" : "Private"
}
function VisibilityIcon({ value }: { value: Visibility }) {
  if (value === "open_to_offers") return <Handshake className="size-3" />
  if (value === "showcase") return <Globe2 className="size-3" />
  return <LockKeyhole className="size-3" />
}
function conditionLabel(value: Condition, it: boolean) {
  if (!it) return value
  const labels: Partial<Record<Condition, string>> = {
    Sealed: "Sigillato",
    "New / Opened": "Nuovo / Aperto",
    Built: "Montato",
    Used: "Usato",
    Incomplete: "Incompleto",
  }
  return labels[value] ?? value
}

function VisibilitySelect({ value, disabled, onChange }: { value: Visibility; disabled?: boolean; onChange: (value: Visibility) => void }) {
  const { locale } = useI18n(); const it = locale === "it"
  return (
    <Select value={value} onValueChange={(next) => onChange(next as Visibility)} disabled={disabled}>
      <SelectTrigger size="sm" aria-label={`${it ? "Visibilità collezione" : "Collection visibility"}: ${visibilityLongLabel(value, it)}`} title={`${it ? "Visibilità" : "Visibility"}: ${visibilityLongLabel(value, it)}`} className={cn("h-7 rounded-full border px-2.5 text-[10px] font-medium", value === "open_to_offers" && "border-brand/30 bg-brand/10 text-brand", value === "showcase" && "bg-muted text-foreground", value === "private" && "text-muted-foreground")}>
        <VisibilityIcon value={value} /><span>{visibilityLabel(value, it)}</span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="private">{it ? "Privato — visibile solo a te" : "Private — only you can see it"}</SelectItem>
        <SelectItem value="showcase">{it ? "Condiviso — vetrina collezionista" : "Shared — collector showcase"}</SelectItem>
        <SelectItem value="open_to_offers">{it ? "Aperto a offerte" : "Open to offers"}</SelectItem>
      </SelectContent>
    </Select>
  )
}

export function CollectionScreen({ catalogProducts }: { catalogProducts: Product[] }) {
  const { collection, updateCollectionItem, removeFromCollection } = useStore()
  const { locale, t } = useI18n(); const it = locale === "it"
  const marketSignals = useMarketSignals()
  const [sort, setSort] = React.useState<SortKey>("recent")
  const [query, setQuery] = React.useState("")
  const [conditionFilter, setConditionFilter] = React.useState<ConditionFilter>("all")
  const [editing, setEditing] = React.useState<EnrichedCollectionItem | null>(null)
  const [shares, setShares] = React.useState<MyShare[]>([])
  const [visibilityBusyId, setVisibilityBusyId] = React.useState<string | null>(null)

  React.useEffect(() => { let cancelled = false; getMyCollectionSharesAction().then((rows) => { if (!cancelled) setShares(rows) }).catch(() => {}); return () => { cancelled = true } }, [])

  const enriched = React.useMemo(
    () => enrichCollection(collection, marketSignals, catalogProducts),
    [catalogProducts, collection, marketSignals],
  )
  const summary = React.useMemo(() => portfolioSummary(enriched), [enriched])
  const shareByCollectionItem = React.useMemo(() => new Map(shares.map((share) => [share.collectionItemId, share])), [shares])
  const visibleItems = React.useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(locale)
    const list = enriched.filter((entry) => {
      if (conditionFilter !== "all" && entry.item.condition !== conditionFilter) return false
      if (!normalizedQuery) return true
      const haystack = [entry.product.name, entry.release.itemNumber, entry.release.chassis, entry.label, entry.release.releaseType]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase(locale)
      return haystack.includes(normalizedQuery)
    })
    switch (sort) {
      case "value-desc": return list.sort((a, b) => (b.marketReferenceValue ?? -Infinity) - (a.marketReferenceValue ?? -Infinity))
      case "value-asc": return list.sort((a, b) => (a.marketReferenceValue ?? Infinity) - (b.marketReferenceValue ?? Infinity))
      case "name": return list.sort((a, b) => a.product.name.localeCompare(b.product.name))
      default: return list.sort((a, b) => +new Date(b.item.createdAt) - +new Date(a.item.createdAt))
    }
  }, [conditionFilter, enriched, locale, query, sort])

  function applySavedShare(id: string, share: MyShare | null) { setShares((current) => { const withoutCurrent = current.filter((item) => item.collectionItemId !== id); return share ? [...withoutCurrent, share] : withoutCurrent }) }
  async function changeVisibility(id: string, visibility: Visibility) {
    setVisibilityBusyId(id)
    try { const result = await saveCollectionItemAndShareAction(id, {}, visibility); applySavedShare(id, result.share); toast.success(it ? `Visibilità impostata su ${visibilityLongLabel(visibility, it)}` : `Visibility changed to ${visibilityLongLabel(visibility, it)}`) }
    catch (error) { toast.error(error instanceof Error ? error.message : it ? "Impossibile cambiare la visibilità" : "Couldn't change visibility") }
    finally { setVisibilityBusyId(null) }
  }

  return (
    <div className="flex flex-col gap-6">
      <CollectionOverview summary={summary} it={it} />

      {collection.length === 0 ? (
        <Empty className="rounded-2xl border border-dashed border-border bg-card py-16">
          <EmptyHeader><EmptyMedia variant="icon"><Boxes /></EmptyMedia><EmptyTitle>{t("collection.emptyTitle")}</EmptyTitle><EmptyDescription>{t("collection.emptyDesc")}</EmptyDescription></EmptyHeader>
          <EmptyContent><Button className="rounded-xl" render={<Link href="/catalog" />}>{t("collection.browse")}</Button></EmptyContent>
        </Empty>
      ) : (
        <>
          <details className="group rounded-2xl border border-border/70 bg-card">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 text-sm font-medium sm:px-5">
              <span>{it ? "Dettagli della collezione" : "Collection details"}</span>
              <span className="text-xs font-normal text-muted-foreground group-open:hidden">{it ? "Spesa, rendimento e stato" : "Spend, performance and condition"}</span>
              <span className="hidden text-xs font-normal text-muted-foreground group-open:inline">{it ? "Nascondi" : "Hide"}</span>
            </summary>
            <div className="border-t border-border/60 p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatCard label={it ? "Speso" : "Spent"} value={summary.acquisitionCostCount > 0 ? formatMoney(summary.acquisitionCost) : "—"} icon={Layers} hint={<span>{summary.acquisitionCostCount}/{summary.count} {it ? "acquisti con base EUR" : "purchases with EUR basis"}</span>} />
                <StatCard label={it ? "Guadagno / perdita" : "Gain / loss"} value={summary.gainCount > 0 ? formatMoney(summary.gain) : "—"} icon={TrendingUp} hint={summary.gainCount > 0 ? <TrendIndicator value={summary.gainPercent} className="text-xs" /> : <span>{it ? "Nessun confronto disponibile" : "No comparison available"}</span>} />
                <StatCard label={it ? "Sigillati" : "Sealed"} value={summary.sealedCount} icon={Boxes} hint={<span>{it ? "su" : "of"} {summary.count}</span>} />
              </div>
              {summary.marketReferenceCount < summary.sealedCount || summary.sealedCount < summary.count || summary.acquisitionCostCount < summary.count ? (
  <p className="mt-4 max-w-4xl text-xs leading-relaxed text-muted-foreground">
    {it
      ? "Il valore indicativo delle copie sigillate usa in ordine: Market Value consolidato; riferimento da vendite concluse della Release esatta (anche una sola vendita, non una stima); infine un prezzo richiesto recente con provenienza europea o consegna in Italia verificata. Non sommiamo vecchi annunci, richieste extra-UE senza confronto affidabile, spedizione o oneri d'importazione. Le copie aperte, montate, usate o incomplete sono escluse, senza inventare svalutazioni. Gli acquisti in valuta estera usano il cambio storico ECB."
      : "The sealed-copy indicative reference uses canonical Market Value first, exact completed-sale evidence next (even one sale is a reference, not an estimate), and then only a recent European asking price or an offer with verified Italian delivery. Historical asks and non-comparable extra-EU quotes cannot inflate or depress the total; shipping and import duties are excluded. Opened, built, used or incomplete copies are not automatically valued. Foreign-currency purchases use historical ECB rates."}
  </p>
) : null}
            </div>
          </details>

          <section className="rounded-2xl border border-border/70 bg-card p-3.5 sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <label className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={it ? "Cerca nella mia collezione per modello o Item Number" : "Search my collection by model or Item Number"}
                  className="h-10 rounded-xl pl-9"
                />
              </label>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                <Select value={conditionFilter} onValueChange={(value) => setConditionFilter(value as ConditionFilter)}>
                  <SelectTrigger className="h-10 min-w-0 rounded-xl sm:w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{it ? "Tutte le condizioni" : "All conditions"}</SelectItem>
                    {CONDITIONS.map((condition) => <SelectItem key={condition} value={condition}>{conditionLabel(condition, it)}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
                  <SelectTrigger className="h-10 min-w-0 rounded-xl sm:w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">{it ? "Aggiunti di recente" : "Recently added"}</SelectItem>
                    <SelectItem value="value-desc">{it ? "Valore: alto → basso" : "Value: high to low"}</SelectItem>
                    <SelectItem value="value-asc">{it ? "Valore: basso → alto" : "Value: low to high"}</SelectItem>
                    <SelectItem value="name">{it ? "Nome A–Z" : "Name A–Z"}</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="col-span-2 h-10 rounded-xl sm:col-auto" render={<Link href="/catalog" />}><Plus className="size-4" />{it ? "Aggiungi release" : "Add release"}</Button>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
              <span>{visibleItems.length} {it ? (visibleItems.length === 1 ? "release mostrata" : "release mostrate") : (visibleItems.length === 1 ? "release shown" : "releases shown")}</span>
              <span>{it ? "Privata per impostazione predefinita" : "Private by default"}</span>
            </div>
          </section>

          {visibleItems.length === 0 ? (
            <Empty className="rounded-2xl border border-dashed border-border py-12">
              <EmptyHeader><EmptyMedia variant="icon"><Search /></EmptyMedia><EmptyTitle>{it ? "Nessuna release trovata" : "No releases found"}</EmptyTitle><EmptyDescription>{it ? "Prova con un nome, un Item Number o una condizione diversa." : "Try a model name, Item Number or a different condition."}</EmptyDescription></EmptyHeader>
            </Empty>
          ) : (
            <div className="grid gap-3 xl:grid-cols-2">
              {visibleItems.map((entry) => {
                const share = shareByCollectionItem.get(entry.item.id); const visibility: Visibility = share?.shareMode ?? "private"
                const remove = async () => { try { await removeFromCollection(entry.item.id); setShares((current) => current.filter((item) => item.collectionItemId !== entry.item.id)); toast.success(it ? `Rimosso ${entry.product.name}` : `Removed ${entry.product.name}`) } catch (error) { toast.error(error instanceof Error ? error.message : it ? "Impossibile rimuovere questo elemento" : "Couldn't remove this item") } }
                return (
                  <Card key={entry.item.id} className="group min-w-0 overflow-hidden rounded-[22px] border-border/70 py-0 shadow-[0_8px_28px_rgba(15,23,42,0.045)] transition-all duration-200 hover:border-brand/25 hover:shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
                    <div className="grid grid-cols-[42%_minmax(0,1fr)] border-b border-border/50 sm:grid-cols-[36%_minmax(0,1fr)]">
                      <Link href={`/catalog/${entry.product.id}/releases/${entry.release.id}`} className="relative block min-h-40 overflow-hidden border-r border-border/50 bg-gradient-to-br from-white to-sky-50/50 sm:min-h-44">
                        <ProductImage product={entry.product} release={entry.release} className="absolute inset-0 h-full w-full rounded-none bg-transparent transition-transform duration-300 group-hover:scale-[1.025]" />
                      </Link>
                      <div className="flex min-w-0 flex-col justify-center gap-2 p-3 sm:p-4">
                        <Link href={`/catalog/${entry.product.id}/releases/${entry.release.id}`} className="min-w-0">
                          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.10em] text-brand">#{entry.release.itemNumber ?? "—"} · {entry.displayYear ?? "—"}</p>
                          <h2 className="mt-1 line-clamp-3 text-[15px] font-semibold leading-snug tracking-tight transition-colors group-hover:text-brand sm:text-base">{entry.release.editionName}</h2>
                        </Link>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="secondary" className="h-5 rounded-full px-2 text-[9px] font-medium">{conditionLabel(entry.item.condition, it)}</Badge>
                          {entry.marketSignal?.soldUnits != null && entry.marketSignal.soldUnits > 0 ? (
                            <Badge variant="secondary" className="h-5 rounded-full bg-emerald-50 px-2 text-[9px] font-semibold text-emerald-800">
                              {entry.marketSignal.soldUnits} {it ? (entry.marketSignal.soldUnits === 1 ? "vendita" : "vendite") : (entry.marketSignal.soldUnits === 1 ? "sale" : "sales")}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="px-3 pt-3 sm:px-4">
                      <CollectionMarketValue entry={entry} it={it} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/55 px-3 py-3 sm:px-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <VisibilitySelect value={visibility} disabled={visibilityBusyId === entry.item.id} onChange={(next) => void changeVisibility(entry.item.id, next)} />
                        <CollectionItemPhotosButton collectionItemId={entry.item.id} initialCount={entry.item.photos?.length ?? 0} />
                      </div>
                      <div className="flex shrink-0 items-center gap-1 rounded-xl border border-border/60 bg-background/80 p-0.5">
                        <Button variant="ghost" size="icon" className="size-8 rounded-lg bg-brand/10 text-brand hover:bg-brand/15 hover:text-brand" render={<Link href={`/catalog/${entry.product.id}/releases/${entry.release.id}`} />} aria-label={it ? "Apri release" : "Open release"} title={it ? "Apri release" : "Open release"}>
                          <Eye className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8 rounded-lg bg-muted/70 text-foreground hover:bg-muted" aria-label={t("common.edit")} title={it ? "Modifica copia" : "Edit copy"} onClick={() => setEditing(entry)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive" aria-label={it ? "Rimuovi dalla collezione" : "Remove from collection"} title={it ? "Rimuovi dalla collezione" : "Remove from collection"} onClick={() => void remove()}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      <EditDialog entry={editing} share={editing ? shareByCollectionItem.get(editing.item.id) : undefined} onClose={() => setEditing(null)} onSave={async (id, patch, visibility, offerTerms) => {
        try {
          const result = await saveCollectionItemAndShareAction(id, patch, visibility, offerTerms); applySavedShare(id, result.share); setEditing(null)
          try { await updateCollectionItem(id, {}); toast.success(it ? (visibility === "private" ? "Collezione aggiornata" : "Collezione e condivisione aggiornate") : (visibility === "private" ? "Collection updated" : "Collection and sharing updated")) }
          catch { toast.warning(it ? "Salvataggio riuscito, ma la vista non si è aggiornata. Ricarica la pagina." : "Saved successfully, but the collection view couldn't refresh. Reload the page to see the latest data.") }
        } catch (error) { toast.error(error instanceof Error ? error.message : it ? "Impossibile salvare le modifiche" : "Couldn't save changes") }
      }} />
    </div>
  )
}

function CollectionOverview({ summary, it }: { summary: ReturnType<typeof portfolioSummary>; it: boolean }) {
  const progress = Math.min(100, (summary.count / FREE_COLLECTION_LIMIT) * 100)
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-card p-5 shadow-[0_12px_38px_rgba(15,23,42,0.05)] sm:p-7">
      <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full border border-brand/10" />
      <div className="pointer-events-none absolute -right-10 -top-12 size-52 rounded-full border border-brand/10" />
      <div className="pointer-events-none absolute right-24 top-6 h-px w-28 -rotate-[24deg] bg-destructive/30" />
      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,.7fr)] lg:items-stretch">
        <div className="flex min-w-0 flex-col justify-between">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">{it ? "La mia collezione" : "My collection"}</p>
            <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-2">
              <h1 className="text-4xl font-semibold tracking-[-0.055em] text-foreground sm:text-5xl">{summary.count}<span className="ml-2 text-lg font-medium tracking-tight text-muted-foreground sm:text-xl">/ {FREE_COLLECTION_LIMIT} {it ? "release" : "releases"}</span></h1>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{it ? "La tua libreria personale Mini 4WD. La collezione resta privata per impostazione predefinita e puoi condividere singole copie solo quando vuoi." : "Your personal Mini 4WD library. Your collection stays private by default, and you can share individual copies only when you choose."}</p>
          </div>

          <div className="mt-7">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">{it ? "Valore indicativo · copie sigillate" : "Indicative value · sealed copies"}</p>
<p className="mt-1 text-4xl font-semibold tracking-[-0.06em] text-brand sm:text-5xl">{summary.marketReferenceCount > 0 ? <>≈ {formatMoney(summary.marketReferenceValue)}</> : "—"}</p>
<p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">
  {summary.marketReferenceCount}/{summary.sealedCount} {it ? "copie sigillate con un riferimento di mercato disponibile" : "sealed copies with an available market reference"}.
  <span> {it
    ? `${summary.marketValueCount} stime · ${summary.soldReferenceCount} riferimenti da vendite · ${summary.observedPriceCount} prezzi richiesti verificati. Prezzi del solo kit, spedizione esclusa. Una vendita isolata è solo un riferimento, non una stima né un ricavo garantito.`
    : `${summary.marketValueCount} estimates · ${summary.soldReferenceCount} completed-sale references · ${summary.observedPriceCount} verified asking prices. Kit only, shipping excluded. A single sale is a reference, not a valuation or guaranteed resale proceeds.`}
  </span>
</p>
<div className="mt-5 h-1.5 max-w-xl overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${progress}%` }} /></div>
            <p className="mt-2 text-[11px] text-muted-foreground">{it ? `${Math.max(0, FREE_COLLECTION_LIMIT - summary.count)} posti disponibili nel piano Free` : `${Math.max(0, FREE_COLLECTION_LIMIT - summary.count)} spots available on Free`}</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-[#0b3275] p-5 text-white sm:p-6">
          <Sparkles className="size-5 text-white/70" />
          <p className="mt-5 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-white/65">TrackDash Pro</p>
          <h2 className="mt-2 max-w-xs text-xl font-semibold leading-tight tracking-tight">{it ? "Scopri come cambia il valore della tua collezione nel tempo." : "See how your collection value changes over time."}</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/65">{it ? "Lo storico e gli strumenti di monitoraggio avanzati arriveranno con TrackDash Pro. La stima aggiornata delle copie sigillate resta disponibile nel piano Free." : "History and advanced monitoring tools will come with TrackDash Pro. The current estimate for sealed copies remains available on Free."}</p>
          <Badge className="mt-5 rounded-full border-white/15 bg-white/10 text-white hover:bg-white/10">{it ? "In arrivo" : "Coming later"}</Badge>
        </div>
      </div>
    </section>
  )
}

// Compact Collection preview: prices share one row, complete evidence remains
// on the Release/copy detail. Never turn a SOLD anchor or dated ASK into MV.
function CollectionMarketValue({ entry, it }: { entry: EnrichedCollectionItem; it: boolean }) {
  const signal = entry.marketSignal
  const sealed = entry.item.condition === "Sealed"
  const mv = sealed ? entry.marketValue : null
  const sold = sealed && signal?.soldAnchorEUR != null && signal.soldAnchorEUR > 0 ? signal.soldAnchorEUR : null
  const mainPrice = mv ?? sold
  const ask = observedMarketReferencePrice(signal)
  const historical = observedMarketReferenceIsHistorical(signal)
  const comparison = sealed ? signal?.soldTrendComparison : null
  const trendPercent = comparison ? entry.marketTrend : null

  return (
    <MarketPricePanelShell className="p-3 sm:p-3.5">
      <div className="grid grid-cols-2">
        <div className="min-w-0 pr-3">
          <p className="inline-flex min-w-0 items-center gap-1.5 text-[11px] font-semibold leading-tight text-foreground/85 sm:text-xs">
            <Coins className="size-3.5 shrink-0 text-sky-700 dark:text-sky-300" aria-hidden="true" />
            <span>{it ? "Riferimento mercato" : "Market reference"}</span>
          </p>
          <strong className="mt-1 block text-base font-semibold tabular-nums text-foreground sm:text-lg">
            {mainPrice != null ? `≈ ${formatMoney(mainPrice)}` : "—"}
          </strong>
          <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
            {!sealed
              ? (it ? "Copia non stimata" : "Copy not estimated")
              : mv != null
                ? (it ? "Stima TrackDash" : "TrackDash estimate")
                : sold != null
                  ? (it ? "Vendite concluse · non stima" : "Completed sales · not an estimate")
                  : (it ? "Valore in osservazione" : "Value under observation")}
          </p>
        </div>
        <div className="min-w-0 border-l border-sky-200/75 pl-3 dark:border-sky-800/50">
          <p className="inline-flex min-w-0 items-center gap-1.5 text-[11px] font-semibold leading-tight text-foreground/85 sm:text-xs">
            <Tag className="size-3.5 shrink-0 text-sky-700 dark:text-sky-300" aria-hidden="true" />
            <span>{it ? "Prezzo richiesto" : "Asking price"}</span>
          </p>
          <strong className="mt-1 block text-base font-semibold tabular-nums text-foreground sm:text-lg">
            {ask != null ? formatMoney(ask) : "—"}
          </strong>
          <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
            {ask == null
              ? (it ? "Nessuna offerta osservata" : "No observed offer")
              : historical
                ? (it ? "Ultima offerta osservata" : "Last observed offer")
                : (it ? "Verificata di recente" : "Recently verified")}
          </p>
        </div>
      </div>
      <p className="mt-2 border-t border-sky-200/75 pt-2 text-[10px] leading-snug text-muted-foreground dark:border-sky-800/50">
        {it ? "Spedizione esclusa" : "Shipping excluded"}
        {historical && ask != null ? (it ? " · disponibilità da verificare" : " · availability unverified") : null}
        {ask != null && observedMarketOfferOrigin(signal) === "extra_eu"
          ? (it ? " · extra-UE, costi d'importazione da verificare" : " · non-EU, import costs unknown")
          : null}
        {!sealed ? (it ? " · riferimenti della Release, non della copia" : " · Release references, not a copy valuation") : null}
      </p>
      {comparison && trendPercent != null ? (
        <div className={cn(
          "mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border px-2.5 py-2",
          trendPercent > 0
            ? "border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-800/55 dark:bg-emerald-950/30"
            : "border-border/60 bg-white/65 dark:bg-background/40",
        )}>
          <span className="text-[10px] font-medium text-muted-foreground">
            {it ? "Vendite concluse" : "Completed sales"} · {comparison.windowMonths}+{comparison.windowMonths} {it ? "mesi" : "months"}
          </span>
          <span className="text-xs font-semibold tabular-nums text-foreground">
            {formatMoney(comparison.previousAverageEUR)} → {formatMoney(comparison.recentAverageEUR)}
          </span>
          <TrendIndicator value={trendPercent} className="text-[11px]" />
        </div>
      ) : null}
    </MarketPricePanelShell>
  )
}

function EditDialog({ entry, share, onClose, onSave }: { entry: EnrichedCollectionItem | null; share?: MyShare; onClose: () => void; onSave: (id: string, patch: Partial<CollectionItem>, visibility: Visibility, offerTerms?: CollectionOfferTerms) => void }) {
  const { locale, t } = useI18n(); const it = locale === "it"
  const [condition, setCondition] = React.useState<Condition>("Sealed")
  const [price, setPrice] = React.useState("")
  const [currency, setCurrency] = React.useState<Currency>("EUR")
  const [date, setDate] = React.useState("")
  const [year, setYear] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [visibility, setVisibility] = React.useState<Visibility>("private")
  const [askingPrice, setAskingPrice] = React.useState("")
  const [askingCurrency, setAskingCurrency] = React.useState<Currency>("EUR")

  React.useEffect(() => {
    if (!entry) return
    setCondition(entry.item.condition)
    setPrice(entry.item.acquisitionPrice > 0 ? String(entry.item.acquisitionPrice) : "")
    setCurrency(entry.item.acquisitionCurrency)
    setDate(entry.item.acquisitionDate ?? "")
    setYear(entry.displayYear ? String(entry.displayYear) : "")
    setNotes(entry.item.notes ?? "")
    setVisibility(share?.shareMode ?? "private")
    setAskingPrice(share?.askingPrice != null ? String(share.askingPrice) : "")
    setAskingCurrency(share?.askingCurrency ?? "EUR")
  }, [entry, share])

  return (
    <Dialog open={Boolean(entry)} onOpenChange={(open) => !open && onClose()}><DialogContent><DialogHeader><DialogTitle>{it ? "Modifica elemento" : "Edit item"}</DialogTitle><DialogDescription>{entry?.product.name}{entry ? ` · ${entry.release.releaseType} · #${entry.release.itemNumber}` : ""}</DialogDescription></DialogHeader>
      <FieldGroup>
        <Field><FieldLabel>{t("collection.condition")}</FieldLabel><ToggleGroup value={[condition]} onValueChange={(value) => value[0] && setCondition(value[0] as Condition)} className="flex-wrap">{CONDITIONS.map((candidate) => <ToggleGroupItem key={candidate} value={candidate} className="text-xs">{conditionLabel(candidate, it)}</ToggleGroupItem>)}</ToggleGroup></Field>
        <div className="grid grid-cols-[1fr_7rem] gap-3"><Field><FieldLabel htmlFor="edit-price">{it ? "Prezzo di acquisto" : "Acquisition price"}</FieldLabel><Input id="edit-price" type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} /></Field><Field><FieldLabel htmlFor="edit-currency">{it ? "Valuta" : "Currency"}</FieldLabel><Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}><SelectTrigger id="edit-currency" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map((candidate) => <SelectItem key={candidate} value={candidate}>{candidate}</SelectItem>)}</SelectContent></Select></Field></div>
        <div className="grid grid-cols-2 gap-3"><Field><FieldLabel htmlFor="edit-date">{it ? "Data acquisto" : "Purchase date"}</FieldLabel><Input id="edit-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} /><p className="text-[11px] text-muted-foreground">{currency !== "EUR" ? (it ? "Serve per applicare il cambio storico ECB. Puoi lasciarla vuota se non la ricordi." : "Used for historical ECB FX. Leave blank if you don't remember it.") : (it ? "Puoi lasciarla vuota se non la ricordi." : "Leave blank if you don't remember it.")}</p></Field><Field><FieldLabel htmlFor="edit-year">{it ? "Anno release" : "Release year"}</FieldLabel><Input id="edit-year" type="number" inputMode="numeric" min={1980} max={2100} value={year} onChange={(event) => setYear(event.target.value)} /></Field></div>
        <Field><FieldLabel htmlFor="edit-notes">Note</FieldLabel><Input id="edit-notes" value={notes} onChange={(event) => setNotes(event.target.value)} /></Field>
        <Separator />
        <Field><FieldLabel>{it ? "Collezione condivisa" : "Shared collection"}</FieldLabel><Select value={visibility} onValueChange={(value) => setVisibility(value as Visibility)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="private">{it ? "Privato — visibile solo a te" : "Private — only you can see it"}</SelectItem><SelectItem value="showcase">{it ? "Condiviso — mostralo nella vetrina" : "Shared — show it in your collector showcase"}</SelectItem><SelectItem value="open_to_offers">{it ? "Aperto a offerte — condiviso e disponibile a proposte" : "Open to offers — shared and open to proposals"}</SelectItem></SelectContent></Select><p className="text-xs text-muted-foreground">{it ? "Prezzo d'acquisto, data e note private non vengono mai pubblicati." : "Purchase price, date and private notes are never published."}</p></Field>
        {visibility === "open_to_offers" ? <div className="grid grid-cols-[1fr_7rem] gap-3"><Field><FieldLabel htmlFor="edit-asking-price">{it ? "Prezzo richiesto" : "Asking price"}</FieldLabel><Input id="edit-asking-price" type="number" min="0" step="0.01" placeholder={it ? "Opzionale" : "Optional"} value={askingPrice} onChange={(event) => setAskingPrice(event.target.value)} /></Field><Field><FieldLabel>{it ? "Valuta" : "Currency"}</FieldLabel><Select value={askingCurrency} onValueChange={(value) => setAskingCurrency(value as Currency)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map((candidate) => <SelectItem key={candidate} value={candidate}>{candidate}</SelectItem>)}</SelectContent></Select></Field><p className="col-span-2 -mt-1 text-[11px] text-muted-foreground">{it ? "Il prezzo richiesto è pubblico, ma non modifica da solo il Valore stimato." : "The asking price is public, but it does not change the Estimated value by itself."}</p></div> : null}
      </FieldGroup>
      <Separator /><DialogFooter><DialogClose render={<Button variant="outline">{t("common.cancel")}</Button>} /><Button onClick={() => { if (!entry) return; const parsedYear = Number(year); const releaseYearOverride = Number.isFinite(parsedYear) && parsedYear !== entry.release.releaseYear ? parsedYear : undefined; onSave(entry.item.id, { condition, acquisitionDate: date, acquisitionPrice: Number(price) || 0, acquisitionCurrency: currency, releaseYearOverride, notes: notes.trim() || undefined }, visibility, visibility === "open_to_offers" ? { askingPrice: askingPrice ? Number(askingPrice) : null, askingCurrency: askingPrice ? askingCurrency : null } : undefined) }}>{t("common.save")}</Button></DialogFooter>
    </DialogContent></Dialog>
  )
}
