// Real Frankfurt DB + real eBay calls through the application's existing
// targeted preview mode. A network guard independently prohibits DB writes.
import { build } from 'esbuild'
import Module from 'node:module'
import path from 'node:path'

const project = 'https://uhojhqxnzrolmnopwgpy.supabase.co'
if (process.env.VERCEL_ENV !== 'preview' || process.env.NEXT_PUBLIC_SUPABASE_URL !== project ||
    process.env.TRACKDASH_PREVIEW_EBAY_CANARY !== 'readonly' || process.env.EBAY_ENV !== 'production' ||
    process.env.EBAY_MARKET_WRITES_ENABLED !== 'false' || process.env.CRON_SECRET) throw Error('ISOLATED_READONLY_CANARY_REQUIRED')

const compiled = await build({
  stdin: { contents: 'export { runEbayActiveMarketScanForRelease } from "./lib/market/automation/ebay-worker.ts"', resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'test-server-only', setup(b) {
    b.onResolve({ filter: /^server-only$/ }, () => ({ path: 'server-only', namespace: 'test-only' }))
    b.onLoad({ filter: /.*/, namespace: 'test-only' }, () => ({ contents: '', loader: 'js' }))
  } }],
})
const filename = path.resolve('scripts/recovery/readonly-worker-bundle.cjs')
const module = new Module(filename)
module.filename = filename
module.paths = Module._nodeModulePaths(process.cwd())
module._compile(compiled.outputFiles[0].text, filename)
const originalFetch = globalThis.fetch
const counts = { databaseReads: 0, ebayRequests: 0, fxReads: 0, blockedWrites: 0 }
globalThis.fetch = async (input, options) => {
  const request = input instanceof Request ? input : null
  const url = new URL(request?.url ?? String(input))
  const method = (options?.method ?? request?.method ?? 'GET').toUpperCase()
  if (url.origin === project && method === 'GET' && url.pathname.startsWith('/rest/v1/')) counts.databaseReads++
  else if (url.origin === 'https://api.ebay.com' && ((method === 'POST' && url.pathname === '/identity/v1/oauth2/token') ||
    (method === 'GET' && url.pathname.startsWith('/buy/browse/v1/')))) {
    if (++counts.ebayRequests > 100) throw Error('CANARY_REQUEST_LIMIT')
  } else if (url.hostname === 'data-api.ecb.europa.eu' && method === 'GET') counts.fxReads++
  else { counts.blockedWrites++; throw Error('CANARY_NETWORK_BOUNDARY') }
  return originalFetch(input, options)
}
try {
  const result = await module.exports.runEbayActiveMarketScanForRelease({
    jobId: '62d024ff-4174-4b2a-a738-21f71eb8623d',
    releaseId: 'b2805fb7-cdd3-5dbf-a724-f73d54702844', mode: 'preview',
  })
  if (result.attempted !== 1 || result.succeeded !== 1 || result.failed !== 0 || result.runId !== null ||
      counts.databaseReads < 4 || counts.ebayRequests < 2 || counts.blockedWrites !== 0) throw Error('CANARY_INCOMPLETE')
  console.log(JSON.stringify({ EbayWorkerReadonlyCanary: 'PASS', releaseItemNumber: '95466', ...counts,
    found: result.results[0]?.found ?? 0, selected: result.results[0]?.selectedListings?.length ?? 0,
    databaseWrites: false, queueClaimed: false, scheduledScannerStarted: false }))
} catch (error) {
  const code = /^(?:EBAY|CANARY)_[A-Z0-9_]+$/.test(error?.message ?? '') ? error.message : 'SUPPRESSED'
  console.error(JSON.stringify({ EbayWorkerReadonlyCanary: 'FAIL', ...counts, code, databaseWrites: false }))
  process.exitCode = 1
} finally { globalThis.fetch = originalFetch }
