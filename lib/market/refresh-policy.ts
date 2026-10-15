import type { ReleaseMarketSignalMap } from "./view-types"

// Public market context is already server-bootstrapped. A tab that's sitting
// open does not need to refetch the complete Release map every 60 seconds;
// switching back to a tab/PWA should still refresh promptly.
export const PUBLIC_MARKET_ACTIVE_POLL_MS = 120_000
export const PUBLIC_MARKET_MIN_REFRESH_GAP_MS = 60_000

export function shouldRefreshPublicMarket(
  lastAttemptAt: number,
  now: number,
  hidden: boolean,
): boolean {
  return !hidden &&
    Number.isFinite(now) &&
    Number.isFinite(lastAttemptAt) &&
    now - lastAttemptAt >= PUBLIC_MARKET_MIN_REFRESH_GAP_MS
}

/** Avoid re-rendering every market consumer when the public projection hasn't changed. */
export function samePublicMarketSignals(
  current: ReleaseMarketSignalMap,
  next: ReleaseMarketSignalMap,
): boolean {
  if (current === next) return true
  const ids = Object.keys(current)
  if (ids.length !== Object.keys(next).length) return false
  for (const id of ids) {
    if (!Object.prototype.hasOwnProperty.call(next, id)) return false
    // Stringifying the public projection checks SOLD/ASK/MV/trend, timestamps
    // and TTL-driven disappearance alike; checking only computedAt is unsafe.
    if (JSON.stringify(current[id]) !== JSON.stringify(next[id])) return false
  }
  return true
}
