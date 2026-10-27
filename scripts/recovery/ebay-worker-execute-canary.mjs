// One persisted application-worker scan, only after an independently checked source freeze.
import {build} from 'esbuild'
import Module from 'node:module'
import path from 'node:path'

const project = 'https://uhojhqxnzrolmnopwgpy.supabase.co'
const frozenAt = Date.parse(process.env.TRACKDASH_CUTOVER_SOURCE_FROZEN_AT ?? '')
const age = Date.now() - frozenAt
if(process.env.VERCEL_ENV !== 'production' || process.env.NEXT_PUBLIC_SUPABASE_URL !== project ||
 process.env.TRACKDASH_CUTOVER_RUN_ONE_SCAN !== 'yes' || !Number.isFinite(age) || age < 0 || age > 30*60*1000 ||
 process.env.EBAY_ENV !== 'production' || process.env.EBAY_MARKET_WRITES_ENABLED !== 'true')
 throw Error('APPROVED_FRESH_SOURCE_FREEZE_REQUIRED')

const originalFetch = globalThis.fetch
const counts = {databaseRequests:0,ebayRequests:0,fxReads:0}
let total = 0
globalThis.fetch = async (input, options) => {
 const request = input instanceof Request ? input : null
 const url = new URL(request?.url ?? String(input))
 const method = (options?.method ?? request?.method ?? 'GET').toUpperCase()
 if(++total > 500) throw Error('CANARY_REQUEST_LIMIT')
 if(url.origin === project && url.pathname.startsWith('/rest/v1/')) counts.databaseRequests++
 else if(url.origin === 'https://api.ebay.com' && ((method === 'POST' && url.pathname === '/identity/v1/oauth2/token') ||
  (method === 'GET' && url.pathname.startsWith('/buy/browse/v1/')))) counts.ebayRequests++
 else if(url.hostname === 'data-api.ecb.europa.eu' && method === 'GET') counts.fxReads++
 else throw Error('CANARY_NETWORK_BOUNDARY')
 return originalFetch(input,options)
}
try {
 // Reject repeat execution after any scan in this maintenance window.
 const response = await fetch(project + '/rest/v1/market_scan_runs?select=id&started_at=gte.' +
  encodeURIComponent(new Date(frozenAt).toISOString()) + '&limit=1', {
  headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY}
 })
 if(!response.ok || (await response.json()).length !== 0) throw Error('CANARY_FRESH_WINDOW_REQUIRED')
 const compiled = await build({
  stdin:{contents:'export { runEbayActiveMarketScanBatch } from "./lib/market/automation/ebay-worker.ts"',resolveDir:process.cwd(),loader:'ts'},
  bundle:true,platform:'node',format:'cjs',packages:'external',write:false,
  plugins:[{name:'server-worker-entry',setup(b){
   b.onResolve({filter:/^server-only$/},()=>({path:'server-only',namespace:'worker-entry'}))
   b.onLoad({filter:/.*/,namespace:'worker-entry'},()=>({contents:'',loader:'js'}))
  }}]
 })
 const filename = path.resolve('scripts/recovery/execute-worker-bundle.cjs')
 const module = new Module(filename)
 module.filename = filename; module.paths = Module._nodeModulePaths(process.cwd())
 module._compile(compiled.outputFiles[0].text,filename)
 const result = await module.exports.runEbayActiveMarketScanBatch(1)
 if(!result.configured || result.attempted !== 1 || result.succeeded !== 1 || result.failed !== 0 || !result.runId)
  throw Error('CANARY_PERSISTED_SCAN_INCOMPLETE')
 console.log(JSON.stringify({EbayPersistedWorkerCanary:'PASS',...counts,attempted:result.attempted,
  succeeded:result.succeeded,accepted:result.acceptedListings,review:result.reviewListings,
  rejected:result.rejectedListings,destination:'Frankfurt',recurringSchedulerStarted:false}))
} catch(error) {
 console.error(JSON.stringify({EbayPersistedWorkerCanary:'FAIL',code:/^CANARY_[A-Z0-9_]+$/.test(error?.message??'')?error.message:'SUPPRESSED'}))
 process.exitCode=1
} finally { globalThis.fetch=originalFetch }
