// Standalone, bounded technical test. No database or market-pipeline imports.
import { searchEbayActiveListings, classifyEbayActiveListing, dedupeEbayListings, ebayEnvironment } from '../lib/market/automation/ebay-browse-adapter.ts'
const release = { itemNumber: '95467', editionName: 'Dyna-Hawk GX Super XX Special', releaseYear: 2019, itemNumberIsShared: false }
const rows = []
let failures = 0
try {
  console.log(JSON.stringify({ environment: ebayEnvironment(), technicalTestOnly: true, persistsData: false, itemNumber: release.itemNumber }))
  for (const marketplace of ['EBAY_IT', 'EBAY_DE', 'EBAY_GB', 'EBAY_US']) {
    try {
      const found = await searchEbayActiveListings(release, marketplace, 5)
      rows.push(...found)
      console.log(JSON.stringify({ marketplace, browse: 'OK', parsedListings: found.length }))
    } catch (error) {
      const code = error instanceof Error && /^EBAY_[A-Z_]+(?:_\d{3})?$/.test(error.message) ? error.message : 'EBAY_TEST_FAILED'
      console.log(JSON.stringify({ marketplace, browse: 'KO', code }))
      failures++
      // Do not repeat authentication/configuration failures across marketplaces.
      if (!code.startsWith('EBAY_BROWSE_HTTP_')) break
    }
  }
  const unique = dedupeEbayListings(rows)
  const counts = { accepted: 0, needs_review: 0, rejected: 0 }
  for (const row of unique) counts[classifyEbayActiveListing(row, release).decision]++
  console.log(JSON.stringify({ parsedListings: rows.length, uniqueListings: unique.length, ...counts, failures }))
  if (failures) process.exitCode = 1
} catch {
  console.log('EBAY_TEST_CONFIGURATION_INVALID')
  process.exitCode = 1
}
