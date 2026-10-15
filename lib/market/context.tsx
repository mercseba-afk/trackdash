"use client"

import * as React from "react"
import { getPublicMarketSignalsAction } from "@/lib/actions/market"
import type { ReleaseMarketSignalMap, ReleaseMarketSignalView } from "@/lib/market/view-types"
import { PUBLIC_MARKET_ACTIVE_POLL_MS, samePublicMarketSignals, shouldRefreshPublicMarket } from "@/lib/market/refresh-policy"
import { expirePublicMarketSignals, nextPublicMarketExpiry } from "@/lib/market/snapshot-expiry"

const MarketSignalsContext = React.createContext<ReleaseMarketSignalMap>({})

export function MarketSignalsProvider({
  initialSignals,
  children,
}: {
  initialSignals: ReleaseMarketSignalMap
  children: React.ReactNode
}) {
  const [signals, setSignals] = React.useState(() => expirePublicMarketSignals(initialSignals))
  const latestRequest = React.useRef(0)
  const lastAttemptAt = React.useRef(0)

  const refresh = React.useCallback(async () => {
    // A slower previous request must not overwrite a newer canonical snapshot.
    const requestId = ++latestRequest.current
    try {
      const next = expirePublicMarketSignals(await getPublicMarketSignalsAction())
      if (requestId === latestRequest.current) {
        setSignals((current) => samePublicMarketSignals(current, next) ? current : next)
      }
    } catch (error) {
      if (requestId === latestRequest.current) setSignals((current) => expirePublicMarketSignals(current))
      console.error("Failed to refresh public R3 market signals:", error)
    }
  }, [])

  React.useEffect(() => {
    const expiry = nextPublicMarketExpiry(signals)
    if (expiry == null) return
    let timer: number
    const schedule = () => {
      // Browsers cap timeouts at ~24.8 days; retail/history can expire later.
      timer = window.setTimeout(() => {
        if (Date.now() > expiry) setSignals((current) => expirePublicMarketSignals(current))
        else schedule()
      }, Math.min(2_147_483_647, Math.max(1, expiry - Date.now() + 1)))
    }
    schedule()
    return () => window.clearTimeout(timer)
  }, [signals])

  React.useEffect(() => {
    // The server-rendered initial map is already current. Avoid a duplicate
    // request immediately after hydration or on back-to-back focus/visibility.
    lastAttemptAt.current = Date.now()
    const requestRefresh = () => {
      const now = Date.now()
      // Expire locally even if a resumed tab is throttled or the network fails.
      setSignals((current) => expirePublicMarketSignals(current, now))
      if (!shouldRefreshPublicMarket(lastAttemptAt.current, now, document.hidden)) return
      lastAttemptAt.current = now
      void refresh()
    }
    // Background tabs/PWAs never poll. Foreground tabs retain periodic updates;
    // returning after a pause triggers refresh without waiting for the interval.
    const interval = window.setInterval(requestRefresh, PUBLIC_MARKET_ACTIVE_POLL_MS)
    window.addEventListener("focus", requestRefresh)
    document.addEventListener("visibilitychange", requestRefresh)
    return () => {
      ++latestRequest.current
      window.clearInterval(interval)
      window.removeEventListener("focus", requestRefresh)
      document.removeEventListener("visibilitychange", requestRefresh)
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
