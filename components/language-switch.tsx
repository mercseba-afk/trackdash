"use client"

import { Languages } from "lucide-react"
import { useI18n, type AppLocale } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export function LanguageSwitch({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  const { locale, setLocale } = useI18n()
  const label = locale === "it" ? "Cambia lingua" : "Change language"

  const selectLocale = (next: AppLocale) => {
    if (next !== locale) setLocale(next)
  }

  return (
    <div
      className={cn(
        "inline-flex h-9 items-center rounded-md border border-border bg-white p-0.5 text-[11px] font-semibold shadow-[0_1px_2px_rgba(11,26,58,0.04)]",
        className,
      )}
      role="group"
      aria-label={label}
    >
      {!compact ? <Languages className="ml-1.5 size-3.5 text-muted-foreground" aria-hidden /> : null}
      {(["it", "en"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => selectLocale(option)}
          aria-pressed={locale === option}
          className={cn(
            "min-w-8 rounded-[5px] px-2 py-1.5 uppercase tracking-[0.08em] transition-colors",
            locale === option
              ? "bg-brand text-white"
              : "text-muted-foreground hover:bg-brand-muted hover:text-brand",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
