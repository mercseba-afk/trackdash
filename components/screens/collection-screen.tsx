"use client"

import * as React from "react"
import Link from "next/link"
import { Boxes, Coins, Globe2, Handshake, Layers, LockKeyhole, Pencil, Trash2, TrendingUp } from "lucide-react"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import { breakdownBy, enrichCollection, portfolioSummary, type EnrichedCollectionItem } from "@/lib/analytics"
import { formatDate, formatMoney } from "@/lib/format"
import type { CollectionItem, Condition } from "@/lib/types"
import { CONDITIONS } from "@/lib/types"
import { getMyCollectionSharesAction, saveCollectionItemAndShareAction, type CollectionVisibility } from "@/lib/actions/sharing"
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
    "Sealed": "Sigillato",
    "New / Opened": "Nuovo / Aperto",
    "Built": "Montato",
    "Used": "Usato",
    "Parts only": "Solo parti",
  }
  return labels[value] ?? value
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
  const [sort, setSort] = React.useState<SortKey>("recent")
  const [editing, setEditing] = React.useState<EnrichedCollectionItem | null>(null)
  const [shares, setShares] = React.useState<MyShare[]>([])
  const [visibilityBusyId, setVisibilityBusyId] = React.useState<string | null>(null)

  React.useEffect(() => { let cancelled = false; getMyCollectionSharesAction().then((rows) => { if (!cancelled) setShares(rows) }).catch(() => {}); return () => { cancelled = true } }, [])

  const enriched = React.useMemo(() => enrichCollection(collection), [collection])
  const summary = React.useMemo(() => portfolioSummary(enriched), [enriched])
  const byCondition = React.useMemo(() => breakdownBy(enriched, (e) => e.item.condition), [enriched])
  const shareByCollectionItem = React.useMemo(() => new Map(shares.map((share) => [share.collectionItemId, share])), [shares])
  const sorted = React.useMemo(() => {
    const list = [...enriched]
    switch (sort) {
      case "value-desc": return list.sort((a, b) => b.estimate.value - a.estimate.value)
      case "value-asc": return list.sort((a, b) => a.estimate.value - b.estimate.value)
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
        <StatCard label={it ? "Valore di mercato" : "Market value"} value={formatMoney(summary.marketValue)} icon={Coins} accent />
        <StatCard label={it ? "Speso" : "Spent"} value={formatMoney(summary.acquisitionCost)} icon={Layers} hint={<span>{summary.count} {it ? "pezzi" : "items"}</span>} />
        <StatCard label={it ? "Guadagno / perdita" : "Gain / loss"} value={formatMoney(summary.gain)} icon={TrendingUp} hint={<TrendIndicator value={summary.gainPercent} className="text-xs" />} />
        <StatCard label={it ? "Sigillati" : "Sealed"} value={summary.sealedCount} icon={Boxes} hint={<span>{it ? "su" : "of"} {summary.count}</span>} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {byCondition.map((b) => <Badge key={b.label} variant="outline" className="gap-1.5">{conditionLabel(b.label as Condition, it)}<span className="text-muted-foreground">{b.count}</span></Badge>)}
        <div className="ml-auto"><Select value={sort} onValueChange={(v) => setSort(v as SortKey)}><SelectTrigger size="sm" className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="recent">{it ? "Aggiunti di recente" : "Recently added"}</SelectItem><SelectItem value="value-desc">{it ? "Valore: alto → basso" : "Value: high to low"}</SelectItem><SelectItem value="value-asc">{it ? "Valore: basso → alto" : "Value: low to high"}</SelectItem><SelectItem value="name">{it ? "Nome A–Z" : "Name A–Z"}</SelectItem></SelectContent></Select></div>
      </div>

      <div className="grid gap-3">
        {sorted.map((e) => {
          const share = shareByCollectionItem.get(e.item.id); const visibility: Visibility = share?.shareMode ?? "private"
          const remove = async () => { try { await removeFromCollection(e.item.id); setShares((current) => current.filter((item) => item.collectionItemId !== e.item.id)); toast.success(it ? `Rimosso ${e.product.name}` : `Removed ${e.product.name}`) } catch (error) { toast.error(error instanceof Error ? error.message : it ? "Impossibile rimuovere questo elemento" : "Couldn't remove this item") } }
          return (
            <Card key={e.item.id} className="overflow-hidden py-0"><div className="p-3 sm:p-4">
              <div className="flex gap-3 sm:gap-4">
                <Link href={`/catalog/${e.product.id}`} className="shrink-0"><ProductImage product={e.product} release={e.release} size="sm" className="h-20 w-28 sm:h-24 sm:w-36" /></Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link href={`/catalog/${e.product.id}`} className="block truncate font-medium hover:text-brand">{e.product.name}</Link><p className="truncate text-xs text-muted-foreground">{e.label} · {e.release.chassis ?? "—"} · #{e.release.itemNumber ?? "—"}</p><p className="truncate text-[11px] text-muted-foreground">{it ? "Modello originale" : "Model originally released"} {e.product.originalReleaseYear ?? "—"}</p></div><div className="hidden shrink-0 sm:block"><VisibilitySelect value={visibility} disabled={visibilityBusyId === e.item.id} onChange={(next) => void changeVisibility(e.item.id, next)} /></div></div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground"><span>{t("collection.condition")} <span className="font-medium text-foreground">{conditionLabel(e.item.condition, it)}</span></span><span>{t("collection.paid")} <span className="font-medium text-foreground">{formatMoney(e.item.acquisitionPrice, e.item.acquisitionCurrency)}</span></span><span className="hidden sm:inline">{it ? "Aggiunto" : "Added"} {formatDate(e.item.acquisitionDate)}</span></div>
                </div>
                <div className="hidden shrink-0 flex-col items-end justify-between border-l border-border pl-4 sm:flex"><div className="text-right"><p className="text-sm font-semibold tabular-nums">{formatMoney(e.estimate.value)}</p><TrendIndicator value={e.estimate.trend90d} className="justify-end text-xs" /></div><div className="flex gap-1"><Button variant="ghost" size="icon" className="size-8" aria-label={t("common.edit")} onClick={() => setEditing(e)}><Pencil /></Button><Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" aria-label={t("common.remove")} onClick={() => void remove()}><Trash2 /></Button></div></div>
              </div>
              <div className="mt-3 flex items-center gap-2 border-t border-border pt-3 sm:hidden"><VisibilitySelect value={visibility} disabled={visibilityBusyId === e.item.id} onChange={(next) => void changeVisibility(e.item.id, next)} /><div className="ml-auto flex items-center gap-3"><div className="text-right"><p className="text-sm font-semibold tabular-nums">{formatMoney(e.estimate.value)}</p><TrendIndicator value={e.estimate.trend90d} className="justify-end text-xs" /></div><div className="flex gap-1"><Button variant="ghost" size="icon" className="size-8" aria-label={t("common.edit")} onClick={() => setEditing(e)}><Pencil /></Button><Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" aria-label={t("common.remove")} onClick={() => void remove()}><Trash2 /></Button></div></div></div>
            </div></Card>
          )
        })}
      </div>

      <EditDialog entry={editing} shareMode={editing ? shareByCollectionItem.get(editing.item.id)?.shareMode : undefined} onClose={() => setEditing(null)} onSave={async (id, patch, visibility) => {
        try {
          const result = await saveCollectionItemAndShareAction(id, patch, visibility); applySavedShare(id, result.share); setEditing(null)
          try { await updateCollectionItem(id, {}); toast.success(it ? (visibility === "private" ? "Collezione aggiornata" : "Collezione e condivisione aggiornate") : (visibility === "private" ? "Collection updated" : "Collection and sharing updated")) }
          catch { toast.warning(it ? "Salvataggio riuscito, ma la vista non si è aggiornata. Ricarica la pagina." : "Saved successfully, but the collection view couldn't refresh. Reload the page to see the latest data.") }
        } catch (error) { toast.error(error instanceof Error ? error.message : it ? "Impossibile salvare le modifiche" : "Couldn't save changes") }
      }} />
    </div>
  )
}

function PageHeader() {
  const { locale, t } = useI18n(); const it = locale === "it"
  return <div className="flex flex-col gap-1"><h1 className="text-2xl font-semibold tracking-tight">{t("collection.title")}</h1><p className="text-sm text-muted-foreground">{it ? "La collezione è privata per impostazione predefinita. Condividi singoli modelli solo quando vuoi mostrarli nella tua vetrina." : "Your collection is private by default. Share individual items only when you want them in your collector showcase."}</p></div>
}

function EditDialog({ entry, shareMode, onClose, onSave }: { entry: EnrichedCollectionItem | null; shareMode?: MyShare["shareMode"]; onClose: () => void; onSave: (id: string, patch: Partial<CollectionItem>, visibility: Visibility) => void }) {
  const { locale, t } = useI18n(); const it = locale === "it"
  const [condition, setCondition] = React.useState<Condition>("Sealed")
  const [price, setPrice] = React.useState("")
  const [year, setYear] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [visibility, setVisibility] = React.useState<Visibility>("private")
  React.useEffect(() => { if (entry) { setCondition(entry.item.condition); setPrice(String(entry.item.acquisitionPrice)); setYear(entry.displayYear ? String(entry.displayYear) : ""); setNotes(entry.item.notes ?? ""); setVisibility(shareMode ?? "private") } }, [entry, shareMode])
  return (
    <Dialog open={Boolean(entry)} onOpenChange={(o) => !o && onClose()}><DialogContent><DialogHeader><DialogTitle>{it ? "Modifica elemento" : "Edit item"}</DialogTitle><DialogDescription>{entry?.product.name}{entry ? ` · ${entry.release.releaseType} · #${entry.release.itemNumber}` : ""}</DialogDescription></DialogHeader>
      <FieldGroup>
        <Field><FieldLabel>{t("collection.condition")}</FieldLabel><ToggleGroup value={[condition]} onValueChange={(v) => v[0] && setCondition(v[0] as Condition)} className="flex-wrap">{CONDITIONS.map((c) => <ToggleGroupItem key={c} value={c} className="text-xs">{conditionLabel(c, it)}</ToggleGroupItem>)}</ToggleGroup></Field>
        <div className="grid grid-cols-2 gap-3"><Field><FieldLabel htmlFor="edit-price">{it ? "Prezzo di acquisto" : "Acquisition price"}</FieldLabel><Input id="edit-price" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} /></Field><Field><FieldLabel htmlFor="edit-year">{it ? "Anno release" : "Release year"}</FieldLabel><Input id="edit-year" type="number" inputMode="numeric" min={1980} max={2100} value={year} onChange={(e) => setYear(e.target.value)} /></Field></div>
        <Field><FieldLabel htmlFor="edit-notes">Note</FieldLabel><Input id="edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        <Separator />
        <Field><FieldLabel>{it ? "Collezione condivisa" : "Shared collection"}</FieldLabel><Select value={visibility} onValueChange={(value) => setVisibility(value as Visibility)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="private">{it ? "Privato — visibile solo a te" : "Private — only you can see it"}</SelectItem><SelectItem value="showcase">{it ? "Condiviso — mostralo nella vetrina" : "Shared — show it in your collector showcase"}</SelectItem><SelectItem value="open_to_offers">{it ? "Aperto a offerte — condiviso e disponibile a proposte" : "Open to offers — shared and open to proposals"}</SelectItem></SelectContent></Select><p className="text-xs text-muted-foreground">{it ? "La condivisione espone solo modello, release esatta e condizione. Prezzo d'acquisto, fonte e note private restano sempre nella tua collezione." : "Sharing exposes only the model, exact release and condition. Purchase price, acquisition source and private notes never leave My Collection."}</p></Field>
      </FieldGroup>
      <Separator /><DialogFooter><DialogClose render={<Button variant="outline">{t("common.cancel")}</Button>} /><Button onClick={() => { if (!entry) return; const parsedYear = Number(year); const releaseYearOverride = Number.isFinite(parsedYear) && parsedYear !== entry.release.releaseYear ? parsedYear : undefined; onSave(entry.item.id, { condition, acquisitionPrice: Number(price) || 0, releaseYearOverride, notes: notes.trim() || undefined }, visibility) }}>{t("common.save")}</Button></DialogFooter>
    </DialogContent></Dialog>
  )
}
