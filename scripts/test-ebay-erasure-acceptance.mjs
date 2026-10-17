import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createSign,generateKeyPairSync,randomBytes} from 'node:crypto'
import {createClient} from '@supabase/supabase-js'
import {isolatedPostgrest} from './p06-postgrest-isolated.mjs'
import {loadModule} from './p06-load-module.mjs'
import {localSnapshot} from './p06-local-snapshot.mjs'
const d=await isolatedPostgrest(),disk=localSnapshot(d),source='00000000-0000-4000-8000-000000000005',release='00000000-0000-4000-8000-000000000009'
Object.assign(process.env,{EBAY_ERASURE_ENABLED:'true',EBAY_ERASURE_FENCING_ENABLED:'true',EBAY_ERASURE_WORKER_ENABLED:'true',EBAY_ERASURE_CURRENT_KEY:'test',EBAY_ERASURE_KEYS:JSON.stringify({test:randomBytes(32).toString('hex')}),EBAY_ENV:'production',EBAY_CLIENT_ID:'synthetic-client',EBAY_CLIENT_SECRET:'synthetic-client-secret'})
const mk=(role,fetch=d.fetchImpl)=>createClient('http://local.invalid',d.jwt(role),{global:{fetch},auth:{persistSession:false,autoRefreshToken:false}})
const client=mk('service_role'),logs=[],report=(...a)=>logs.push(a),oldFetch=globalThis.fetch,oldConsole={info:console.info,warn:console.warn,error:console.error}
let stage='setup'
try{
 d.sql(readFileSync('scripts/fixtures/p06a-realistic-seed.sql','utf8'))
 d.sql('drop role if exists trackdash_erasure_monitor;drop role if exists trackdash_erasure_worker;drop role if exists trackdash_erasure_ingress;')
 d.sql(readFileSync('proposals/p06a-minimization-and-token-recovery.sql','utf8'));await d.reload()
 for(let n=1;n<=2;n++)d.sql(`insert into market_candidates(id,source_id,source_record_key,resolved_release_id,condition,seller_fingerprint,decision,match_confidence,match_evidence) values('00000000-0000-4000-8000-00000000001${n}','${source}','synthetic-${n}','${release}','new_complete_unbuilt','ebay:SyntheticSeller${n}','accepted','exact',array['item_number_exact']);
 insert into price_points(candidate_id,release_id,source_id,observation_type,condition,price,currency,shipping_basis,valuation_price,normalized_price_eur,match_confidence,match_evidence,evidence_group_key,valuation_eligible,sold_on,observed_at,evidence_grade,market_price_eur,market_price_basis)
 values('00000000-0000-4000-8000-00000000001${n}','${release}','${source}','sold_confirmed','new_complete_unbuilt',12.5,'EUR','excluded',12.5,12.5,'exact',array['item_number_exact'],'eg:synthetic-${n}',true,current_date-1,now(),'verified',12.5,'raw_sale');`)
 const ingress=mk('trackdash_erasure_ingress'),scoped=mk('trackdash_erasure_worker'),monitor=mk('trackdash_erasure_monitor')
 const {acceptEbayErasure}=await loadModule('lib/ebay/erasure-acceptance.ts'),{runErasureRecoveryTick}=await loadModule('lib/ebay/erasure-worker.ts'),{inboxIdentity}=await loadModule('lib/ebay/erasure-inbox.ts')
 const tick=()=>runErasureRecoveryTick(scoped,Date.now()+45000,report,async()=>{throw Error('USE_GITHUB_CHECK')})
 const message=n=>({notificationId:'synthetic-inbox-'+n,identifiers:{username:'SyntheticSeller'+n}}),accept=(n,c=ingress)=>acceptEbayErasure(c,message(n),Date.now()+30000)
 stage='stale worker'
 await assert.rejects(accept(1),e=>e.sqlCode==='WORKER_STALE')
 assert.equal(d.json('select count(*) from trackdash_erasure.notifications'),1)
 assert.equal(d.json("select count(*) from trackdash_erasure.notifications where sealed::text like '%SyntheticSeller%'"),0)
 let result=await tick();assert.equal(result.failed,0)
 assert.equal(d.json("select count(*) from trackdash_erasure.notifications where state='completed'"),1)
 // Completed duplicate requires no live worker; identity conflict still fails.
 d.sql("update trackdash_erasure.heartbeat set last_success=now()-interval '1 hour';")
 await accept(1)
 await assert.rejects(acceptEbayErasure(ingress,{...message(1),identifiers:{username:'different'}},Date.now()+10000))
 await tick()
 console.log('PASS stale/unconfigured worker cannot earn 202; token-only obligation is already saved and completes without another provider delivery; completed duplicates/conflicts remain safe')
 stage='signature'
 globalThis.__p06HttpClient=ingress
 const pair=generateKeyPairSync('ec',{namedCurve:'prime256v1'})
 globalThis.fetch=async url=>String(url).includes('/oauth2/token')?Response.json({access_token:'synthetic-oauth-token',expires_in:3600}):String(url).includes('/public_key/')?Response.json({key:pair.publicKey.export({type:'spki',format:'pem'})}):Promise.reject(Error('UNEXPECTED_EXTERNAL_FETCH'))
 const route=await loadModule('app/api/ebay/marketplace-account-deletion/route.ts')
 const signed=n=>{const body=JSON.stringify({metadata:{topic:'MARKETPLACE_ACCOUNT_DELETION'},notification:{notificationId:message(n).notificationId,data:message(n).identifiers}}),sign=createSign('ssl3-sha1');sign.update(body);sign.end();return {body,header:Buffer.from(JSON.stringify({kid:'synthetic-key',signature:sign.sign(pair.privateKey,'base64')})).toString('base64')}}
 const request=({body,header})=>new Request('https://synthetic.invalid/deletion',{method:'POST',headers:{'x-ebay-signature':header},body})
 Object.assign(console,{info:(...a)=>logs.push(a),warn:(...a)=>logs.push(a),error:(...a)=>logs.push(a)})
 const input=signed(2),responses=await Promise.all([route.POST(request(input)),route.POST(request(input))])
 assert.deepEqual(responses.map(r=>r.status),[202,202]);assert.equal(d.json('select count(*) from trackdash_erasure.notifications'),2)
 const before=d.metrics.requests;assert.equal((await route.POST(request({...input,body:input.body.replace('SyntheticSeller2','tampered')}))).status,412);assert.equal(d.metrics.requests,before)
 Object.assign(console,oldConsole);globalThis.fetch=oldFetch
 console.log('PASS genuine signed webhook -> scoped PostgREST -> committed Supabase inbox ->202, concurrent duplicate one row; tampering performs no DB operation')
 stage='database failure'
 d.sql("create function public.lab_fail_insert() returns trigger language plpgsql as $$begin raise exception 'SYNTHETIC_DB_FAILURE';end$$;create trigger lab_fail before insert on trackdash_erasure.notifications for each statement execute function lab_fail_insert();")
 await assert.rejects(accept(3));assert.equal(d.json('select count(*) from trackdash_erasure.notifications'),2)
 d.sql('drop trigger lab_fail on trackdash_erasure.notifications;')
 stage='uncertain response'
 const uncertain=mk('trackdash_erasure_ingress',async(...args)=>{await d.fetchImpl(...args);throw Error('RESPONSE_LOST_AFTER_COMMIT')})
 await assert.rejects(accept(3,uncertain));assert.equal(d.json('select count(*) from trackdash_erasure.notifications'),3)
 await accept(3)
 const status=await monitor.rpc('trackdash_ebay_erasure_health').retry(false);assert.equal(status.error,null)
 assert.ok((await ingress.from('market_candidates').select('id').limit(1).retry(false)).error)
 const denied=await monitor.rpc('trackdash_ebay_accept_tokens',{p_key:'d'.repeat(64),p_digest:'e'.repeat(64),p_digests:{},p_key_id:'test',p_identifiers:['synthetic-access-canary']}).retry(false);assert.equal(denied.error?.code,'42501')
 assert.notEqual(d.sql('set role trackdash_erasure_worker;select * from vault.decrypted_secrets;',true).status,0)
 console.log('PASS insert failure never accepts; lost response retains one recoverable job; ingress/worker/monitor privileges are separated')
 stage='exhaustion'
 const id=inboxIdentity(message(2))
 d.sql(`update trackdash_erasure.notifications set next_attempt_at=now()+interval '1 day' where notification_key<>'${id.key}';update trackdash_erasure.notifications set attempts=8,next_attempt_at=now(),job_locked_until=null where notification_key='${id.key}';`)
 // Dependency unavailable at the exhausted attempt: next due is six hours.
 result=await runErasureRecoveryTick(scoped,Date.now()+45000,report,async()=>{throw Error('NO_ALERT_ACK')},false,async()=>{throw Error('SYNTHETIC_RECOMPUTE_FAILURE')})
 assert.equal(result.healthy,false)
 stage='exhaustion-attempt-counter'
 assert.equal(d.json(`select attempts from trackdash_erasure.notifications where notification_key='${id.key}'`),8)
 stage='exhaustion-slow-due'
 assert.equal(d.json(`select count(*) from trackdash_erasure.notifications where notification_key='${id.key}' and next_attempt_at>now()+interval '5 hours'`),1)
 // Advance synthetic due/lease time together; attempts are never reset.
 stage='exhaustion-recovery'
 d.sql("update trackdash_erasure.notifications set next_attempt_at=now(),job_locked_until=null;update trackdash_erasure.recomputes set locked_until=now()-interval '1 second';")
 for(let n=0;n<5;n++){await tick();if(d.json("select count(*) from trackdash_erasure.notifications where state<>'completed'")===0)break}
 assert.equal(d.json("select count(*) from trackdash_erasure.notifications where state<>'completed'"),0)
 assert.equal(d.json('select count(*) from market_candidates where seller_fingerprint is not null'),0)
 assert.equal(d.json('select sum(price) from price_points'),25)
 const idleBefore=d.metrics.requests;await tick();assert.equal(d.metrics.requests-idleBefore,1)
 console.log('PASS exhausted jobs retry automatically at six-hour intervals, without eBay delivery or resetting attempts; non-personal prices survive; idle recovery uses one DB RPC')
 stage='restore limits'
 // A backup containing obligations can restore them; a prior backup cannot.
 const saved=disk.dump(),count=d.json('select count(*) from trackdash_erasure.notifications')
 await accept(4);assert.equal(d.json('select count(*) from trackdash_erasure.notifications'),count+1)
 const escrow=d.json('select jsonb_agg(to_jsonb(s)) from vault.decrypted_secrets s')
 disk.restore(saved)
 for(const e of escrow)d.sql(`insert into vault.decrypted_secrets(id,decrypted_secret) values('${e.id}','${e.decrypted_secret}') on conflict(id) do update set decrypted_secret=excluded.decrypted_secret;`)
 assert.equal(d.json('select count(*) from trackdash_erasure.notifications'),count)
 assert.equal(d.json(`select count(*) from trackdash_erasure.notifications where notification_key='${inboxIdentity(message(4)).key}'`),0)
 console.log('PASS real pg_restore retains obligations/tombstones present in backup; OPEN: a post-backup accepted receipt is lost on rollback, single-DB inbox does not promise independent RPO0')
 stage='privacy'
 const captured=JSON.stringify(logs)+d.logs()+d.databaseLogs()
 for(const value of ['SyntheticSeller1','SyntheticSeller2','synthetic-client-secret',...Object.values(JSON.parse(process.env.EBAY_ERASURE_KEYS))])assert.ok(!captured.includes(value),'CAPTURED_DIAGNOSTIC_CONTAINS_CANARY')
 console.log('PASS captured application/PostgREST/PostgreSQL diagnostics contain no personal identifier or key; managed provider logs/restore/alert delivery remain unverified')
}catch(e){Object.assign(console,oldConsole);console.error('ACCEPTANCE_LAB_FAILED stage='+stage+' type='+e.constructor.name);process.exitCode=1}
finally{globalThis.fetch=oldFetch;Object.assign(console,oldConsole);delete globalThis.__p06HttpClient;d.close()}
