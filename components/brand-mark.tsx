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
      <span className={cn("inline-flex items-center", className)}>
        <img
          src="/brand-car-v5"
          alt="TrackDash"
          className="h-[42px] w-auto object-contain"
        />
      </span>
    )
  }

  return (
    <span className={cn("inline-flex items-center", className)}>
      <img
        src="/brand/trackdash-logo-v7-exact.png"
        alt="TrackDash"
        className="h-[46px] w-auto max-w-[230px] object-contain sm:h-[52px] sm:max-w-[250px]"
      />
    </span>
  )
}
