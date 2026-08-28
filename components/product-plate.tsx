import type { Product, Series } from "@/lib/types"
import { cn } from "@/lib/utils"

// A deliberate "box-art plate" visual identity for each model. Real product
// photography will replace this in production; until then every product gets a
// consistent, series-coded plate driven by its chassis + item number so the
// catalog reads as an intentional design system rather than empty placeholders.

const SERIES_ACCENT: Record<Series, string> = {
  "Racing Mini 4WD": "from-brand/25 to-brand/5",
  "Fully Cowled": "from-chart-2/25 to-chart-2/5",
  Aero: "from-brand/20 to-transparent",
  Avante: "from-warning/25 to-warning/5",
  "Dash! Yonkuro": "from-success/25 to-success/5",
  "Let's & Go": "from-chart-3/25 to-chart-3/5",
  Mighty: "from-muted to-transparent",
  "Super Mini 4WD": "from-chart-4/25 to-chart-4/5",
  Classic: "from-muted to-transparent",
}

export function ProductPlate({
  product,
  className,
  size = "md",
}: {
  product: Product
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const accent = SERIES_ACCENT[product.series] ?? "from-muted to-transparent"
  return (
    <div
      className={cn(
        "relative flex aspect-4/3 w-full flex-col justify-between overflow-hidden bg-gradient-to-br p-3",
        accent,
        className,
      )}
      aria-hidden
    >
      {/* faint track-lane motif */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]">
        <div className="absolute -right-6 top-1/2 h-[2px] w-[140%] -translate-y-1/2 -rotate-12 bg-foreground" />
        <div className="absolute -right-6 top-1/2 mt-3 h-[2px] w-[140%] -translate-y-1/2 -rotate-12 bg-foreground" />
      </div>

      <div className="flex items-start justify-between gap-2">
        <span className="rounded-sm bg-foreground/85 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-background">
          {product.chassis}
        </span>
        <span className="font-mono text-[10px] text-foreground/60">#{product.tamiyaItemNumber}</span>
      </div>

      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">
          {product.series}
        </p>
        <p
          className={cn(
            "font-semibold leading-tight text-foreground text-balance",
            size === "lg" ? "text-xl" : size === "sm" ? "text-xs" : "text-sm",
          )}
        >
          {product.name}
        </p>
      </div>
    </div>
  )
}
