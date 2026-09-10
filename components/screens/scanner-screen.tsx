"use client"

import * as React from "react"
import Link from "next/link"
import { Camera, Loader2, ScanLine, Sparkles, X } from "lucide-react"
import { PRODUCTS, findByCode, resolveRelease } from "@/lib/data/corrected-products"
import { useI18n } from "@/lib/i18n"
import { useMarketSignals } from "@/lib/market/context"
import type { Product, ProductRelease } from "@/lib/types"
import { ProductImage } from "@/components/catalog/product-image"
import { RarityBadge } from "@/components/market-bits"
import { MarketSignalInline } from "@/components/market-signal-inline"
import { AddToCollectionDialog, AddToWishlistDialog } from "@/components/add-item-dialogs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"

type Phase = "idle" | "scanning" | "result" | "not-found"
interface Match { product: Product; releaseId?: string }

export function ScannerScreen() {
  const { t } = useI18n()
  const [phase, setPhase] = React.useState<Phase>("idle")
  const [manual, setManual] = React.useState("")
  const [result, setResult] = React.useState<Match | null>(null)
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  function runScan(target?: Match | null) { setPhase("scanning"); setResult(null); timer.current = setTimeout(() => { const found = target ?? { product: PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)] }; if (found.product) { setResult(found); setPhase("result") } else setPhase("not-found") }, 1600) }
  function submitManual(e: React.FormEvent) { e.preventDefault(); const q = manual.trim(); if (!q) return; const byCode = findByCode(q); if (byCode) { runScan({ product: byCode.product, releaseId: byCode.release?.id }); return } const byName = PRODUCTS.find((p) => p.name.toLowerCase().includes(q.toLowerCase())); runScan(byName ? { product: byName } : null) }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1"><h1 className="text-2xl font-semibold tracking-tight">{t("scanner.title")}</h1><p className="text-sm text-muted-foreground">{t("scanner.subtitle")}</p></div>
      <Card className="overflow-hidden py-0"><CardContent className="relative flex aspect-video items-center justify-center bg-foreground/95 p-0 text-background">
        <div className="pointer-events-none absolute inset-6 rounded-lg">{["left-0 top-0 border-l-2 border-t-2", "right-0 top-0 border-r-2 border-t-2", "left-0 bottom-0 border-l-2 border-b-2", "right-0 bottom-0 border-r-2 border-b-2"].map((pos) => <span key={pos} className={`absolute size-8 rounded-[3px] border-brand ${pos}`} />)}</div>
        {phase === "scanning" && <div className="pointer-events-none absolute inset-x-6 top-6 bottom-6 overflow-hidden"><span className="absolute inset-x-0 h-0.5 animate-[scan_1.6s_ease-in-out_infinite] bg-brand shadow-[0_0_12px_2px_var(--brand)]" /></div>}
        <div className="z-10 flex flex-col items-center gap-3 text-center">{phase === "scanning" ? <><Loader2 className="size-8 animate-spin text-brand" /><p className="text-sm font-medium">{t("scanner.scanning")}</p></> : <><ScanLine className="size-9 text-background/70" /><p className="max-w-xs text-sm text-background/70">{t("scanner.simulated")}</p></>}</div>
      </CardContent></Card>

      <div className="flex flex-col gap-3">
        <Button size="lg" onClick={() => runScan()} disabled={phase === "scanning"}><Camera data-icon="inline-start" />{phase === "scanning" ? t("scanner.scanning") : t("scanner.scan")}</Button>
        <form onSubmit={submitManual}><InputGroup><InputGroupInput placeholder={t("scanner.placeholder")} value={manual} onChange={(e) => setManual(e.target.value)} /><InputGroupAddon align="inline-end"><InputGroupButton type="submit" disabled={phase === "scanning"}>{t("scanner.lookup")}</InputGroupButton></InputGroupAddon></InputGroup></form>
      </div>

      {phase === "not-found" && <Card><CardContent className="flex items-center justify-between gap-3 py-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground"><X className="size-4" /></span><div><p className="text-sm font-medium">{t("scanner.noMatch")}</p><p className="text-xs text-muted-foreground">{t("scanner.noMatchDesc")}</p></div></div><Button variant="outline" size="sm" onClick={() => setPhase("idle")}>{t("scanner.dismiss")}</Button></CardContent></Card>}
      {phase === "result" && result && <ScanResult product={result.product} matchedReleaseId={result.releaseId} onScanAgain={() => runScan()} />}
    </div>
  )
}

function ScanResult({ product, matchedReleaseId, onScanAgain }: { product: Product; matchedReleaseId?: string; onScanAgain: () => void }) {
  const { t } = useI18n()
  const marketSignals = useMarketSignals()
  const [releaseId, setReleaseId] = React.useState(resolveRelease(product, matchedReleaseId).id)
  React.useEffect(() => setReleaseId(resolveRelease(product, matchedReleaseId).id), [product, matchedReleaseId])
  const release: ProductRelease = resolveRelease(product, releaseId)
  const marketSignal = marketSignals[release.id] ?? null
  const releaseHref = `/catalog/${product.id}/releases/${release.id}`
  return (
    <Card className="border-brand/40"><CardContent className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-brand"><Sparkles className="size-4" /><span className="text-sm font-medium">{matchedReleaseId ? t("scanner.foundRelease") : t("scanner.foundProduct")}</span></div>
      <div className="flex gap-4"><ProductImage product={product} release={release} className="h-24 w-36 shrink-0" /><div className="flex min-w-0 flex-1 flex-col gap-1.5"><Link href={releaseHref} className="font-semibold leading-tight hover:text-brand">{release.editionName}</Link><p className="text-xs text-muted-foreground">{t("scanner.model")}: <Link href={`/catalog/${product.id}`} className="hover:text-foreground">{product.name}</Link></p><p className="text-xs text-muted-foreground">#{release.itemNumber ?? "—"} · {release.chassis ?? "—"} · {release.releaseYear ?? "—"}</p><div className="flex flex-wrap items-center gap-1.5"><RarityBadge rarity={release.rarity ?? product.rarity} /><Badge variant="outline">{product.series}</Badge></div><div className="mt-1"><MarketSignalInline signal={marketSignal} showStartingPrice /></div></div></div>
      <div className="flex flex-col gap-1.5"><span className="text-xs font-medium text-muted-foreground">{t("scanner.releaseEdition")}</span><Select value={releaseId} onValueChange={(v) => v && setReleaseId(v as string)}><SelectTrigger className="w-full"><SelectValue>{(v: string) => { const r = product.releases.find((x) => x.id === v); return r ? `${r.releaseYear ?? "—"} · ${r.releaseType} · #${r.itemNumber ?? "—"}` : t("scanner.selectRelease") }}</SelectValue></SelectTrigger><SelectContent>{product.releases.map((r) => <SelectItem key={r.id} value={r.id}>{r.releaseYear ?? "—"} · {r.releaseType} · #{r.itemNumber ?? "—"}</SelectItem>)}</SelectContent></Select>{product.hasMultipleReleases ? <p className="text-[11px] text-muted-foreground">{t("scanner.multiple")}</p> : null}</div>
      <div className="flex flex-wrap gap-2"><AddToCollectionDialog product={product} defaultReleaseId={releaseId}><Button className="flex-1">{t("product.addCollection")}</Button></AddToCollectionDialog><AddToWishlistDialog product={product} defaultReleaseId={releaseId}><Button variant="outline" className="flex-1">{t("scanner.addWishlist")}</Button></AddToWishlistDialog><Button variant="ghost" onClick={onScanAgain}>{t("scanner.again")}</Button></div>
    </CardContent></Card>
  )
}
