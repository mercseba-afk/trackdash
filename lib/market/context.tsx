"use client"

import * as React from "react"
import { getPublicMarketSignalsAction } from "@/lib/actions/market"
import type { ReleaseMarketSignalMap, ReleaseMarketSignalView } from "@/lib/market/view-types"

const MarketSignalsContext = React.createContext<ReleaseMarketSignalMap>({})

export function MarketSignalsProvider({
  initialSignals,
  children,
}: {
  initialSignals: ReleaseMarketSignalMap
  children: React.ReactNode
}) {
  const [signals, setSignals] = React.useState(initialSignals)
  const latestRequest = React.useRef(0)

  const refresh = React.useCallback(async () => {
    // A slower previous request must not overwrite a newer canonical snapshot.
    const requestId = ++latestRequest.current
    try {
      const next = await getPublicMarketSignalsAction()
      if (requestId === latestRequest.current) setSignals(next)
    } catch (error) {
      console.error("Failed to refresh public R3 market signals:", error)
    }
  }, [])

  React.useEffect(() => {
    const interval = window.setInterval(() => void refresh(), 60_000)
    const onFocus = () => void refresh()
    const onVisibilityChange = () => {
      // Mobile/PWA resume is not guaranteed to dispatch window focus.
      if (!document.hidden) void refresh()
    }
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => {
      ++latestRequest.current
      window.clearInterval(interval)
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [refresh])

  return <MarketSignalsContext.Provider value={signals}>{children}</MarketSignalsContext.Provider>
}

export function useMarketSignals(): ReleaseMarketSignalMap {
  return React.useContext(MarketSignalsContext)
}

export function useReleaseMarketSignal(releaseId?: string): ReleaseMarketSignalView | null {
  const signals = useMarketSignals()
  if (!releaseId) return null
  return signals[releaseId] ?? null
}
