"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import { Spinner } from "@/components/ui/spinner"

// Keep protected routes blocked until Supabase has resolved a real app user,
// but do not blank the whole app while collection/wishlist continue hydrating.
// The store sets `user` after the profile is resolved, before those heavier
// per-user datasets finish loading, so rendering as soon as `isAuthed` is true
// makes a hard refresh feel much faster without weakening route protection.
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthed, hydrated } = useStore()
  const router = useRouter()

  React.useEffect(() => {
    if (hydrated && !isAuthed) router.replace("/login")
  }, [hydrated, isAuthed, router])

  if (!isAuthed) {
    return (
      <div className="grid min-h-svh place-items-center bg-background">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    )
  }

  return <>{children}</>
}
