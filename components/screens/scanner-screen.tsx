"use client"

import * as React from "react"
import Link from "next/link"
import { Camera, CameraOff, PackageSearch, ScanBarcode, Search, Sparkles, X } from "lucide-react"
import { findByCodeInProducts, resolveRelease } from "@/lib/data/corrected-products"
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

type Match = { product: Product; releaseId?: string }
type DetectedBarcode = { rawValue: string }
type BarcodeDetectorInstance = { detect(source: CanvasImageSource): Promise<DetectedBarcode[]> }
type BarcodeDetectorConstructor = new () => BarcodeDetectorInstance

type ScannerWindow = Window & typeof globalThis & {
  BarcodeDetector?: BarcodeDetectorConstructor
}

export function ScannerScreen({ products }: { products: Product[] }) {
  const { locale } = useI18n()
  const it = locale === "it"
  const [manual, setManual] = React.useState("")
  const [result, setResult] = React.useState<Match | null>(null)
  const [notFoundCode, setNotFoundCode] = React.useState<string | null>(null)
  const [cameraActive, setCameraActive] = React.useState(false)
  const [cameraStarting, setCameraStarting] = React.useState(false)
  const [cameraError, setCameraError] = React.useState<string | null>(null)
  const productById = React.useMemo(() => new Map(products.map((product) => [product.id, product])), [products])
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const streamRef = React.useRef<MediaStream | null>(null)
  const detectorRef = React.useRef<BarcodeDetectorInstance | null>(null)
  const animationRef = React.useRef<number | null>(null)
  const detectingRef = React.useRef(false)

  const stopCamera = React.useCallback(() => {
    if (animationRef.current != null) cancelAnimationFrame(animationRef.current)
    animationRef.current = null
    detectingRef.current = false
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraActive(false)
    setCameraStarting(false)
  }, [])

  React.useEffect(() => stopCamera, [stopCamera])

  const resolveCode = React.useCallback((rawCode: string) => {
    const code = rawCode.trim()
    if (!code) return

    // Keep the tested local matcher as an identity index only. Once it finds
    // product/release IDs, hydrate every displayed field from the canonical DB
    // catalog passed by the server page.
    const byCode = findByCodeInProducts(products, code)
    if (byCode) {
      const canonicalProduct = productById.get(byCode.product.id)
      const matchedReleaseId = byCode.release?.id

      if (
        canonicalProduct &&
        (!matchedReleaseId || canonicalProduct.releases.some((release) => release.id === matchedReleaseId))
      ) {
        setResult({ product: canonicalProduct, releaseId: matchedReleaseId })
        setNotFoundCode(null)
        return
      }
    }

    const byName = products.find((product) => product.name.toLowerCase().includes(code.toLowerCase()))
    if (byName) {
      setResult({ product: byName })
      setNotFoundCode(null)
      return
    }

    setResult(null)
    setNotFoundCode(code)
  }, [productById, products])

  const scanFrame = React.useCallback(async function scanFrameLoop() {
    const video = videoRef.current
    const detector = detectorRef.current
    if (!video || !detector || !streamRef.current) return

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && !detectingRef.current) {
      detectingRef.current = true
      try {
        const codes = await detector.detect(video)
        const rawValue = codes.find((code) => code.rawValue?.trim())?.rawValue
        if (rawValue) {
          stopCamera()
          setManual(rawValue)
          resolveCode(rawValue)
          return
        }
      } catch {
        // A transient detector error should not kill the live camera session.
      } finally {
        detectingRef.current = false
      }
    }

    if (streamRef.current) animationRef.current = requestAnimationFrame(scanFrameLoop)
  }, [resolveCode, stopCamera])

  async function startCamera() {
    setResult(null)
    setNotFoundCode(null)
    setCameraError(null)
    setCameraStarting(true)

    const Detector = (window as ScannerWindow).BarcodeDetector
    if (!Detector) {
      setCameraError(it
        ? "La scansione barcode non è supportata da questo browser. Puoi comunque cercare il codice manualmente."
        : "Barcode scanning isn't supported by this browser. You can still search the code manually.")
      setCameraStarting(false)
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(it ? "Fotocamera non disponibile su questo dispositivo." : "Camera isn't available on this device.")
      setCameraStarting(false)
      return
    }

    try {
      detectorRef.current = new Detector()
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      streamRef.current = stream
      const video = videoRef.current
      if (!video) throw new Error("camera_unavailable")
      video.srcObject = stream
      await video.play()
      setCameraActive(true)
      setCameraStarting(false)
      animationRef.current = requestAnimationFrame(scanFrame)
    } catch (error) {
      stopCamera()
      const denied = error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "SecurityError")
      setCameraError(denied
        ? (it ? "Permesso fotocamera negato. Abilitalo nelle impostazioni del browser e riprova." : "Camera permission denied. Enable it in browser settings and try again.")
        : (it ? "Non riesco ad avviare la fotocamera. Usa la ricerca manuale." : "Couldn't start the camera. Use manual search instead."))
    }
  }

  function submitManual(event: React.FormEvent) {
    event.preventDefault()
    stopCamera()
    resolveCode(manual)
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
      <header className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-white via-white to-brand/5 px-5 py-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)] sm:px-7 sm:py-8">
        <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full border border-brand/10" />
        <div className="pointer-events-none absolute -right-4 top-8 size-36 rounded-full border border-brand/10" />
        <div className="relative max-w-2xl">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">Scanner</p>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            {it ? <>Trova la <span className="text-brand">Release esatta.</span></> : <>Find the <span className="text-brand">exact Release.</span></>}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {it
              ? "Inquadra il codice a barre della scatola oppure inserisci il codice articolo (Item Number). Se lo stesso codice è stato usato per più Release, TrackDash ti aiuta a scegliere quella corretta."
              : "Scan the box barcode or enter an Item Number or JAN/EAN. TrackDash keeps Releases separate even when an item number has been reused."}
          </p>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)] lg:items-start">
        <section className="flex flex-col gap-4">
          <Card className="overflow-hidden rounded-3xl border-border/70 py-0 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
            <CardContent className="relative flex aspect-[4/3] min-h-72 items-center justify-center bg-slate-950 p-0 text-white sm:aspect-video lg:min-h-[420px]">
              <video ref={videoRef} muted playsInline autoPlay className="absolute inset-0 size-full object-cover" />
              <div className="pointer-events-none absolute inset-7 sm:inset-10">
                {["left-0 top-0 border-l-[3px] border-t-[3px]", "right-0 top-0 border-r-[3px] border-t-[3px]", "left-0 bottom-0 border-l-[3px] border-b-[3px]", "right-0 bottom-0 border-r-[3px] border-b-[3px]"].map((position) => (
                  <span key={position} className={`absolute size-12 rounded-[5px] border-brand ${position}`} />
                ))}
              </div>
              {cameraActive ? <span className="pointer-events-none absolute inset-x-12 top-1/2 h-px bg-brand shadow-[0_0_18px_3px_var(--brand)]" /> : null}
              {!cameraActive ? (
                <div className="z-10 flex max-w-md flex-col items-center gap-4 px-8 text-center">
                  <span className="grid size-14 place-items-center rounded-2xl border border-white/10 bg-white/5"><ScanBarcode className="size-7 text-white/80" /></span>
                  <div>
                    <p className="font-medium">{it ? "Inquadra il codice a barre della confezione" : "Frame the barcode on the box"}</p>
                    <p className="mt-1 text-sm leading-relaxed text-white/60">{it ? "Se il codice identifica una Release univoca, TrackDash apre direttamente quella corretta." : "When the code identifies one unique Release, TrackDash opens the correct one directly."}</p>
                  </div>
                </div>
              ) : (
                <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/90 px-4 py-1.5 text-xs font-semibold text-slate-950 backdrop-blur">
                  {it ? "Cerco il codice…" : "Looking for barcode…"}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-2 sm:grid-cols-2">
            {cameraActive ? (
              <Button variant="outline" size="lg" className="sm:col-span-2" onClick={stopCamera}><CameraOff />{it ? "Chiudi fotocamera" : "Close camera"}</Button>
            ) : (
              <Button size="lg" className="sm:col-span-2 rounded-xl" onClick={() => void startCamera()} disabled={cameraStarting}><Camera />{cameraStarting ? (it ? "Avvio fotocamera…" : "Starting camera…") : (it ? "Scansiona codice a barre" : "Scan barcode")}</Button>
            )}
            {cameraError ? <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground sm:col-span-2">{cameraError}</p> : null}
          </div>
        </section>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
          <Card className="rounded-3xl border-brand/15 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <CardContent className="flex flex-col gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">{it ? "Ricerca manuale" : "Manual search"}</p>
                <h2 className="mt-1 text-lg font-semibold">{it ? "Hai già il codice?" : "Already have the code?"}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{it ? "Inserisci un codice articolo (Item Number), un codice a barre o il nome del modello." : "Enter an Item Number, barcode or model name."}</p>
              </div>
              <form onSubmit={submitManual}>
                <InputGroup className="h-12 rounded-xl">
                  <InputGroupInput inputMode="search" autoComplete="off" placeholder={it ? "Es. 95467" : "E.g. 95467"} value={manual} onChange={(event) => setManual(event.target.value)} />
                  <InputGroupAddon align="inline-end"><InputGroupButton type="submit" disabled={!manual.trim()}><Search />{it ? "Cerca" : "Search"}</InputGroupButton></InputGroupAddon>
                </InputGroup>
              </form>
              <p className="text-[11px] leading-relaxed text-muted-foreground">{it ? "Se lo stesso codice articolo è stato usato per più Release, TrackDash ti chiede di scegliere l'edizione corretta." : "If the same item number belongs to multiple Releases, TrackDash asks you to choose the correct edition."}</p>
            </CardContent>
          </Card>

          <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            {it ? "Se la fotocamera non legge il codice, puoi sempre cercare manualmente per codice articolo o nome del modello." : "If the camera cannot read the code, you can always search manually by item number or model name."}
          </div>
        </aside>
      </div>

      {notFoundCode ? (
        <Card className="rounded-2xl">
          <CardContent className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"><X className="size-4" /></span>
              <div><p className="text-sm font-medium">{it ? "Nessuna corrispondenza" : "No match"}</p><p className="text-xs text-muted-foreground">{it ? `Codice cercato: ${notFoundCode}` : `Searched code: ${notFoundCode}`}</p></div>
            </div>
            <Button variant="outline" size="sm" render={<Link href={`/support?category=model_release_request&query=${encodeURIComponent(notFoundCode)}`} />}><PackageSearch />{it ? "Richiedi inserimento" : "Request model"}</Button>
          </CardContent>
        </Card>
      ) : null}

      {result ? <ScanResult product={result.product} matchedReleaseId={result.releaseId} onScanAgain={() => { setResult(null); setNotFoundCode(null); void startCamera() }} /> : null}
    </div>
  )
}

function ScanResult({ product, matchedReleaseId, onScanAgain }: { product: Product; matchedReleaseId?: string; onScanAgain: () => void }) {
  const { locale, t } = useI18n()
  const it = locale === "it"
  const marketSignals = useMarketSignals()
  const [releaseId, setReleaseId] = React.useState(resolveRelease(product, matchedReleaseId).id)
  React.useEffect(() => setReleaseId(resolveRelease(product, matchedReleaseId).id), [product, matchedReleaseId])
  const release: ProductRelease = resolveRelease(product, releaseId)
  const marketSignal = marketSignals[release.id] ?? null
  const releaseHref = `/catalog/${product.id}/releases/${release.id}`

  return (
    <Card className="overflow-hidden rounded-3xl border-brand/30 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
      <CardContent className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-brand"><Sparkles className="size-4" /><span className="text-xs font-semibold uppercase tracking-[0.14em]">{matchedReleaseId ? (it ? "Release identificata" : "Release identified") : (it ? "Modello trovato" : "Model found")}</span></div>
        <div className="grid gap-5 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-start">
          <ProductImage product={product} release={release} className="aspect-[4/3] w-full rounded-2xl bg-muted/20" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Link href={releaseHref} className="text-xl font-semibold tracking-tight hover:text-brand">{release.editionName}</Link>
            <p className="text-sm text-muted-foreground">{product.name}</p>
            <p className="font-mono text-xs text-muted-foreground">#{release.itemNumber ?? "—"} · {release.releaseYear ?? "—"} · {release.chassis ?? "—"}</p>
            <div className="flex flex-wrap items-center gap-1.5">{(release.rarity ?? product.rarity) ? <RarityBadge rarity={(release.rarity ?? product.rarity)!} /> : null}<Badge variant="outline">{product.series}</Badge></div>
            <div className="mt-1"><MarketSignalInline signal={marketSignal} showStartingPrice /></div>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">{it ? "Release / edizione" : "Release / edition"}</span>
          <Select value={releaseId} onValueChange={(value) => value && setReleaseId(value as string)}>
            <SelectTrigger className="w-full rounded-xl"><SelectValue>{(value: string) => { const candidate = product.releases.find((item) => item.id === value); return candidate ? `${candidate.releaseYear ?? "—"} · ${releaseTypeLabel(candidate.releaseType, it)} · #${candidate.itemNumber ?? "—"}` : t("scanner.selectRelease") }}</SelectValue></SelectTrigger>
            <SelectContent>{product.releases.map((candidate) => <SelectItem key={candidate.id} value={candidate.id}>{candidate.releaseYear ?? "—"} · {releaseTypeLabel(candidate.releaseType, it)} · #{candidate.itemNumber ?? "—"}</SelectItem>)}</SelectContent>
          </Select>
          {product.hasMultipleReleases ? <p className="text-[11px] text-muted-foreground">{it ? "Controlla l'edizione prima di aggiungerla alla collezione." : "Check the edition before adding it to your collection."}</p> : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <AddToCollectionDialog product={product} defaultReleaseId={releaseId}><Button className="flex-1 rounded-xl">{t("product.addCollection")}</Button></AddToCollectionDialog>
          <AddToWishlistDialog product={product} defaultReleaseId={releaseId}><Button variant="outline" className="flex-1 rounded-xl">Wishlist</Button></AddToWishlistDialog>
          <Button variant="ghost" onClick={onScanAgain}>{it ? "Scansiona ancora" : "Scan again"}</Button>
        </div>
      </CardContent>
    </Card>
  )
}


function releaseTypeLabel(value: ProductRelease["releaseType"], it: boolean): string {
  if (!it) return value
  const labels: Record<ProductRelease["releaseType"], string> = {
    Original: "Originale",
    Reissue: "Riedizione",
    "Special Edition": "Edizione speciale",
    "Limited Edition": "Edizione limitata",
    "Anniversary Edition": "Edizione anniversario",
    "Japan Cup Edition": "Edizione Japan Cup",
    "Color Special": "Color Special",
    "Clear Body": "Carrozzeria trasparente",
    Premium: "Premium",
    "Chassis Variant": "Variante chassis",
    Other: "Altro",
  }
  return labels[value]
}
