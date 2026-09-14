"use client"

import { cn } from "@/lib/utils"

export function BrandMark({
  className,
  showText = true,
  tone = "default",
}: {
  className?: string
  showText?: boolean
  tone?: "default" | "invert"
}) {
  const trackClass = tone === "invert" ? "text-white" : "text-foreground"
  const payoffClass = tone === "invert" ? "text-white/70" : "text-muted-foreground"

  if (!showText) {
    return (
      <span className={cn("inline-flex items-center", className)}>
        <img
          src="/brand/trackdash-car-b-v4.svg"
          alt="TrackDash"
          className="h-[42px] w-auto object-contain"
        />
      </span>
    )
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <img
        src="/brand/trackdash-car-b-v4.svg"
        alt=""
        aria-hidden="true"
        className="h-[38px] w-auto shrink-0 object-contain sm:h-[42px]"
      />
      <span className="flex min-w-0 flex-col justify-center leading-none">
        <span className="whitespace-nowrap text-[20px] font-black italic tracking-[-0.055em] sm:text-[22px]">
          <span className={trackClass}>Track</span>
          <span className="text-[#ff1e1e]">Dash</span>
        </span>
        <span
          className={cn(
            "mt-1 whitespace-nowrap text-[6px] font-semibold uppercase tracking-[0.08em] sm:text-[6.5px] sm:tracking-[0.1em]",
            payoffClass,
          )}
        >
          COLLECT · TRACK · TRADE
        </span>
      </span>
    </span>
  )
}
