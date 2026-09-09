export type ScanScope = "retail" | "active_marketplace" | "sold_research"
export type ScanActivityTier = "hot" | "normal" | "cold"

export interface ScanScheduleInput {
  scope: ScanScope
  activityTier?: ScanActivityTier
  lastMaterialChangeAt?: string | null
  stableSince?: string | null
  now: string
}

export interface ScanQueueTarget {
  id: string
  releaseId: string
  sourceId: string
  scanScope: ScanScope
  activityTier: ScanActivityTier
  priority: number
  nextScanAt: string
  enabled: boolean
  lockedUntil?: string | null
}

export interface ScanBatchLimits {
  retail: number
  active_marketplace: number
  sold_research: number
  total: number
}

export const DEFAULT_SCAN_BATCH_LIMITS: ScanBatchLimits = {
  retail: 12,
  active_marketplace: 12,
  sold_research: 6,
  total: 18,
}

const INTERVAL_HOURS: Record<ScanScope, Record<ScanActivityTier, number>> = {
  retail: {
    hot: 72,
    normal: 168,
    cold: 336,
  },
  active_marketplace: {
    hot: 72,
    normal: 168,
    cold: 336,
  },
  sold_research: {
    hot: 168,
    normal: 336,
    cold: 720,
  },
}

const DAY_MS = 86_400_000

function parseDate(value: string): number {
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) throw new Error(`Invalid date: ${value}`)
  return parsed
}

function addHours(value: string, hours: number): string {
  return new Date(parseDate(value) + hours * 3_600_000).toISOString()
}

function daysSince(value: string | null | undefined, now: string): number | null {
  if (!value) return null
  return Math.max(0, (parseDate(now) - parseDate(value)) / DAY_MS)
}

export function suggestActivityTier(input: {
  lastMaterialChangeAt?: string | null
  stableSince?: string | null
  now: string
  explicitHot?: boolean
}): ScanActivityTier {
  if (input.explicitHot) return "hot"

  const changedDays = daysSince(input.lastMaterialChangeAt, input.now)
  if (changedDays != null && changedDays <= 14) return "hot"

  const stableDays = daysSince(input.stableSince, input.now)
  if (stableDays != null && stableDays >= 60) return "cold"

  return "normal"
}

export function scanIntervalHours(scope: ScanScope, tier: ScanActivityTier): number {
  return INTERVAL_HOURS[scope][tier]
}

export function nextScanSchedule(input: ScanScheduleInput): {
  activityTier: ScanActivityTier
  intervalHours: number
  nextScanAt: string
} {
  const activityTier = input.activityTier ?? suggestActivityTier({
    lastMaterialChangeAt: input.lastMaterialChangeAt,
    stableSince: input.stableSince,
    now: input.now,
  })
  const intervalHours = scanIntervalHours(input.scope, activityTier)
  return {
    activityTier,
    intervalHours,
    nextScanAt: addHours(input.now, intervalHours),
  }
}

function isUnlocked(target: ScanQueueTarget, nowMs: number): boolean {
  return !target.lockedUntil || parseDate(target.lockedUntil) <= nowMs
}

export function selectDueScanBatch(
  targets: ScanQueueTarget[],
  now: string,
  limits: ScanBatchLimits = DEFAULT_SCAN_BATCH_LIMITS,
): ScanQueueTarget[] {
  const nowMs = parseDate(now)
  const due = targets
    .filter((target) => target.enabled)
    .filter((target) => parseDate(target.nextScanAt) <= nowMs)
    .filter((target) => isUnlocked(target, nowMs))
    .sort((a, b) => {
      const next = parseDate(a.nextScanAt) - parseDate(b.nextScanAt)
      if (next !== 0) return next
      if (a.priority !== b.priority) return b.priority - a.priority
      return a.id.localeCompare(b.id)
    })

  const used: Record<ScanScope, number> = {
    retail: 0,
    active_marketplace: 0,
    sold_research: 0,
  }
  const selected: ScanQueueTarget[] = []

  for (const target of due) {
    if (selected.length >= limits.total) break
    if (used[target.scanScope] >= limits[target.scanScope]) continue
    selected.push(target)
    used[target.scanScope] += 1
  }

  return selected
}

export function shouldEscalateHot(input: {
  priceBefore?: number | null
  priceAfter?: number | null
  availabilityBefore?: string | null
  availabilityAfter?: string | null
  newSoldEvidence?: boolean
  newActiveListing?: boolean
}): boolean {
  if (input.newSoldEvidence || input.newActiveListing) return true
  if (
    input.availabilityBefore != null &&
    input.availabilityAfter != null &&
    input.availabilityBefore !== input.availabilityAfter
  ) return true

  if (
    input.priceBefore != null &&
    input.priceAfter != null &&
    input.priceBefore > 0 &&
    input.priceAfter > 0
  ) {
    const delta = Math.abs(input.priceAfter - input.priceBefore) / input.priceBefore
    if (delta >= 0.1) return true
  }

  return false
}
