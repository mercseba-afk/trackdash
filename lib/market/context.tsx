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

  const refresh = React.useCallback(async () => {
    try {
      const next = await getPublicMarketSignalsAction()
      setSignals(next)
    } catch (error) {
      console.error("Failed to refresh public R3 market signals:", error)
    }
  }, [])

  React.useEffect(() => {
    const interval = window.setInterval(() => void refresh(), 60_000)
    const onFocus = () => void refresh()
    window.addEventListener("focus", onFocus)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener("focus", onFocus)
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
