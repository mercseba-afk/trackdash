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
  const invert = tone === "invert"
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        aria-hidden
        className="relative grid size-8 shrink-0 place-items-center rounded-md bg-brand text-brand-foreground"
      >
        <span className="absolute inset-x-1 top-1 h-px bg-brand-foreground/50" />
        <span className="font-mono text-[11px] font-bold tracking-tight">4WD</span>
      </span>
      {showText && (
        <span className="flex flex-col leading-none">
          <span className="font-mono text-sm font-bold tracking-tight">MINI 4WD</span>
          <span
            className={cn(
              "text-[10px] font-medium uppercase tracking-[0.2em]",
              invert ? "text-background/60" : "text-muted-foreground",
            )}
          >
            Collector
          </span>
        </span>
      )}
    </div>
  )
}
