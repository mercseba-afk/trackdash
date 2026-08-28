"use client"

import * as React from "react"
import { toast } from "sonner"
import type { Condition, Currency, Product, WishlistPriority } from "@/lib/types"
import { useStore } from "@/lib/store"
import { getMarketEstimate } from "@/lib/data/market"
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

function VariantSelect({
  product,
  value,
  onChange,
}: {
  product: Product
  value: string
  onChange: (v: string) => void
}) {
  if (product.variants.length <= 1) return null
  return (
    <Field>
      <FieldLabel htmlFor="variant">Variant</FieldLabel>
      <Select value={value} onValueChange={(v) => onChange(v as string)}>
        <SelectTrigger id="variant" className="w-full">
          <SelectValue placeholder="Select variant" />
        </SelectTrigger>
        <SelectContent>
          {product.variants.map((v) => (
            <SelectItem key={v.id} value={v.id}>
              {v.variantName} · {v.variantType}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

export function AddToCollectionDialog({
  product,
  children,
}: {
  product: Product
  children: React.ReactNode
}) {
  const { addToCollection } = useStore()
  const [open, setOpen] = React.useState(false)
  const estimate = getMarketEstimate(product)

  const [variantId, setVariantId] = React.useState(product.variants[0]?.id ?? "")
  const [condition, setCondition] = React.useState<Condition>("New / Opened")
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10))
  const [price, setPrice] = React.useState(String(estimate.value))
  const [currency, setCurrency] = React.useState<Currency>("EUR")
  const [notes, setNotes] = React.useState("")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    addToCollection({
      productId: product.id,
      variantId: variantId || undefined,
      condition,
      acquisitionDate: new Date(date).toISOString(),
      acquisitionPrice: Number(price) || 0,
      acquisitionCurrency: currency,
      notes: notes.trim() || undefined,
    })
    toast.success("Added to collection", { description: product.name })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to collection</DialogTitle>
          <DialogDescription>Log an item you own with its condition and what you paid.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3 rounded-lg border border-border p-2">
          <ProductArt product={product} size="sm" className="h-14 w-20" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{product.name}</p>
            <p className="text-xs text-muted-foreground">
              #{product.tamiyaItemNumber} · {product.chassis}
            </p>
          </div>
        </div>
        <form onSubmit={submit}>
          <FieldGroup>
            <VariantSelect product={product} value={variantId} onChange={setVariantId} />
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
  children,
}: {
  product: Product
  children: React.ReactNode
}) {
  const { addToWishlist } = useStore()
  const [open, setOpen] = React.useState(false)
  const estimate = getMarketEstimate(product)

  const [variantId, setVariantId] = React.useState(product.variants[0]?.id ?? "")
  const [priority, setPriority] = React.useState<WishlistPriority>("Medium")
  const [target, setTarget] = React.useState(String(Math.round(estimate.value * 0.9)))
  const [notes, setNotes] = React.useState("")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    addToWishlist({
      productId: product.id,
      variantId: variantId || undefined,
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
              Est. {formatMoney(estimate.value)} · demo
            </p>
          </div>
        </div>
        <form onSubmit={submit}>
          <FieldGroup>
            <VariantSelect product={product} value={variantId} onChange={setVariantId} />
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
