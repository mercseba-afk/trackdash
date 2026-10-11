"use client"

import * as React from "react"
import { Analytics } from "@vercel/analytics/next"
import { getAnalyticsEligibilityAction } from "@/lib/actions/analytics-eligibility"
import { useStore } from "@/lib/store"

// Defer starting Vercel Analytics until the actual Supabase identity is known.
// This prevents even the first pageview of an admin session being sent. A
// sign-in, sign-out or account switch invalidates the previous eligibility.
export function VisitorAnalytics() {
  const { user, hydrated } = useStore()
  const identity = user?.id ?? (hydrated ? "anonymous" : "pending")
  const [eligibleIdentity, setEligibleIdentity] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (identity === "pending") {
      setEligibleIdentity(null)
      return
    }
    if (identity === "anonymous") {
      setEligibleIdentity(identity)
      return
    }

    let cancelled = false
    setEligibleIdentity(null)
    getAnalyticsEligibilityAction()
      .then(({ userId, track }) => {
        if (!cancelled && userId === identity && track) setEligibleIdentity(identity)
      })
      .catch(() => {
        // Fail closed: never track an authenticated account whose
        // internal-role status cannot be verified.
        if (!cancelled) setEligibleIdentity(null)
      })
    return () => { cancelled = true }
  }, [identity])

  if (eligibleIdentity !== identity) return null
  return <Analytics />
}
