"use client"

import Link from "next/link"
import { Check, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export type CollectibleUiVertical = "mini4wd" | "hotwheels"

const STORAGE_KEY = "trackdash.collectible.vertical"

export function CollectibleVerticalSwitch({ active }: { active: CollectibleUiVertical }) {
  const options: Array<{ id: CollectibleUiVertical; href: string; label: string; beta?: boolean }> = [
    { id: "mini4wd", href: "/catalog", label: "Mini 4WD" },
    { id: "hotwheels", href: "/hotwheels/catalog", label: "Hot Wheels", beta: true },
  ]
  const current = options.find((option) => option.id === active) ?? options[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-white px-2.5 text-xs font-semibold text-foreground shadow-[0_1px_2px_rgba(11,26,58,0.04)] outline-none transition-colors hover:bg-brand-muted hover:text-brand focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Cambia universo da collezione"
          >
            <span className="max-w-[92px] truncate sm:max-w-none">{current.label}</span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-48">
        {options.map((option) => {
          const selected = option.id === active
          return (
            <DropdownMenuItem
              key={option.id}
              render={
                <Link
                  href={option.href}
                  onClick={() => {
                    window.localStorage.setItem(STORAGE_KEY, option.id)
                  }}
                  className="flex w-full items-center gap-2"
                >
                  <span className={cn("flex-1", selected && "font-semibold")}>{option.label}</span>
                  {option.beta ? (
                    <span className="rounded-full bg-brand/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-brand">
                      Beta
                    </span>
                  ) : null}
                  {selected ? <Check className="size-3.5 text-brand" /> : null}
                </Link>
              }
            />
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
