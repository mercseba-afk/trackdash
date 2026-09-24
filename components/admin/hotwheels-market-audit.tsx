"use client"

import * as React from "react"
import { ChartNoAxesColumnIncreasing, Search, ShieldCheck } from "lucide-react"
import {
  listHotWheelsAuditProfilesAction,
  runHcj81MarketSignalPreviewAction,
  runHotWheelsAskAuditAction,
  type HotWheelsAuditProfileOption,
} from "@/lib/actions/hotwheels-admin"
import type { HotWheelsAskAuditResult } from "@/lib/market/automation/hotwheels-ebay-audit"
import type { HotWheelsMarketSignalPreview } from "@/lib/market/automation/hotwheels-hcj81-preview"
import { useI18n } from "@/lib/i18n"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

function decisionLabel(decision: string, it: boolean) {
  if (decision === "accepted") return it ? "Accettato" : "Accepted"
  if (decision === "needs_review") return it ? "Da verificare" : "Needs review"
  return it ? "Scartato" : "Rejected"
}

function costBasisLabel(costBasis: string, it: boolean) {
  if (costBasis === "delivered_eu") return it ? "Totale UE" : "EU delivered"
  if (costBasis === "extra_eu_import_unknown") return it ? "Extra-UE · import da verificare" : "Extra-EU · import unknown"
  if (costBasis === "shipping_unknown") return it ? "Spedizione non disponibile" : "Shipping unavailable"
  if (costBasis === "origin_unknown") return it ? "Origine non verificata" : "Origin unverified"
  return it ? "Cambio non disponibile" : "FX unavailable"
}

function euro(value: number | null) {
  return value == null ? "—" : new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
}

export function HotWheelsMarketAudit() {
  const { locale } = useI18n()
  const it = locale === "it"
  const [profiles, setProfiles] = React.useState<HotWheelsAuditProfileOption[]>([])
  const [releaseId, setReleaseId] = React.useState("")
  const [includeFallback, setIncludeFallback] = React.useState(false)
  const [result, setResult] = React.useState<HotWheelsAskAuditResult | null>(null)
  const [preview, setPreview] = React.useState<HotWheelsMarketSignalPreview | null>(null)
  const [loadingProfiles, startProfiles] = React.useTransition()
  const [running, startAudit] = React.useTransition()
  const [runningPreview, startPreview] = React.useTransition()

  React.useEffect(() => {
    startProfiles(async () => {
      try {
        const rows = await listHotWheelsAuditProfilesAction()
        setProfiles(rows)
        if (rows.length) setReleaseId((current) => current || rows[0].releaseId)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : (it ? "Impossibile caricare le Release Hot Wheels" : "Couldn't load Hot Wheels Releases"))
      }
    })
  }, [it])

  function runAudit() {
    if (!releaseId) return
    startAudit(async () => {
      try {
        const next = await runHotWheelsAskAuditAction({
          releaseId,
          includeFallbackQuery: includeFallback,
        })
        setResult(next)
        toast.success(it ? "Audit eBay Hot Wheels completato" : "Hot Wheels eBay audit completed")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : (it ? "Audit eBay non riuscito" : "eBay audit failed"))
      }
    })
  }

  function runPreview() {
    startPreview(async () => {
      try {
        const next = await runHcj81MarketSignalPreviewAction()
        setPreview(next)
        toast.success(it ? "Market Signal Preview HCJ81 aggiornato" : "HCJ81 Market Signal Preview updated")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : (it ? "Preview mercato non riuscito" : "Market preview failed"))
      }
    })
  }

  return (
    <Card className="border-orange-500/20 bg-orange-500/[0.025]">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="size-4 text-orange-600" />
              {it ? "Hot Wheels · Audit eBay ASK" : "Hot Wheels · eBay ASK audit"}
            </CardTitle>
            <CardDescription className="mt-1 max-w-3xl">
              {it
                ? "Diagnostica read-only sulle Release Hot Wheels. Cerca annunci eBay europei e misura matching esatto, review e falsi positivi senza scrivere candidati, offerte o valori di mercato."
                : "Read-only diagnostics for Hot Wheels Releases. Searches European eBay listings and measures exact matching, review cases and false positives without writing candidates, offers or market values."}
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <ShieldCheck className="size-3" />
            {it ? "Solo lettura" : "Read only"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-end">
          <label className="grid gap-1.5 text-xs font-medium">
            {it ? "Release da verificare" : "Release to audit"}
            <select
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={loadingProfiles || running}
              value={releaseId}
              onChange={(event) => {
                setReleaseId(event.target.value)
                setResult(null)
                setPreview(null)
              }}
            >
              {profiles.map((profile) => (
                <option key={profile.releaseId} value={profile.releaseId}>
                  {profile.identifier} · {profile.releaseYear ?? "—"} · {profile.lineName}
                  {profile.subseries ? ` / ${profile.subseries}` : ""} · {profile.castingName}
                </option>
              ))}
            </select>
          </label>

          <label className="flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs">
            <input
              type="checkbox"
              checked={includeFallback}
              onChange={(event) => setIncludeFallback(event.target.checked)}
              disabled={running}
            />
            {it ? "Includi query contestuale" : "Include context query"}
          </label>

          <Button onClick={runAudit} disabled={!releaseId || running || loadingProfiles || runningPreview}>
            <Search data-icon="inline-start" className={running ? "animate-pulse" : ""} />
            {running ? (it ? "Audit…" : "Auditing…") : (it ? "Esegui audit" : "Run audit")}
          </Button>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-brand/20 bg-brand/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold">
              <ChartNoAxesColumnIncreasing className="size-4 text-brand" />
              {it ? "HCJ81 · Market Signal Preview" : "HCJ81 · Market Signal Preview"}
            </p>
            <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
              {it
                ? "Combina l'audit eBay live con le evidenze Mercari/retail già verificate. È solo diagnostica: non scrive Market Value, ASK o Price Points nel database."
                : "Combines the live eBay audit with already verified Mercari/retail evidence. Diagnostic only: it writes no Market Value, ASK or Price Points to the database."}
            </p>
          </div>
          <Button variant="outline" onClick={runPreview} disabled={runningPreview || running} className="shrink-0">
            <ChartNoAxesColumnIncreasing data-icon="inline-start" className={runningPreview ? "animate-pulse" : ""} />
            {runningPreview ? (it ? "Calcolo…" : "Calculating…") : (it ? "Calcola preview HCJ81" : "Calculate HCJ81 preview")}
          </Button>
        </div>

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {it
            ? "Default: query con codice Mattel esatto e soli annunci spedibili in Italia. Gli annunci senza codice nel titolo possono essere verificati tramite MPN/GTIN/item specifics o discriminatori commerciali forti. Il costo effettivo somma prezzo + spedizione quando l'origine è UE; extra-UE resta contesto finché import/dazi non sono verificabili."
            : "Default: exact Mattel-code query limited to listings shippable to Italy. Listings without the code in the title may be verified through MPN/GTIN/item specifics or strong commercial discriminators. Effective cost uses item + shipping for EU-origin offers; extra-EU stays contextual until import costs are known."}
        </p>

        {preview ? (
          <div className="flex flex-col gap-4 rounded-2xl border border-brand/25 bg-brand/[0.025] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand">
                  {preview.identifier} · {it ? "segnale simulato" : "simulated signal"}
                </p>
                <h3 className="mt-1 text-lg font-semibold">
                  {preview.signal.marketStatus === "consolidated"
                    ? (it ? "Market Value consolidabile" : "Market Value can consolidate")
                    : preview.signal.marketStatus === "observing"
                      ? (it ? "Mercato in osservazione" : "Market under observation")
                      : (it ? "Dati di mercato in arrivo" : "Market data incoming")}
                </h3>
                <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">{preview.readiness.note}</p>
              </div>
              <Badge variant={preview.readiness.sufficientForPublishedMv ? "default" : "secondary"}>
                {preview.readiness.sufficientForPublishedMv
                  ? (it ? "MV sufficiente" : "MV sufficient")
                  : (it ? "MV non ancora sufficiente" : "MV not sufficient yet")}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <PreviewMetric label={it ? "ASK centrale" : "ASK center"} value={euro(preview.signal.askAnchorEUR)} />
              <PreviewMetric label={it ? "Disponibile da" : "Available from"} value={euro(preview.signal.startingEffectiveCostEUR)} />
              <PreviewMetric label={it ? "Market Value" : "Market Value"} value={euro(preview.signal.marketValueEUR)} />
              <PreviewMetric label={it ? "ASK eBay accettati" : "Accepted eBay ASK"} value={String(preview.liveEbay.acceptedAskCount)} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-background p-3 text-xs">
                <p className="font-semibold">{it ? "Audit eBay live" : "Live eBay audit"}</p>
                <p className="mt-2 text-muted-foreground">
                  {preview.liveEbay.uniqueListings} {it ? "annunci unici" : "unique listings"} · {preview.liveEbay.accepted} {it ? "accettati" : "accepted"} · {preview.liveEbay.review} {it ? "da verificare" : "review"} · {preview.liveEbay.rejected} {it ? "scartati" : "rejected"}.
                </p>
                <p className="mt-1 text-muted-foreground">
                  {preview.liveEbay.deliveredAskCount} {it ? "ASK hanno un costo consegnato UE utilizzabile per “Disponibile da”." : "ASK have an EU delivered cost usable for “Available from”."}
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background p-3 text-xs">
                <p className="font-semibold">{it ? "Guard rail" : "Guard rail"}</p>
                <p className="mt-2 text-muted-foreground">
                  {preview.signal.guardedSold.length > 0
                    ? preview.signal.guardedSold.map((row) => `${row.source}: ${euro(row.itemPriceEUR)}`).join(" · ")
                    : (it ? "Nessun SOLD idoneo è stato escluso come outlier in questo calcolo." : "No eligible SOLD was excluded as an outlier in this calculation.")}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border/70 bg-background">
              <table className="w-full min-w-[900px] text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">{it ? "Fonte" : "Source"}</th>
                    <th className="px-3 py-2 font-medium">{it ? "Tipo" : "Type"}</th>
                    <th className="px-3 py-2 font-medium">{it ? "Prezzo" : "Price"}</th>
                    <th className="px-3 py-2 font-medium">{it ? "Costo consegnato" : "Delivered cost"}</th>
                    <th className="px-3 py-2 font-medium">{it ? "Uso" : "Use"}</th>
                    <th className="px-3 py-2 font-medium">{it ? "Nota" : "Note"}</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.evidence.map((row) => (
                    <tr key={`${row.sourceFamily}-${row.sourceRecordKey}`} className="border-t border-border/60 align-top">
                      <td className="px-3 py-2">
                        {row.url ? (
                          <a href={row.url} target="_blank" rel="noreferrer" className="font-medium hover:text-brand hover:underline">
                            {row.source}
                          </a>
                        ) : <span className="font-medium">{row.source}</span>}
                      </td>
                      <td className="px-3 py-2 font-mono text-[10px]">{row.kind}</td>
                      <td className="px-3 py-2 tabular-nums">{euro(row.itemPriceEUR)}</td>
                      <td className="px-3 py-2 tabular-nums">{euro(row.deliveredCostEUR)}</td>
                      <td className="px-3 py-2">
                        <Badge variant={row.marketUse === "mv_candidate" ? "default" : row.marketUse === "ask" ? "secondary" : "outline"}>
                          {row.marketUse}
                        </Badge>
                      </td>
                      <td className="max-w-[360px] px-3 py-2 text-muted-foreground">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[10px] text-muted-foreground">
              {it ? "Generato " : "Generated "}
              {new Intl.DateTimeFormat(it ? "it-IT" : "en-GB", { dateStyle: "short", timeStyle: "short" }).format(new Date(preview.generatedAt))}
              {" · "}
              {it ? "nessuna scrittura nel Price Engine" : "no writes to the Price Engine"}
            </p>
          </div>
        ) : null}

        {result ? (
          <div className="flex flex-col gap-4 border-t border-border/70 pt-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label={it ? "Annunci unici" : "Unique listings"} value={result.uniqueListings} />
              <Metric label={it ? "Accettati" : "Accepted"} value={result.accepted} />
              <Metric label={it ? "Da verificare" : "Needs review"} value={result.review} />
              <Metric label={it ? "Scartati" : "Rejected"} value={result.rejected} />
            </div>

            <div className="rounded-xl border border-border/70 bg-background p-3 text-xs">
              <p className="font-semibold">{result.primaryIdentifier} · {result.castingName}</p>
              <p className="mt-1 text-muted-foreground">
                {result.queries.map((query, index) => `Q${index + 1}: ${query}`).join(" · ")}
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border/70">
              <table className="w-full min-w-[1180px] text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">{it ? "Esito" : "Decision"}</th>
                    <th className="px-3 py-2 font-medium">Marketplace</th>
                    <th className="px-3 py-2 font-medium">{it ? "Titolo" : "Title"}</th>
                    <th className="px-3 py-2 font-medium">{it ? "Prezzo / spedizione" : "Price / shipping"}</th>
                    <th className="px-3 py-2 font-medium">{it ? "Costo effettivo" : "Effective cost"}</th>
                    <th className="px-3 py-2 font-medium">{it ? "Origine" : "Origin"}</th>
                    <th className="px-3 py-2 font-medium">{it ? "Secondo passaggio" : "Detail lookup"}</th>
                    <th className="px-3 py-2 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {result.listings.slice(0, 20).map((row) => (
                    <tr key={`${row.itemId}-${row.marketplace}`} className="border-t border-border/60 align-top">
                      <td className="px-3 py-2">
                        <Badge variant={row.decision === "accepted" ? "default" : "secondary"}>
                          {decisionLabel(row.decision, it)}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 font-mono">{row.marketplace}</td>
                      <td className="max-w-[420px] px-3 py-2">
                        {row.itemWebUrl ? (
                          <a href={row.itemWebUrl} target="_blank" rel="noreferrer" className="font-medium hover:text-brand hover:underline">
                            {row.title}
                          </a>
                        ) : row.title}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                        <div>{row.price} {row.currency}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {row.shipping != null
                            ? `+ ${row.shipping} ${row.currency} ${it ? "sped." : "shipping"}`
                            : (it ? "spedizione non disponibile" : "shipping unavailable")}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <div className="font-semibold tabular-nums">
                          {row.effectiveCostEUR != null
                            ? euro(row.effectiveCostEUR)
                            : row.shippingAdjustedSubtotalEUR != null
                              ? euro(row.shippingAdjustedSubtotalEUR)
                              : euro(row.itemPriceEUR)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{costBasisLabel(row.costBasis, it)}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-[10px]">
                        {row.itemLocationCountry ?? "—"}
                        {row.shippingEstimateCountry ? ` → ${row.shippingEstimateCountry}` : ""}
                      </td>
                      <td className="px-3 py-2 font-mono text-[10px]">{row.detailLookup}</td>
                      <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">
                        {row.reasonCodes.join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.listings.length > 20 ? (
                <p className="border-t border-border/60 px-3 py-2 text-[11px] text-muted-foreground">
                  {it
                    ? `Mostrati i primi 20 di ${result.listings.length} annunci unici.`
                    : `Showing the first 20 of ${result.listings.length} unique listings.`}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background p-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background p-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  )
}
