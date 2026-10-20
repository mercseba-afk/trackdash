"use client"

import * as React from "react"
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next"
import { getAnalyticsEligibilityAction } from "@/lib/actions/analytics-eligibility"
import { useStore } from "@/lib/store"

// Wait for Supabase identity and the server-side app_admins check before
// injecting Vercel Analytics. This prevents the first admin pageview.
export function VisitorAnalytics() {
  const { user, hydrated } = useStore()
  const identity = user?.id ?? (hydrated ? "anonymous" : "pending")
  const [eligibleIdentity, setEligibleIdentity] = React.useState<string | null>(null)
  const [hasStarted, setHasStarted] = React.useState(false)

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
        // Fail closed if the internal role cannot be verified.
        if (!cancelled) setEligibleIdentity(null)
      })
    return () => { cancelled = true }
  }, [identity])

  const eligible = identity !== "pending" && eligibleIdentity === identity
  const eligibleRef = React.useRef(false)
  eligibleRef.current = eligible

  // The Vercel script persists in document.head after a React unmount.
  // Keep one stable beforeSend guard installed for the lifetime of the tab,
  // so a visitor who later signs in as an admin is no longer counted.
  const beforeSend = React.useCallback((event: BeforeSendEvent) => {
    return eligibleRef.current ? event : null
  }, [])

  React.useEffect(() => {
    if (eligible) setHasStarted(true)
  }, [eligible])

  if (!hasStarted && !eligible) return null
  return <Analytics beforeSend={beforeSend} />
}
