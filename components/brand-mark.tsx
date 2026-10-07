"use client"

import { cn } from "@/lib/utils"

export function BrandMark({
  className,
  showText = true,
  tone: _tone = "default",
}: {
  className?: string
  showText?: boolean
  tone?: "default" | "invert"
}) {
  if (!showText) {
    return (
      <span className={cn("inline-flex items-center overflow-visible", className)}>
        <img
          src="/brand-car-v5"
          alt="TrackDash"
          className="h-[42px] w-auto object-contain"
        />
      </span>
    )
  }

  return (
    <span
      aria-label="TrackDash"
      className={cn(
        "inline-flex items-center gap-0.5 overflow-visible py-1",
        className,
      )}
    >
      <img
        src="/brand-car-v5"
        alt=""
        aria-hidden="true"
        className="h-[38px] w-auto shrink-0 object-contain sm:h-[42px]"
      />
      <span
        aria-hidden="true"
        className="whitespace-nowrap font-sans text-[28px] font-black italic leading-none tracking-[-0.055em] sm:text-[32px]"
      >
        <span className="text-[#086cff]">Track</span>
        <span className="text-[#ef2b2d]">Dash</span>
      </span>
    </span>
  )
}
