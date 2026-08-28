"use client"

import * as React from "react"
import { toast } from "sonner"
import type { Condition, Product } from "@/lib/types"
import { useStore } from "@/lib/store"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ProductPlate } from "@/components/product-plate"

const CONDITIONS: Condition[] = ["Sealed", "New / Opened", "Built", "Used", "Incomplete"]

export function AddToCollectionDialog({
  product,
  open,
  onOpenChange,
}: {
  product: Product
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { addToCollection } = useStore()
  const [variantId, setVariantId] = React.useState(product.variants[0]?.id ?? "")
  const [condition, setCondition] = React.useState<Condition>("New / Opened")
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10))
  const [price, setPrice] = React.useState("")
  const [notes, setNotes] = React.useState("")

  function submit() {
    addToCollection({
      productId: product.id,
      variantId: variantId || undefined,
      condition,
      acquisitionDate: date,
      acquisitionPrice: Number(price) || 0,
      acquisitionCurrency: "EUR",
      notes: notes.trim() || undefined,
    })
    toast.success("Added to your collection", { description: product.name })
    onOpenChange(false)
    setPrice("")
    setNotes("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to collection</DialogTitle>
          <DialogDescription>Log a copy of {product.name} you own.</DialogDescription>
        </DialogHeader>

        <div className="w-28 overflow-hidden rounded-lg ring-1 ring-foreground/10">
          <ProductPlate product={product} size="sm" />
        </div>

        <FieldGroup>
          {product.variants.length > 1 && (
            <Field>
              <FieldLabel>Variant</FieldLabel>
              <Select value={variantId} onValueChange={setVariantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select variant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {product.variants.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.variantName}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          )}

          <Field>
            <FieldLabel>Condition</FieldLabel>
            <Select value={condition} onValueChange={(v) => setCondition(v as Condition)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {CONDITIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="acq-date">Acquired</FieldLabel>
              <Input
                id="acq-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="acq-price">Paid (€)</FieldLabel>
              <Input
                id="acq-price"
                inputMode="decimal"
                placeholder="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="acq-notes">Notes</FieldLabel>
            <Textarea
              id="acq-notes"
              rows={2}
              placeholder="Optional — condition details, where you found it…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <FieldDescription>Only you can see your notes.</FieldDescription>
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Add to collection</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
