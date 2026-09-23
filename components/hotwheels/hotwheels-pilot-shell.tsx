"use client"

import type { ReactNode } from "react"
import { AppShell } from "@/components/app-shell"

export function HotWheelsPilotShell({ children }: { children: ReactNode }) {
  return (
    <AppShell contentMode="public" vertical="hotwheels">
      {children}
    </AppShell>
  )
}
