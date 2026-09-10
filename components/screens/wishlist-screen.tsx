"use client"

import * as React from "react"
import Link from "next/link"
import { Check, Heart, Target, Trash2 } from "lucide-react"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import { useMarketSignals } from "@/lib/market/context"
import { enrichWishlist, type EnrichedWishlistItem } from "@/lib/analytics"
import { formatMoney } from "@/lib/format"
import type { WishlistPriority } from "@/lib/types"
import { ProductImage } from "@/components/catalog/product-image"
import { RarityBadge, TrendIndicator } from "@/components/market-bits"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { toast } from "sonner"

const PRIORITY_META: Record<WishlistPriority, { className: string }> = {
  High: { className: "bg-brand text-brand-foreground" },
  Medium: { className: "bg-warning text-white" },
  Low: { className: "bg-muted text-muted-foreground" },
}

function priorityLabel(priority: WishlistPriority, it: boolean) {
  if (!it) return priority
  if (priority === "High") return "Alta"
  if (priority === "Medium") return "Media"
  return "Bassa"
}

export function WishlistScreen() {
  const { wishlist, removeFromWishlist, moveWishlistToCollection } = useStore()
  const { locale, t } = useI18n(); const it = locale === "it"
  const marketSignals = useMarketSignals()
  const enriched = React.useMemo(() => enrichWishlist(wishlist, marketSignals), [wishlist, marketSignals])
  const sorted = React.useMemo(() => { const order: Record<WishlistPriority, number> = { High: 0, Medium: 1, Low: 2 }; return [...enriched].sort((a, b) => order[a.item.priority] - order[b.item.priority]) }, [enriched])
  const atTarget = enriched.filter((entry) => entry.belowTarget)
  const totalTarget = enriched.reduce((sum, entry) => sum + (entry.item.targetPrice ?? entry.currentPrice ?? 0), 0)

  if (wishlist.length === 0) {
    return <div className="flex flex-col gap-6"><PageHeader /><Empty className="rounded-lg border border-dashed border-border py-16"><EmptyHeader><EmptyMedia variant="icon"><Heart /></EmptyMedia><EmptyTitle>{t("wishlist.emptyTitle")}</EmptyTitle><EmptyDescription>{t("wishlist.emptyDesc")}</EmptyDescription></EmptyHeader><EmptyContent><Button render={<Link href="/catalog" />}>{t("wishlist.find")}</Button></EmptyContent></Empty></div>
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader />
      <div className="flex flex-wrap items-center gap-3">
        <Card className="flex-1 py-0"><CardContent className="flex items-center justify-between px-4 py-3"><span className="text-sm text-muted-foreground">{t("wishlist.items")}</span><span className="text-lg font-semibold tabular-nums">{enriched.length}</span></CardContent></Card>
        <Card className="flex-1 py-0"><CardContent className="flex items-center justify-between px-4 py-3"><span className="text-sm text-muted-foreground">{t("wishlist.complete")}</span><span className="text-lg font-semibold tabular-nums">{formatMoney(totalTarget)}</span></CardContent></Card>
        <Card className="flex-1 py-0"><CardContent className="flex items-center justify-between px-4 py-3"><span className="text-sm text-muted-foreground">{t("wishlist.targetPrice")}</span><span className="text-lg font-semibold tabular-nums text-success">{atTarget.length}</span></CardContent></Card>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{it ? "Il confronto con il target usa il prezzo corrente acquistabile “Da” quando disponibile. Il Valore di mercato resta separato e usa esclusivamente il segnale R3 consolidato della release." : "Target matching uses the current purchasable From price when available. Market Value remains separate and uses only the release's consolidated R3 signal."}</p>
      <div className="grid gap-3">
        {sorted.map((entry) => <WishlistRow key={entry.item.id} entry={entry} onRemove={async () => { try { await removeFromWishlist(entry.item.id); toast.success(it ? `${entry.product.name} rimosso dai desideri` : `Removed ${entry.product.name} from wishlist`) } catch (error) { toast.error(error instanceof Error ? error.message : it ? "Impossibile rimuovere questo elemento" : "Couldn't remove this item") } }} onAcquire={async () => { try { await moveWishlistToCollection(entry.item.id, { condition: "New / Opened", acquisitionDate: new Date().toISOString(), acquisitionPrice: entry.item.targetPrice ?? entry.currentPrice ?? 0, acquisitionCurrency: "EUR" }); toast.success(it ? "Spostato nella collezione" : "Moved to collection", { description: entry.product.name }) } catch (error) { toast.error(error instanceof Error ? error.message : it ? "Impossibile spostarlo nella collezione" : "Couldn't move this item to your collection") } }} />)}
      </div>
    </div>
  )
}

function WishlistRow({ entry, onRemove, onAcquire }: { entry: EnrichedWishlistItem; onRemove: () => void; onAcquire: () => void }) {
  const { locale, t } = useI18n(); const it = locale === "it"; const meta = PRIORITY_META[entry.item.priority]
  const href = entry.release ? `/catalog/${entry.product.id}/releases/${entry.release.id}` : `/catalog/${entry.product.id}`
  return (
    <Card className="overflow-hidden py-0"><div className="flex items-stretch gap-3 p-3 sm:gap-4">
      <Link href={href} className="shrink-0"><ProductImage product={entry.product} release={entry.release} size="sm" className="h-20 w-28 sm:h-24 sm:w-36" /></Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2"><div className="min-w-0"><Link href={href} className="truncate font-medium hover:text-brand">{entry.product.name}</Link><p className="truncate text-xs text-muted-foreground">{entry.label ? `${entry.label} · ` : `${t("wishlist.anyEdition")} · `}{entry.product.chassis ?? "—"}</p></div><div className="flex items-center gap-1.5"><Badge className={meta.className}>{priorityLabel(entry.item.priority, it)}</Badge><RarityBadge rarity={entry.release?.rarity ?? entry.product.rarity} /></div></div>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <MarketReadout entry={entry} it={it} marketLabel={t("wishlist.market")} />
          {entry.item.targetPrice != null && <span className="inline-flex items-center gap-1"><Target className="size-3" /> {t("wishlist.target")} <span className="font-medium text-foreground">{formatMoney(entry.item.targetPrice)}</span></span>}
          {entry.belowTarget && <Badge className="bg-success text-white"><Check data-icon="inline-start" />{t("wishlist.atTarget")}</Badge>}
        </div>
      </div>
      <div className="flex flex-col items-end justify-between border-l border-border pl-3 sm:pl-4"><Button variant="outline" size="sm" onClick={onAcquire}><Check data-icon="inline-start" />{t("wishlist.gotIt")}</Button><Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" aria-label={it ? "Rimuovi dai desideri" : "Remove from wishlist"} onClick={onRemove}><Trash2 /></Button></div>
    </div></Card>
  )
}

function MarketReadout({ entry, it, marketLabel }: { entry: EnrichedWishlistItem; it: boolean; marketLabel: string }) {
  if (entry.marketValue != null) {
    return <span className="inline-flex items-center gap-1">{marketLabel} <span className="font-medium text-foreground">{formatMoney(entry.marketValue)}</span>{entry.marketSignal?.trendPercent != null ? <TrendIndicator value={entry.marketSignal.trendPercent} className="text-xs" /> : null}{entry.currentPrice != null ? <span>· {it ? "Da" : "From"} <span className="font-medium text-foreground">{formatMoney(entry.currentPrice)}</span></span> : null}</span>
  }
  if (entry.currentPrice != null) {
    return <span className="inline-flex items-center gap-1">{it ? "Prezzo corrente" : "Current price"} <span className="font-medium text-foreground">{it ? "Da " : "From "}{formatMoney(entry.currentPrice)}</span></span>
  }
  if (entry.marketSignal) {
    return <span>{it ? "Valore non consolidato" : "Value not consolidated"}</span>
  }
  return <span>{it ? "Dati mercato in arrivo" : "Market data coming soon"}</span>
}

function PageHeader() { const { t } = useI18n(); return <div className="flex flex-col gap-1"><h1 className="text-2xl font-semibold tracking-tight">{t("wishlist.title")}</h1><p className="text-sm text-muted-foreground">{t("wishlist.subtitle")}</p></div> }
