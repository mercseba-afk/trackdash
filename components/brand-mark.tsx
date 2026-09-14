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
  const payoffClass = tone === "invert" ? "text-white/75" : "text-[#0b1f3a] dark:text-white/75"

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
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      <img
        src="/brand-car-v5"
        alt=""
        aria-hidden="true"
        className="h-[40px] w-auto shrink-0 object-contain sm:h-[45px]"
      />
      <span className="relative inline-block pb-[10px] leading-none sm:pb-[11px]">
        <span className="whitespace-nowrap text-[21px] font-black italic tracking-[-0.06em] sm:text-[23px]">
          <span className="text-[#086cff] dark:text-[#2f80ff]">Track</span>
          <span className="text-[#ff1e1e] dark:text-[#ff3b3d]">Dash</span>
        </span>
        <span
          className={cn(
            "absolute inset-x-0 bottom-0 flex items-center justify-center gap-[3px] whitespace-nowrap text-[5.75px] font-bold uppercase leading-none tracking-[0.09em] sm:gap-[3.5px] sm:text-[6.25px] sm:tracking-[0.1em]",
            payoffClass,
          )}
        >
          <span>COLLECT</span>
          <span className="tracking-normal" aria-hidden="true">•</span>
          <span>TRACK</span>
          <span className="tracking-normal" aria-hidden="true">•</span>
          <span>TRADE</span>
        </span>
      </span>
    </span>
  )
}
