import "server-only"

import { getPublicLegoMarketSummary, PRICE_OBSERVATION_TTL_DAYS, type LegoMarketSummary } from "@/lib/lego/market"
import { createAdminClient } from "@/lib/supabase/admin"

interface LegoScanSample {
  set_number: string
  observed_at: string
  asking_low_cents: number
  asking_high_cents: number
  asking_count: number
}

// Call only after the owner-only page gate succeeds. Send aggregates to the catalog.
export async function loadLegoMarketSummaries(setNumbers: string[], asOf: string) {
  const summaries: Record<string, LegoMarketSummary> = Object.fromEntries(
    setNumbers.map(setNumber => [setNumber, getPublicLegoMarketSummary(setNumber, asOf)]),
  )
  const now = Date.parse(asOf)
  if (process.env.VERCEL_ENV !== "production" || !Number.isFinite(now) || !setNumbers.length) return summaries

  try {
    const cutoff = new Date(now - PRICE_OBSERVATION_TTL_DAYS * 86400000).toISOString().slice(0, 10)
    const { data, error } = await createAdminClient().from("lego_asking_queue")
      .select("set_number,observed_at,asking_low_cents,asking_high_cents,asking_count")
      .in("set_number", setNumbers).gte("observed_at", cutoff).gt("asking_count", 0)
      .returns<LegoScanSample[]>()
    if (error) throw error
    for (const row of data ?? []) {
      const age = now - Date.parse(row.observed_at)
      if (age < 0 || age >= PRICE_OBSERVATION_TTL_DAYS * 86400000) continue
      const previous = summaries[row.set_number]
      if (previous.observedAt && previous.observedAt > row.observed_at) continue
      summaries[row.set_number] = {
        askingLowCents: row.asking_low_cents,
        askingHighCents: row.asking_high_cents,
        askingCount: row.asking_count,
        observedAt: row.observed_at,
        condition: "Sigillato",
        automated: true,
      }
    }
  } catch {
    console.warn("[lego-market]", "LEGO_ASK_READ_UNAVAILABLE")
  }
  return summaries
}
