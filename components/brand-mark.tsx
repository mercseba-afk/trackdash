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
      className={cn(
        "relative inline-flex h-[50px] w-[200px] shrink-0 items-center overflow-visible sm:h-[56px] sm:w-[225px]",
        className,
      )}
    >
      <img
        src="/brand/trackdash-logo-official-v2.png"
        alt="TrackDash — Collect · Track · Trade"
        className="absolute inset-0 block h-full w-full object-contain object-center"
      />
    </span>
  )
}
