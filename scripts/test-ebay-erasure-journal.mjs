// Real AWS SDK + HTTP DynamoDB emulator; does NOT certify managed durability/IAM.
import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {createServer} from 'node:net'
import {readFileSync} from 'node:fs'
import {randomBytes,createSign,generateKeyPairSync} from 'node:crypto'
import {DynamoDBClient,CreateTableCommand} from '@aws-sdk/client-dynamodb'
import {DynamoDBDocumentClient} from '@aws-sdk/lib-dynamodb'
import {createClient} from '@supabase/supabase-js'
import {isolatedPostgrest} from './p06-postgrest-isolated.mjs'
import {loadModule} from './p06-load-module.mjs'
import {localSnapshot} from './p06-local-snapshot.mjs'
const socket=createServer();await new Promise(r=>socket.listen(0,'127.0.0.1',r));const port=socket.address().port;await new Promise(r=>socket.close(r))
const python=process.env.P06_MOTO_PYTHON||'work/moto-venv/bin/python'
// Werkzeug + Moto otherwise emit two Date headers; the SDK correctly cannot
// sign using that invalid HTTP clock. Emit one valid Date, as AWS does.
const serverCode=`from moto.server import DomainDispatcherApplication,create_backend_app
from werkzeug.serving import make_server,WSGIRequestHandler
class SingleDate(WSGIRequestHandler):
 def send_response(self,*a,**kw):
  self.date_sent=False
  return super().send_response(*a,**kw)
 def send_header(self,k,v):
  if k.lower()=='date':
   if getattr(self,'date_sent',False): return
   self.date_sent=True
  return super().send_header(k,v)
s=make_server('127.0.0.1',${port},DomainDispatcherApplication(create_backend_app),threaded=True,request_handler=SingleDate)
print('READY',flush=True)
s.serve_forever()`
const moto=spawn(python,['-u','-c',serverCode],{stdio:['ignore','pipe','pipe']})
let serviceLogs='';moto.stdout.on('data',x=>serviceLogs+=x);moto.stderr.on('data',x=>serviceLogs+=x)
let d,stage='service setup';const oldFetch=globalThis.fetch,oldConsole={info:console.info,warn:console.warn,error:console.error};const appLogs=[]
try{
 for(let n=0;n<100&&!serviceLogs.includes('READY');n++){if(moto.exitCode!==null)throw Error('EMULATOR_UNAVAILABLE');await new Promise(r=>setTimeout(r,100))}
 assert.ok(serviceLogs.includes('READY'))
 const aws=new DynamoDBClient({endpoint:`http://127.0.0.1:${port}`,region:'us-east-1',maxAttempts:1,credentials:{accessKeyId:'synthetic',secretAccessKey:'synthetic-secret'}})
 const table='trackdash-erasure-synthetic'
 await aws.send(new CreateTableCommand({TableName:table,BillingMode:'PAY_PER_REQUEST',AttributeDefinitions:[{AttributeName:'pk',AttributeType:'S'},{AttributeName:'state',AttributeType:'S'},{AttributeName:'createdAt',AttributeType:'S'}],KeySchema:[{AttributeName:'pk',KeyType:'HASH'}],GlobalSecondaryIndexes:[{IndexName:'pending',KeySchema:[{AttributeName:'state',KeyType:'HASH'},{AttributeName:'createdAt',KeyType:'RANGE'}],Projection:{ProjectionType:'KEYS_ONLY'}}]}))
 const document=DynamoDBDocumentClient.from(aws),calls=[];document.middlewareStack.add((next,context)=>async args=>{calls.push(context.commandName);return next(args)},{step:'initialize'})
 const api=await loadModule('lib/ebay/erasure-journal.ts'),journal=new api.DynamoErasureJournal(document,table)
 d=await isolatedPostgrest();const disk=localSnapshot(d),release='00000000-0000-4000-8000-000000000009',source='00000000-0000-4000-8000-000000000005'
 const client=createClient('http://local.invalid',d.jwt('service_role'),{global:{fetch:d.fetchImpl},auth:{persistSession:false,autoRefreshToken:false}})
 globalThis.__p06HttpClient=client
 process.env.EBAY_ERASURE_CURRENT_KEY='test';process.env.EBAY_ERASURE_KEYS=JSON.stringify({test:randomBytes(32).toString('hex')});process.env.EBAY_ERASURE_FENCING_ENABLED='true'
 const acceptance=await loadModule('lib/ebay/erasure-acceptance.ts'),worker=await loadModule('lib/ebay/erasure-journal-worker.ts'),inbox=await loadModule('lib/ebay/erasure-inbox.ts')
 d.sql(readFileSync('scripts/fixtures/p06a-realistic-seed.sql','utf8'));d.sql('drop role if exists trackdash_erasure_monitor;drop role if exists trackdash_erasure_worker;drop role if exists trackdash_erasure_ingress;');d.sql(readFileSync('proposals/p06a-minimization-and-token-recovery.sql','utf8'));await d.reload()
 for(let n=1;n<=2;n++)d.sql(`insert into market_candidates(id,source_id,source_record_key,resolved_release_id,condition,seller_fingerprint,decision,match_confidence,match_evidence) values('00000000-0000-4000-8000-00000000001${n}','${source}','synthetic-${n}','${release}','new_complete_unbuilt','ebay:SyntheticSeller${n}','accepted','exact',array['item_number_exact']);
 insert into price_points(candidate_id,release_id,source_id,observation_type,condition,price,currency,shipping_basis,valuation_price,normalized_price_eur,match_confidence,match_evidence,evidence_group_key,valuation_eligible,sold_on,observed_at,evidence_grade,market_price_eur,market_price_basis)
 values('00000000-0000-4000-8000-00000000001${n}','${release}','${source}','sold_confirmed','new_complete_unbuilt',12.5,'EUR','excluded',12.5,12.5,'exact',array['item_number_exact'],'eg:synthetic-${n}',true,current_date-1,now(),'verified',12.5,'raw_sale');`)
 const escrow=d.json('select jsonb_agg(to_jsonb(v)) from vault.decrypted_secrets v'),baseline=disk.dump()
 const message=n=>({notificationId:'synthetic-receipt-'+n,identifiers:{username:'SyntheticSeller'+n}}),logs=[],report=(...a)=>logs.push(a)
 const ingress=createClient('http://local.invalid',d.jwt('trackdash_erasure_ingress'),{global:{fetch:d.fetchImpl},auth:{persistSession:false,autoRefreshToken:false}})
 const accept=n=>acceptance.acceptEbayErasure(ingress,journal,message(n),Date.now()+30000)
 const scoped=createClient('http://local.invalid',d.jwt('trackdash_erasure_worker'),{global:{fetch:d.fetchImpl},auth:{persistSession:false,autoRefreshToken:false}})
 const tick=()=>worker.runJournalRecovery(scoped,journal,Date.now()+45000,report,async a=>logs.push(['alarm',a]))
 stage='persistent acceptance'
 Object.assign(process.env,{EBAY_ERASURE_ENABLED:'true',EBAY_ENV:'production',EBAY_CLIENT_ID:'synthetic-client',EBAY_CLIENT_SECRET:'synthetic-client-secret'})
 const pair=generateKeyPairSync('ec',{namedCurve:'prime256v1'})
 globalThis.fetch=async url=>String(url).includes('/oauth2/token')?Response.json({access_token:'synthetic-oauth-token',expires_in:3600}):String(url).includes('/public_key/')?Response.json({key:pair.publicKey.export({type:'spki',format:'pem'})}):Promise.reject(Error('UNEXPECTED_EXTERNAL_FETCH'))
 globalThis.__p06HttpClient=ingress;globalThis.__p06Journal=journal
 const route=await loadModule('app/api/ebay/marketplace-account-deletion/route.ts',{journal:true})
 console.info=(...a)=>appLogs.push(a);console.warn=(...a)=>appLogs.push(a);console.error=(...a)=>appLogs.push(a)
 const body=JSON.stringify({metadata:{topic:'MARKETPLACE_ACCOUNT_DELETION'},notification:{notificationId:message(1).notificationId,data:message(1).identifiers}}),sign=createSign('ssl3-sha1');sign.update(body);sign.end()
 const header=Buffer.from(JSON.stringify({kid:'synthetic-signature-key',signature:sign.sign(pair.privateKey,'base64')})).toString('base64')
 const req=value=>new Request('https://synthetic.invalid/deletion',{method:'POST',headers:{'x-ebay-signature':header},body:value})
 const responses=await Promise.all([route.POST(req(body)),route.POST(req(body))]);assert.deepEqual(responses.map(r=>r.status),[202,202])
 const requestsBefore=d.metrics.requests;assert.equal((await route.POST(req(body.replace('SyntheticSeller1','tampered')))).status,412);assert.equal(d.metrics.requests,requestsBefore)
 const outageBody=body.replace('synthetic-receipt-1','synthetic-receipt-4'),outageSign=createSign('ssl3-sha1');outageSign.update(outageBody);outageSign.end();const outageHeader=Buffer.from(JSON.stringify({kid:'synthetic-signature-key',signature:outageSign.sign(pair.privateKey,'base64')})).toString('base64');const outageRequest=new Request('https://synthetic.invalid/deletion',{method:'POST',headers:{'x-ebay-signature':outageHeader},body:outageBody});const savedJournal=globalThis.__p06Journal;globalThis.__p06Journal={put:async()=>{throw Error('SYNTHETIC_JOURNAL_OUTAGE')}};assert.ok((await route.POST(outageRequest)).status>=500);globalThis.__p06Journal=savedJournal;assert.equal((await journal.meta(Date.now()+10000)).accepted,1)
 Object.assign(console,oldConsole);globalThis.fetch=oldFetch;globalThis.__p06HttpClient=client
 console.log('PASS complete signed webhook -> real role-scoped PostgREST -> HTTP DynamoDB transaction -> 202; concurrent duplicates and tampered signature never duplicate/register unsafe work')
 assert.equal((await journal.meta(Date.now()+10000)).accepted,1)
 assert.equal(d.json('select count(*) from trackdash_erasure.notifications'),0)
 await assert.rejects(acceptance.acceptEbayErasure(ingress,journal,{...message(1),identifiers:{username:'DIFFERENT'}},Date.now()+10000))
 const raw=await journal.get(inbox.inboxIdentity(message(1)).key,Date.now()+10000)
 for(const name of ['SyntheticSeller1','DIFFERENT'])assert.ok(!JSON.stringify(raw).includes(name))
 let result=await tick();assert.equal(result.failed,0);assert.equal(d.json("select count(*) from trackdash_erasure.notifications where state='completed'"),1)
 await accept(2) // after the last DB snapshot: no primary registration at all
 // Lost response after durable PUT: no ACK, but obligation remains recoverable.
 await assert.rejects(acceptance.acceptEbayErasure(ingress,{...journal,put:async(r,d,t)=>{await journal.put(r,d,t);throw Error('SYNTHETIC_LOST_RESPONSE')}},message(3),Date.now()+10000))
 assert.equal((await journal.meta(Date.now()+10000)).accepted,3)
 console.log('PASS actual DynamoDB SDK/HTTP: transactional concurrent duplicates/counters, conflict rejection, token-only receipt and lost response retain recoverable obligations')
 const lagged=new Proxy(journal,{get(t,k){if(k==='pending')return async()=>[];const value=Reflect.get(t,k);return typeof value==='function'?value.bind(t):value}})
 const lagResult=await worker.runJournalRecovery(client,lagged,Date.now()+45000,report,async()=>{});assert.equal(lagResult.healthy,false)
 console.log('PASS empty eventually-consistent pending index cannot hide an accepted unregistered obligation')
 stage='primary loss and restore'
 d.sql('drop schema trackdash_erasure cascade;drop schema public cascade;')
 await assert.rejects(tick())
 assert.equal((await journal.meta(Date.now()+10000)).accepted,3)
 stage='pg_restore after schema loss';d.sql('create schema public authorization pg_database_owner;');disk.restore(baseline);await d.reload();stage='missing key replay'
 assert.equal(d.json('select count(*) from trackdash_erasure.notifications'),0)
 result=await tick();assert.ok(result.failed>0) // missing Vault pepper fails closed
 assert.ok(d.json("select count(*) from trackdash_erasure.notifications where state<>'completed'")>0)
 const paused=await client.from('market_candidates').update({seller_fingerprint:'synthetic-forbidden-write'}).eq('source_record_key','synthetic-1').retry(false);assert.equal(paused.error?.code,'PT503')
 d.sql("update trackdash_erasure.notifications set attempts=8,next_attempt_at=now(),job_locked_until=null where state<>'completed';")
 const exhausted=await tick();assert.equal(exhausted.healthy,false);assert.equal(d.json('select max(slow_attempts) from trackdash_erasure.notifications'),1)
 assert.ok(d.json("select count(*) from trackdash_erasure.notifications where attempts>=8 and next_attempt_at>now()+interval '5 hours'")>0)
 for(const e of escrow)d.sql(`insert into vault.decrypted_secrets(id,decrypted_secret) values('${e.id}','${e.decrypted_secret}');`)
 d.sql("update trackdash_erasure.notifications set next_attempt_at=now(),job_locked_until=null;")
 for(let n=0;n<8;n++){result=await tick();if(d.json("select count(*) from trackdash_erasure.notifications where state='completed'")===3)break;d.sql("update trackdash_erasure.notifications set next_attempt_at=now(),job_locked_until=null;")}
 assert.equal(d.json("select count(*) from trackdash_erasure.notifications where state='completed'"),3)
 assert.equal(d.json('select count(*) from market_candidates where seller_fingerprint is not null'),0)
 assert.equal(d.json('select sum(price) from price_points'),25)
 assert.equal((await journal.meta(Date.now()+10000)).accepted,3)
 console.log('PASS database schema loss + real pg_restore: all receipts replay, including post-snapshot/unregistered/lost-response tail; missing key fails closed; recovered key resumes without provider retries')
 stage='privacy'
 assert.ok((await ingress.from('market_candidates').select('id').limit(1).retry(false)).error)
 assert.ok((await scoped.from('profiles').select('id').limit(1).retry(false)).error)
 assert.notEqual(d.sql('set role trackdash_erasure_worker;select * from vault.decrypted_secrets;',true).status,0)
 const captured=JSON.stringify(logs)+JSON.stringify(appLogs)+d.logs()+d.databaseLogs()+serviceLogs
 for(const name of ['SyntheticSeller1','SyntheticSeller2','SyntheticSeller3',...escrow.map(e=>e.decrypted_secret),...Object.values(JSON.parse(process.env.EBAY_ERASURE_KEYS)),client.supabaseKey,ingress.supabaseKey,scoped.supabaseKey,'synthetic-secret','synthetic-client-secret'])assert.ok(!captured.includes(name))
 console.log('PASS capped six-hour slow recovery survives internal exhaustion without resetting attempts; captured diagnostics contain no seller identifier or key; managed AWS/Supabase/recipient-delivery validation remains a release gate')
 const settled=await journal.meta(Date.now()+10000);assert.deepEqual(settled,{accepted:3,completed:3});const scansBefore=calls.filter(c=>c==='ScanCommand').length;const idle=await tick();assert.equal(calls.filter(c=>c==='ScanCommand').length,scansBefore);assert.equal(idle.healthy,true);assert.equal(idle.imported,0);console.log('PASS restore detected by independent monotonic completion counter; recovery converges and normal idle work does not scan historical receipts');aws.destroy()
}catch(e){console.error('JOURNAL_LAB_FAILED stage='+stage+' type='+e.constructor.name+' code='+(/^[A-Z_]+$/.test(e.code??'')?e.code:'UNKNOWN'));process.exitCode=1}
finally{Object.assign(console,oldConsole);globalThis.fetch=oldFetch;delete globalThis.__p06Journal;delete globalThis.__p06HttpClient;if(d)d.close();moto.kill('SIGTERM')}
