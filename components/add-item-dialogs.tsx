"use client"

import * as React from "react"
import { toast } from "sonner"
import type { Condition, Currency, Product, ProductRelease, WishlistPriority } from "@/lib/types"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import { getReleaseEstimate, getProductEstimate } from "@/lib/data/market"
import { primaryRelease, resolveRelease } from "@/lib/data/products"
import { formatMoney } from "@/lib/format"
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

const CONDITIONS: Condition[] = ["Sealed", "New / Opened", "Built", "Used", "Incomplete"]
const CURRENCIES: Currency[] = ["EUR", "USD", "JPY", "GBP"]
const PRIORITIES: WishlistPriority[] = ["High", "Medium", "Low"]
type CollectionVisibility = "private" | "showcase" | "open_to_offers"

function conditionLabel(value: Condition, it: boolean): string {
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

export function AddToCollectionDialog({
  product,
  defaultReleaseId,
  children,
}: {
  product: Product
  defaultReleaseId?: string
  children: React.ReactNode
}) {
  const { addToCollection } = useStore()
  const { locale } = useI18n()
  const it = locale === "it"
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)

  const initialRelease = resolveRelease(product, defaultReleaseId)
  const [releaseId, setReleaseId] = React.useState(initialRelease.id)
  const [condition, setCondition] = React.useState<Condition>("New / Opened")
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10))
  const [year, setYear] = React.useState(initialRelease.releaseYear ? String(initialRelease.releaseYear) : "")
  const [currency, setCurrency] = React.useState<Currency>("EUR")
  const [notes, setNotes] = React.useState("")
  const [visibility, setVisibility] = React.useState<CollectionVisibility>("private")

  const selectedRelease = resolveRelease(product, releaseId)
  const estimate = getReleaseEstimate(product, selectedRelease, condition)
  const [price, setPrice] = React.useState(String(estimate.value))

  React.useEffect(() => {
    if (!open) return
    const r = resolveRelease(product, defaultReleaseId)
    setReleaseId(r.id)
    setYear(r.releaseYear ? String(r.releaseYear) : "")
    setCondition("New / Opened")
    setPrice(String(getReleaseEstimate(product, r, "New / Opened").value))
    setNotes("")
    setVisibility("private")
    setDate(new Date().toISOString().slice(0, 10))
  }, [open, product, defaultReleaseId])

  function handleReleaseChange(id: string) {
    setReleaseId(id)
    const r = resolveRelease(product, id)
    setYear(r.releaseYear ? String(r.releaseYear) : "")
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const parsedYear = Number(year)
    const releaseYearOverride =
      Number.isFinite(parsedYear) && parsedYear !== selectedRelease.releaseYear ? parsedYear : undefined
    setPending(true)
    try {
      await addToCollection({
        productId: product.id,
        releaseId: selectedRelease.id,
        condition,
        acquisitionDate: new Date(date).toISOString(),
        acquisitionPrice: Number(price) || 0,
        acquisitionCurrency: currency,
        releaseYearOverride,
        notes: notes.trim() || undefined,
        visibility,
      } as Parameters<typeof addToCollection>[0] & { visibility: CollectionVisibility })
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
      <DialogContent className="sm:max-w-md">
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
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="condition">{it ? "Condizione" : "Condition"}</FieldLabel>
                <Select value={condition} onValueChange={(v) => setCondition(v as Condition)}>
                  <SelectTrigger id="condition" className="w-full">
                    <SelectValue />
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
            <p className="-mt-1 text-[11px] text-muted-foreground">
              {it ? "Prima uscita del modello" : "Original model release"}: {product.originalReleaseYear ?? "—"}. {it ? "Modifica l'anno sopra per indicare il tuo kit esatto." : "Adjust the year above to match your exact kit."}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="date">{it ? "Acquistato il" : "Acquired"}</FieldLabel>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="currency">{it ? "Valuta" : "Currency"}</FieldLabel>
                <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                  <SelectTrigger id="currency" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
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
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                {it ? "Stima demo per questa release e condizione" : "Demo estimate for this release & condition"}: {formatMoney(estimate.value)}
              </p>
            </Field>
            <Field>
              <FieldLabel>{it ? "Visibilità" : "Visibility"}</FieldLabel>
              <Select value={visibility} onValueChange={(v) => setVisibility(v as CollectionVisibility)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">{it ? "Privato — solo tu" : "Private — only you"}</SelectItem>
                  <SelectItem value="showcase">{it ? "Condiviso — vetrina collezionista" : "Shared — collector showcase"}</SelectItem>
                  <SelectItem value="open_to_offers">{it ? "Aperto a offerte" : "Open to offers"}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                {it
                  ? "Privato è l'impostazione predefinita. La condivisione mostra solo modello, release esatta e condizione."
                  : "Private is the default. Sharing exposes only the model, exact release and condition."}
              </p>
            </Field>
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
            <Button type="submit" disabled={pending}>
              {pending ? (it ? "Aggiunta…" : "Adding…") : it ? "Aggiungi modello" : "Add item"}
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
  const { locale } = useI18n()
  const it = locale === "it"
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const estimate = getProductEstimate(product)

  const [releaseId, setReleaseId] = React.useState(defaultReleaseId ?? "any")
  const [priority, setPriority] = React.useState<WishlistPriority>("Medium")
  const [target, setTarget] = React.useState(String(Math.round(estimate.value * 0.9)))
  const [notes, setNotes] = React.useState("")

  const selectedRelease =
    releaseId && releaseId !== "any" ? resolveRelease(product, releaseId) : primaryRelease(product)
  const displayEstimate =
    releaseId && releaseId !== "any" ? getReleaseEstimate(product, selectedRelease) : estimate

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
              ? "Salva un modello che stai cercando e imposta un prezzo obiettivo. Gli alert automatici saranno attivati quando avremo dati di mercato reali."
              : "Save a model you're looking for and set a target price. Automatic alerts will be enabled when real market data is available."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3 rounded-lg border border-border p-2">
          <ProductImage product={product} size="sm" className="h-14 w-20" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{product.name}</p>
            <p className="text-xs text-muted-foreground">
              {it ? "Stima" : "Est."} {formatMoney(displayEstimate.value)} · demo
            </p>
          </div>
        </div>
        <form onSubmit={submit}>
          <FieldGroup>
            <ReleaseSelect product={product} value={releaseId} onChange={setReleaseId} allowAny />
            <Field>
              <FieldLabel htmlFor="priority">{it ? "Priorità" : "Priority"}</FieldLabel>
              <Select value={priority} onValueChange={(v) => setPriority(v as WishlistPriority)}>
                <SelectTrigger id="priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {priorityLabel(p, it)}
                    </SelectItem>
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
