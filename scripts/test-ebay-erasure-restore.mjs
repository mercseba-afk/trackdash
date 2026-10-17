import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createHash,randomBytes} from 'node:crypto'
import {createClient} from '@supabase/supabase-js'
import {isolatedPostgrest} from './p06-postgrest-isolated.mjs'
import {loadModule} from './p06-load-module.mjs'
import {localSnapshot} from './p06-local-snapshot.mjs'
import {sealCheckpoint,openCheckpoint} from './p06-recovery-capsule.mjs'
import {reconcileInLab,labGate} from './p06-restore-lab.mjs'
const testStarted=Date.now()
const d=await isolatedPostgrest(),disk=localSnapshot(d),release='00000000-0000-4000-8000-000000000009',source='00000000-0000-4000-8000-000000000005',condition='new_complete_unbuilt'
const client=createClient('http://local.invalid',d.jwt('service_role'),{global:{fetch:d.fetchImpl},auth:{persistSession:false,autoRefreshToken:false}})
const envKeys=['EBAY_ERASURE_ENABLED','EBAY_ERASURE_FENCING_ENABLED','EBAY_ERASURE_KEYS','EBAY_ERASURE_CURRENT_KEY']
const prior=Object.fromEntries(envKeys.map(k=>[k,process.env[k]]))
const inboxKey=randomBytes(32).toString('hex'),archiveKey=randomBytes(32),project='synthetic-trackdash'
Object.assign(process.env,{EBAY_ERASURE_ENABLED:'true',EBAY_ERASURE_FENCING_ENABLED:'true',EBAY_ERASURE_KEYS:JSON.stringify({lab:inboxKey}),EBAY_ERASURE_CURRENT_KEY:'lab'})
globalThis.__p06HttpClient=client
const crypto=await loadModule('lib/ebay/erasure-inbox.ts'),recovery=await loadModule('lib/ebay/account-deletion-recovery.ts'),worker=await loadModule('lib/ebay/erasure-worker.ts'),normal=await loadModule('lib/market/automation/recompute-worker.ts')
const logs=[],report=(...args)=>logs.push(args),ok=async p=>{const r=await p;if(r.error)throw Error('LAB_RPC_REJECTED');return r.data}
const rpc=(a,data,box)=>ok(client.rpc('trackdash_ebay_erasure',{p_action:a,p_key:box.key,p_digest:box.digest,p_data:data||{}}).retry(false))
const exportState=()=>d.json('set role trackdash_erasure_backup;select trackdash_erasure.recovery_checkpoint();')
let stage='setup'
try{
 stage='seed';d.sql(readFileSync('scripts/fixtures/p06a-realistic-seed.sql','utf8'));d.sql(readFileSync('supabase/migrations/0115_market_recompute_service_role_execute.sql','utf8'))
 // Mirror the observed managed grants with EMPTY synthetic Vault objects.
 stage='vault facade';d.sql(`create table vault.secrets(id uuid primary key,secret bytea);
 create function vault.create_secret(text,text,text,uuid) returns uuid language sql as 'select null::uuid';
 create function vault.update_secret(uuid,text,text,text,uuid) returns void language plpgsql as $$begin return;end$$;
 create function vault._crypto_aead_det_decrypt(bytea,bytea,bigint,bytea,bytea) returns bytea language sql as 'select null::bytea';
 revoke all on function vault.create_secret(text,text,text,uuid),vault.update_secret(uuid,text,text,text,uuid),vault._crypto_aead_det_decrypt(bytea,bytea,bigint,bytea,bytea) from public,anon,authenticated;
 grant usage on schema vault to service_role;grant select,delete on vault.secrets,vault.decrypted_secrets to service_role;
 grant execute on function vault.create_secret(text,text,text,uuid),vault.update_secret(uuid,text,text,text,uuid),vault._crypto_aead_det_decrypt(bytea,bytea,bigint,bytea,bytea) to service_role;`)
 assert.equal(d.json("select to_jsonb(has_table_privilege('service_role','vault.decrypted_secrets','select'))"),true)
 stage='hardening';d.sql('drop role if exists trackdash_erasure_backup;');d.sql(readFileSync('proposals/p06a-vault-backup-privileges.sql','utf8'))
 stage='ACL';for(const t of ['vault.secrets','vault.decrypted_secrets'])assert.equal(d.json(`select to_jsonb(has_table_privilege('service_role','${t}','select') or has_table_privilege('service_role','${t}','delete'))`),false)
 assert.equal(d.json("select to_jsonb(has_function_privilege('service_role','vault.create_secret(text,text,text,uuid)','execute'))"),false)
 assert.notEqual(d.sql('set role trackdash_erasure_backup;select * from trackdash_erasure.notifications;',true).status,0)
 assert.notEqual(d.sql('set role trackdash_erasure_backup;select * from vault.decrypted_secrets;',true).status,0)
 assert.notEqual(d.sql('set role service_role;select trackdash_erasure.recovery_checkpoint();',true).status,0)
 console.log('PASS A2 observed broad Vault grants reproduced; proposed least privilege removes direct runtime secret access while private A1 helpers remain usable')
 stage='market seed';const messages=[1,2,3].map(n=>({notificationId:'synthetic-restore-'+n,identifiers:{username:'synthetic-restore-private-'+n}})),boxes=messages.map(crypto.sealInbox)
 for(let n=0;n<3;n++)d.sql(`insert into market_candidates(id,source_id,source_record_key,resolved_release_id,condition,seller_fingerprint,raw_payload,decision,match_confidence,match_evidence) values('00000000-0000-4000-8000-00000000001${n}','${source}','restore-${n}','${release}','${condition}','ebay:${messages[n].identifiers.username}','{"seller":"${messages[n].identifiers.username}","price":12.5}','accepted','exact',array['item_number_exact']);
 insert into price_points(candidate_id,release_id,source_id,observation_type,condition,price,currency,shipping_basis,valuation_price,normalized_price_eur,match_confidence,match_evidence,evidence_group_key,valuation_eligible,sold_on,observed_at,evidence_grade,market_price_eur,market_price_basis)
 values('00000000-0000-4000-8000-00000000001${n}','${release}','${source}','sold_confirmed','${condition}',12.5,'EUR','excluded',12.5,12.5,'exact',array['item_number_exact'],'${release}|${messages[n].identifiers.username}',true,current_date-1,now(),'verified',12.5,'raw_sale');`)
 // Escrow is ONLY synthetic test memory, not a production key export. The
 // database dump explicitly excludes the plaintext Vault facade's table data.
 stage='dump';const escrow=d.json('select jsonb_agg(to_jsonb(s)) from vault.decrypted_secrets s'),baseline=disk.dump()
 stage='initial export';const initial=exportState(),schema=createHash('sha256').update(['p06a-ebay-erasure.sql','p06a-recovery-and-fence.sql','p06a-ingress-suppression.sql'].map(f=>readFileSync('proposals/'+f,'utf8')).join('\n')).digest('hex')
 const old=sealCheckpoint(initial,archiveKey,{project,schema,generation:1,parent:null,keyId:'archive1'})
 stage='create durable states'
 assert.equal(await recovery.eraseEbayUserData(client,messages[0],Date.now()+45000,report),true)
 await rpc('register',{sealed:boxes[1].sealed,digests:boxes[1].digests},boxes[1])
 await rpc('register',{sealed:boxes[2].sealed,digests:boxes[2].digests},boxes[2]);await rpc('erase',{identifiers:[messages[2].identifiers.username]},boxes[2])
 const staleClaim=await rpc('claim',{},boxes[2])
 const snapshot=exportState();assert.deepEqual(snapshot.notifications.map(n=>n.state).sort(),['completed','erased','received'])
 const capsule=sealCheckpoint(snapshot,archiveKey,{project,schema,generation:2,parent:old.witness.digest,keyId:'archive1'})
 assert.ok(!JSON.stringify(capsule.envelope).includes('synthetic-restore-private'))
 // Witness persists outside both the DB snapshot and encrypted archive under
 // test. This is an ASSUMPTION to provision in A3, not a production integration.
 const trusted=structuredClone(capsule.witness)
 for(const bad of [{...capsule.envelope,ciphertext:capsule.envelope.ciphertext.slice(0,-4)},old.envelope,{...capsule.envelope,header:{...capsule.envelope.header,project:'wrong'}}])assert.throws(()=>openCheckpoint(bad,{archive1:archiveKey},trusted),/RECOVERY_CAPSULE_REJECTED/)
 assert.throws(()=>openCheckpoint(capsule.envelope,{},trusted),/RECOVERY_CAPSULE_REJECTED/)
 assert.throws(()=>openCheckpoint(capsule.envelope,{archive1:randomBytes(32)},trusted),/RECOVERY_CAPSULE_REJECTED/)
 assert.throws(()=>openCheckpoint(capsule.envelope,{archive1:archiveKey},null),/RECOVERY_CAPSULE_REJECTED/)
 const nextArchiveKey=randomBytes(32),rotated=sealCheckpoint(openCheckpoint(capsule.envelope,{archive1:archiveKey},trusted),nextArchiveKey,{...trusted,generation:3,parent:trusted.digest,keyId:'archive2'})
 assert.deepEqual(openCheckpoint(rotated.envelope,{archive2:nextArchiveKey},rotated.witness),snapshot)
 console.log('PASS encrypted checkpoint authenticates project/schema/head, rejects stale/missing/truncated/tampered archive and missing/wrong key; archive rewrap preserves all notification/tombstone state')
 // Demonstrate the open RPO gap instead of claiming periodic export is enough.
 const tailMessage={notificationId:'synthetic-unarchived-tail',identifiers:{username:'synthetic-tail-private'}},tailBox=crypto.sealInbox(tailMessage)
 await rpc('register',{sealed:tailBox.sealed,digests:tailBox.digests},tailBox)
 assert.equal(d.json('select count(*) from trackdash_erasure.notifications'),4)
 assert.equal(snapshot.notifications.some(n=>n.notification_key===tailBox.key),false)
 console.log('OPEN A3: notification registered after checkpoint is absent from that checkpoint; pre-ACK independent receipt/head integration is still required')
 stage='real pg_restore'
 disk.restore(baseline);await d.reload()
 assert.equal(d.json('select count(*) from trackdash_erasure.notifications'),0)
 assert.equal(d.json('select count(*) from trackdash_erasure.suppressed_identities'),0)
 assert.equal(d.json('select count(*) from market_candidates where seller_fingerprint is not null'),3)
 assert.equal(labGate(d).mayLeaveSyntheticQuarantine,false)
 const restored=openCheckpoint(capsule.envelope,{archive1:archiveKey},trusted)
 assert.throws(()=>reconcileInLab(d,restored),/RESTORE_RECONCILIATION_REJECTED/)
 assert.equal(d.json('select count(*) from trackdash_erasure.notifications'),0)
 // Recovered suppression pepper is validated by A1 key_check; wrong recovery
 // material must roll back the complete import instead of accepting new data.
 d.sql(`insert into vault.decrypted_secrets(id,decrypted_secret) values('${escrow[0].id}','${'2'.repeat(64)}');`)
 assert.throws(()=>reconcileInLab(d,restored),/RESTORE_RECONCILIATION_REJECTED/)
 d.sql(`update vault.decrypted_secrets set decrypted_secret='${escrow[0].decrypted_secret}' where id='${escrow[0].id}';`)
 stage='reconciliation failure atomicity'
 const conflicting=structuredClone(restored);conflicting.notification_work[0].notification_key='f'.repeat(64)
 assert.throws(()=>reconcileInLab(d,conflicting),/RESTORE_RECONCILIATION_REJECTED/)
 assert.equal(d.json('select count(*) from trackdash_erasure.notifications'),0)
 assert.equal(d.json('select count(*) from trackdash_erasure.suppressed_identities'),0)
 const locked=d.sqlAsync('begin;select pg_advisory_xact_lock(70601601);select pg_sleep(2);commit;')
 for(let n=0;n<30;n++){if(d.json("select count(*) from pg_locks where locktype='advisory' and objid=70601601 and granted")>0)break;await new Promise(r=>setTimeout(r,20))}
 assert.throws(()=>reconcileInLab(d,restored),/RESTORE_RECONCILIATION_REJECTED/);assert.equal((await locked).status,0)
 assert.equal(d.json('select count(*) from trackdash_erasure.notifications'),0)
 stage='reconciliation'
 reconcileInLab(d,restored)
 assert.equal(d.json('select count(*) from trackdash_erasure.notifications'),3)
 assert.equal(d.json("select count(*) from trackdash_erasure.notifications where notification_key='"+tailBox.key+"'"),0)
 assert.equal(d.json('select count(*) from trackdash_erasure.suppressed_identities'),snapshot.suppressed_identities.length)
 assert.equal(d.json('select count(*) from market_candidates where seller_fingerprint is not null'),1)
 assert.equal(d.json('select sum(price) from price_points'),37.5)
 assert.equal(labGate(d,{witnessVerified:true}).mayLeaveSyntheticQuarantine,false)
 const invalid=await client.rpc('trackdash_ebay_erasure',{p_action:'publish',p_key:boxes[2].key,p_digest:boxes[2].digest,p_data:{...staleClaim,writes:[]}}).retry(false);assert.ok(invalid.error)
 console.log('PASS real pg_dump/pg_restore resurrects synthetic PII in quarantine; independent authenticated checkpoint + validated key escrow restores notifications/tombstones and re-scrubs without completed plaintext payloads; stale claims rejected')
 stage='pending recovery'
 for(let n=0;n<8;n++){
  await worker.runErasureRecoveryTick(client,Date.now()+45000,report,async a=>logs.push(['alarm',a]))
  if(d.json("select count(*) from trackdash_erasure.notifications where state<>'completed'")===0)break
  d.sql("update trackdash_erasure.notifications set next_attempt_at=now();")
 }
 stage='canonical worker';const normalResult=await normal.runMarketRecomputeBatch(8);assert.equal(normalResult.failed,0)
 stage='queue assertions';
 // Queue finish is asserted separately: failure cannot be hidden by a shape.
 assert.equal(d.json("select count(*) from trackdash_erasure.notifications where state<>'completed'"),0)
 assert.equal(d.json('select count(*) from market_recompute_queue'),0)
 assert.equal(d.json('select count(*) from market_candidates where seller_fingerprint is not null'),0)
 assert.equal(d.json('select sum(price) from price_points'),37.5)
 assert.equal(labGate(d,{witnessVerified:true}).mayLeaveSyntheticQuarantine,true)
 // Same latest archive can be re-imported after a partial recovery. It unions
 // tombstones and reopens work conservatively rather than silently dropping it.
 reconcileInLab(d,restored);assert.equal(d.json('select count(*) from trackdash_erasure.notifications'),3);assert.equal(labGate(d,{witnessVerified:true}).mayLeaveSyntheticQuarantine,false)
 const captured=JSON.stringify(logs)+d.logs()+d.databaseLogs();for(const value of [inboxKey,escrow[0].decrypted_secret,archiveKey.toString('hex'),tailMessage.identifiers.username,...messages.map(m=>m.identifiers.username)])assert.ok(!captured.includes(value))
 console.log('PASS received/erased/completed obligations recover without provider retry, canonical recomputes drain before lab gate, repeated reconciliation preserves obligations and non-personal prices; no secrets/PII in captured diagnostics')
 console.log('PERF synthetic restore artifacts:',JSON.stringify({databaseDumpBytes:baseline.length,checkpointBytes:Buffer.byteLength(JSON.stringify(capsule.envelope)),notifications:3,tombstones:snapshot.suppressed_identities.length,httpRequests:d.metrics.requests,elapsedMs:Date.now()-testStarted}))
}catch{console.error('RESTORE_LAB_FAILED stage='+stage);process.exitCode=1}
finally{delete globalThis.__p06HttpClient;for(const k of envKeys)if(prior[k]===undefined)delete process.env[k];else process.env[k]=prior[k];d.close()}
