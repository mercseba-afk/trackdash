"use client"

import * as React from "react"
import { Camera } from "lucide-react"
import { CollectionItemPhotoGallery } from "@/components/collection-item-photo-gallery"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useI18n } from "@/lib/i18n"

export function CollectionItemPhotosButton({
  collectionItemId,
  initialCount = 0,
}: {
  collectionItemId: string
  initialCount?: number
}) {
  const { locale } = useI18n()
  const it = locale === "it"
  const [open, setOpen] = React.useState(false)
  const [count, setCount] = React.useState(initialCount)

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 px-2 text-xs text-muted-foreground"
        onClick={() => setOpen(true)}
        aria-label={it ? `Foto della copia: ${count}` : `Copy photos: ${count}`}
      >
        <Camera className="size-3.5" />
        <span>{it ? "Foto" : "Photos"}{count > 0 ? ` · ${count}` : ""}</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{it ? "Foto della singola copia" : "Photos of this copy"}</DialogTitle>
            <DialogDescription>{it ? "Queste immagini appartengono a questo esemplare fisico, non alla Release generica." : "These images belong to this physical copy, not to the generic Release."}</DialogDescription>
          </DialogHeader>
          {open ? <CollectionItemPhotoGallery collectionItemId={collectionItemId} onCountChange={setCount} /> : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
