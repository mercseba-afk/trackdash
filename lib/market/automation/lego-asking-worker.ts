import "server-only"

import { speedChampionsSets } from "@/lib/lego/catalog"
import { createAdminClient } from "@/lib/supabase/admin"
import { dedupeEbayListings, ebayBrowseConfigured, ebayScheduledMarketWritesAllowed, searchEbayActiveListingsByQuery } from "./ebay-browse-adapter"
import { classifySpeedChampionsAsking } from "./speed-champions-ebay-matcher"

export async function runLegoAskingScan() {
  if (process.env.VERCEL_ENV !== "production" || !ebayBrowseConfigured() || !ebayScheduledMarketWritesAllowed()) return
  const client = createAdminClient()
  const { data, error } = await client.rpc("trackdash_claim_lego_asking_scan").maybeSingle<{
    set_number: string
    attempted_at: string
  }>()
  if (error) throw new Error("LEGO_ASK_QUEUE_UNAVAILABLE")
  if (!data) return

  const updateJob = async (updates: Record<string, string | number | null>) => {
    const { error } = await client.from("lego_asking_queue").update(updates)
      .eq("set_number", data.set_number).eq("attempted_at", data.attempted_at)
    if (error) throw new Error("LEGO_ASK_WRITE_FAILED")
  }
  try {
    const set = speedChampionsSets.find(row => row.setNumber === data.set_number)
    if (!set) throw new Error("LEGO_ASK_UNKNOWN_SET")
    const listings = await searchEbayActiveListingsByQuery(`LEGO Speed Champions ${set.setNumber}`, "EBAY_IT", 24, {
      deliveryCountry: "IT",
      fixedPriceOnly: true,
    })
    const observedAt = new Date()
    // Persist a price sample only, with no seller details or listing URLs.
    const prices = dedupeEbayListings(listings).slice(0, 24)
      .filter(listing => listing.itemLocationCountry === "IT"
        && classifySpeedChampionsAsking(listing, set, observedAt).decision === "accepted")
      .map(listing => Math.round(listing.price * 100))
      .filter(cents => Number.isSafeInteger(cents) && cents > 0 && cents <= 2147483647)
    await updateJob({
      attempt_status: "success",
      observed_at: observedAt.toISOString().slice(0, 10),
      asking_low_cents: prices.length ? Math.min(...prices) : null,
      asking_high_cents: prices.length ? Math.max(...prices) : null,
      asking_count: prices.length,
    })
  } catch (error) {
    await updateJob({ attempt_status: "failed" })
    throw error
  }
}
