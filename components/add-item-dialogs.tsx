"use client"

import * as React from "react"
import { toast } from "sonner"
import type { Condition, Currency, Product, ProductRelease, WishlistPriority } from "@/lib/types"
import { useStore } from "@/lib/store"
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
import { ProductArt } from "@/components/product-art"

const CONDITIONS: Condition[] = ["Sealed", "New / Opened", "Built", "Used", "Incomplete"]
const CURRENCIES: Currency[] = ["EUR", "USD", "JPY", "GBP"]
const PRIORITIES: WishlistPriority[] = ["High", "Medium", "Low"]

function releaseOptionLabel(r: ProductRelease): string {
  return `${r.releaseYear} · ${r.releaseType}${r.color ? ` (${r.color})` : ""} · #${r.itemNumber}`
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
  if (product.releases.length <= 1 && !allowAny) return null
  return (
    <Field>
      <FieldLabel htmlFor="release">Release / edition</FieldLabel>
      <Select value={value} onValueChange={(v) => onChange(v as string)}>
        <SelectTrigger id="release" className="w-full">
          <SelectValue placeholder="Select release" />
        </SelectTrigger>
        <SelectContent>
          {allowAny ? <SelectItem value="any">Any edition</SelectItem> : null}
          {product.releases.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {releaseOptionLabel(r)}
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
  const [open, setOpen] = React.useState(false)

  const initialRelease = resolveRelease(product, defaultReleaseId)
  const [releaseId, setReleaseId] = React.useState(initialRelease.id)
  const [condition, setCondition] = React.useState<Condition>("New / Opened")
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10))
  const [year, setYear] = React.useState(String(initialRelease.releaseYear))
  const [currency, setCurrency] = React.useState<Currency>("EUR")
  const [notes, setNotes] = React.useState("")

  const selectedRelease = resolveRelease(product, releaseId)
  const estimate = getReleaseEstimate(product, selectedRelease, condition)
  const [price, setPrice] = React.useState(String(estimate.value))

  // When the dialog opens, reset to a clean default keyed to the chosen release.
  React.useEffect(() => {
    if (!open) return
    const r = resolveRelease(product, defaultReleaseId)
    setReleaseId(r.id)
    setYear(String(r.releaseYear))
    setCondition("New / Opened")
    setPrice(String(getReleaseEstimate(product, r, "New / Opened").value))
    setNotes("")
    setDate(new Date().toISOString().slice(0, 10))
  }, [open, product, defaultReleaseId])

  // Keep the year field in sync when the collector switches release.
  function handleReleaseChange(id: string) {
    setReleaseId(id)
    const r = resolveRelease(product, id)
    setYear(String(r.releaseYear))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const parsedYear = Number(year)
    const releaseYearOverride =
      Number.isFinite(parsedYear) && parsedYear !== selectedRelease.releaseYear ? parsedYear : undefined
    addToCollection({
      productId: product.id,
      releaseId: selectedRelease.id,
      condition,
      acquisitionDate: new Date(date).toISOString(),
      acquisitionPrice: Number(price) || 0,
      acquisitionCurrency: currency,
      releaseYearOverride,
      notes: notes.trim() || undefined,
    })
    toast.success("Added to collection", {
      description: `${selectedRelease.editionName} · ${year} ${selectedRelease.releaseType}`,
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to collection</DialogTitle>
          <DialogDescription>Log the exact release you own, its condition and what you paid.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3 rounded-lg border border-border p-2">
          <ProductArt product={product} release={selectedRelease} size="sm" className="h-14 w-20" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{product.name}</p>
            <p className="text-xs text-muted-foreground">
              #{selectedRelease.itemNumber} · {selectedRelease.chassis} · original {product.originalReleaseYear}
            </p>
          </div>
        </div>
        <form onSubmit={submit}>
          <FieldGroup>
            <ReleaseSelect product={product} value={releaseId} onChange={handleReleaseChange} />
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="condition">Condition</FieldLabel>
                <Select value={condition} onValueChange={(v) => setCondition(v as Condition)}>
                  <SelectTrigger id="condition" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="year">Release year</FieldLabel>
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
              Original model release: {product.originalReleaseYear}. Adjust the year above to match your exact kit.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="date">Acquired</FieldLabel>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="currency">Currency</FieldLabel>
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
              <FieldLabel htmlFor="price">Paid ({currency})</FieldLabel>
              <Input
                id="price"
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Demo estimate for this release &amp; condition: {formatMoney(estimate.value)}
              </p>
            </Field>
            <Field>
              <FieldLabel htmlFor="notes">Notes</FieldLabel>
              <Textarea
                id="notes"
                rows={2}
                placeholder="Optional — provenance, box condition, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-4">
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit">Add item</Button>
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
  const [open, setOpen] = React.useState(false)
  const estimate = getProductEstimate(product)

  const [releaseId, setReleaseId] = React.useState(defaultReleaseId ?? "any")
  const [priority, setPriority] = React.useState<WishlistPriority>("Medium")
  const [target, setTarget] = React.useState(String(Math.round(estimate.value * 0.9)))
  const [notes, setNotes] = React.useState("")

  const selectedRelease =
    releaseId && releaseId !== "any" ? resolveRelease(product, releaseId) : primaryRelease(product)
  const displayEstimate =
    releaseId && releaseId !== "any" ? getReleaseEstimate(product, selectedRelease) : estimate

  function submit(e: React.FormEvent) {
    e.preventDefault()
    addToWishlist({
      productId: product.id,
      releaseId: releaseId && releaseId !== "any" ? releaseId : undefined,
      priority,
      targetPrice: target ? Number(target) : undefined,
      notes: notes.trim() || undefined,
    })
    toast.success("Added to wishlist", { description: product.name })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to wishlist</DialogTitle>
          <DialogDescription>
            Track a model you want. We&apos;ll flag it when the market estimate drops to your target.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3 rounded-lg border border-border p-2">
          <ProductArt product={product} size="sm" className="h-14 w-20" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{product.name}</p>
            <p className="text-xs text-muted-foreground">
              Est. {formatMoney(displayEstimate.value)} · demo
            </p>
          </div>
        </div>
        <form onSubmit={submit}>
          <FieldGroup>
            <ReleaseSelect product={product} value={releaseId} onChange={setReleaseId} allowAny />
            <Field>
              <FieldLabel htmlFor="priority">Priority</FieldLabel>
              <Select value={priority} onValueChange={(v) => setPriority(v as WishlistPriority)}>
                <SelectTrigger id="priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="target">Target price (EUR)</FieldLabel>
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
              <FieldLabel htmlFor="wnotes">Notes</FieldLabel>
              <Textarea
                id="wnotes"
                rows={2}
                placeholder="Optional"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-4">
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit">Add to wishlist</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
