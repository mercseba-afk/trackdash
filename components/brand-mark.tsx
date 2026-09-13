"use client"

import * as React from "react"
import { useTheme } from "next-themes"
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
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  // Keep the dark artwork as the sizing reference so light/dark occupy
  // the same horizontal footprint even though the source canvases differ.
  const sizeClass = showText ? "w-[166px]" : "w-[142px]"
  const dark = tone === "invert" || (mounted && resolvedTheme === "dark")
  const src = dark ? "/brand/trackdash-logo-dark.webp" : "/brand/trackdash-logo-light.webp"

  return (
    <span className={cn("inline-flex items-center", className)}>
      <img src={src} alt="TrackDash" className={cn(sizeClass, "h-auto object-contain")} />
    </span>
  )
}
