import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createSign,generateKeyPairSync,randomBytes} from 'node:crypto'
import {createClient} from '@supabase/supabase-js'
import {isolatedPostgrest} from './p06-postgrest-isolated.mjs'
import {loadModule} from './p06-load-module.mjs'
const d=await isolatedPostgrest(), release='00000000-0000-4000-8000-000000000009',condition='new_complete_unbuilt'
process.env.EBAY_ERASURE_ENABLED='true';process.env.EBAY_ERASURE_FENCING_ENABLED='true';process.env.EBAY_ERASURE_CURRENT_KEY='test';process.env.EBAY_ERASURE_KEYS=JSON.stringify({test:randomBytes(32).toString('hex')})
const client=createClient('http://local.invalid',d.jwt('service_role'),{global:{fetch:d.fetchImpl},auth:{persistSession:false,autoRefreshToken:false}})
const logs=[],report=(...args)=>{logs.push(args);if(process.env.P06_DEBUG)console.error(JSON.stringify(args))}
const m=await loadModule('lib/ebay/account-deletion-recovery.ts'),crypto=await loadModule('lib/ebay/erasure-inbox.ts'),worker=await loadModule('lib/ebay/erasure-worker.ts')
let serial=0
const message=()=>({notificationId:'synthetic-'+(++serial),identifiers:{username:'synthetic-private-target',userId:'synthetic-private-id',eiasToken:'synthetic-private-token'}})
const rpc=async(action,data={},identity)=>{const {data:out,error}=await client.rpc('trackdash_ebay_erasure',{p_action:action,p_key:identity.key,p_digest:identity.digest,p_data:data}).retry(false);if(error)throw Object.assign(Error('RPC_FAILED'),{safe:error});return out}
const register=async msg=>{const box=crypto.sealInbox(msg);await rpc('register',{sealed:box.sealed,digests:box.digests},box);return box}
const tick=(send=async a=>logs.push(['alarm',a]),compute)=>worker.runErasureRecoveryTick(client,Date.now()+45000,report,send,false,compute??(async(c,claim)=>{try{return await m.computeErasurePublication(c,claim)}catch(e){if(process.env.P06_DEBUG)console.error('COMPUTE',e.message.split(':')[0]);throw e}}))
const state=()=>d.json("select jsonb_build_object('job',(select state from trackdash_erasure.notifications limit 1),'cipher',(select sealed from trackdash_erasure.notifications limit 1),'seller',(select to_jsonb(seller_fingerprint) from market_candidates where source_record_key='synthetic-target'),'eligible',(select valuation_eligible from price_points limit 1),'price',(select price from price_points limit 1),'sales',(select sales_count from market_aggregate_observations limit 1))")
function seed(){
 d.sql(`truncate trackdash_erasure.suppressed_candidates,trackdash_erasure.suppressed_identities,trackdash_erasure.notification_work,trackdash_erasure.notifications,trackdash_erasure.recomputes,trackdash_erasure.alerts,market_recompute_queue,market_release_ask_snapshots,market_release_monthly_signals,market_release_signals,market_monthly_source_stats,market_aggregate_observations,market_offer_states,market_candidates,price_points cascade;
 insert into market_candidates(id,source_id,source_record_key,resolved_release_id,condition,seller_fingerprint,evidence_group_key,raw_payload,decision,match_confidence,match_evidence,original_source) values
 ('00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000005','synthetic-target','${release}','${condition}','ebay:synthetic-private-target','${release}|synthetic-private-target','{"seller":"synthetic-private-target","nested":["synthetic-private-id"],"price":12.5,"title":"Synthetic kit"}','accepted','exact',array['item_number_exact'],'EBAY_IT'),
 ('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000006','retail-canary','${release}','${condition}','ebay:synthetic-private-target',null,'{"seller":"synthetic-private-target"}','needs_review',null,'{}',null);
 insert into price_points(candidate_id,release_id,source_id,observation_type,condition,price,currency,shipping_basis,valuation_price,normalized_price_eur,match_confidence,match_evidence,evidence_group_key,valuation_eligible,sold_on,observed_at,evidence_grade,market_price_eur,market_price_basis)
 values('00000000-0000-4000-8000-000000000010','${release}','00000000-0000-4000-8000-000000000005','sold_confirmed','${condition}',12.5,'EUR','excluded',12.5,12.5,'exact',array['item_number_exact'],'${release}|synthetic-private-target',true,current_date-1,now(),'verified',12.5,'raw_sale');
 insert into market_offer_states(candidate_id,release_id,source_id,condition,channel,availability,seller_fingerprint,item_price,currency,item_price_eur,cost_basis,first_seen_at,last_checked_at,changed_at)
 values('00000000-0000-4000-8000-000000000010','${release}','00000000-0000-4000-8000-000000000005','${condition}','marketplace','in_stock','synthetic-private-target',12,'EUR',12,'item_only',now(),now(),now());
 insert into market_aggregate_observations(source_id,release_id,item_number,attribution_status,grain,period_start,period_end,condition,query_key,sales_count,seller_count,average_item_price,currency,market_average_eur,raw_payload)
 values('00000000-0000-4000-8000-000000000004','${release}','00001','release_exact','full_history',current_date-180,current_date,'${condition}','synthetic-query',2,1,15,'EUR',15,'{"seller":"synthetic-private-token","market":15}');
 insert into market_monthly_source_stats(release_id,source_id,month,condition,query_key,sales_count,average_price,currency,market_average_eur,raw_payload)
 values('${release}','00000000-0000-4000-8000-000000000005',date_trunc('month',current_date)::date,'${condition}','synthetic-month',2,14,'EUR',14,'{"seller":"synthetic-private-target","market":14}');`)
}
try{
 d.sql(readFileSync('scripts/fixtures/p06a-realistic-seed.sql','utf8'));seed()
 // Provider retries stop after register: recovery needs no further notification.
 let box=await register(message());assert.equal(state().job,'received');assert.ok(state().cipher);assert.ok(!JSON.stringify(state().cipher).includes('synthetic-private'))
 let result=await tick();assert.equal(result.failed,0);assert.equal(state().job,'completed');assert.equal(state().cipher,null);assert.equal(state().seller,null);assert.equal(state().eligible,false);assert.equal(state().price,12.5);assert.equal(state().sales,2)
 assert.equal(d.json("select to_jsonb(seller_fingerprint) from market_candidates where source_record_key='retail-canary'"),'ebay:synthetic-private-target')
 assert.equal((await rpc('register',{sealed:box.sealed,digests:box.digests},box)).state,'completed')
 console.log('PASS real PostgREST + repository schema/FKs/checks/triggers: encrypted received recovered without eBay retry; personal fields removed; non-personal amounts/history preserved')
 // SQL interruption after each mutation phase must roll back all evidence.
 for(const table of ['market_candidates','market_offer_states','price_points','market_aggregate_observations','market_monthly_source_stats','trackdash_erasure.notification_work']){
  seed();box=await register(message());d.sql(`create function p06_fail() returns trigger language plpgsql as $$begin raise exception 'synthetic-private-target';end$$;create trigger p06_fail before insert or update on ${table} for each statement execute function p06_fail();`)
  result=await tick();assert.equal(result.failed,1);assert.equal(state().job,'received');assert.equal(state().eligible,true)
  d.sql(`drop trigger p06_fail on ${table};drop function p06_fail();update trackdash_erasure.notifications set next_attempt_at=now();`)
  assert.equal((await tick()).failed,0);assert.equal(state().job,'completed')
 }
 console.log('PASS HTTP interruption after each data/outbox phase: rollback then automatic retry completes without provider delivery')
 // Function timeout through the real API (not a psql session timeout).
 seed();box=await register(message());d.sql(`create function p06_slow() returns trigger language plpgsql as $$begin perform pg_sleep(.6);return new;end$$;create trigger p06_slow before update on market_candidates for each row execute function p06_slow();alter function public.trackdash_ebay_erasure(text,text,text,jsonb) set statement_timeout='100ms';`);await d.reload()
 const start=Date.now();await assert.rejects(rpc('erase',{identifiers:['synthetic-private-target','synthetic-private-id','synthetic-private-token']},box),e=>e.safe.code==='57014');assert.ok(Date.now()-start<1500);assert.equal(state().job,'received');assert.equal(state().eligible,true)
 d.sql("drop trigger p06_slow on market_candidates;drop function p06_slow();alter function public.trackdash_ebay_erasure(text,text,text,jsonb) set statement_timeout='10s';");await d.reload();assert.equal((await tick()).failed,0)
 console.log('PASS PostgREST enforces per-function SQL timeout and preserves recoverable inbox')
 // Process death after claim, no settle and no provider retries.
 seed();box=await register(message());let job=await worker.recoveryRpc(client,'take',{},Date.now()+45000);assert.ok(job.token)
 d.sql("update trackdash_erasure.notifications set job_locked_until=now()-interval '1 second',next_attempt_at=now();")
 assert.equal((await tick()).failed,0);assert.equal(state().job,'completed')
 console.log('PASS restart after lost recovery lease resumes durable encrypted job')
 // Response loss after a committed inbox or erase must not require provider replay.
 for(const lostAction of ['register','erase']){
  seed();let lost=false
  const interrupted=createClient('http://local.invalid',d.jwt('service_role'),{global:{fetch:async(u,init)=>{
   const response=await d.fetchImpl(u,init)
   if(String(u).includes('trackdash_ebay_erasure')&&JSON.parse(init.body).p_action===lostAction&&!lost){lost=true;throw Error('SYNTHETIC_RESPONSE_LOSS')}
   return response
  }},auth:{persistSession:false,autoRefreshToken:false}})
  await assert.rejects(m.eraseEbayUserData(interrupted,message(),Date.now()+45000,report))
  assert.equal(state().job,lostAction==='register'?'received':'erased')
  await tick();assert.equal(state().job,'completed')
 }
 console.log('PASS lost HTTP response after inbox/erase commit: durable state completes without a further eBay delivery')
 // Concurrent duplicate signed deliveries share one ledger and dependency plan.
 seed();const msg=message();const dup=await Promise.allSettled([m.eraseEbayUserData(client,msg,Date.now()+45000,report),m.eraseEbayUserData(client,msg,Date.now()+45000,report)])
 assert.ok(dup.some(x=>x.status==='fulfilled'));assert.equal(d.json('select count(*) from trackdash_erasure.notifications'),1);assert.equal(d.json('select count(*) from trackdash_erasure.notification_work'),1)
 d.sql("update trackdash_erasure.notifications set next_attempt_at=now();update trackdash_erasure.recomputes set locked_until=now()-interval '1 second';");await tick();assert.equal(state().job,'completed')
 console.log('PASS concurrent duplicate HTTP deliveries are idempotent and finish once')
 // A real ordinary recompute is paused immediately before its canonical write.
 seed();let releasePublish,hitPublish;const gate=new Promise(r=>releasePublish=r),hit=new Promise(r=>hitPublish=r)
 const slowClient=createClient('http://local.invalid',d.jwt('service_role'),{global:{fetch:async(u,i)=>{if(String(u).includes('trackdash_market_fence')&&JSON.parse(i.body).p_action==='publish'){if(process.env.P06_DEBUG)console.error('GATE_ENTER');hitPublish();await gate;if(process.env.P06_DEBUG)console.error('GATE_EXIT')}return d.fetchImpl(u,i)}},auth:{persistSession:false,autoRefreshToken:false}})
 const {MarketR3Repository}=await loadModule('lib/market/pipeline/market-r3-repository.ts'),{recomputeReleaseMarketSignal}=await loadModule('lib/market/pipeline/market-r3-service.ts')
 const old=recomputeReleaseMarketSignal(release,condition,new Date(),new MarketR3Repository(slowClient),async()=>[]);const rejected=assert.rejects(old,/MARKET_PUBLICATION_REJECTED/)
 await hit;assert.equal(await m.eraseEbayUserData(client,message(),Date.now()+45000,report),true);const published=d.json('select to_jsonb(computed_at) from market_release_signals');releasePublish();if(process.env.P06_DEBUG)console.error('PUBLISH_RELEASED');await rejected;if(process.env.P06_DEBUG)console.error('STALE_REJECTED');assert.equal(d.json('select to_jsonb(computed_at) from market_release_signals'),published)
 if(process.env.P06_DEBUG)console.error('FRESH_BEGIN');await recomputeReleaseMarketSignal(release,condition,new Date(),new MarketR3Repository(client),async()=>[]);if(process.env.P06_DEBUG)console.error('FRESH_DONE')
 const raw=await client.from('market_release_signals').update({market_value_eur:999}).eq('release_id',release);assert.equal(raw.error.code,'PT409')
 console.log('PASS real ordinary recompute begun before erasure cannot overwrite the newer publication; fresh recompute succeeds; unfenced writes rejected')
 // A deletion that affects no data must not invalidate unrelated market work.
 const snapshot=await client.rpc('trackdash_market_fence',{p_action:'snapshot',p_data:{releaseId:release,condition}})
 const unchangedWrites=await m.computeErasurePublication(client,{releaseId:release,condition})
 assert.equal(await m.eraseEbayUserData(client,{...message(),identifiers:{username:'synthetic-no-match'}},Date.now()+45000,report),true)
 const unaffected=await client.rpc('trackdash_market_fence',{p_action:'publish',p_data:{epoch:snapshot.data.epoch,releaseId:release,condition,writes:unchangedWrites}})
 assert.equal(unaffected.error,null)
 console.log('PASS scoped fencing accepts a valid recompute when an unrelated deletion changes no evidence')
 // Retry exhaustion is durable, detected, and alarm delivery itself is retryable.
 seed();await register(message())
 for(let n=0;n<8;n++){d.sql("update trackdash_erasure.notifications set next_attempt_at=now();update trackdash_erasure.recomputes set locked_until=now()-interval '1 second';");await tick(async()=>{throw Error('synthetic sink down')},async()=>{throw Error('synthetic recompute failure')})}
 assert.equal(d.json('select attempts from trackdash_erasure.notifications'),8);assert.ok(d.json("select count(*) from trackdash_erasure.alerts where kind='exhausted' and delivered_at is null")>0)
 d.sql("update trackdash_erasure.alerts set locked_until=now()-interval '1 second',next_attempt_at=now();")
 const alarms=[];result=await worker.runErasureRecoveryTick(client,Date.now()+45000,report,async a=>alarms.push(a),true);assert.equal(result.healthy,false);assert.equal(alarms[0].kind,'exhausted');assert.equal(d.json('select count(*) from trackdash_erasure.alerts where delivered_at is not null'),1)
 console.log('PASS provider-independent retry exhaustion remains persisted and unhealthy; failed alarm delivery retries and acknowledges only after sink success')
 // Independent monitor detects worker downtime, resolves it, and detects a new outage.
 seed();d.sql("update trackdash_erasure.heartbeat set last_success=now()-interval '20 minutes';")
 const monitorAlarms=[]
 let monitor=await worker.runErasureRecoveryTick(client,Date.now()+45000,report,async a=>monitorAlarms.push(a),true)
 assert.equal(monitor.healthy,false);assert.equal(monitorAlarms[0].kind,'heartbeat')
 await tick();await worker.runErasureRecoveryTick(client,Date.now()+45000,report,async a=>monitorAlarms.push(a),true)
 d.sql("update trackdash_erasure.heartbeat set last_success=now()-interval '21 minutes';")
 monitor=await worker.runErasureRecoveryTick(client,Date.now()+45000,report,async a=>monitorAlarms.push(a),true)
 assert.equal(monitor.healthy,false);assert.equal(monitorAlarms.length,2);assert.notEqual(monitorAlarms[0].id,monitorAlarms[1].id)
 await tick();await worker.runErasureRecoveryTick(client,Date.now()+45000,report,async()=>{},true)
 const idleBefore=d.metrics.requests;await tick();assert.equal(d.metrics.requests-idleBefore,1)
 console.log('PASS monitor mode detects successive heartbeat outages; empty worker tick performs one ledger-only RPC (infrastructure independence is a separate release gate)')
 // Full webhook path: genuine synthetic signature, real PostgREST, no real eBay calls.
 seed();globalThis.__p06HttpClient=client
 Object.assign(process.env,{EBAY_ENV:'production',EBAY_CLIENT_ID:'synthetic-client',EBAY_CLIENT_SECRET:'synthetic-client-secret',EBAY_MARKETPLACE_DELETION_ENDPOINT:'https://local.invalid/api/ebay/marketplace-account-deletion',EBAY_MARKETPLACE_DELETION_TOKEN:'synthetic-verification-token-1234567890'})
 const {privateKey,publicKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'}),originalFetch=globalThis.fetch
 globalThis.fetch=async url=>String(url).includes('/oauth2/token')?Response.json({access_token:'synthetic-oauth-token',expires_in:3600}):String(url).includes('/public_key/')?Response.json({key:publicKey.export({type:'spki',format:'pem'})}):Promise.reject(Error('UNEXPECTED_NETWORK'))
 const oldConsole={info:console.info,warn:console.warn,error:console.error}
 console.info=(...x)=>logs.push(x);console.warn=(...x)=>logs.push(x);console.error=(...x)=>logs.push(x)
 try{
  const route=await loadModule('app/api/ebay/marketplace-account-deletion/route.ts'),msg=message()
  const body=JSON.stringify({metadata:{topic:'MARKETPLACE_ACCOUNT_DELETION',schemaVersion:'1.0'},notification:{notificationId:msg.notificationId,data:msg.identifiers}})
  const signer=createSign('ssl3-sha1');signer.update(body);signer.end();const header=Buffer.from(JSON.stringify({kid:'synthetic-key',signature:signer.sign(privateKey,'base64')})).toString('base64')
  const req=value=>new Request('https://local.invalid/api/ebay/marketplace-account-deletion',{method:'POST',headers:{'x-ebay-signature':header},body:value})
  assert.equal((await route.POST(req(body))).status,204);assert.equal(state().job,'completed');assert.equal((await route.POST(req(body))).status,204)
  const before=d.metrics.requests;assert.equal((await route.POST(req(body.replace(msg.notificationId,msg.notificationId+'-tampered')))).status,412);assert.equal(d.metrics.requests,before)
 }finally{Object.assign(console,oldConsole);globalThis.fetch=originalFetch;delete globalThis.__p06HttpClient}
 console.log('PASS complete signed webhook -> real API -> durable erase/recompute -> 204, duplicate replay and tampered-signature rejection before DB')
 // Synthetic historical payload load: real SQL scan/redaction, preserved market fields.
 seed();d.sql(`insert into market_candidates(source_id,source_record_key,raw_payload) select '00000000-0000-4000-8000-000000000005','synthetic-bulk-'||n,jsonb_build_object('seller','unrelated-'||n,'title',repeat('synthetic public market data ',25),'price',n) from generate_series(1,2000) n;`)
 const perfMsg=message(),perfBox=await register(perfMsg),started=Date.now(),beforePerf={...d.metrics}
 await rpc('erase',{identifiers:Object.values(perfMsg.identifiers)},perfBox)
 const elapsed=Date.now()-started
 assert.equal(state().seller,null);assert.equal(d.json("select count(*) from market_candidates where source_record_key like 'synthetic-bulk-%'"),2000)
 console.log('PERF synthetic 2000 historical payloads:',JSON.stringify({eraseWallMs:elapsed,requests:d.metrics.requests-beforePerf.requests,responseBytes:d.metrics.responseBytes-beforePerf.responseBytes}))
 const expired=createClient('http://local.invalid',d.jwt('service_role',true),{global:{fetch:d.fetchImpl},auth:{persistSession:false,autoRefreshToken:false}})
 const expiredResult=await expired.rpc('trackdash_ebay_recovery',{p_action:'health'});assert.equal(expiredResult.status,401);assert.match(expiredResult.error.code,/^PGRST/)
 const badAuth=createClient('http://local.invalid',d.jwt('service_role'),{global:{fetch:async()=>Response.json({code:'PGRST303',message:'synthetic-private-target synthetic-client-secret'},{status:401})},auth:{persistSession:false,autoRefreshToken:false}})
 await assert.rejects(m.eraseEbayUserData(badAuth,message(),Date.now()+45000,report),e=>e.sqlCode==='PGRST303')
 console.log('PASS independent authentication diagnostics: real expired JWT rejected ('+expiredResult.error.code+'); PGRST303 preserved without raw message or credential changes')
 const anon=createClient('http://local.invalid',d.jwt('anon'),{global:{fetch:d.fetchImpl},auth:{persistSession:false}});assert.ok((await anon.rpc('trackdash_ebay_recovery',{p_action:'take'})).error);assert.ok((await anon.rpc('trackdash_ebay_erasure',{p_action:'status',p_key:box.key,p_digest:box.digest})).error)
 for(const canary of ['synthetic-private-target','synthetic-private-id','synthetic-private-token',...Object.values(JSON.parse(process.env.EBAY_ERASURE_KEYS))]){assert.ok(!JSON.stringify(logs).includes(canary));assert.ok(!d.logs().includes(canary));assert.ok(!d.databaseLogs().includes(canary))}
 console.log('PASS HTTP role isolation and privacy: no seller identifier or encryption key in captured diagnostic/alarm output')
}finally{d.close()}
