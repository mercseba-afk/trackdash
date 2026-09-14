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

  const dark = tone === "invert" || (mounted && resolvedTheme === "dark")
  const src = showText
    ? dark
      ? "/brand/trackdash-logo-dark-v2.svg"
      : "/brand/trackdash-logo-light-v2.svg"
    : "/pwa/icon-v2.svg"
  const sizeClass = showText ? "w-[156px] sm:w-[184px]" : "w-[54px]"

  return (
    <span className={cn("inline-flex items-center", className)}>
      <img src={src} alt="TrackDash" className={cn(sizeClass, "h-auto object-contain")} />
    </span>
  )
}
