"use client"
import { useState } from "react"
import Image from "next/image"
import { Package } from "lucide-react"

export function SetImage({
  src,
  alt,
  eager = false,
  sizes = "(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw",
}: {
  src: string
  alt: string
  eager?: boolean
  sizes?: string
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  return (
    <div className="relative h-full min-h-40 w-full bg-white">
      {failedSrc === src ? (
        <div
          role="img"
          aria-label={alt}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400"
        >
          <Package className="size-10" aria-hidden="true" />
          <span className="text-xs">Immagine non disponibile</span>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          loading={eager ? "eager" : "lazy"}
          sizes={sizes}
          className="object-contain p-5"
          onError={() => setFailedSrc(src)}
        />
      )}
    </div>
  )
}
