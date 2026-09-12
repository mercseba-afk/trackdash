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
  const sizeClass = showText ? "h-12" : "h-10"

  if (tone === "invert") {
    return (
      <span className={cn("inline-flex items-center", className)}>
        <img
          src="/brand/trackdash-logo-dark.webp"
          alt="TrackDash"
          className={cn(sizeClass, "w-auto object-contain")}
        />
      </span>
    )
  }

  return (
    <span className={cn("inline-flex items-center", className)}>
      <img
        src="/brand/trackdash-logo-light.webp"
        alt="TrackDash"
        className={cn(sizeClass, "w-auto object-contain dark:hidden")}
      />
      <img
        src="/brand/trackdash-logo-dark.webp"
        alt="TrackDash"
        className={cn(sizeClass, "hidden w-auto object-contain dark:block")}
      />
    </span>
  )
}
