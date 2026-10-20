// Bounded real-provider test. Never imports a DB client or scanner worker.
import { searchEbayActiveListingsByQuery } from '../../lib/market/automation/ebay-browse-adapter.ts'

const expectedProject = 'https://uhojhqxnzrolmnopwgpy.supabase.co'
if (process.env.VERCEL_ENV !== 'preview' || process.env.NEXT_PUBLIC_SUPABASE_URL !== expectedProject ||
    process.env.TRACKDASH_PREVIEW_EBAY_CANARY !== 'readonly' || process.env.EBAY_ENV !== 'production' ||
    process.env.EBAY_MARKET_WRITES_ENABLED !== 'false' || process.env.CRON_SECRET) {
  throw new Error('ISOLATED_READONLY_CANARY_REQUIRED')
}
const originalFetch = globalThis.fetch
const statuses = { oauth: null, browse: null }
const calls = { oauth: 0, browse: 0 }
globalThis.fetch = async (input, options = {}) => {
  const url = new URL(String(input))
  const method = options.method ?? 'GET'
  const lane = url.origin === 'https://api.ebay.com' && method === 'POST' && url.pathname === '/identity/v1/oauth2/token'
    ? 'oauth'
    : url.origin === 'https://api.ebay.com' && method === 'GET' && url.pathname === '/buy/browse/v1/item_summary/search' && url.searchParams.get('limit') === '1'
      ? 'browse' : null
  if (!lane || ++calls[lane] > 1) throw new Error('CANARY_REQUEST_BOUNDARY')
  const response = await originalFetch(input, options)
  statuses[lane] = response.status
  return response
}
try {
  const rows = await searchEbayActiveListingsByQuery('Tamiya 18038', 'EBAY_IT', 1)
  if (statuses.oauth !== 200 || statuses.browse !== 200) throw new Error('CANARY_PROVIDER_RESPONSE')
  console.log(JSON.stringify({ EbayReadonlyCanary: 'PASS', ...statuses, parsedResults: rows.length, databaseWrites: false, scannerStarted: false }))
} catch (error) {
  const code = /^(?:EBAY|CANARY)_[A-Z0-9_]+$/.test(error?.message ?? '') ? error.message : 'SUPPRESSED'
  console.error(JSON.stringify({ EbayReadonlyCanary: 'FAIL', ...statuses, code, databaseWrites: false, scannerStarted: false }))
  process.exitCode = 1
} finally {
  globalThis.fetch = originalFetch
}
