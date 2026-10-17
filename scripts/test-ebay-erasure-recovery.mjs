import assert from 'node:assert/strict'
import {build} from 'esbuild'
const compile=async entry=>{
 const result=await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',write:false,plugins:[{name:'no-network-tests',setup(b){
 b.onResolve({filter:/^server-only$/},()=>({path:'empty',namespace:'stub'}))
 b.onResolve({filter:/^@\/lib\/ebay\/erasure-client$/},()=>({path:'scoped',namespace:'stub'}))
 b.onResolve({filter:/^@\/lib\/supabase\/admin$/},()=>({path:'admin',namespace:'stub'}))
 b.onResolve({filter:/^next\/server$/},()=>({path:'next',namespace:'stub'}))
 if(entry.includes('/route.ts')){b.onResolve({filter:/^@\/lib\/ebay\/erasure-acceptance$/},()=>({path:'acceptance',namespace:'stub'}))}
 if(entry.includes('/route.ts'))b.onResolve({filter:/^@\/lib\/ebay\/account-deletion$/},()=>({path:'signature',namespace:'stub'}))
 b.onLoad({filter:/.*/,namespace:'stub'},a=>({resolveDir:process.cwd(),contents:({scoped:'export const createErasureClient=()=>{globalThis.__p06AdminCalls++;return globalThis.__p06Client}',acceptance:'import {EbayRecoveryError} from "@/lib/ebay/account-deletion-recovery";export const acceptEbayErasure=async()=>globalThis.__p06Acceptance(EbayRecoveryError)' ,empty:'export {}',admin:'export const createAdminClient=()=>{globalThis.__p06AdminCalls++;return globalThis.__p06Client}',next:'export class NextResponse extends Response {static json(data,init){return new Response(JSON.stringify(data),init)}}',signature:'export const generateEbayDeletionChallenge=()=>"challenge";export const verifyEbayNotificationSignature=async()=>globalThis.__p06Signature;export const parseEbayDeletionNotification=()=>globalThis.__p06Message'})[a.path]}))
 }}]})
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'))
}
process.env.EBAY_ERASURE_KEYS=JSON.stringify({test:'1'.repeat(64)})
process.env.EBAY_ERASURE_CURRENT_KEY='test'
process.env.EBAY_ERASURE_ENABLED='true'
const m=await compile('lib/ebay/account-deletion-recovery.ts')
const message={notificationId:'synthetic-notification',identifiers:{username:'synthetic-private-seller',userId:'synthetic-private-id',eiasToken:'synthetic-private-token'}}
assert.deepEqual(m.notificationIdentity(message),m.notificationIdentity({...message,publishAttemptCount:2,publishDate:'later'}))
assert.notEqual(m.notificationIdentity(message).digest,m.notificationIdentity({...message,identifiers:{username:'different'}}).digest)
const logs=[],report=(...args)=>logs.push(args),claim={state:'claimed',releaseId:'release',condition:'new_complete_unbuilt',generation:1,token:'token'}
function client(steps){const calls=[];return {calls,rpc(name,args){assert.equal(name,'trackdash_ebay_erasure');calls.push(args.p_action);const step=steps.shift();assert.equal(args.p_action,step.action);const b={retry(value){assert.equal(value,false);return b},abortSignal(signal){assert.ok(signal instanceof AbortSignal);return Promise.resolve({data:step.data,error:step.error})}};return b}}}
let c=client([{action:'register',data:{state:'received'}},{action:'erase',data:{state:'erased'}},{action:'claim',data:claim},{action:'publish',data:{state:'completed'}}])
assert.equal(await m.eraseEbayUserData(c,message,Date.now()+45000,report,async()=>[]),true)
c=client([{action:'register',data:{state:'completed'}}]);assert.equal(await m.eraseEbayUserData(c,message,Date.now()+45000,report,()=>assert.fail('duplicate recomputed')),true)
c=client([{action:'register',data:{state:'erased'}},{action:'claim',data:{state:'erased'}}]);assert.equal(await m.eraseEbayUserData(c,message,Date.now()+45000,report),false)
c=client([{action:'register',data:{state:'erased'}},{action:'claim',data:claim}]);await assert.rejects(m.eraseEbayUserData(c,message,Date.now()+45000,report,async()=>{throw Error(message.identifiers.username)}),e=>e.operation==='recompute')
assert.ok(!c.calls.includes('publish'))
c=client([{action:'register',error:{code:'PGRST303',message:message.identifiers.username}}]);await assert.rejects(m.eraseEbayUserData(c,message,Date.now()+45000,report),e=>e.sqlCode==='PGRST303')
await assert.rejects(m.eraseEbayUserData(client([]),message,Date.now()-1,report),e=>e.sqlCode==='DEADLINE')
await assert.rejects(m.beforeDeadline(new Promise(()=>{}),Date.now()+10),e=>e.sqlCode==='DEADLINE')
for(const sensitive of Object.values(message.identifiers))assert.ok(!JSON.stringify(logs).includes(sensitive))
c=client([{action:'status',data:{state:'erased'}},{action:'claim',data:claim},{action:'publish',data:{state:'completed'}}]);assert.equal(await m.resumeEbayErasureJob(c,m.notificationIdentity(message),Date.now()+45000,report,async()=>[]),true)
c=client([{action:'status',data:{state:'received'}}]);await assert.rejects(m.resumeEbayErasureJob(c,m.notificationIdentity(message),Date.now()+45000,report),e=>e.sqlCode==='EMPTY')
c=client([{action:'register',data:{state:'erased'}},...Array.from({length:4},()=>[{action:'claim',data:claim},{action:'publish',data:{state:'erased'}}]).flat()]);assert.equal(await m.eraseEbayUserData(c,message,Date.now()+45000,report,async()=>[]),false);assert.equal(c.calls.filter(x=>x==='publish').length,4)
const slowFetch=m.deadlineFetch(Date.now()+15,async()=>new Promise(()=>{}),report)
await assert.rejects(slowFetch('https://local.invalid/rest/v1/market_candidates?secret=synthetic-private-id'),m.EbayRecoveryError)
assert.ok(!JSON.stringify(logs).includes('synthetic-private-id'))
console.log('PASS retry orchestration, completed duplicate, concurrent busy, failed recompute, DB 401 code, deadlines, private diagnostics')
// Exercise the real service and repository with empty synthetic evidence: all reads
// stay on the injected bounded client; canonical writes must be buffered.
const reads=[],normalWrites=[]
function reader(){return {from(table){reads.push(table);let single=false;const b=new Proxy({}, {get(_,key){if(key==='then')return resolve=>resolve({data:single?null:[],error:null});if(key==='maybeSingle')return ()=>{single=true;return b};if(key==='upsert')return row=>{normalWrites.push({table,row});return Promise.resolve({error:null})};return ()=>b}});return b}}}
const writes=await m.computeErasurePublication(reader(),claim)
assert.equal(normalWrites.length,0);assert.equal(writes.filter(w=>w.table==='market_release_signals').length,1);assert.ok(reads.includes('price_sources'))
assert.throws(()=>m.bufferedPublication(reader()).client.from('market_candidates').upsert({}),/UNEXPECTED_PUBLICATION_WRITE/)
assert.throws(()=>m.bufferedPublication(reader()).client.from('market_candidates').delete(),/UNEXPECTED_PUBLICATION_WRITE/)
console.log('PASS real recomputation uses injected reads and original publication mapping; no unfenced canonical writes')
const route=await compile('app/api/ebay/marketplace-account-deletion/route.ts')
globalThis.__p06AdminCalls=0;globalThis.__p06Signature=false;globalThis.__p06Message=message
const request=()=>new Request('https://local.invalid/api/ebay/marketplace-account-deletion',{method:'POST',body:'{}'})
assert.equal((await route.POST(request())).status,412);assert.equal(globalThis.__p06AdminCalls,0)
globalThis.__p06Signature=true
globalThis.__p06Client={};globalThis.__p06Acceptance=E=>{throw new E('accept_tokens','08006')};let response=await route.POST(request());assert.equal(response.status,503);assert.equal(response.headers.get('retry-after'),'30')
globalThis.__p06Acceptance=()=>{};assert.equal((await route.POST(request())).status,202)
globalThis.__p06Acceptance=()=>{throw new Error('EBAY_NOTIFICATION_DATA_INVALID')};assert.equal((await route.POST(request())).status,400)
delete globalThis.__p06Acceptance
console.log('PASS route verifies signature before all DB work and ACKs asynchronous acceptance only after persistence succeeds')
for(const key of ['__p06AdminCalls','__p06Signature','__p06Message','__p06Client'])delete globalThis[key]

const workerRoute=await compile('app/api/internal/ebay-erasure-recovery/route.ts')
globalThis.__p06AdminCalls=0
assert.equal((await workerRoute.POST(request())).status,503)
process.env.EBAY_ERASURE_WORKER_ENABLED='true'
assert.equal((await workerRoute.POST(request())).status,401)
assert.equal(globalThis.__p06AdminCalls,0)
delete process.env.EBAY_ERASURE_WORKER_ENABLED;delete globalThis.__p06AdminCalls
console.log('PASS worker/monitor endpoint disabled by default and unauthorized requests never access the database')

// A failure in the first recovery poll used to collapse PGRST303 to FAILED.
// Keep only the allowlisted code, never the database error message/details.
process.env.EBAY_ERASURE_WORKER_ENABLED='true'
process.env.EBAY_ERASURE_RECOVERY_TOKEN='synthetic-recovery-token-for-isolated-test'
globalThis.__p06Client={rpc(){const b={retry(){return b},abortSignal(){return Promise.resolve({error:{code:'PGRST303',message:message.identifiers.username,details:message.identifiers.eiasToken}})}};return b}}
const tickLogs=[],originalInfo=console.info
try{
 console.info=(line)=>tickLogs.push(line)
 response=await workerRoute.POST(new Request('https://local.invalid/recovery',{method:'POST',headers:{authorization:'Bearer '+process.env.EBAY_ERASURE_RECOVERY_TOKEN}}))
 assert.equal(response.status,503)
 assert.ok(tickLogs.some(line=>line==='[ebay-erasure-recovery] operation=tick code=PGRST303'))
 for(const value of [...Object.values(message.identifiers),process.env.EBAY_ERASURE_RECOVERY_TOKEN])assert.ok(!JSON.stringify(tickLogs).includes(value))
}finally{
 console.info=originalInfo
 for(const key of ['EBAY_ERASURE_WORKER_ENABLED','EBAY_ERASURE_RECOVERY_TOKEN'])delete process.env[key]
 delete globalThis.__p06Client;delete globalThis.__p06AdminCalls
}
console.log('PASS initial recovery poll preserves PGRST303 without personal data or secrets in diagnostics')

// A backlog cannot turn a single authorized HTTP invocation into an unbounded
// worker. Jobs already completed by a concurrent worker remain idempotent.
process.env.EBAY_ERASURE_WORKER_ENABLED='true'
process.env.EBAY_ERASURE_RECOVERY_TOKEN='synthetic-recovery-token-for-isolated-test'
let taken=0,statusCalls=0
const safeHealth={exhausted:0,overdue:0,undelivered:0,heartbeatStale:false}
globalThis.__p06Client={rpc(name,args){
 let data
 if(name==='trackdash_ebay_recovery'){
  if(args.p_action==='poll')data={job:args.p_data.monitorOnly?null:{key:'synthetic-private-job-'+(++taken),digest:'synthetic-digest'},alarm:null,health:safeHealth}
  else {assert.equal(args.p_action,'settle');data={state:'ok'}}
 }else{assert.equal(name,'trackdash_ebay_erasure');assert.equal(args.p_action,'status');statusCalls++;data={state:'completed'}}
 const b={retry(){return b},abortSignal(){return Promise.resolve({data,error:null})}};return b
}}
response=await workerRoute.POST(new Request('https://local.invalid/recovery',{method:'POST',headers:{authorization:'Bearer '+process.env.EBAY_ERASURE_RECOVERY_TOKEN}}))
assert.equal(response.status,200);const cycle=await response.json();assert.equal(taken,4);assert.equal(statusCalls,4);assert.equal(cycle.processed,4);assert.ok(!JSON.stringify(cycle).includes('synthetic-private-job'))
for(const key of ['EBAY_ERASURE_WORKER_ENABLED','EBAY_ERASURE_RECOVERY_TOKEN'])delete process.env[key]
delete globalThis.__p06Client;delete globalThis.__p06AdminCalls
console.log('PASS recovery endpoint caps backlog work at four idempotent claims per invocation and returns only aggregate health')
