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
        "relative inline-flex h-[54px] w-[162px] shrink-0 items-center overflow-visible sm:h-[62px] sm:w-[186px]",
        className,
      )}
    >
      <img
        src="/brand/trackdash-logo-official-v4.png"
        alt="TrackDash — Collect · Track · Trade"
        className="absolute inset-0 block h-full w-full object-contain object-center"
        style={_tone === "invert" ? { filter: "drop-shadow(0 0 2px rgba(255,255,255,0.9))" } : undefined}
      />
    </span>
  )
}
