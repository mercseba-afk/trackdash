"use client"

import * as React from "react"
import { Camera, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import type { Condition, Currency, Product, ProductRelease, WishlistPriority } from "@/lib/types"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import { useMarketSignals } from "@/lib/market/context"
import { primaryRelease, resolveRelease } from "@/lib/data/products"
import { formatDate, formatMoney, formatPercent } from "@/lib/format"
import { getMyCollectionAction, previewHistoricalAcquisitionEurAction } from "@/lib/actions/collection"
import { registerCollectionItemPhotoAction } from "@/lib/actions/collection-photos"
import { COLLECTION_PHOTO_BUCKET, MAX_COLLECTION_PHOTOS } from "@/lib/collection-photos"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ProductImage } from "@/components/catalog/product-image"
import { MarketSignalInline } from "@/components/market-signal-inline"

const CONDITIONS: Condition[] = ["Sealed", "New / Opened", "Built", "Used", "Incomplete"]
const CURRENCIES: Currency[] = ["EUR", "USD", "JPY", "GBP"]
const PRIORITIES: WishlistPriority[] = ["High", "Medium", "Low"]
const MAX_SOURCE_BYTES = 12 * 1024 * 1024
const MAX_EDGE = 1600
type CollectionVisibility = "private" | "showcase" | "open_to_offers"
type HistoricalFxPreview = { amountEUR: number; fxRateDate: string | null }

function conditionLabel(value: Condition, it: boolean): string {
  const labels: Record<Condition, { it: string; en: string }> = {
    Sealed: { it: "Nuovo · bustine chiuse", en: "New · sealed bags" },
    "New / Opened": { it: "Nuovo · bustine aperte", en: "New · opened bags" },
    Built: { it: "Montato · mai usato", en: "Built · unused" },
    Used: { it: "Usato", en: "Used" },
    Incomplete: { it: "Incompleto", en: "Incomplete" },
  }
  return it ? labels[value].it : labels[value].en
}

function visibilityLabel(value: CollectionVisibility, it: boolean): string {
  if (value === "open_to_offers") return it ? "Aperto a offerte" : "Open to offers"
  if (value === "showcase") return it ? "Condiviso · vetrina" : "Shared · showcase"
  return it ? "Privato · solo tu" : "Private · only you"
}

function priorityLabel(value: WishlistPriority, it: boolean): string {
  if (!it) return value
  if (value === "High") return "Alta"
  if (value === "Low") return "Bassa"
  return "Media"
}

function releaseTypeLabel(value: ProductRelease["releaseType"], it: boolean): string {
  if (!it) return value
  const labels: Partial<Record<ProductRelease["releaseType"], string>> = {
    Original: "Originale",
    Reissue: "Riedizione",
    "Special Edition": "Edizione speciale",
    "Limited Edition": "Edizione limitata",
    "Anniversary Edition": "Edizione anniversario",
    "Japan Cup Edition": "Edizione Japan Cup",
    "Color Special": "Color Special",
    "Clear Body": "Carrozzeria trasparente",
    Premium: "Premium",
    "Chassis Variant": "Variante chassis",
    Other: "Altro",
  }
  return labels[value] ?? value
}

function releaseOptionLabel(r: ProductRelease, it: boolean): string {
  return `${r.releaseYear ?? "—"} · ${releaseTypeLabel(r.releaseType, it)}${r.color ? ` (${r.color})` : ""} · #${r.itemNumber ?? "—"}`
}

function ReleaseSelect({
  product,
  value,
  onChange,
  allowAny = false,
}: {
  product: Product
  value: string
  onChange: (v: string) => void
  allowAny?: boolean
}) {
  const { locale } = useI18n()
  const it = locale === "it"
  if (product.releases.length <= 1 && !allowAny) return null
  return (
    <Field>
      <FieldLabel htmlFor="release">{it ? "Release / edizione" : "Release / edition"}</FieldLabel>
      <Select value={value} onValueChange={(v) => onChange(v as string)}>
        <SelectTrigger id="release" className="w-full">
          <SelectValue placeholder={it ? "Seleziona release" : "Select release"}>
            {(v: string) => {
              if (v === "any") return it ? "Qualsiasi edizione" : "Any edition"
              const r = product.releases.find((x) => x.id === v)
              return r ? releaseOptionLabel(r, it) : it ? "Seleziona release" : "Select release"
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {allowAny ? <SelectItem value="any">{it ? "Qualsiasi edizione" : "Any edition"}</SelectItem> : null}
          {product.releases.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {releaseOptionLabel(r, it)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

function signedMoney(value: number): string {
  return `${value > 0 ? "+" : ""}${formatMoney(value)}`
}

async function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Unsupported image format"))
    }
    image.src = url
  })
}

async function compressPhoto(file: File) {
  if (file.size > MAX_SOURCE_BYTES) throw new Error("Image too large")
  if (!file.type.startsWith("image/")) throw new Error("Invalid image")

  const image = await loadImage(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Image processing unavailable")
  context.drawImage(image, 0, 0, width, height)

  const webp = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82))
  if (webp) return { blob: webp, extension: "webp", contentType: "image/webp" }

  const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.84))
  if (!jpeg) throw new Error("Image processing failed")
  return { blob: jpeg, extension: "jpg", contentType: "image/jpeg" }
}

export function AddToCollectionDialog({
  product,
  defaultReleaseId,
  children,
}: {
  product: Product
  defaultReleaseId?: string
  children: React.ReactNode
}) {
  const { addToCollection, collection, user } = useStore()
  const marketSignals = useMarketSignals()
  const { locale } = useI18n()
  const it = locale === "it"
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const photoInputRef = React.useRef<HTMLInputElement>(null)

  const initialRelease = resolveRelease(product, defaultReleaseId)
  const [releaseId, setReleaseId] = React.useState(initialRelease.id)
  const [condition, setCondition] = React.useState<Condition | "">("")
  const [date, setDate] = React.useState("")
  const [year, setYear] = React.useState(initialRelease.releaseYear ? String(initialRelease.releaseYear) : "")
  const [currency, setCurrency] = React.useState<Currency>("EUR")
  const [price, setPrice] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [visibility, setVisibility] = React.useState<CollectionVisibility>("private")
  const [askingPrice, setAskingPrice] = React.useState("")
  const [askingCurrency, setAskingCurrency] = React.useState<Currency>("EUR")
  const [offerPhotos, setOfferPhotos] = React.useState<File[]>([])
  const [fxPreview, setFxPreview] = React.useState<HistoricalFxPreview | null>(null)
  const [fxPreviewPending, setFxPreviewPending] = React.useState(false)

  const selectedRelease = resolveRelease(product, releaseId)
  const selectedSignal = marketSignals[selectedRelease.id]
  const currentValue = selectedSignal?.valueEUR ?? null
  const paid = Number(price)
  const nativePaid = Number.isFinite(paid) && paid > 0 ? paid : null
  const paidEUR = currency === "EUR" ? nativePaid : fxPreview?.amountEUR ?? null
  const comparableCondition = condition === "Sealed" || condition === "New / Opened"
  const canShowPerformance =
    comparableCondition &&
    currentValue != null &&
    paidEUR != null &&
    paidEUR > 0
  const personalGain = canShowPerformance && paidEUR != null ? currentValue - paidEUR : null
  const personalGainPercent = canShowPerformance && personalGain != null && paidEUR != null
    ? (personalGain / paidEUR) * 100
    : null

  React.useEffect(() => {
    if (!open) return
    const r = resolveRelease(product, defaultReleaseId)
    setReleaseId(r.id)
    setYear(r.releaseYear ? String(r.releaseYear) : "")
    setCondition("")
    setPrice("")
    setNotes("")
    setVisibility("private")
    setDate("")
    setCurrency("EUR")
    setAskingPrice("")
    setAskingCurrency("EUR")
    setOfferPhotos([])
    if (photoInputRef.current) photoInputRef.current.value = ""
    setFxPreview(null)
    setFxPreviewPending(false)
  }, [open, product, defaultReleaseId])

  React.useEffect(() => {
    setFxPreview(null)
    setFxPreviewPending(false)
    if (!open || currency === "EUR" || !date || nativePaid == null) return

    let cancelled = false
    const timer = window.setTimeout(() => {
      setFxPreviewPending(true)
      void previewHistoricalAcquisitionEurAction({
        amount: nativePaid,
        currency,
        acquisitionDate: date,
      })
        .then((result) => {
          if (cancelled) return
          setFxPreview(result ? { amountEUR: result.amountEUR, fxRateDate: result.fxRateDate } : null)
        })
        .catch(() => {
          if (!cancelled) setFxPreview(null)
        })
        .finally(() => {
          if (!cancelled) setFxPreviewPending(false)
        })
    }, 350)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [open, currency, date, nativePaid])

  function handleReleaseChange(id: string) {
    setReleaseId(id)
    const r = resolveRelease(product, id)
    setYear(r.releaseYear ? String(r.releaseYear) : "")
  }

  function addOfferPhotos(files: FileList | null) {
    if (!files?.length) return
    const remaining = MAX_COLLECTION_PHOTOS - offerPhotos.length
    if (remaining <= 0) return

    const incoming = [...files]
      .filter((file) => file.type.startsWith("image/") && file.size <= MAX_SOURCE_BYTES)
      .slice(0, remaining)

    if (incoming.length === 0) {
      toast.error(it ? "Usa immagini JPG, PNG o WebP fino a 12 MB." : "Use JPG, PNG or WebP images up to 12 MB.")
      return
    }

    setOfferPhotos((current) => [...current, ...incoming].slice(0, MAX_COLLECTION_PHOTOS))
    if (photoInputRef.current) photoInputRef.current.value = ""
  }

  async function uploadOfferPhotos(collectionItemId: string) {
    if (!user || offerPhotos.length === 0) return
    const supabase = createClient()

    for (const file of offerPhotos) {
      const processed = await compressPhoto(file)
      const path = `${user.id}/${collectionItemId}/${crypto.randomUUID()}.${processed.extension}`
      const { error: uploadError } = await supabase.storage
        .from(COLLECTION_PHOTO_BUCKET)
        .upload(path, processed.blob, {
          contentType: processed.contentType,
          upsert: false,
          cacheControl: "3600",
        })
      if (uploadError) throw new Error(uploadError.message)

      try {
        await registerCollectionItemPhotoAction(collectionItemId, path)
      } catch (error) {
        await supabase.storage.from(COLLECTION_PHOTO_BUCKET).remove([path])
        throw error
      }
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!condition) {
      toast.error(it ? "Seleziona la condizione del kit" : "Select the kit condition")
      return
    }
    const parsedYear = Number(year)
    const releaseYearOverride =
      Number.isFinite(parsedYear) && parsedYear !== selectedRelease.releaseYear ? parsedYear : undefined
    const collectionIdsBefore = new Set(collection.map((item) => item.id))
    setPending(true)
    try {
      await addToCollection({
        productId: product.id,
        releaseId: selectedRelease.id,
        condition,
        acquisitionDate: date,
        acquisitionPrice: Number(price) || 0,
        acquisitionCurrency: currency,
        releaseYearOverride,
        notes: notes.trim() || undefined,
        visibility,
        askingPrice: visibility === "open_to_offers" && askingPrice ? Number(askingPrice) : undefined,
        askingCurrency: visibility === "open_to_offers" && askingPrice ? askingCurrency : undefined,
      } as Parameters<typeof addToCollection>[0] & {
        visibility: CollectionVisibility
        askingPrice?: number
        askingCurrency?: Currency
      })

      if (visibility === "open_to_offers" && offerPhotos.length > 0) {
        try {
          const freshCollection = await getMyCollectionAction()
          const createdItem = freshCollection.find(
            (item) =>
              !collectionIdsBefore.has(item.id) &&
              item.productId === product.id &&
              item.releaseId === selectedRelease.id,
          )
          if (!createdItem) throw new Error("New collection copy not found")
          await uploadOfferPhotos(createdItem.id)
        } catch (photoError) {
          console.error("Collection copy created but offer photos could not be uploaded:", photoError)
          toast.warning(
            it
              ? "Copia aggiunta, ma le foto non sono state caricate. Puoi aggiungerle dalla scheda della copia."
              : "Copy added, but photos could not be uploaded. You can add them from the copy details.",
          )
        }
      }

      toast.success(it ? "Aggiunto alla collezione" : "Added to collection", {
        description: `${selectedRelease.editionName} · ${year} ${releaseTypeLabel(selectedRelease.releaseType, it)}`,
      })
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : it ? "Impossibile aggiungere questo modello" : "Couldn't add this item")
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto overscroll-contain sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{it ? "Aggiungi alla collezione" : "Add to collection"}</DialogTitle>
          <DialogDescription>
            {it
              ? "Registra la release esatta che possiedi, le sue condizioni e quanto l'hai pagata."
              : "Log the exact release you own, its condition and what you paid."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3 rounded-lg border border-border p-2">
          <ProductImage product={product} release={selectedRelease} size="sm" className="h-14 w-20" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{product.name}</p>
            <p className="text-xs text-muted-foreground">
              #{selectedRelease.itemNumber ?? "—"} · {selectedRelease.chassis ?? "—"} · {it ? "originale" : "original"} {product.originalReleaseYear ?? "—"}
            </p>
          </div>
        </div>
        <form onSubmit={submit}>
          <FieldGroup>
            <ReleaseSelect product={product} value={releaseId} onChange={handleReleaseChange} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="condition">{it ? "Condizione" : "Condition"}</FieldLabel>
                <Select value={condition || null} onValueChange={(v) => setCondition(v as Condition)}>
                  <SelectTrigger id="condition" className="w-full">
                    <SelectValue placeholder={it ? "Seleziona condizione" : "Select condition"}>
                      {(v: Condition | null) => v ? conditionLabel(v, it) : (it ? "Seleziona condizione" : "Select condition")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {conditionLabel(c, it)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="year">{it ? "Anno release" : "Release year"}</FieldLabel>
                <Input
                  id="year"
                  type="number"
                  inputMode="numeric"
                  min={1980}
                  max={2100}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </Field>
            </div>
            <p className="-mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {it
                ? "Guarda le bustine interne: chiuse = “Nuovo · bustine chiuse”; aperte ma kit mai montato = “Nuovo · bustine aperte”."
                : "Check the inner bags: sealed = “New · sealed bags”; opened but never built = “New · opened bags”."}
            </p>
            <p className="-mt-1 text-[11px] text-muted-foreground">
              {it ? "Prima uscita del modello" : "Original model release"}: {product.originalReleaseYear ?? "—"}. {it ? "Modifica l'anno sopra per indicare il tuo kit esatto." : "Adjust the year above to match your exact kit."}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="date">{it ? "Acquistato il" : "Acquired"}</FieldLabel>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                <p className="text-[11px] text-muted-foreground">
                  {it ? "Opzionale — lascialo vuoto se non ricordi la data." : "Optional — leave blank if you don't remember the date."}
                </p>
              </Field>
              <Field>
                <FieldLabel htmlFor="currency">{it ? "Valuta" : "Currency"}</FieldLabel>
                <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                  <SelectTrigger id="currency" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="price">{it ? "Pagato" : "Paid"} ({currency})</FieldLabel>
              <Input
                id="price"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <div className="space-y-0.5 text-[11px] text-muted-foreground">
                {price && currency !== "EUR" ? (
                  !date ? (
                    <p>{it ? "Inserisci la data d'acquisto per vedere subito il controvalore storico in euro." : "Enter the purchase date to see the historical EUR equivalent immediately."}</p>
                  ) : fxPreviewPending ? (
                    <p>{it ? "Calcolo del controvalore storico…" : "Calculating historical EUR equivalent…"}</p>
                  ) : fxPreview ? (
                    <p className="font-medium text-foreground">
                      {it ? "Controvalore storico" : "Historical EUR equivalent"}: {formatMoney(fxPreview.amountEUR)}
                      {fxPreview.fxRateDate ? <span className="font-normal text-muted-foreground"> · ECB {formatDate(fxPreview.fxRateDate)}</span> : null}
                    </p>
                  ) : (
                    <p>{it ? "Cambio storico non disponibile: verrà riprovato al salvataggio." : "Historical FX is unavailable right now; it will be retried when saving."}</p>
                  )
                ) : null}
                {currentValue != null ? (
                  <p>{it ? "Valore attuale stimato" : "Estimated current value"}: {formatMoney(currentValue)}</p>
                ) : (
                  <p>{it ? "Inserisci quanto hai realmente pagato." : "Enter what you actually paid."}</p>
                )}
                {personalGain != null && personalGainPercent != null ? (
                  <p className={personalGain >= 0 ? "font-medium text-success" : "font-medium text-destructive"}>
                    {it ? "Rendimento personale" : "Personal performance"}: {signedMoney(personalGain)} · {formatPercent(personalGainPercent)}
                  </p>
                ) : price && condition && !comparableCondition ? (
                  <p>{it ? "Questa condizione non ha ancora un valore di mercato comparabile." : "This condition doesn't have a comparable market value yet."}</p>
                ) : null}
              </div>
            </Field>
            <Field>
              <FieldLabel>{it ? "Visibilità" : "Visibility"}</FieldLabel>
              <Select value={visibility} onValueChange={(v) => setVisibility(v as CollectionVisibility)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(v: CollectionVisibility) => visibilityLabel(v, it)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">{visibilityLabel("private", it)}</SelectItem>
                  <SelectItem value="showcase">{visibilityLabel("showcase", it)}</SelectItem>
                  <SelectItem value="open_to_offers">{visibilityLabel("open_to_offers", it)}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                {it
                  ? "Privato è l'impostazione predefinita. La condivisione non espone mai il tuo prezzo d'acquisto."
                  : "Private is the default. Sharing never exposes your purchase price."}
              </p>
            </Field>
            {visibility === "open_to_offers" ? (
              <div className="grid grid-cols-[1fr_7rem] gap-3">
                <Field>
                  <FieldLabel htmlFor="asking-price">{it ? "Prezzo richiesto" : "Asking price"}</FieldLabel>
                  <Input
                    id="asking-price"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder={it ? "Opzionale" : "Optional"}
                    value={askingPrice}
                    onChange={(e) => setAskingPrice(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="asking-currency">{it ? "Valuta" : "Currency"}</FieldLabel>
                  <Select value={askingCurrency} onValueChange={(v) => setAskingCurrency(v as Currency)}>
                    <SelectTrigger id="asking-currency" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <p className="col-span-2 -mt-1 text-[11px] text-muted-foreground">
                  {it ? "È un prezzo richiesto pubblico, non una vendita conclusa e non modifica il Valore di mercato TrackDash." : "This is a public asking price, not a completed sale, and it does not change TrackDash Market Value."}
                </p>

                <div className="col-span-2 rounded-xl border border-dashed border-border bg-muted/20 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{it ? "Foto della tua copia" : "Photos of your copy"}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                        {it
                          ? "Aggiungile subito all'annuncio. Fino a 5 foto; la prima sarà la principale."
                          : "Add them to the listing now. Up to 5 photos; the first will be the main one."}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-background px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                      {offerPhotos.length}/{MAX_COLLECTION_PHOTOS}
                    </span>
                  </div>

                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    capture="environment"
                    multiple
                    className="hidden"
                    onChange={(event) => addOfferPhotos(event.target.files)}
                  />

                  {offerPhotos.length > 0 ? (
                    <div className="mt-2 grid gap-1.5">
                      {offerPhotos.map((file, index) => (
                        <div key={`${file.name}-${file.lastModified}-${index}`} className="flex items-center gap-2 rounded-lg border bg-background px-2.5 py-2 text-xs">
                          <Camera className="size-3.5 shrink-0 text-brand" />
                          <span className="min-w-0 flex-1 truncate">{index === 0 ? `${it ? "Principale" : "Main"} · ` : ""}{file.name}</span>
                          <button
                            type="button"
                            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            onClick={() => setOfferPhotos((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                            aria-label={it ? "Rimuovi foto" : "Remove photo"}
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    disabled={pending || offerPhotos.length >= MAX_COLLECTION_PHOTOS}
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <Camera />
                    {offerPhotos.length === 0 ? (it ? "Aggiungi foto" : "Add photos") : (it ? "Aggiungi altre foto" : "Add more photos")}
                  </Button>
                </div>
              </div>
            ) : null}
            <Field>
              <FieldLabel htmlFor="notes">Note</FieldLabel>
              <Textarea
                id="notes"
                rows={2}
                placeholder={it ? "Opzionale — provenienza, condizioni scatola, ecc." : "Optional — provenance, box condition, etc."}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-4">
            <DialogClose render={<Button type="button" variant="outline" />}>{it ? "Annulla" : "Cancel"}</DialogClose>
            <Button type="submit" disabled={pending || !condition}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              {pending ? (it ? "Aggiunta…" : "Adding…") : it ? "Aggiungi alla collezione" : "Add to collection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function AddToWishlistDialog({
  product,
  defaultReleaseId,
  children,
}: {
  product: Product
  defaultReleaseId?: string
  children: React.ReactNode
}) {
  const { addToWishlist } = useStore()
  const marketSignals = useMarketSignals()
  const { locale } = useI18n()
  const it = locale === "it"
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)

  const [releaseId, setReleaseId] = React.useState(defaultReleaseId ?? "any")
  const [priority, setPriority] = React.useState<WishlistPriority>("Medium")
  const [target, setTarget] = React.useState("")
  const [notes, setNotes] = React.useState("")

  const selectedRelease =
    releaseId && releaseId !== "any" ? resolveRelease(product, releaseId) : primaryRelease(product)
  const selectedSignal = releaseId && releaseId !== "any" ? marketSignals[selectedRelease.id] : null

  React.useEffect(() => {
    if (!open) return
    setReleaseId(defaultReleaseId ?? "any")
    setPriority("Medium")
    setTarget("")
    setNotes("")
  }, [open, defaultReleaseId])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    try {
      await addToWishlist({
        productId: product.id,
        releaseId: releaseId && releaseId !== "any" ? releaseId : undefined,
        priority,
        targetPrice: target ? Number(target) : undefined,
        notes: notes.trim() || undefined,
      })
      toast.success(it ? "Aggiunto ai desideri" : "Added to wishlist", { description: product.name })
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : it ? "Impossibile aggiungere questo modello" : "Couldn't add this item")
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{it ? "Aggiungi ai desideri" : "Add to wishlist"}</DialogTitle>
          <DialogDescription>
            {it
              ? "Salva una release che stai cercando e, se vuoi, imposta il prezzo che vorresti pagare."
              : "Save a release you're looking for and optionally set the price you'd like to pay."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3 rounded-lg border border-border p-2">
          <ProductImage product={product} release={releaseId !== "any" ? selectedRelease : undefined} size="sm" className="h-14 w-20" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{product.name}</p>
            {releaseId !== "any" ? (
              <MarketSignalInline signal={selectedSignal} />
            ) : (
              <p className="text-xs text-muted-foreground">{it ? "Qualsiasi edizione" : "Any edition"}</p>
            )}
          </div>
        </div>
        <form onSubmit={submit}>
          <FieldGroup>
            <ReleaseSelect product={product} value={releaseId} onChange={setReleaseId} allowAny />
            <Field>
              <FieldLabel htmlFor="priority">{it ? "Priorità" : "Priority"}</FieldLabel>
              <Select value={priority} onValueChange={(v) => setPriority(v as WishlistPriority)}>
                <SelectTrigger id="priority" className="w-full">
                  <SelectValue>{(v: WishlistPriority) => priorityLabel(v, it)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{priorityLabel(p, it)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="target">{it ? "Prezzo obiettivo" : "Target price"} (EUR)</FieldLabel>
              <Input
                id="target"
                type="number"
                min={0}
                step="0.01"
                placeholder={it ? "Opzionale" : "Optional"}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="wnotes">Note</FieldLabel>
              <Textarea
                id="wnotes"
                rows={2}
                placeholder={it ? "Opzionale" : "Optional"}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-4">
            <DialogClose render={<Button type="button" variant="outline" />}>{it ? "Annulla" : "Cancel"}</DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? (it ? "Aggiunta…" : "Adding…") : it ? "Aggiungi ai desideri" : "Add to wishlist"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
