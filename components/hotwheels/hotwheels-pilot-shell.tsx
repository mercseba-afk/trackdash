"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { BrandMark } from "@/components/brand-mark"
import { LanguageSwitch } from "@/components/language-switch"
import { useI18n } from "@/lib/i18n"

export function HotWheelsPilotShell({ children }: { children: ReactNode }) {
  const { locale } = useI18n()
  const it = locale === "it"

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 md:h-[72px] md:px-6 lg:px-8">
          <Link href="/hotwheels/catalog" className="inline-flex items-center gap-3">
            <BrandMark />
            <span className="hidden rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground sm:inline-flex">
              {it ? "Pilot Hot Wheels" : "Hot Wheels pilot"}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-1 text-sm font-semibold sm:gap-2">
              <Link href="/catalog" className="rounded-lg px-2.5 py-2 text-muted-foreground transition hover:bg-muted hover:text-foreground sm:px-3">
                Mini 4WD
              </Link>
              <Link href="/hotwheels/catalog" className="rounded-lg bg-brand-muted px-2.5 py-2 text-brand sm:px-3">
                Hot Wheels
              </Link>
            </nav>
            <LanguageSwitch compact />
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
