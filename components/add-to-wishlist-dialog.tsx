"use client"

import * as React from "react"
import { toast } from "sonner"
import type { Product, WishlistPriority } from "@/lib/types"
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ProductPlate } from "@/components/product-plate"

const PRIORITIES: WishlistPriority[] = ["Low", "Medium", "High"]

export function AddToWishlistDialog({
  product,
  open,
  onOpenChange,
}: {
  product: Product
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { addToWishlist } = useStore()
  const [variantId, setVariantId] = React.useState(product.variants[0]?.id ?? "")
  const [priority, setPriority] = React.useState<WishlistPriority>("Medium")
  const [target, setTarget] = React.useState("")
  const [notes, setNotes] = React.useState("")

  function submit() {
    addToWishlist({
      productId: product.id,
      variantId: variantId || undefined,
      priority,
      targetPrice: target ? Number(target) : undefined,
      notes: notes.trim() || undefined,
    })
    toast.success("Added to your wishlist", { description: product.name })
    onOpenChange(false)
    setTarget("")
    setNotes("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to wishlist</DialogTitle>
          <DialogDescription>Track {product.name} and set a target price.</DialogDescription>
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
            <FieldLabel>Priority</FieldLabel>
            <ToggleGroup
              value={[priority]}
              onValueChange={(v) => v[0] && setPriority(v[0] as WishlistPriority)}
              className="w-full"
            >
              {PRIORITIES.map((p) => (
                <ToggleGroupItem key={p} value={p} className="flex-1">
                  {p}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>

          <Field>
            <FieldLabel htmlFor="wl-target">Target price (€)</FieldLabel>
            <Input
              id="wl-target"
              inputMode="decimal"
              placeholder="Alert me at or below…"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="wl-notes">Notes</FieldLabel>
            <Textarea
              id="wl-notes"
              rows={2}
              placeholder="Optional"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Add to wishlist</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
