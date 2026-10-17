import assert from 'node:assert/strict'
import {assessHealth,monitorOnce} from '../ops/ebay-erasure/monitor.mjs'
import {loadModule} from './p06-load-module.mjs'
const healthy={pending:0,oldestPendingSeconds:0,exhausted:0,heartbeatSeconds:10,journalCycleSeconds:10,undelivered:0,guard:true,recovering:false,journalCompleted:3}
const journal={accepted:3,completed:3};assert.equal(assessHealth(healthy,journal),true)
for(const [key,value] of Object.entries({oldestPendingSeconds:900,heartbeatSeconds:900,journalCycleSeconds:900,exhausted:1,undelivered:1,guard:false}))assert.equal(assessHealth({...healthy,[key]:value},journal),false)
for(const bad of [null,{}, {...healthy,pending:NaN},{...healthy,heartbeatSeconds:null}])assert.equal(assessHealth(bad,journal),false)
assert.equal(assessHealth({...healthy,recovering:true},journal),false);assert.equal(assessHealth(healthy,{accepted:4,completed:3,oldestPendingMs:Date.now()-1000000}),false);assert.equal(assessHealth(healthy,{accepted:2,completed:2}),false);assert.equal(assessHealth(healthy,{accepted:4,completed:4}),false)
const env={EBAY_ERASURE_MONITOR_DB_URL:'https://synthetic.invalid',EBAY_ERASURE_MONITOR_JWT:'synthetic-private-token',EBAY_ERASURE_MONITOR_API_KEY:'synthetic-key'}
assert.equal((await monitorOnce({env,journal,fetchImpl:async()=>Response.json(healthy)})).healthy,true)
assert.equal((await monitorOnce({env,journal,fetchImpl:async()=>{throw Error(env.EBAY_ERASURE_MONITOR_JWT)}})).healthy,false)
assert.deepEqual(await monitorOnce({env,journal,fetchImpl:async()=>Response.json({code:'PGRST303',message:env.EBAY_ERASURE_MONITOR_JWT},{status:401})}),{healthy:false,code:'PGRST303'})
assert.ok(!JSON.stringify(await monitorOnce({env,journal,fetchImpl:async()=>Response.json({code:env.EBAY_ERASURE_MONITOR_JWT},{status:503})})).includes(env.EBAY_ERASURE_MONITOR_JWT))
console.log('PASS independent monitor: worker stoppage, journal lag, DB/auth/network failure, undelivered alarms and PGRST303 remain unhealthy with no secret diagnostic')
const {snsAlarmSender}=await loadModule('ops/ebay-erasure/alarm.ts')
const topic='arn:aws:sns:eu-west-1:123456789012:synthetic-erasure',alarm={id:'00000000-0000-4000-8000-000000000001',kind:'exhausted'}
let sent
const sender=snsAlarmSender({send:async(command,options)=>{sent={input:command.input,signal:options.abortSignal};return {MessageId:'synthetic-accepted'}}},topic,Date.now()+10000)
await sender({...alarm,unexpectedPersonalData:'must-never-be-forwarded'})
assert.deepEqual(JSON.parse(sent.input.Message),alarm);assert.equal(sent.input.TopicArn,topic);assert.ok(sent.signal instanceof AbortSignal)
assert.throws(()=>snsAlarmSender({},'https://unreviewed.invalid',Date.now()+10000))
await assert.rejects(sender({...alarm,kind:'unexpected'}))
await assert.rejects(snsAlarmSender({send:async()=>({})},topic,Date.now()+10000)(alarm))
await assert.rejects(snsAlarmSender({send:async()=>{throw Error('provider failure')}},topic,Date.now()+10000)(alarm))
await assert.rejects(snsAlarmSender({send:async()=>{throw Error('must not call')}},topic,Date.now()-1)(alarm))
console.log('PASS scoped SNS alarm adapter: acknowledgement requires provider MessageId; invalid configuration, timeout and delivery failure remain unacknowledged; payload has only opaque alert UUID and fixed kind')
