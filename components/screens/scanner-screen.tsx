"use client"

import * as React from "react"
import Link from "next/link"
import { Camera, Loader2, ScanLine, Sparkles, X } from "lucide-react"
import { PRODUCTS, findByCode } from "@/lib/data/products"
import { getMarketEstimate } from "@/lib/data/market"
import { formatMoney } from "@/lib/format"
import type { Product } from "@/lib/types"
import { ProductArt } from "@/components/product-art"
import { RarityBadge, TrendIndicator, ConfidenceBadge } from "@/components/market-bits"
import { AddToCollectionDialog, AddToWishlistDialog } from "@/components/add-item-dialogs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

type Phase = "idle" | "scanning" | "result" | "not-found"

export function ScannerScreen() {
  const [phase, setPhase] = React.useState<Phase>("idle")
  const [manual, setManual] = React.useState("")
  const [result, setResult] = React.useState<Product | null>(null)
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  function runScan(target?: Product | null) {
    setPhase("scanning")
    setResult(null)
    timer.current = setTimeout(() => {
      const found = target ?? PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)]
      if (found) {
        setResult(found)
        setPhase("result")
      } else {
        setPhase("not-found")
      }
    }, 1600)
  }

  function submitManual(e: React.FormEvent) {
    e.preventDefault()
    const q = manual.trim()
    if (!q) return
    const byCode = findByCode(q)
    const byName = PRODUCTS.find((p) => p.name.toLowerCase().includes(q.toLowerCase()))
    runScan(byCode ?? byName ?? null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Scanner</h1>
        <p className="text-sm text-muted-foreground">
          Point at a box or barcode to identify a model. Demo scanner resolves to a catalog match.
        </p>
      </div>

      {/* Scanner viewport */}
      <Card className="overflow-hidden py-0">
        <CardContent className="relative flex aspect-video items-center justify-center bg-foreground/95 p-0 text-background">
          {/* framing corners */}
          <div className="pointer-events-none absolute inset-6 rounded-lg">
            {["left-0 top-0 border-l-2 border-t-2", "right-0 top-0 border-r-2 border-t-2", "left-0 bottom-0 border-l-2 border-b-2", "right-0 bottom-0 border-r-2 border-b-2"].map(
              (pos) => (
                <span key={pos} className={`absolute size-8 rounded-[3px] border-brand ${pos}`} />
              ),
            )}
          </div>

          {phase === "scanning" && (
            <div className="pointer-events-none absolute inset-x-6 top-6 bottom-6 overflow-hidden">
              <span className="absolute inset-x-0 h-0.5 animate-[scan_1.6s_ease-in-out_infinite] bg-brand shadow-[0_0_12px_2px_var(--brand)]" />
            </div>
          )}

          <div className="z-10 flex flex-col items-center gap-3 text-center">
            {phase === "scanning" ? (
              <>
                <Loader2 className="size-8 animate-spin text-brand" />
                <p className="text-sm font-medium">Scanning…</p>
              </>
            ) : (
              <>
                <ScanLine className="size-9 text-background/70" />
                <p className="max-w-xs text-sm text-background/70">
                  Camera preview is simulated in this demo build.
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <Button size="lg" onClick={() => runScan()} disabled={phase === "scanning"}>
          <Camera data-icon="inline-start" />
          {phase === "scanning" ? "Scanning…" : "Scan a box"}
        </Button>

        <form onSubmit={submitManual}>
          <InputGroup>
            <InputGroupInput
              placeholder="Or enter item number (e.g. 18075) or name"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton type="submit" disabled={phase === "scanning"}>
                Look up
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>
      </div>

      {phase === "not-found" && (
        <Card>
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground">
                <X className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium">No match found</p>
                <p className="text-xs text-muted-foreground">Try a different item number or scan again.</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setPhase("idle")}>
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {phase === "result" && result && <ScanResult product={result} onScanAgain={() => runScan()} />}
    </div>
  )
}

function ScanResult({ product, onScanAgain }: { product: Product; onScanAgain: () => void }) {
  const estimate = getMarketEstimate(product)
  return (
    <Card className="border-brand/40">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-brand">
          <Sparkles className="size-4" />
          <span className="text-sm font-medium">Identified</span>
        </div>
        <div className="flex gap-4">
          <ProductArt product={product} className="h-24 w-36 shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Link href={`/catalog/${product.id}`} className="font-semibold leading-tight hover:text-brand">
              {product.name}
            </Link>
            <p className="text-xs text-muted-foreground">
              {product.chassis} · #{product.tamiyaItemNumber} · {product.releaseYear}
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <RarityBadge rarity={product.rarity} />
              <Badge variant="outline">{product.series}</Badge>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-lg font-semibold tabular-nums">{formatMoney(estimate.value)}</span>
              <TrendIndicator value={estimate.trend90d} />
              <ConfidenceBadge estimate={estimate} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <AddToCollectionDialog product={product}>
            <Button className="flex-1">Add to collection</Button>
          </AddToCollectionDialog>
          <AddToWishlistDialog product={product}>
            <Button variant="outline" className="flex-1">
              Add to wishlist
            </Button>
          </AddToWishlistDialog>
          <Button variant="ghost" onClick={onScanAgain}>
            Scan again
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
