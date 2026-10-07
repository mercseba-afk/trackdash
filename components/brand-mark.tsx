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
      className={cn("inline-flex items-center overflow-visible", className)}
    >
      <img
        src="/brand/trackdash-logo-official.png"
        alt="TrackDash — Collect · Track · Trade"
        className="h-[42px] w-auto max-w-[190px] object-contain sm:h-[50px] sm:max-w-[225px]"
      />
    </span>
  )
}
