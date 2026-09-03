"use client"

import * as React from "react"
import Link from "next/link"
import { Boxes, Coins, Layers, Pencil, Trash2, TrendingUp } from "lucide-react"
import { useStore } from "@/lib/store"
import { breakdownBy, enrichCollection, portfolioSummary, type EnrichedCollectionItem } from "@/lib/analytics"
import { formatDate, formatMoney } from "@/lib/format"
import type { CollectionItem, Condition } from "@/lib/types"
import { CONDITIONS } from "@/lib/types"
import { StatCard } from "@/components/stat-card"
import { ProductImage } from "@/components/catalog/product-image"
import { RarityBadge, TrendIndicator } from "@/components/market-bits"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { toast } from "sonner"

type SortKey = "recent" | "value-desc" | "value-asc" | "name"

export function CollectionScreen() {
  const { collection, updateCollectionItem, removeFromCollection } = useStore()
  const [sort, setSort] = React.useState<SortKey>("recent")
  const [editing, setEditing] = React.useState<EnrichedCollectionItem | null>(null)

  const enriched = React.useMemo(() => enrichCollection(collection), [collection])
  const summary = React.useMemo(() => portfolioSummary(enriched), [enriched])
  const byCondition = React.useMemo(() => breakdownBy(enriched, (e) => e.item.condition), [enriched])

  const sorted = React.useMemo(() => {
    const list = [...enriched]
    switch (sort) {
      case "value-desc":
        return list.sort((a, b) => b.estimate.value - a.estimate.value)
      case "value-asc":
        return list.sort((a, b) => a.estimate.value - b.estimate.value)
      case "name":
        return list.sort((a, b) => a.product.name.localeCompare(b.product.name))
      default:
        return list.sort((a, b) => +new Date(b.item.createdAt) - +new Date(a.item.createdAt))
    }
  }, [enriched, sort])

  if (collection.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader />
        <Empty className="rounded-lg border border-dashed border-border py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Boxes />
            </EmptyMedia>
            <EmptyTitle>No models yet</EmptyTitle>
            <EmptyDescription>Add models from the catalog and they will show up here.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link href="/catalog" />}>Browse the catalog</Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Market value" value={formatMoney(summary.marketValue)} icon={Coins} accent />
        <StatCard
          label="Spent"
          value={formatMoney(summary.acquisitionCost)}
          icon={Layers}
          hint={<span>{summary.count} items</span>}
        />
        <StatCard
          label="Gain / loss"
          value={formatMoney(summary.gain)}
          icon={TrendingUp}
          hint={<TrendIndicator value={summary.gainPercent} className="text-xs" />}
        />
        <StatCard label="Sealed" value={summary.sealedCount} icon={Boxes} hint={<span>of {summary.count}</span>} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {byCondition.map((b) => (
          <Badge key={b.label} variant="outline" className="gap-1.5">
            {b.label}
            <span className="text-muted-foreground">{b.count}</span>
          </Badge>
        ))}
        <div className="ml-auto">
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger size="sm" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently added</SelectItem>
              <SelectItem value="value-desc">Value: high to low</SelectItem>
              <SelectItem value="value-asc">Value: low to high</SelectItem>
              <SelectItem value="name">Name A–Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3">
        {sorted.map((e) => (
          <Card key={e.item.id} className="overflow-hidden py-0">
            <div className="flex items-stretch gap-3 p-3 sm:gap-4">
              <Link href={`/catalog/${e.product.id}`} className="shrink-0">
                <ProductImage product={e.product} release={e.release} size="sm" className="h-20 w-28 sm:h-24 sm:w-36" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/catalog/${e.product.id}`} className="truncate font-medium hover:text-brand">
                      {e.product.name}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {e.label} · {e.release.chassis} · #{e.release.itemNumber}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      Model originally released {e.product.originalReleaseYear}
                    </p>
                  </div>
                  <RarityBadge rarity={e.release.rarity ?? e.product.rarity} />
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    Condition <span className="font-medium text-foreground">{e.item.condition}</span>
                  </span>
                  <span>
                    Paid{" "}
                    <span className="font-medium text-foreground">
                      {formatMoney(e.item.acquisitionPrice, e.item.acquisitionCurrency)}
                    </span>
                  </span>
                  <span className="hidden sm:inline">Added {formatDate(e.item.acquisitionDate)}</span>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between border-l border-border pl-3 sm:pl-4">
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">{formatMoney(e.estimate.value)}</p>
                  <TrendIndicator value={e.estimate.trend90d} className="justify-end text-xs" />
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label="Edit"
                    onClick={() => setEditing(e)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    aria-label="Remove"
                    onClick={async () => {
                      try {
                        await removeFromCollection(e.item.id)
                        toast.success(`Removed ${e.product.name}`)
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Couldn't remove this item")
                      }
                    }}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <EditDialog
        entry={editing}
        onClose={() => setEditing(null)}
        onSave={async (id, patch) => {
          try {
            await updateCollectionItem(id, patch)
            setEditing(null)
            toast.success("Collection updated")
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Couldn't save changes")
          }
        }}
      />
    </div>
  )
}

function PageHeader() {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold tracking-tight">My collection</h1>
      <p className="text-sm text-muted-foreground">Every model you own, valued with indicative demo estimates.</p>
    </div>
  )
}

function EditDialog({
  entry,
  onClose,
  onSave,
}: {
  entry: EnrichedCollectionItem | null
  onClose: () => void
  onSave: (id: string, patch: Partial<CollectionItem>) => void
}) {
  const [condition, setCondition] = React.useState<Condition>("Sealed")
  const [price, setPrice] = React.useState("")
  const [year, setYear] = React.useState("")
  const [notes, setNotes] = React.useState("")

  React.useEffect(() => {
    if (entry) {
      setCondition(entry.item.condition)
      setPrice(String(entry.item.acquisitionPrice))
      setYear(String(entry.displayYear))
      setNotes(entry.item.notes ?? "")
    }
  }, [entry])

  return (
    <Dialog open={Boolean(entry)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit item</DialogTitle>
          <DialogDescription>
            {entry?.product.name}
            {entry ? ` · ${entry.release.releaseType} · #${entry.release.itemNumber}` : ""}
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel>Condition</FieldLabel>
            <ToggleGroup
              value={[condition]}
              onValueChange={(v) => v[0] && setCondition(v[0] as Condition)}
              className="flex-wrap"
            >
              {CONDITIONS.map((c) => (
                <ToggleGroupItem key={c} value={c} className="text-xs">
                  {c}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="edit-price">Acquisition price</FieldLabel>
              <Input
                id="edit-price"
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-year">Release year</FieldLabel>
              <Input
                id="edit-year"
                type="number"
                inputMode="numeric"
                min={1980}
                max={2100}
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="edit-notes">Notes</FieldLabel>
            <Input id="edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </FieldGroup>
        <Separator />
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button
            onClick={() => {
              if (!entry) return
              const parsedYear = Number(year)
              const releaseYearOverride =
                Number.isFinite(parsedYear) && parsedYear !== entry.release.releaseYear ? parsedYear : undefined
              onSave(entry.item.id, {
                condition,
                acquisitionPrice: Number(price) || 0,
                releaseYearOverride,
                notes: notes.trim() || undefined,
              })
            }}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
