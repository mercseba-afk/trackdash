"use client"
import { useState } from "react"
import Image from "next/image"
import { Package } from "lucide-react"

export function SetImage({
  src,
  alt,
  eager = false,
  thumbnail = false,
  sizes = "(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw",
}: {
  src: string
  alt: string
  eager?: boolean
  thumbnail?: boolean
  sizes?: string
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  return (
    <div className={`relative h-full w-full bg-white ${thumbnail ? "" : "min-h-40"}`}>
      {failedSrc === src ? (
        <div
          role={alt ? "img" : undefined}
          aria-label={alt || undefined}
          aria-hidden={!alt || undefined}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400"
        >
          <Package className={thumbnail ? "size-5" : "size-10"} aria-hidden="true" />
          {!thumbnail && <span className="text-xs">Immagine non disponibile</span>}
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          loading={eager ? "eager" : "lazy"}
          sizes={sizes}
          className={thumbnail ? "object-contain p-1.5" : "object-contain p-5"}
          onError={() => setFailedSrc(src)}
        />
      )}
    </div>
  )
}
