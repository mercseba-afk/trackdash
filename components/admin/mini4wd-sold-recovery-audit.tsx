"use client"

import * as React from "react"
import { BadgeCheck, ChartNoAxesColumnIncreasing, RefreshCw } from "lucide-react"
import { getAdminMini4wdSoldRecoveryAction } from "@/lib/actions/admin"
import type { Mini4wdSoldRecoveryReport, Mini4wdSoldRecoveryRow } from "@/lib/market/automation/sold-recovery-report"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function euro(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n)
}

function recoveryHint(row: Mini4wdSoldRecoveryRow): string {
  if (row.verificationStatus !== "verified") return "Identità dell'edizione da verificare"
  if (row.queued) return "Ricalcolo in coda"
  if (row.category === "corroboration_candidate") return "Storico corroborante da ricalcolare"
  if (row.category === "broader_sold") return "Verificare il campione"
  if (row.category === "single_sold") return "Serve un'altra prova"
  return "Verificare storico e venditori"
}

export function Mini4wdSoldRecoveryAudit({ refreshKey = 0 }: { refreshKey?: number }) {
  const [report, setReport] = React.useState<Mini4wdSoldRecoveryReport | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [reload, setReload] = React.useState(0)
  const [group, setGroup] = React.useState<"multiple" | "single">("multiple")

  React.useEffect(() => {
    let live = true
    getAdminMini4wdSoldRecoveryAction()
      .then((next) => {
        if (live) {
          setReport(next)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (live) setError(err instanceof Error ? err.message : "Audit non disponibile")
      })
      .finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [refreshKey, reload])

  const shown = (report?.rows ?? []).filter((row) => group === "single" ? row.soldUnits === 1 : row.soldUnits >= 2)

  return (
    <Card className="border-border/70">
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <ChartNoAxesColumnIncreasing className="size-4 text-brand" />
            Mini 4WD · Recupero valori da vendite concluse
          </CardTitle>
          <CardDescription className="mt-1 max-w-3xl">
            Audit automatico delle Release con vendite concluse ma senza Market Value.
            Usa i dati già archiviati, dà priorità ai campioni con più SOLD e mostra quelli
            che necessitano di ulteriori conferme. Il prezzo pubblico rimane sotto il controllo del Market Method v4.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => { setLoading(true); setReload((i) => i + 1) }}
        >
          <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} data-icon="inline-start" />
          Aggiorna audit
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error ? <p className="text-sm text-destructive">Audit non disponibile: {error}</p> : null}
        {report ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Con Market Value</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{report.withMarketValue}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">SOLD senza stima</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{report.soldWithoutValue}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Con 2–3 vendite</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{report.twoOrThreeSales}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Con una vendita</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{report.oneSale}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline"><BadgeCheck className="mr-1 size-3" />{report.corroborationCandidates} con storico promettente</Badge>
              <Badge variant="outline">{report.pendingRecomputes} ricalcoli in coda</Badge>
              <span>Copertura: {report.publicReleases} Release pubbliche</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={group === "multiple" ? "default" : "outline"} onClick={() => setGroup("multiple")}>
                Prima: 2+ SOLD ({report.rows.filter((r) => r.soldUnits >= 2).length})
              </Button>
              <Button size="sm" variant={group === "single" ? "default" : "outline"} onClick={() => setGroup("single")}>
                Poi: 1 SOLD ({report.oneSale})
              </Button>
            </div>
            <div className="max-h-80 overflow-y-auto rounded-lg border border-border/70">
              {shown.length ? shown.map((row) => (
                <div key={row.releaseId} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-3 py-3 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{row.edition}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {row.family}{row.itemNumber ? ` · Item ${row.itemNumber}` : ""} · {row.soldUnits} {row.soldUnits === 1 ? "vendita" : "vendite"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{recoveryHint(row)}</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums">≈ {euro(row.soldEUR)}</p>
                </div>
              )) : <p className="px-3 py-4 text-sm text-muted-foreground">Nessuna Release in questa categoria.</p>}
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              I prezzi SOLD qui sono riferimenti osservati, non Market Value. L'audit non crea prezzi:
              nuove prove SOLD attivano già il ricalcolo canonico tramite i trigger esistenti;
              il cron notturno elabora la coda. La ricerca di nuove vendite esterne non è automatica per tutte le fonti.
            </p>
          </>
        ) : loading ? (
          <p className="text-sm text-muted-foreground">Analisi delle vendite esistenti…</p>
        ) : !error ? (
          <p className="text-sm text-muted-foreground">Nessun dato disponibile.</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
