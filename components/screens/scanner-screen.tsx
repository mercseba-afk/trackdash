"use client"

import * as React from "react"
import Link from "next/link"
import { Camera, CameraOff, PackageSearch, ScanBarcode, Search, Sparkles, X } from "lucide-react"
import { PRODUCTS, findByCode, resolveRelease } from "@/lib/data/corrected-products"
import { useI18n } from "@/lib/i18n"
import { useMarketSignals } from "@/lib/market/context"
import type { Product, ProductRelease } from "@/lib/types"
import { ProductImage } from "@/components/catalog/product-image"
import { RarityBadge } from "@/components/market-bits"
import { MarketSignalInline } from "@/components/market-signal-inline"
import { AddToCollectionDialog, AddToWishlistDialog } from "@/components/add-item-dialogs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

export function ScannerScreen() {
  const { locale } = useI18n()
  const it = locale === "it"
  const [manual, setManual] = React.useState("")
  const [result, setResult] = React.useState<Match | null>(null)
  const [notFoundCode, setNotFoundCode] = React.useState<string | null>(null)
  const [cameraActive, setCameraActive] = React.useState(false)
  const [cameraStarting, setCameraStarting] = React.useState(false)
  const [cameraError, setCameraError] = React.useState<string | null>(null)
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
    const byCode = findByCode(code)
    if (byCode) {
      setResult({ product: byCode.product, releaseId: byCode.release?.id })
      setNotFoundCode(null)
      return
    }

    const byName = PRODUCTS.find((product) => product.name.toLowerCase().includes(code.toLowerCase()))
    if (byName) {
      setResult({ product: byName })
      setNotFoundCode(null)
      return
    }

    setResult(null)
    setNotFoundCode(code)
  }, [])

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
        ? "La scansione barcode non è supportata da questo browser. Puoi comunque cercare il codice qui sopra."
        : "Barcode scanning isn't supported by this browser. You can still search the code above.")
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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      })
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
        : (it ? "Non riesco ad avviare la fotocamera. Usa la ricerca per codice." : "Couldn't start the camera. Use code search instead."))
    }
  }

  function submitManual(event: React.FormEvent) {
    event.preventDefault()
    stopCamera()
    resolveCode(manual)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{it ? "Trova un modello" : "Find a model"}</h1>
        <p className="text-sm text-muted-foreground">
          {it ? "Cerca subito per codice articolo oppure inquadra il barcode della scatola." : "Search by item number or scan the barcode on the box."}
        </p>
      </div>

      <Card className="border-brand/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Search className="size-4 text-brand" />{it ? "Cerca per codice" : "Search by code"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <form onSubmit={submitManual}>
            <InputGroup className="h-12">
              <InputGroupInput
                inputMode="search"
                autoComplete="off"
                placeholder={it ? "Codice articolo o barcode, es. 95467" : "Item number or barcode, e.g. 95467"}
                value={manual}
                onChange={(event) => setManual(event.target.value)}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton type="submit" disabled={!manual.trim()}>{it ? "Cerca" : "Search"}</InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </form>
          <p className="text-xs text-muted-foreground">
            {it ? "Accetta item number TrackDash e barcode JAN/EAN presenti nel catalogo." : "Accepts TrackDash item numbers and JAN/EAN barcodes in the catalog."}
          </p>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span className="h-px flex-1 bg-border" /><span>{it ? "oppure" : "or"}</span><span className="h-px flex-1 bg-border" />
      </div>

      <Card className="overflow-hidden py-0">
        <CardContent className="relative flex aspect-video min-h-52 items-center justify-center bg-foreground/95 p-0 text-background">
          <video ref={videoRef} muted playsInline autoPlay className="absolute inset-0 size-full object-cover" />
          <div className="pointer-events-none absolute inset-6 rounded-lg">
            {["left-0 top-0 border-l-2 border-t-2", "right-0 top-0 border-r-2 border-t-2", "left-0 bottom-0 border-l-2 border-b-2", "right-0 bottom-0 border-r-2 border-b-2"].map((position) => (
              <span key={position} className={`absolute size-8 rounded-[3px] border-brand ${position}`} />
            ))}
          </div>
          {cameraActive ? <span className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 bg-brand shadow-[0_0_14px_2px_var(--brand)]" /> : null}
          {!cameraActive ? (
            <div className="z-10 flex max-w-sm flex-col items-center gap-3 px-6 text-center">
              <ScanBarcode className="size-10 text-background/75" />
              <p className="text-sm text-background/75">
                {it ? "Inquadra il barcode della confezione: TrackDash proverà a identificare la Release esatta." : "Frame the box barcode and TrackDash will try to identify the exact Release."}
              </p>
            </div>
          ) : (
            <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-background/85 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
              {it ? "Cerco il barcode…" : "Looking for barcode…"}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-2">
        {cameraActive ? (
          <Button variant="outline" size="lg" onClick={stopCamera}><CameraOff />{it ? "Chiudi fotocamera" : "Close camera"}</Button>
        ) : (
          <Button size="lg" onClick={() => void startCamera()} disabled={cameraStarting}><Camera />{cameraStarting ? (it ? "Avvio fotocamera…" : "Starting camera…") : (it ? "Scansiona barcode" : "Scan barcode")}</Button>
        )}
        {cameraError ? <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">{cameraError}</p> : null}
        <p className="text-center text-[11px] text-muted-foreground">
          {it ? "Riconoscimento del modello dalla sola immagine: previsto in una fase successiva." : "Image-only model recognition is planned for a later phase."}
        </p>
      </div>

      {notFoundCode ? (
        <Card>
          <CardContent className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"><X className="size-4" /></span>
              <div><p className="text-sm font-medium">{it ? "Nessuna corrispondenza" : "No match"}</p><p className="text-xs text-muted-foreground">{it ? `Codice cercato: ${notFoundCode}` : `Searched code: ${notFoundCode}`}</p></div>
            </div>
            <Button variant="outline" size="sm" render={<Link href={`/support?category=model_release_request&query=${encodeURIComponent(notFoundCode)}`} />}>
              <PackageSearch />{it ? "Richiedi inserimento" : "Request model"}
            </Button>
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
    <Card className="border-brand/40">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-brand"><Sparkles className="size-4" /><span className="text-sm font-medium">{matchedReleaseId ? (it ? "Release identificata" : "Release identified") : (it ? "Modello trovato" : "Model found")}</span></div>
        <div className="flex gap-4">
          <ProductImage product={product} release={release} className="h-24 w-36 shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Link href={releaseHref} className="font-semibold leading-tight hover:text-brand">{release.editionName}</Link>
            <p className="text-xs text-muted-foreground">{it ? "Modello" : "Model"}: <Link href={`/catalog/${product.id}`} className="hover:text-foreground">{product.name}</Link></p>
            <p className="text-xs text-muted-foreground">#{release.itemNumber ?? "—"} · {release.chassis ?? "—"} · {release.releaseYear ?? "—"}</p>
            <div className="flex flex-wrap items-center gap-1.5"><RarityBadge rarity={release.rarity ?? product.rarity} /><Badge variant="outline">{product.series}</Badge></div>
            <div className="mt-1"><MarketSignalInline signal={marketSignal} showStartingPrice /></div>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">{it ? "Release / edizione" : "Release / edition"}</span>
          <Select value={releaseId} onValueChange={(value) => value && setReleaseId(value as string)}>
            <SelectTrigger className="w-full"><SelectValue>{(value: string) => { const candidate = product.releases.find((item) => item.id === value); return candidate ? `${candidate.releaseYear ?? "—"} · ${candidate.releaseType} · #${candidate.itemNumber ?? "—"}` : t("scanner.selectRelease") }}</SelectValue></SelectTrigger>
            <SelectContent>{product.releases.map((candidate) => <SelectItem key={candidate.id} value={candidate.id}>{candidate.releaseYear ?? "—"} · {candidate.releaseType} · #{candidate.itemNumber ?? "—"}</SelectItem>)}</SelectContent>
          </Select>
          {product.hasMultipleReleases ? <p className="text-[11px] text-muted-foreground">{it ? "Controlla l'edizione prima di aggiungerla alla collezione." : "Check the edition before adding it to your collection."}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <AddToCollectionDialog product={product} defaultReleaseId={releaseId}><Button className="flex-1">{t("product.addCollection")}</Button></AddToCollectionDialog>
          <AddToWishlistDialog product={product} defaultReleaseId={releaseId}><Button variant="outline" className="flex-1">{it ? "Wishlist" : "Wishlist"}</Button></AddToWishlistDialog>
          <Button variant="ghost" onClick={onScanAgain}>{it ? "Scansiona ancora" : "Scan again"}</Button>
        </div>
      </CardContent>
    </Card>
  )
}
