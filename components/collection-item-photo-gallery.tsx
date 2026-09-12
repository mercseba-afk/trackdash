"use client"

import * as React from "react"
import { Camera, ChevronLeft, ChevronRight, Loader2, Trash2 } from "lucide-react"
import {
  deleteCollectionItemPhotoAction,
  getCollectionItemPhotosAction,
  registerCollectionItemPhotoAction,
  reorderCollectionItemPhotosAction,
} from "@/lib/actions/collection-photos"
import {
  COLLECTION_PHOTO_BUCKET,
  MAX_COLLECTION_PHOTOS,
  type CollectionPhotoView,
} from "@/lib/collection-photos"
import { createClient } from "@/lib/supabase/client"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

const MAX_SOURCE_BYTES = 12 * 1024 * 1024
const MAX_EDGE = 1600

async function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Unsupported image format"))
    }
    image.src = url
  })
}

async function compressPhoto(file: File) {
  if (file.size > MAX_SOURCE_BYTES) throw new Error("Image too large")
  if (!file.type.startsWith("image/")) throw new Error("Invalid image")

  const image = await loadImage(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Image processing unavailable")
  context.drawImage(image, 0, 0, width, height)

  const webp = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82))
  if (webp) return { blob: webp, extension: "webp", contentType: "image/webp" }

  const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.84))
  if (!jpeg) throw new Error("Image processing failed")
  return { blob: jpeg, extension: "jpg", contentType: "image/jpeg" }
}

export function CollectionItemPhotoGallery({
  collectionItemId,
  onCountChange,
}: {
  collectionItemId: string
  onCountChange?: (count: number) => void
}) {
  const { user } = useStore()
  const { locale } = useI18n()
  const it = locale === "it"
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = React.useState<CollectionPhotoView[]>([])
  const [loading, setLoading] = React.useState(true)
  const [busy, setBusy] = React.useState(false)

  const refresh = React.useCallback(async () => {
    setLoading(true)
    try {
      const rows = await getCollectionItemPhotosAction(collectionItemId)
      setPhotos(rows)
      onCountChange?.(rows.length)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (it ? "Impossibile caricare le foto." : "Couldn't load photos."))
    } finally {
      setLoading(false)
    }
  }, [collectionItemId, it, onCountChange])

  React.useEffect(() => { void refresh() }, [refresh])

  async function addFiles(files: FileList | null) {
    if (!files?.length || !user) return
    const available = MAX_COLLECTION_PHOTOS - photos.length
    if (available <= 0) {
      toast.error(it ? "Puoi caricare al massimo 5 foto per copia." : "You can upload at most 5 photos per copy.")
      return
    }

    const selected = [...files].slice(0, available)
    setBusy(true)
    try {
      const supabase = createClient()
      for (const file of selected) {
        const processed = await compressPhoto(file)
        const path = `${user.id}/${collectionItemId}/${crypto.randomUUID()}.${processed.extension}`
        const { error: uploadError } = await supabase.storage
          .from(COLLECTION_PHOTO_BUCKET)
          .upload(path, processed.blob, { contentType: processed.contentType, upsert: false, cacheControl: "3600" })
        if (uploadError) throw new Error(uploadError.message)

        try {
          await registerCollectionItemPhotoAction(collectionItemId, path)
        } catch (error) {
          await supabase.storage.from(COLLECTION_PHOTO_BUCKET).remove([path])
          throw error
        }
      }
      await refresh()
      toast.success(it ? "Foto aggiunte." : "Photos added.")
    } catch (error) {
      toast.error(error instanceof Error
        ? (error.message === "Unsupported image format" ? (it ? "Formato immagine non supportato. Usa JPG, PNG o WebP." : "Unsupported image format. Use JPG, PNG or WebP.") : error.message)
        : (it ? "Caricamento non riuscito." : "Upload failed."))
    } finally {
      if (inputRef.current) inputRef.current.value = ""
      setBusy(false)
    }
  }

  async function remove(photo: CollectionPhotoView) {
    setBusy(true)
    try {
      await deleteCollectionItemPhotoAction(photo.id)
      const next = photos.filter((row) => row.id !== photo.id).map((row, position) => ({ ...row, position }))
      setPhotos(next)
      onCountChange?.(next.length)
      toast.success(it ? "Foto eliminata." : "Photo deleted.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (it ? "Impossibile eliminare la foto." : "Couldn't delete photo."))
    } finally {
      setBusy(false)
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= photos.length || busy) return
    const next = [...photos]
    ;[next[index], next[target]] = [next[target], next[index]]
    setPhotos(next.map((row, position) => ({ ...row, position })))
    setBusy(true)
    try {
      await reorderCollectionItemPhotosAction(collectionItemId, next.map((row) => row.id))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (it ? "Impossibile riordinare le foto." : "Couldn't reorder photos."))
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{it ? "Foto della tua copia" : "Photos of your copy"}</p>
          <p className="text-xs text-muted-foreground">{it ? "Fino a 5. La prima è la principale; diventano visibili agli acquirenti solo quando la copia è aperta a offerte." : "Up to 5. The first is the main photo; buyers can see them only when this copy is open to offers."}</p>
        </div>
        <Badge variant="secondary">{photos.length}/{MAX_COLLECTION_PHOTOS}</Badge>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-xs text-muted-foreground"><Loader2 className="size-4 animate-spin" />{it ? "Caricamento foto…" : "Loading photos…"}</div>
      ) : photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {photos.map((photo, index) => (
            <div key={photo.id} className="group relative overflow-hidden rounded-lg border bg-muted/30">
              <img src={photo.signedUrl} alt={it ? `Foto copia ${index + 1}` : `Copy photo ${index + 1}`} className="aspect-[4/3] w-full object-cover" />
              {index === 0 ? <Badge className="absolute left-2 top-2 text-[10px]">{it ? "Principale" : "Main"}</Badge> : null}
              <div className="flex items-center justify-between gap-1 border-t bg-background/95 p-1">
                <div className="flex gap-0.5">
                  <Button type="button" variant="ghost" size="icon" className="size-7" disabled={busy || index === 0} onClick={() => void move(index, -1)} aria-label={it ? "Sposta prima" : "Move earlier"}><ChevronLeft className="size-3.5" /></Button>
                  <Button type="button" variant="ghost" size="icon" className="size-7" disabled={busy || index === photos.length - 1} onClick={() => void move(index, 1)} aria-label={it ? "Sposta dopo" : "Move later"}><ChevronRight className="size-3.5" /></Button>
                </div>
                <Button type="button" variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" disabled={busy} onClick={() => void remove(photo)} aria-label={it ? "Elimina foto" : "Delete photo"}><Trash2 className="size-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">{it ? "Nessuna foto reale per questa copia." : "No real photos for this copy yet."}</div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        multiple
        className="hidden"
        onChange={(event) => void addFiles(event.target.files)}
      />
      <Button type="button" variant="outline" disabled={busy || photos.length >= MAX_COLLECTION_PHOTOS} onClick={() => inputRef.current?.click()}>
        {busy ? <Loader2 className="animate-spin" /> : <Camera />}
        {photos.length === 0 ? (it ? "Aggiungi foto" : "Add photos") : (it ? "Aggiungi altre foto" : "Add more photos")}
      </Button>
      <p className="text-[11px] text-muted-foreground">{it ? "Le immagini vengono ridimensionate sul dispositivo prima dell'upload per mantenere TrackDash leggero." : "Images are resized on-device before upload to keep TrackDash lightweight."}</p>
    </div>
  )
}
