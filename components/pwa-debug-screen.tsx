"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Clipboard, RefreshCw, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

type DiagnosticValue = string | number | boolean | null | undefined

type DiagnosticReport = {
  generatedAt: string
  url: string
  userAgent: string
  secureContext: boolean
  standalone: boolean
  installPromptCached: boolean
  bootstrap: Record<string, DiagnosticValue>
  serviceWorker: {
    supported: boolean
    controller: boolean
    registrations: Array<{
      scope: string
      active: string | null
      waiting: string | null
      installing: string | null
    }>
  }
  manifest: {
    ok: boolean
    status: number | null
    startUrl: string | null
    scope: string | null
    display: string | null
    iconCount: number | null
    error: string | null
  }
}

type TrackDashWindow = Window & {
  __trackdashInstallPrompt?: Event | null
  __trackdashPwaDiagnostics?: Record<string, DiagnosticValue>
}

const initialReport: DiagnosticReport = {
  generatedAt: "",
  url: "",
  userAgent: "",
  secureContext: false,
  standalone: false,
  installPromptCached: false,
  bootstrap: {},
  serviceWorker: {
    supported: false,
    controller: false,
    registrations: [],
  },
  manifest: {
    ok: false,
    status: null,
    startUrl: null,
    scope: null,
    display: null,
    iconCount: null,
    error: null,
  },
}

async function collectReport(): Promise<DiagnosticReport> {
  const trackDashWindow = window as TrackDashWindow
  const serviceWorkerSupported = "serviceWorker" in navigator
  const registrations = serviceWorkerSupported ? await navigator.serviceWorker.getRegistrations() : []

  let manifest: DiagnosticReport["manifest"] = {
    ok: false,
    status: null,
    startUrl: null,
    scope: null,
    display: null,
    iconCount: null,
    error: null,
  }

  try {
    const response = await fetch("/manifest.webmanifest", { cache: "no-store" })
    const data = response.ok ? await response.json() : null
    manifest = {
      ok: response.ok,
      status: response.status,
      startUrl: typeof data?.start_url === "string" ? data.start_url : null,
      scope: typeof data?.scope === "string" ? data.scope : null,
      display: typeof data?.display === "string" ? data.display : null,
      iconCount: Array.isArray(data?.icons) ? data.icons.length : null,
      error: null,
    }
  } catch (error) {
    manifest.error = String(error)
  }

  return {
    generatedAt: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    secureContext: window.isSecureContext,
    standalone:
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
    installPromptCached: Boolean(trackDashWindow.__trackdashInstallPrompt),
    bootstrap: { ...(trackDashWindow.__trackdashPwaDiagnostics ?? {}) },
    serviceWorker: {
      supported: serviceWorkerSupported,
      controller: Boolean(serviceWorkerSupported && navigator.serviceWorker.controller),
      registrations: registrations.map((registration) => ({
        scope: registration.scope,
        active: registration.active?.state ?? null,
        waiting: registration.waiting?.state ?? null,
        installing: registration.installing?.state ?? null,
      })),
    },
    manifest,
  }
}

function StatusRow({ label, value, expected = true }: { label: string; value: boolean; expected?: boolean }) {
  const ok = value === expected
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 font-medium">
        {ok ? <CheckCircle2 className="size-4 text-emerald-600" /> : <XCircle className="size-4 text-destructive" />}
        {value ? "Sì" : "No"}
      </span>
    </div>
  )
}

export function PwaDebugScreen() {
  const [report, setReport] = React.useState<DiagnosticReport>(initialReport)
  const [loading, setLoading] = React.useState(true)
  const [copied, setCopied] = React.useState(false)

  const refresh = React.useCallback(async () => {
    setLoading(true)
    try {
      setReport(await collectReport())
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void refresh()

    const handleStateChange = () => void refresh()
    window.addEventListener("trackdash:pwa-state-change", handleStateChange)
    window.addEventListener("trackdash:pwa-available", handleStateChange)
    return () => {
      window.removeEventListener("trackdash:pwa-state-change", handleStateChange)
      window.removeEventListener("trackdash:pwa-available", handleStateChange)
    }
  }, [refresh])

  const copyReport = async () => {
    await navigator.clipboard.writeText(JSON.stringify(report, null, 2))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  const promptSeen = Boolean(report.bootstrap.beforeInstallPromptSeen)
  const swReady = Boolean(report.bootstrap.serviceWorkerReady)

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" render={<Link href="/" />}>
          <ArrowLeft data-icon="inline-start" />
          TrackDash
        </Button>
        <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
          <RefreshCw data-icon="inline-start" className={loading ? "animate-spin" : undefined} />
          Aggiorna
        </Button>
      </div>

      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Diagnostica PWA</p>
        <h1 className="text-3xl font-semibold tracking-tight">Installazione TrackDash</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Questa pagina controlla direttamente ciò che il browser vede sul dispositivo. Non contiene dati del tuo account.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <StatusRow label="Connessione sicura HTTPS" value={report.secureContext} />
        <StatusRow label="Service worker supportato" value={report.serviceWorker.supported} />
        <StatusRow label="Service worker registrato" value={report.serviceWorker.registrations.length > 0} />
        <StatusRow label="Service worker pronto" value={swReady} />
        <StatusRow label="Pagina controllata dal SW" value={report.serviceWorker.controller} />
        <StatusRow label="Prompt nativo ricevuto" value={promptSeen || report.installPromptCached} />
        <StatusRow label="Manifest raggiungibile" value={report.manifest.ok} />
        <StatusRow label="Modalità standalone attiva" value={report.standalone} expected={report.standalone} />
      </section>

      <section className="rounded-xl border bg-card p-4">
        <h2 className="font-semibold">Manifest</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">HTTP</dt><dd className="font-mono">{report.manifest.status ?? "—"}</dd></div>
          <div><dt className="text-muted-foreground">start_url</dt><dd className="font-mono">{report.manifest.startUrl ?? "—"}</dd></div>
          <div><dt className="text-muted-foreground">scope</dt><dd className="font-mono">{report.manifest.scope ?? "—"}</dd></div>
          <div><dt className="text-muted-foreground">display</dt><dd className="font-mono">{report.manifest.display ?? "—"}</dd></div>
          <div><dt className="text-muted-foreground">icone dichiarate</dt><dd className="font-mono">{report.manifest.iconCount ?? "—"}</dd></div>
        </dl>
      </section>

      <section className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Rapporto tecnico</h2>
            <p className="mt-1 text-xs text-muted-foreground">Se l'installazione non compare, questo è il dato utile da condividere.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void copyReport()}>
            <Clipboard data-icon="inline-start" />
            {copied ? "Copiato" : "Copia"}
          </Button>
        </div>
        <pre className="mt-4 max-h-[34rem] overflow-auto whitespace-pre-wrap break-all rounded-lg bg-muted p-3 text-xs leading-5">
          {JSON.stringify(report, null, 2)}
        </pre>
      </section>
    </main>
  )
}
