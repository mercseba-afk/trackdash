import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

// Shared presentation only. Price selection and evidence remain in each caller.
export function MarketPricePanelShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "w-full min-w-0 rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50/95 via-sky-50/80 to-white/90 p-3 text-left shadow-[0_5px_20px_rgba(27,88,138,0.075)] sm:p-3.5 dark:border-sky-800/50 dark:from-sky-950/45 dark:via-sky-950/30 dark:to-background",
        className,
      )}
    >
      {children}
    </div>
  )
}
