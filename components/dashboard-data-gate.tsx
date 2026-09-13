"use client"

import * as React from "react"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import { Spinner } from "@/components/ui/spinner"

export function DashboardDataGate({ children }: { children: React.ReactNode }) {
  const { hydrated } = useStore()
  const { locale } = useI18n()

  if (!hydrated) {
    return (
      <div className="flex min-h-[42vh] items-center justify-center" aria-live="polite">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="size-4" />
          {locale === "it" ? "Caricamento del garage…" : "Loading your garage…"}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
