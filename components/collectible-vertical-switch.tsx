"use client"

import Link from "next/link"
import { LibraryBig } from "lucide-react"
import { cn } from "@/lib/utils"

export type CollectibleUiVertical = "mini4wd" | "hotwheels"

export function CollectibleVerticalSwitch({ active }: { active: CollectibleUiVertical }) {
  const options: Array<{ id: CollectibleUiVertical; href: string; label: string }> = [
    { id: "mini4wd", href: "/catalog", label: "Mini 4WD" },
    { id: "hotwheels", href: "/hotwheels/catalog", label: "Hot Wheels" },
  ]

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="hidden items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:inline-flex">
        <LibraryBig className="size-3.5" />
        Universo
      </span>
      <div className="inline-flex min-w-0 rounded-xl border border-border/70 bg-white p-1 shadow-sm">
        {options.map((option) => {
          const selected = option.id === active
          return (
            <Link
              key={option.id}
              href={option.href}
              aria-current={selected ? "page" : undefined}
              className={cn(
                "inline-flex h-8 items-center rounded-lg px-2.5 text-xs font-semibold transition-colors sm:px-3",
                selected
                  ? "bg-brand text-white shadow-sm"
                  : "text-muted-foreground hover:bg-brand-muted hover:text-navy",
              )}
            >
              {option.label}
            </Link>
          )
        })}
      </div>
      {active === "hotwheels" ? (
        <span className="hidden rounded-full border border-brand/15 bg-brand/5 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-brand sm:inline-flex">
          Beta privata
        </span>
      ) : null}
    </div>
  )
}
