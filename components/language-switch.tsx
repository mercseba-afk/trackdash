"use client"

import { usePathname, useRouter } from "next/navigation"
import { useI18n, type AppLocale } from "@/lib/i18n"
import { localizePublicPath } from "@/lib/seo/catalog-paths"
import { cn } from "@/lib/utils"

export function LanguageSwitch({
  className,
}: {
  className?: string
  compact?: boolean
}) {
  const { locale, setLocale } = useI18n()
  const pathname = usePathname()
  const router = useRouter()
  const label = locale === "it" ? "Cambia lingua" : "Change language"

  const selectLocale = (next: AppLocale) => {
    if (next === locale) return

    const currentPath = pathname || "/"
    const isPublicSeoRoute =
      currentPath === "/" ||
      currentPath === "/en" ||
      currentPath === "/catalog" ||
      currentPath.startsWith("/catalog/") ||
      currentPath === "/en/catalog" ||
      currentPath.startsWith("/en/catalog/") ||
      currentPath === "/market" ||
      currentPath.startsWith("/market/") ||
      currentPath === "/en/market" ||
      currentPath.startsWith("/en/market/")

    setLocale(next)

    if (isPublicSeoRoute) {
      const nextPath = localizePublicPath(currentPath, next)
      const suffix = typeof window === "undefined" ? "" : `${window.location.search}${window.location.hash}`
      router.push(`${nextPath}${suffix}`)
    }
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
