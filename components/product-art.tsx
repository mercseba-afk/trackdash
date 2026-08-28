import type { Product } from "@/lib/types"
import { cn } from "@/lib/utils"

// Data-driven "box art" tile. The production catalog will carry real product
// photography; until then each model gets a distinctive, deterministic card
// derived from its series and chassis so the grid reads as a shelf of models
// rather than a wall of empty placeholders.

const SERIES_HUE: Record<Product["series"], number> = {
  "Racing Mini 4WD": 8,
  "Fully Cowled": 210,
  Aero: 190,
  Avante: 265,
  "Dash! Yonkuro": 35,
  "Let's & Go": 330,
  Mighty: 145,
  "Super Mini 4WD": 55,
  Classic: 20,
}

export function ProductArt({
  product,
  className,
  size = "md",
}: {
  product: Product
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const hue = SERIES_HUE[product.series] ?? 8
  const bg = `oklch(0.62 0.14 ${hue})`
  const bgDeep = `oklch(0.42 0.12 ${hue})`

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between overflow-hidden rounded-md",
        size === "sm" && "p-2",
        size === "md" && "p-3",
        size === "lg" && "p-5",
        className,
      )}
      style={{ background: `linear-gradient(140deg, ${bg}, ${bgDeep})` }}
      role="img"
      aria-label={`${product.name} box art`}
    >
      {/* track-line motif */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent 0 22px, rgba(255,255,255,0.9) 22px 24px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-8 size-24 rounded-full border-[6px] border-white/20"
      />
      <div className="relative flex items-start justify-between gap-2">
        <span
          className={cn(
            "rounded bg-black/25 px-1.5 py-0.5 font-mono font-semibold text-white",
            size === "sm" ? "text-[9px]" : "text-[10px]",
          )}
        >
          {product.chassis}
        </span>
        <span
          className={cn(
            "font-mono font-medium text-white/80",
            size === "sm" ? "text-[9px]" : "text-[10px]",
          )}
        >
          #{product.tamiyaItemNumber}
        </span>
      </div>
      <div className="relative">
        <p
          className={cn(
            "font-semibold leading-tight text-white text-balance",
            size === "sm" && "text-xs",
            size === "md" && "text-sm",
            size === "lg" && "text-xl",
          )}
        >
          {product.name}
        </p>
        {size !== "sm" && (
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-white/70">
            {product.series}
          </p>
        )}
      </div>
    </div>
  )
}
