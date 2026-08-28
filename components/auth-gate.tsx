"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import { Spinner } from "@/components/ui/spinner"

// Client-side route protection for the MVP. The store seeds a demo user so the
// app is populated on first load; only an explicit sign-out sends you here.
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthed, hydrated } = useStore()
  const router = useRouter()

  React.useEffect(() => {
    if (hydrated && !isAuthed) router.replace("/login")
  }, [hydrated, isAuthed, router])

  if (!hydrated || !isAuthed) {
    return (
      <div className="grid min-h-svh place-items-center bg-background">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    )
  }
  return <>{children}</>
}
