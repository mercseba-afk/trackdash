"use client"

import { cn } from "@/lib/utils"

export function BrandMark({
  className,
  showText: _showText = true,
  tone: _tone = "default",
}: {
  className?: string
  showText?: boolean
  tone?: "default" | "invert"
}) {
  return (
    <span
      aria-label="TrackDash"
      className={cn("inline-flex items-center overflow-visible leading-none", className)}
    >
      <img
        src="/brand/trackdash-logo-official.png"
        alt="TrackDash — Collect · Track · Trade"
        className="block h-auto w-[190px] shrink-0 object-contain sm:w-[225px]"
      />
    </span>
  )
}
