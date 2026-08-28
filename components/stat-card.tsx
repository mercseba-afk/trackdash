import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  accent,
}: {
  label: string
  value: React.ReactNode
  icon: LucideIcon
  hint?: React.ReactNode
  accent?: boolean
}) {
  return (
    <Card className={cn("gap-0 py-0", accent && "border-brand/30 bg-brand/5")}>
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <Icon className={cn("size-4", accent ? "text-brand" : "text-muted-foreground")} />
        </div>
        <span className="text-2xl font-semibold tabular-nums leading-none">{value}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </CardContent>
    </Card>
  )
}
