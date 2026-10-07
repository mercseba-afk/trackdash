"use client"

import { TRACKDASH_LOGO_EXACT_DATA_URI } from "@/lib/brand/trackdash-logo-exact"
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
      className={cn(
        "relative inline-flex aspect-[964/254] w-[200px] shrink-0 items-center overflow-visible sm:w-[225px]",
        className,
      )}
    >
      <img
        src={TRACKDASH_LOGO_EXACT_DATA_URI}
        alt="TrackDash — Collect · Track · Trade"
        className="absolute inset-0 block h-full w-full object-contain object-center"
      />
    </span>
  )
}
