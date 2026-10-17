import assert from 'node:assert/strict'
import {assessHealth,monitorOnce} from '../ops/ebay-erasure/monitor.mjs'
const healthy={pending:0,oldestPendingSeconds:0,exhausted:0,heartbeatSeconds:10,undelivered:0,guard:true}
assert.equal(assessHealth(healthy),true)
for(const [key,value] of Object.entries({oldestPendingSeconds:900,heartbeatSeconds:900,exhausted:1,undelivered:1,guard:false}))assert.equal(assessHealth({...healthy,[key]:value}),false)
for(const bad of [null,{}, {...healthy,pending:NaN},{...healthy,heartbeatSeconds:null}])assert.equal(assessHealth(bad),false)
const env={EBAY_ERASURE_MONITOR_DB_URL:'https://synthetic.invalid',EBAY_ERASURE_MONITOR_JWT:'synthetic-private-token',EBAY_ERASURE_MONITOR_API_KEY:'synthetic-key'}
assert.equal((await monitorOnce({env,fetchImpl:async()=>Response.json(healthy)})).healthy,true)
assert.equal((await monitorOnce({env,fetchImpl:async()=>{throw Error(env.EBAY_ERASURE_MONITOR_JWT)}})).healthy,false)
assert.deepEqual(await monitorOnce({env,fetchImpl:async()=>Response.json({code:'PGRST303',message:env.EBAY_ERASURE_MONITOR_JWT},{status:401})}),{healthy:false,code:'PGRST303'})
assert.ok(!JSON.stringify(await monitorOnce({env,fetchImpl:async()=>Response.json({code:env.EBAY_ERASURE_MONITOR_JWT},{status:503})})).includes(env.EBAY_ERASURE_MONITOR_JWT))
console.log('PASS direct DB monitor: stopped worker, overdue/exhausted obligations, unacknowledged alarms and DB/auth/network failures; diagnostics preserve PGRST303 without secrets')
