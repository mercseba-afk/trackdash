import { readFileSync } from "node:fs"
import {
  dedupeEbayListings,
  ebayEnvironment,
  ebayBrowseConfigured,
  searchEbayActiveListingsByQuery,
} from "../lib/market/automation/ebay-browse-adapter.ts"
import { classifySpeedChampionsAsking } from "../lib/market/automation/speed-champions-ebay-matcher.ts"

const [mode, setNumber, fixturePath, ...extra] = process.argv.slice(2)
const validMode = mode === "--live" && !fixturePath || mode === "--fixture" && Boolean(fixturePath)
const sets = JSON.parse(readFileSync(new URL("../lib/lego/pilot-data.json", import.meta.url), "utf8"))
const set = sets.find((entry) => entry.setNumber === setNumber)
if (!validMode || extra.length || !set) {
  console.error("Usage: node --experimental-strip-types scripts/preview-speed-champions-ebay-asking.mjs --live SET or --fixture SET LISTINGS.json")
  process.exit(2)
}

try {
  let listings
  if (mode === "--live") {
    if (!ebayBrowseConfigured()) throw new Error("EBAY_PREVIEW_CREDENTIALS_MISSING")
    listings = await searchEbayActiveListingsByQuery(`LEGO Speed Champions ${setNumber}`, "EBAY_IT", 24, {
      deliveryCountry: "IT",
      fixedPriceOnly: true,
    })
  } else {
    listings = JSON.parse(readFileSync(fixturePath, "utf8"))
    if (!Array.isArray(listings) || listings.length > 100 || listings.some(
      (row) => typeof row?.itemId !== "string" || typeof row?.title !== "string",
    )) throw new Error("INVALID_LEGO_LISTING_FIXTURE")
  }

  const asOf = new Date()
  const counts = { accepted: 0, needs_review: 0, rejected: 0 }
  const reasons = {}
  const observedItemPrices = []
  let confirmedItalyShippingQuotes = 0
  for (const listing of dedupeEbayListings(listings)) {
    const result = classifySpeedChampionsAsking(listing, set, asOf)
    counts[result.decision]++
    for (const reason of result.reasonCodes) reasons[reason] = (reasons[reason] ?? 0) + 1
    if (result.decision !== "accepted") continue
    observedItemPrices.push(listing.price)
    if (listing.shippingEstimateCountry === "IT" && Number.isFinite(listing.shipping) && listing.shipping >= 0) {
      confirmedItalyShippingQuotes++
    }
  }

  console.log(JSON.stringify({
    mode: mode === "--live" ? ebayEnvironment() : "fixture",
    setNumber,
    observedAt: asOf.toISOString(),
    evidence: "asking_price_only",
    persistsData: false,
    counts,
    reasons,
    itemPriceRangeEUR: observedItemPrices.length
      ? [Math.min(...observedItemPrices), Math.max(...observedItemPrices)]
      : null,
    confirmedItalyShippingQuotes,
  }, null, 2))
} catch (error) {
  console.error(error instanceof Error && /^(EBAY_[A-Z0-9_]+|INVALID_LEGO_LISTING_FIXTURE)$/.test(error.message)
    ? error.message : "LEGO_EBAY_PREVIEW_FAILED")
  process.exitCode = 1
}
