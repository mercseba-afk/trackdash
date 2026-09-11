"use client"

import * as React from "react"
import Link from "next/link"
import { Boxes, Coins, Globe2, Handshake, Layers, LockKeyhole, Pencil, Trash2, TrendingUp } from "lucide-react"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import { useMarketSignals } from "@/lib/market/context"
import { breakdownBy, conditionUsesNewUnbuiltReference, enrichCollection, portfolioSummary, type EnrichedCollectionItem } from "@/lib/analytics"
import { formatDate, formatMoney, formatPercent } from "@/lib/format"
import type { CollectionItem, Condition, Currency } from "@/lib/types"
import { CONDITIONS, CURRENCIES } from "@/lib/types"
import { getMyCollectionSharesAction, saveCollectionItemAndShareAction, type CollectionOfferTerms, type CollectionVisibility } from "@/lib/actions/sharing"
import { StatCard } from "@/components/stat-card"
import { ProductImage } from "@/components/catalog/product-image"
import { TrendIndicator } from "@/components/market-bits"
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

type SortKey = "recent" | "value-desc" | "value-asc" | "name"
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
function signedMoney(value: number) {
  return `${value > 0 ? "+" : ""}${formatMoney(value)}`
}

function VisibilitySelect({ value, disabled, onChange }: { value: Visibility; disabled?: boolean; onChange: (value: Visibility) => void }) {
  const { locale } = useI18n(); const it = locale === "it"
  return (
    <Select value={value} onValueChange={(next) => onChange(next as Visibility)} disabled={disabled}>
      <SelectTrigger size="sm" aria-label={`${it ? "Visibilità collezione" : "Collection visibility"}: ${visibilityLongLabel(value, it)}`} title={`${it ? "Visibilità" : "Visibility"}: ${visibilityLongLabel(value, it)}`} className={cn("h-6 rounded-full border px-2 text-[10px] font-medium", value === "open_to_offers" && "border-brand/30 bg-brand/10 text-brand", value === "showcase" && "bg-muted text-foreground", value === "private" && "text-muted-foreground")}>
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

export function CollectionScreen() {
  const { collection, updateCollectionItem, removeFromCollection } = useStore()
  const { locale, t } = useI18n(); const it = locale === "it"
  const marketSignals = useMarketSignals()
  const [sort, setSort] = React.useState<SortKey>("recent")
  const [editing, setEditing] = React.useState<EnrichedCollectionItem | null>(null)
  const [shares, setShares] = React.useState<MyShare[]>([])
  const [visibilityBusyId, setVisibilityBusyId] = React.useState<string | null>(null)

  React.useEffect(() => { let cancelled = false; getMyCollectionSharesAction().then((rows) => { if (!cancelled) setShares(rows) }).catch(() => {}); return () => { cancelled = true } }, [])

  const enriched = React.useMemo(() => enrichCollection(collection, marketSignals), [collection, marketSignals])
  const summary = React.useMemo(() => portfolioSummary(enriched), [enriched])
  const byCondition = React.useMemo(() => breakdownBy(enriched, (entry) => entry.item.condition), [enriched])
  const shareByCollectionItem = React.useMemo(() => new Map(shares.map((share) => [share.collectionItemId, share])), [shares])
  const sorted = React.useMemo(() => {
    const list = [...enriched]
    switch (sort) {
      case "value-desc": return list.sort((a, b) => (b.marketValue ?? -Infinity) - (a.marketValue ?? -Infinity))
      case "value-asc": return list.sort((a, b) => (a.marketValue ?? Infinity) - (b.marketValue ?? Infinity))
      case "name": return list.sort((a, b) => a.product.name.localeCompare(b.product.name))
      default: return list.sort((a, b) => +new Date(b.item.createdAt) - +new Date(a.item.createdAt))
    }
  }, [enriched, sort])

  function applySavedShare(id: string, share: MyShare | null) { setShares((current) => { const withoutCurrent = current.filter((item) => item.collectionItemId !== id); return share ? [...withoutCurrent, share] : withoutCurrent }) }
  async function changeVisibility(id: string, visibility: Visibility) {
    setVisibilityBusyId(id)
    try { const result = await saveCollectionItemAndShareAction(id, {}, visibility); applySavedShare(id, result.share); toast.success(it ? `Visibilità impostata su ${visibilityLongLabel(visibility, it)}` : `Visibility changed to ${visibilityLongLabel(visibility, it)}`) }
    catch (error) { toast.error(error instanceof Error ? error.message : it ? "Impossibile cambiare la visibilità" : "Couldn't change visibility") }
    finally { setVisibilityBusyId(null) }
  }

  if (collection.length === 0) {
    return <div className="flex flex-col gap-6"><PageHeader /><Empty className="rounded-lg border border-dashed border-border py-16"><EmptyHeader><EmptyMedia variant="icon"><Boxes /></EmptyMedia><EmptyTitle>{t("collection.emptyTitle")}</EmptyTitle><EmptyDescription>{t("collection.emptyDesc")}</EmptyDescription></EmptyHeader><EmptyContent><Button render={<Link href="/catalog" />}>{t("collection.browse")}</Button></EmptyContent></Empty></div>
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={it ? "Valore di mercato" : "Market value"} value={summary.marketValueCount > 0 ? formatMoney(summary.marketValue) : "—"} icon={Coins} accent hint={<span>{summary.marketValueCount}/{summary.count} {it ? "pezzi valorizzati R3" : "items valued by R3"}</span>} />
        <StatCard label={it ? "Speso" : "Spent"} value={summary.acquisitionCostCount > 0 ? formatMoney(summary.acquisitionCost) : "—"} icon={Layers} hint={<span>{summary.acquisitionCostCount}/{summary.count} {it ? "acquisti con base EUR" : "purchases with EUR basis"}</span>} />
        <StatCard label={it ? "Guadagno / perdita" : "Gain / loss"} value={summary.gainCount > 0 ? formatMoney(summary.gain) : "—"} icon={TrendingUp} hint={summary.gainCount > 0 ? <TrendIndicator value={summary.gainPercent} className="text-xs" /> : <span>{it ? "Nessun confronto disponibile" : "No comparison available"}</span>} />
        <StatCard label={it ? "Sigillati" : "Sealed"} value={summary.sealedCount} icon={Boxes} hint={<span>{it ? "su" : "of"} {summary.count}</span>} />
      </div>

      {summary.marketValueCount < summary.count || summary.acquisitionCostCount < summary.count ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {it
            ? "Valore e rendimento usano solo segnali R3 compatibili con kit nuovi/completi/non montati. Gli acquisti in USD, JPY e GBP vengono normalizzati in EUR con il cambio storico di riferimento ECB della data d'acquisto (o dell'ultimo giorno disponibile); se data o cambio non sono disponibili, il rendimento resta non calcolato."
            : "Value and performance use only R3 signals compatible with new/complete/unbuilt kits. USD, JPY and GBP purchases are normalized to EUR using the historical ECB reference rate for the purchase date (or latest available day); if the date or rate is unavailable, performance remains uncalculated."}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {byCondition.map((bucket) => <Badge key={bucket.label} variant="outline" className="gap-1.5">{conditionLabel(bucket.label as Condition, it)}<span className="text-muted-foreground">{bucket.count}</span></Badge>)}
        <div className="ml-auto"><Select value={sort} onValueChange={(value) => setSort(value as SortKey)}><SelectTrigger size="sm" className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="recent">{it ? "Aggiunti di recente" : "Recently added"}</SelectItem><SelectItem value="value-desc">{it ? "Valore: alto → basso" : "Value: high to low"}</SelectItem><SelectItem value="value-asc">{it ? "Valore: basso → alto" : "Value: low to high"}</SelectItem><SelectItem value="name">{it ? "Nome A–Z" : "Name A–Z"}</SelectItem></SelectContent></Select></div>
      </div>

      <div className="grid gap-3">
        {sorted.map((entry) => {
          const share = shareByCollectionItem.get(entry.item.id); const visibility: Visibility = share?.shareMode ?? "private"
          const remove = async () => { try { await removeFromCollection(entry.item.id); setShares((current) => current.filter((item) => item.collectionItemId !== entry.item.id)); toast.success(it ? `Rimosso ${entry.product.name}` : `Removed ${entry.product.name}`) } catch (error) { toast.error(error instanceof Error ? error.message : it ? "Impossibile rimuovere questo elemento" : "Couldn't remove this item") } }
          return (
            <Card key={entry.item.id} className="overflow-hidden py-0"><div className="p-3 sm:p-4">
              <div className="flex gap-3 sm:gap-4">
                <Link href={`/catalog/${entry.product.id}/releases/${entry.release.id}`} className="shrink-0"><ProductImage product={entry.product} release={entry.release} size="sm" className="h-20 w-28 sm:h-24 sm:w-36" /></Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link href={`/catalog/${entry.product.id}/releases/${entry.release.id}`} className="block truncate font-medium hover:text-brand">{entry.product.name}</Link><p className="truncate text-xs text-muted-foreground">{entry.label} · {entry.release.chassis ?? "—"} · #{entry.release.itemNumber ?? "—"}</p><p className="truncate text-[11px] text-muted-foreground">{it ? "Modello originale" : "Model originally released"} {entry.product.originalReleaseYear ?? "—"}</p></div><div className="hidden shrink-0 sm:block"><VisibilitySelect value={visibility} disabled={visibilityBusyId === entry.item.id} onChange={(next) => void changeVisibility(entry.item.id, next)} /></div></div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{t("collection.condition")} <span className="font-medium text-foreground">{conditionLabel(entry.item.condition, it)}</span></span>
                    <span>{t("collection.paid")} <span className="font-medium text-foreground">{entry.item.acquisitionPrice > 0 ? formatMoney(entry.item.acquisitionPrice, entry.item.acquisitionCurrency) : "—"}</span>{entry.item.acquisitionCurrency !== "EUR" && entry.item.acquisitionPriceEUR != null ? <span> · {it ? "base" : "basis"} {formatMoney(entry.item.acquisitionPriceEUR)}</span> : null}</span>
                    <span className="hidden sm:inline">{entry.item.acquisitionDate ? `${it ? "Acquistato" : "Acquired"} ${formatDate(entry.item.acquisitionDate)}` : (it ? "Data acquisto non indicata" : "Purchase date not provided")}</span>
                    {share?.askingPrice != null && share.askingCurrency ? <span>{it ? "Richiesta" : "Asking"} <span className="font-medium text-foreground">{formatMoney(share.askingPrice, share.askingCurrency)}</span></span> : null}
                  </div>
                </div>
                <div className="hidden shrink-0 flex-col items-end justify-between border-l border-border pl-4 sm:flex"><CollectionMarketValue entry={entry} it={it} /><div className="flex gap-1"><Button variant="ghost" size="icon" className="size-8" aria-label={t("common.edit")} onClick={() => setEditing(entry)}><Pencil /></Button><Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" aria-label={t("common.remove")} onClick={() => void remove()}><Trash2 /></Button></div></div>
              </div>
              <div className="mt-3 flex items-center gap-2 border-t border-border pt-3 sm:hidden"><VisibilitySelect value={visibility} disabled={visibilityBusyId === entry.item.id} onChange={(next) => void changeVisibility(entry.item.id, next)} /><div className="ml-auto flex items-center gap-3"><CollectionMarketValue entry={entry} it={it} /><div className="flex gap-1"><Button variant="ghost" size="icon" className="size-8" aria-label={t("common.edit")} onClick={() => setEditing(entry)}><Pencil /></Button><Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" aria-label={t("common.remove")} onClick={() => void remove()}><Trash2 /></Button></div></div></div>
            </div></Card>
          )
        })}
      </div>

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

function CollectionMarketValue({ entry, it }: { entry: EnrichedCollectionItem; it: boolean }) {
  if (!conditionUsesNewUnbuiltReference(entry.item.condition)) {
    return <p className="max-w-32 text-right text-[11px] leading-tight text-muted-foreground">{it ? "Condizione non ancora valorizzata" : "Condition not valued yet"}</p>
  }
  if (!entry.marketSignal) {
    return <p className="max-w-32 text-right text-[11px] leading-tight text-muted-foreground">{it ? "Dati mercato in arrivo" : "Market data coming soon"}</p>
  }
  if (entry.marketValue == null) {
    return <p className="max-w-32 text-right text-[11px] leading-tight text-muted-foreground">{it ? "Valore non consolidato" : "Value not consolidated"}</p>
  }
  return (
    <div className="min-w-28 text-right">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{it ? "Oggi" : "Today"}</p>
      <p className="text-sm font-semibold tabular-nums">{formatMoney(entry.marketValue)}</p>
      {entry.personalGainEUR != null && entry.personalGainPercent != null ? (
        <p className={cn("mt-0.5 text-xs font-medium tabular-nums", entry.personalGainEUR > 0 ? "text-success" : entry.personalGainEUR < 0 ? "text-destructive" : "text-muted-foreground")}>
          {signedMoney(entry.personalGainEUR)} · {formatPercent(entry.personalGainPercent)}
        </p>
      ) : entry.item.acquisitionPrice > 0 && entry.item.acquisitionCurrency !== "EUR" ? (
        <p className="mt-0.5 max-w-32 text-[10px] leading-tight text-muted-foreground">
          {entry.item.acquisitionDate
            ? (it ? "FX storico ECB non disponibile" : "Historical ECB FX unavailable")
            : (it ? "Aggiungi la data per il rendimento" : "Add purchase date for performance")}
        </p>
      ) : null}
      {entry.marketTrend != null ? <TrendIndicator value={entry.marketTrend} className="mt-1 justify-end text-xs" /> : null}
    </div>
  )
}

function PageHeader() {
  const { locale, t } = useI18n(); const it = locale === "it"
  return <div className="flex flex-col gap-1"><h1 className="text-2xl font-semibold tracking-tight">{t("collection.title")}</h1><p className="text-sm text-muted-foreground">{it ? "La collezione è privata per impostazione predefinita. Condividi singoli modelli solo quando vuoi mostrarli nella tua vetrina." : "Your collection is private by default. Share individual items only when you want them in your collector showcase."}</p></div>
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
        {visibility === "open_to_offers" ? <div className="grid grid-cols-[1fr_7rem] gap-3"><Field><FieldLabel htmlFor="edit-asking-price">{it ? "Prezzo richiesto" : "Asking price"}</FieldLabel><Input id="edit-asking-price" type="number" min="0" step="0.01" placeholder={it ? "Opzionale" : "Optional"} value={askingPrice} onChange={(event) => setAskingPrice(event.target.value)} /></Field><Field><FieldLabel>{it ? "Valuta" : "Currency"}</FieldLabel><Select value={askingCurrency} onValueChange={(value) => setAskingCurrency(value as Currency)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map((candidate) => <SelectItem key={candidate} value={candidate}>{candidate}</SelectItem>)}</SelectContent></Select></Field><p className="col-span-2 -mt-1 text-[11px] text-muted-foreground">{it ? "Il prezzo richiesto è pubblico ma resta asking evidence: non modifica da solo il Valore di mercato." : "The asking price is public but remains asking evidence: it does not change Market Value by itself."}</p></div> : null}
      </FieldGroup>
      <Separator /><DialogFooter><DialogClose render={<Button variant="outline">{t("common.cancel")}</Button>} /><Button onClick={() => { if (!entry) return; const parsedYear = Number(year); const releaseYearOverride = Number.isFinite(parsedYear) && parsedYear !== entry.release.releaseYear ? parsedYear : undefined; onSave(entry.item.id, { condition, acquisitionDate: date, acquisitionPrice: Number(price) || 0, acquisitionCurrency: currency, releaseYearOverride, notes: notes.trim() || undefined }, visibility, visibility === "open_to_offers" ? { askingPrice: askingPrice ? Number(askingPrice) : null, askingCurrency: askingPrice ? askingCurrency : null } : undefined) }}>{t("common.save")}</Button></DialogFooter>
    </DialogContent></Dialog>
  )
}
