"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, ExternalLink, Pencil, Save, X } from "lucide-react"
import { enrichCollection } from "@/lib/analytics"
import { formatDate, formatMoney, formatPercent } from "@/lib/format"
import { useI18n } from "@/lib/i18n"
import { useMarketSignals } from "@/lib/market/context"
import { useStore } from "@/lib/store"
import type { Condition, Currency } from "@/lib/types"
import { CONDITIONS, CURRENCIES } from "@/lib/types"
import {
  getMyCollectionSharesAction,
  saveCollectionItemAndShareAction,
  type CollectionVisibility,
} from "@/lib/actions/sharing"
import { CollectionItemPhotoGallery } from "@/components/collection-item-photo-gallery"
import { ProductImage } from "@/components/catalog/product-image"
import { ReleaseMarketOverview } from "@/components/release-market-overview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { toast } from "sonner"

type MyShare = Awaited<ReturnType<typeof getMyCollectionSharesAction>>[number]
type Visibility = CollectionVisibility

function conditionLabel(value: Condition, it: boolean) {
  if (!it) return value
  const labels: Record<Condition, string> = {
    Sealed: "Sigillato",
    "New / Opened": "Nuovo / Aperto",
    Built: "Montato",
    Used: "Usato",
    Incomplete: "Incompleto",
  }
  return labels[value]
}

function visibilityLabel(value: Visibility, it: boolean) {
  if (value === "open_to_offers") return it ? "Aperto a offerte" : "Open to offers"
  if (value === "showcase") return it ? "Condiviso nella vetrina" : "Shared in showcase"
  return it ? "Privato" : "Private"
}

export function CollectionItemDetailScreen({ collectionItemId }: { collectionItemId: string }) {
  const { collection, updateCollectionItem } = useStore()
  const { locale } = useI18n()
  const it = locale === "it"
  const marketSignals = useMarketSignals()
  const item = collection.find((candidate) => candidate.id === collectionItemId)
  const entry = React.useMemo(
    () => item ? enrichCollection([item], marketSignals)[0] ?? null : null,
    [item, marketSignals],
  )
  const [share, setShare] = React.useState<MyShare | null>(null)
  const [editing, setEditing] = React.useState(false)
  const [busy, setBusy] = React.useState(false)

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
    let cancelled = false
    getMyCollectionSharesAction()
      .then((rows) => {
        if (!cancelled) setShare(rows.find((row) => row.collectionItemId === collectionItemId) ?? null)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [collectionItemId])

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

  async function save() {
    if (!entry) return
    setBusy(true)
    try {
      const parsedYear = Number(year)
      const releaseYearOverride = Number.isFinite(parsedYear) && parsedYear > 0 && parsedYear !== entry.release.releaseYear
        ? parsedYear
        : undefined
      const result = await saveCollectionItemAndShareAction(
        entry.item.id,
        {
          condition,
          acquisitionDate: date,
          acquisitionPrice: Number(price) || 0,
          acquisitionCurrency: currency,
          ...(releaseYearOverride !== undefined ? { releaseYearOverride } : {}),
          notes: notes.trim(),
        },
        visibility,
        visibility === "open_to_offers"
          ? { askingPrice: askingPrice ? Number(askingPrice) : null, askingCurrency: askingPrice ? askingCurrency : null }
          : undefined,
      )
      setShare(result.share)
      await updateCollectionItem(entry.item.id, {})
      setEditing(false)
      toast.success(it ? "Copia aggiornata." : "Copy updated.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (it ? "Salvataggio non riuscito." : "Couldn't save changes."))
    } finally {
      setBusy(false)
    }
  }

  if (!entry) {
    return (
      <div className="grid gap-4">
        <Button variant="ghost" className="w-fit" render={<Link href="/collection" />}><ArrowLeft />{it ? "Collezione" : "Collection"}</Button>
        <Card><CardContent className="py-10 text-center"><p className="font-medium">{it ? "Copia non trovata" : "Copy not found"}</p><p className="mt-1 text-sm text-muted-foreground">{it ? "Questa copia non è presente nella tua collezione." : "This copy isn't in your collection."}</p></CardContent></Card>
      </div>
    )
  }

  const releaseHref = `/catalog/${entry.product.id}/releases/${entry.release.id}`
  const gain = entry.personalGainEUR
  const gainPercent = entry.personalGainPercent

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" className="-ml-2" render={<Link href="/collection" />}><ArrowLeft />{it ? "La mia collezione" : "My collection"}</Button>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href={releaseHref} />}><ExternalLink />{it ? "Release" : "Release"}</Button>
          <Button onClick={() => setEditing((current) => !current)}>{editing ? <X /> : <Pencil />}{editing ? (it ? "Chiudi modifica" : "Close edit") : (it ? "Modifica copia" : "Edit copy")}</Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="grid gap-5 pt-6 md:grid-cols-[minmax(220px,320px)_1fr]">
          <ProductImage product={entry.product} release={entry.release} className="aspect-[4/3] h-auto w-full" />
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2"><Badge>{conditionLabel(entry.item.condition, it)}</Badge><Badge variant="outline">{visibilityLabel(share?.shareMode ?? "private", it)}</Badge></div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">{entry.product.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{entry.release.editionName}</p>
            <p className="mt-2 text-sm text-muted-foreground">#{entry.release.itemNumber ?? "—"} · {entry.release.chassis ?? "—"} · {entry.displayYear ?? "—"}</p>
            {entry.item.notes ? <p className="mt-4 rounded-lg bg-muted/50 p-3 text-sm">{entry.item.notes}</p> : null}
          </div>
        </CardContent>
      </Card>

      <ReleaseMarketOverview signal={entry.marketSignal} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">{it ? "Prezzo pagato" : "Purchase price"}</p><p className="mt-1 text-xl font-semibold">{entry.item.acquisitionPrice > 0 ? formatMoney(entry.item.acquisitionPrice, entry.item.acquisitionCurrency) : "—"}</p><p className="mt-1 text-xs text-muted-foreground">{entry.item.acquisitionDate ? formatDate(entry.item.acquisitionDate) : (it ? "Data non indicata" : "Date not provided")}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">{it ? "Rendimento personale" : "Personal performance"}</p><p className="mt-1 text-xl font-semibold">{gain != null ? `${gain > 0 ? "+" : ""}${formatMoney(gain)}` : "—"}</p><p className="mt-1 text-xs text-muted-foreground">{gainPercent != null ? formatPercent(gainPercent) : (it ? "Non calcolabile" : "Not available")}</p></CardContent></Card>
      </div>

      {editing ? (
        <Card>
          <CardHeader><CardTitle className="text-base">{it ? "Modifica questa copia" : "Edit this copy"}</CardTitle></CardHeader>
          <CardContent>
            <FieldGroup>
              <Field><FieldLabel>{it ? "Condizione" : "Condition"}</FieldLabel><ToggleGroup value={[condition]} onValueChange={(value) => value[0] && setCondition(value[0] as Condition)} className="flex-wrap">{CONDITIONS.map((candidate) => <ToggleGroupItem key={candidate} value={candidate} className="text-xs">{conditionLabel(candidate, it)}</ToggleGroupItem>)}</ToggleGroup></Field>
              <div className="grid gap-3 sm:grid-cols-[1fr_8rem]"><Field><FieldLabel htmlFor="copy-price">{it ? "Prezzo di acquisto" : "Purchase price"}</FieldLabel><Input id="copy-price" type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} /></Field><Field><FieldLabel>{it ? "Valuta" : "Currency"}</FieldLabel><Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map((candidate) => <SelectItem key={candidate} value={candidate}>{candidate}</SelectItem>)}</SelectContent></Select></Field></div>
              <div className="grid gap-3 sm:grid-cols-2"><Field><FieldLabel htmlFor="copy-date">{it ? "Data acquisto" : "Purchase date"}</FieldLabel><Input id="copy-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field><Field><FieldLabel htmlFor="copy-year">{it ? "Anno Release" : "Release year"}</FieldLabel><Input id="copy-year" type="number" min="1980" max="2100" value={year} onChange={(event) => setYear(event.target.value)} /></Field></div>
              <Field><FieldLabel htmlFor="copy-notes">Note</FieldLabel><Input id="copy-notes" value={notes} onChange={(event) => setNotes(event.target.value)} /></Field>
              <Field><FieldLabel>{it ? "Visibilità" : "Visibility"}</FieldLabel><Select value={visibility} onValueChange={(value) => setVisibility(value as Visibility)}><SelectTrigger className="w-full"><SelectValue>{(value: Visibility) => visibilityLabel(value, it)}</SelectValue></SelectTrigger><SelectContent><SelectItem value="private">{visibilityLabel("private", it)}</SelectItem><SelectItem value="showcase">{visibilityLabel("showcase", it)}</SelectItem><SelectItem value="open_to_offers">{visibilityLabel("open_to_offers", it)}</SelectItem></SelectContent></Select></Field>
              {visibility === "open_to_offers" ? <div className="grid gap-3 sm:grid-cols-[1fr_8rem]"><Field><FieldLabel>{it ? "Prezzo richiesto" : "Asking price"}</FieldLabel><Input type="number" min="0" step="0.01" value={askingPrice} onChange={(event) => setAskingPrice(event.target.value)} /></Field><Field><FieldLabel>{it ? "Valuta" : "Currency"}</FieldLabel><Select value={askingCurrency} onValueChange={(value) => setAskingCurrency(value as Currency)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map((candidate) => <SelectItem key={candidate} value={candidate}>{candidate}</SelectItem>)}</SelectContent></Select></Field></div> : null}
              <div className="flex justify-end"><Button disabled={busy} onClick={() => void save()}><Save />{busy ? (it ? "Salvataggio…" : "Saving…") : (it ? "Salva modifiche" : "Save changes")}</Button></div>
            </FieldGroup>
          </CardContent>
        </Card>
      ) : null}

      <Card id="photos">
        <CardHeader><CardTitle className="text-base">{it ? "Foto della copia" : "Copy photos"}</CardTitle></CardHeader>
        <CardContent><CollectionItemPhotoGallery collectionItemId={entry.item.id} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">{it ? "Dati essenziali" : "Key details"}</CardTitle></CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div><p className="text-xs text-muted-foreground">{it ? "Release" : "Release"}</p><p className="font-medium">{entry.label}</p></div>
          <div><p className="text-xs text-muted-foreground">{it ? "Condizione" : "Condition"}</p><p className="font-medium">{conditionLabel(entry.item.condition, it)}</p></div>
          <div><p className="text-xs text-muted-foreground">{it ? "Visibilità" : "Visibility"}</p><p className="font-medium">{visibilityLabel(share?.shareMode ?? "private", it)}</p></div>
          <div><p className="text-xs text-muted-foreground">{it ? "Prezzo richiesto" : "Asking price"}</p><p className="font-medium">{share?.askingPrice != null && share.askingCurrency ? formatMoney(share.askingPrice, share.askingCurrency) : "—"}</p></div>
        </CardContent>
      </Card>
    </div>
  )
}
