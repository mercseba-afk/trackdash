"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Clipboard, RefreshCw, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

type DiagnosticValue = string | number | boolean | null | undefined

type InstalledRelatedApp = {
  platform?: string
  id?: string
  url?: string
  version?: string
}

type IconCheck = {
  src: string
  sizes: string | null
  purpose: string | null
  status: number | null
  ok: boolean
  contentType: string | null
  decoded: boolean
  naturalWidth: number | null
  naturalHeight: number | null
  error: string | null
}

type DiagnosticReport = {
  generatedAt: string
  url: string
  userAgent: string
  secureContext: boolean
  standalone: boolean
  installPromptCached: boolean
  bootstrap: Record<string, DiagnosticValue>
  browser: {
    beforeInstallPromptSupported: boolean
    getInstalledRelatedAppsSupported: boolean
    installedRelatedApps: InstalledRelatedApp[]
    installedRelatedAppsError: string | null
    alreadyInstalledPwa: boolean
  }
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
    id: string | null
    name: string | null
    shortName: string | null
    startUrl: string | null
    scope: string | null
    display: string | null
    preferRelatedApplications: boolean | null
    relatedApplications: InstalledRelatedApp[]
    iconCount: number | null
    error: string | null
  }
  startUrlCheck: {
    requestedUrl: string | null
    ok: boolean
    status: number | null
    redirected: boolean | null
    finalUrl: string | null
    sameOrigin: boolean | null
    inScope: boolean | null
    contentType: string | null
    error: string | null
  }
  iconChecks: IconCheck[]
  offlineFallback: {
    ok: boolean
    status: number | null
    contentType: string | null
    error: string | null
  }
}

type TrackDashWindow = Window & {
  __trackdashInstallPrompt?: Event | null
  __trackdashPwaDiagnostics?: Record<string, DiagnosticValue>
}

type NavigatorWithRelatedApps = Navigator & {
  getInstalledRelatedApps?: () => Promise<InstalledRelatedApp[]>
}

const initialReport: DiagnosticReport = {
  generatedAt: "",
  url: "",
  userAgent: "",
  secureContext: false,
  standalone: false,
  installPromptCached: false,
  bootstrap: {},
  browser: {
    beforeInstallPromptSupported: false,
    getInstalledRelatedAppsSupported: false,
    installedRelatedApps: [],
    installedRelatedAppsError: null,
    alreadyInstalledPwa: false,
  },
  serviceWorker: {
    supported: false,
    controller: false,
    registrations: [],
  },
  manifest: {
    ok: false,
    status: null,
    id: null,
    name: null,
    shortName: null,
    startUrl: null,
    scope: null,
    display: null,
    preferRelatedApplications: null,
    relatedApplications: [],
    iconCount: null,
    error: null,
  },
  startUrlCheck: {
    requestedUrl: null,
    ok: false,
    status: null,
    redirected: null,
    finalUrl: null,
    sameOrigin: null,
    inScope: null,
    contentType: null,
    error: null,
  },
  iconChecks: [],
  offlineFallback: {
    ok: false,
    status: null,
    contentType: null,
    error: null,
  },
}

async function decodeImage(url: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image()
    const timeout = window.setTimeout(() => reject(new Error("Image decode timeout")), 8000)

    const cleanup = () => window.clearTimeout(timeout)
    image.onload = () => {
      cleanup()
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    }
    image.onerror = () => {
      cleanup()
      reject(new Error("Image decode failed"))
    }
    image.src = url
  })
}

async function inspectIcon(icon: { src?: unknown; sizes?: unknown; purpose?: unknown }): Promise<IconCheck> {
  const src = typeof icon.src === "string" ? icon.src : ""
  const sizes = typeof icon.sizes === "string" ? icon.sizes : null
  const purpose = typeof icon.purpose === "string" ? icon.purpose : null

  if (!src) {
    return {
      src,
      sizes,
      purpose,
      status: null,
      ok: false,
      contentType: null,
      decoded: false,
      naturalWidth: null,
      naturalHeight: null,
      error: "Missing icon src",
    }
  }

  const absoluteUrl = new URL(src, window.location.origin).href

  try {
    const response = await fetch(absoluteUrl, { cache: "no-store" })
    let decoded = false
    let naturalWidth: number | null = null
    let naturalHeight: number | null = null
    let decodeError: string | null = null

    if (response.ok) {
      try {
        const dimensions = await decodeImage(absoluteUrl)
        decoded = true
        naturalWidth = dimensions.width
        naturalHeight = dimensions.height
      } catch (error) {
        decodeError = String(error)
      }
    }

    return {
      src,
      sizes,
      purpose,
      status: response.status,
      ok: response.ok,
      contentType: response.headers.get("content-type"),
      decoded,
      naturalWidth,
      naturalHeight,
      error: decodeError,
    }
  } catch (error) {
    return {
      src,
      sizes,
      purpose,
      status: null,
      ok: false,
      contentType: null,
      decoded: false,
      naturalWidth: null,
      naturalHeight: null,
      error: String(error),
    }
  }
}

async function collectReport(): Promise<DiagnosticReport> {
  const trackDashWindow = window as TrackDashWindow
  const relatedAppsNavigator = navigator as NavigatorWithRelatedApps
  const serviceWorkerSupported = "serviceWorker" in navigator
  const registrations = serviceWorkerSupported ? await navigator.serviceWorker.getRegistrations() : []
  const getInstalledRelatedAppsSupported = typeof relatedAppsNavigator.getInstalledRelatedApps === "function"

  let installedRelatedApps: InstalledRelatedApp[] = []
  let installedRelatedAppsError: string | null = null
  if (getInstalledRelatedAppsSupported) {
    try {
      installedRelatedApps = await relatedAppsNavigator.getInstalledRelatedApps!()
    } catch (error) {
      installedRelatedAppsError = String(error)
    }
  }

  let manifest: DiagnosticReport["manifest"] = {
    ok: false,
    status: null,
    id: null,
    name: null,
    shortName: null,
    startUrl: null,
    scope: null,
    display: null,
    preferRelatedApplications: null,
    relatedApplications: [],
    iconCount: null,
    error: null,
  }
  let startUrlCheck = { ...initialReport.startUrlCheck }
  let iconChecks: IconCheck[] = []

  try {
    const manifestResponse = await fetch("/manifest.webmanifest", { cache: "no-store" })
    const data = manifestResponse.ok ? await manifestResponse.json() : null
    const icons = Array.isArray(data?.icons) ? data.icons.slice(0, 5) : []

    manifest = {
      ok: manifestResponse.ok,
      status: manifestResponse.status,
      id: typeof data?.id === "string" ? data.id : null,
      name: typeof data?.name === "string" ? data.name : null,
      shortName: typeof data?.short_name === "string" ? data.short_name : null,
      startUrl: typeof data?.start_url === "string" ? data.start_url : null,
      scope: typeof data?.scope === "string" ? data.scope : null,
      display: typeof data?.display === "string" ? data.display : null,
      preferRelatedApplications:
        typeof data?.prefer_related_applications === "boolean" ? data.prefer_related_applications : null,
      relatedApplications: Array.isArray(data?.related_applications)
        ? data.related_applications.map((app: InstalledRelatedApp) => ({
            platform: typeof app?.platform === "string" ? app.platform : undefined,
            id: typeof app?.id === "string" ? app.id : undefined,
            url: typeof app?.url === "string" ? app.url : undefined,
            version: typeof app?.version === "string" ? app.version : undefined,
          }))
        : [],
      iconCount: Array.isArray(data?.icons) ? data.icons.length : null,
      error: null,
    }

    if (manifest.startUrl) {
      const requestedUrl = new URL(manifest.startUrl, manifestResponse.url || window.location.origin).href
      try {
        const response = await fetch(requestedUrl, { cache: "no-store", redirect: "follow" })
        const finalUrl = response.url || requestedUrl
        const final = new URL(finalUrl)
        const scopeUrl = new URL(manifest.scope ?? "/", window.location.origin)
        startUrlCheck = {
          requestedUrl,
          ok: response.ok,
          status: response.status,
          redirected: response.redirected,
          finalUrl,
          sameOrigin: final.origin === window.location.origin,
          inScope: final.origin === scopeUrl.origin && final.pathname.startsWith(scopeUrl.pathname),
          contentType: response.headers.get("content-type"),
          error: null,
        }
      } catch (error) {
        startUrlCheck = {
          ...initialReport.startUrlCheck,
          requestedUrl,
          error: String(error),
        }
      }
    }

    iconChecks = await Promise.all(icons.map((icon: { src?: unknown; sizes?: unknown; purpose?: unknown }) => inspectIcon(icon)))
  } catch (error) {
    manifest.error = String(error)
  }

  let offlineFallback = { ...initialReport.offlineFallback }
  try {
    const response = await fetch("/offline.html", { cache: "no-store" })
    offlineFallback = {
      ok: response.ok,
      status: response.status,
      contentType: response.headers.get("content-type"),
      error: null,
    }
  } catch (error) {
    offlineFallback.error = String(error)
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
    browser: {
      beforeInstallPromptSupported: "onbeforeinstallprompt" in window,
      getInstalledRelatedAppsSupported,
      installedRelatedApps,
      installedRelatedAppsError,
      alreadyInstalledPwa: installedRelatedApps.some((app) => app.platform === "webapp"),
    },
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
    startUrlCheck,
    iconChecks,
    offlineFallback,
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
  const has192 = report.iconChecks.some(
    (icon) => icon.ok && icon.decoded && icon.naturalWidth === 192 && icon.naturalHeight === 192,
  )
  const has512 = report.iconChecks.some(
    (icon) => icon.ok && icon.decoded && icon.naturalWidth === 512 && icon.naturalHeight === 512,
  )
  const startUrlReady =
    report.startUrlCheck.ok && report.startUrlCheck.sameOrigin === true && report.startUrlCheck.inScope === true

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
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Diagnostica PWA v2</p>
        <h1 className="text-3xl font-semibold tracking-tight">Installazione TrackDash</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Controlla direttamente installazione, manifest, start URL, service worker e icone viste dal browser. Non legge dati del tuo account.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <StatusRow label="Connessione sicura HTTPS" value={report.secureContext} />
        <StatusRow label="API beforeinstallprompt esposta" value={report.browser.beforeInstallPromptSupported} />
        <StatusRow label="Service worker supportato" value={report.serviceWorker.supported} />
        <StatusRow label="Service worker registrato" value={report.serviceWorker.registrations.length > 0} />
        <StatusRow label="Service worker pronto" value={swReady} />
        <StatusRow label="Pagina controllata dal SW" value={report.serviceWorker.controller} />
        <StatusRow label="Prompt nativo ricevuto" value={promptSeen || report.installPromptCached} />
        <StatusRow label="Manifest raggiungibile" value={report.manifest.ok} />
        <StatusRow label="start_url valido e nello scope" value={startUrlReady} />
        <StatusRow label="Icona 192×192 decodificata" value={has192} />
        <StatusRow label="Icona 512×512 decodificata" value={has512} />
        <StatusRow label="Fallback offline raggiungibile" value={report.offlineFallback.ok} />
        <StatusRow label="Rilevamento PWA installata supportato" value={report.browser.getInstalledRelatedAppsSupported} />
        <StatusRow label="TrackDash risulta già installata" value={report.browser.alreadyInstalledPwa} expected={false} />
        <StatusRow label="Modalità standalone attiva" value={report.standalone} expected={report.standalone} />
      </section>

      <section className="rounded-xl border bg-card p-4">
        <h2 className="font-semibold">Manifest e avvio</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">HTTP manifest</dt><dd className="font-mono">{report.manifest.status ?? "—"}</dd></div>
          <div><dt className="text-muted-foreground">id</dt><dd className="font-mono">{report.manifest.id ?? "—"}</dd></div>
          <div><dt className="text-muted-foreground">start_url</dt><dd className="font-mono">{report.manifest.startUrl ?? "—"}</dd></div>
          <div><dt className="text-muted-foreground">scope</dt><dd className="font-mono">{report.manifest.scope ?? "—"}</dd></div>
          <div><dt className="text-muted-foreground">display</dt><dd className="font-mono">{report.manifest.display ?? "—"}</dd></div>
          <div><dt className="text-muted-foreground">icone dichiarate</dt><dd className="font-mono">{report.manifest.iconCount ?? "—"}</dd></div>
          <div><dt className="text-muted-foreground">start HTTP</dt><dd className="font-mono">{report.startUrlCheck.status ?? "—"}</dd></div>
          <div><dt className="text-muted-foreground">start finale</dt><dd className="break-all font-mono">{report.startUrlCheck.finalUrl ?? "—"}</dd></div>
        </dl>
      </section>

      <section className="rounded-xl border bg-card p-4">
        <h2 className="font-semibold">Icone viste dal browser</h2>
        <div className="mt-3 grid gap-2 text-xs">
          {report.iconChecks.length === 0 ? (
            <p className="text-muted-foreground">Nessuna icona verificata.</p>
          ) : (
            report.iconChecks.map((icon) => (
              <div key={`${icon.src}-${icon.purpose ?? "any"}`} className="rounded-lg border p-3 font-mono">
                <div className="break-all">{icon.src}</div>
                <div className="mt-1 text-muted-foreground">
                  dichiarata {icon.sizes ?? "—"} · HTTP {icon.status ?? "—"} · MIME {icon.contentType ?? "—"} · reale {icon.naturalWidth ?? "—"}×{icon.naturalHeight ?? "—"} · decode {icon.decoded ? "ok" : "no"}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Rapporto tecnico</h2>
            <p className="mt-1 text-xs text-muted-foreground">Questo rapporto include anche lo stato WebAPK rilevato da Chrome.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void copyReport()}>
            <Clipboard data-icon="inline-start" />
            {copied ? "Copiato" : "Copia"}
          </Button>
        </div>
        <pre className="mt-4 max-h-[40rem] overflow-auto whitespace-pre-wrap break-all rounded-lg bg-muted p-3 text-xs leading-5">
          {JSON.stringify(report, null, 2)}
        </pre>
      </section>
    </main>
  )
}
