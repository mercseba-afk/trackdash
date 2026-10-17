import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {randomBytes,createHmac} from 'node:crypto'
import {createClient} from '@supabase/supabase-js'
import {isolatedPostgrest} from './p06-postgrest-isolated.mjs'
import {loadModule} from './p06-load-module.mjs'
const d=await isolatedPostgrest(),release='00000000-0000-4000-8000-000000000009',source='00000000-0000-4000-8000-000000000005',condition='new_complete_unbuilt'
const client=createClient('http://local.invalid',d.jwt('service_role'),{global:{fetch:d.fetchImpl},auth:{persistSession:false,autoRefreshToken:false}})
const seller='synthetic-deleted-seller',alias='synthetic-deleted-id',eias='synthetic/v^1.1#private/token'
const ok=async promise=>{const r=await promise;if(r.error)throw Error('ISOLATED_'+r.error.code);return r.data}
let serial=0
const register=async()=>{const key=(++serial).toString(16).padStart(64,'0'),digest='c'.repeat(64);const rpc=(action,data={})=>client.rpc('trackdash_ebay_erasure',{p_action:action,p_key:key,p_digest:digest,p_data:data}).retry(false);await ok(rpc('register',{sealed:{keyId:'synthetic'}}));return rpc}
const erase=async rpc=>ok(rpc('erase',{identifiers:[seller,alias,eias]}))
const candidate=(key,identity=seller)=>({source_id:source,source_record_key:key,resolved_release_id:release,condition,seller_fingerprint:'ebay:'+identity,raw_payload:{seller:identity,token:eias,amount:17.5,units:3,nested:[{[alias]:identity}],seller_url:'https://www.ebay.it/usr/'+identity},decision:'accepted',match_confidence:'exact',match_evidence:['item_number_exact']})
const put=payload=>ok(client.from('market_candidates').upsert(payload,{onConflict:'source_id,source_record_key'}).select().single())
const assertPrivateGone=doc=>{for(const id of [seller,alias,eias])assert.ok(!JSON.stringify(doc).toLowerCase().includes(id.toLowerCase()));assert.equal(doc.raw_payload.amount,17.5);assert.equal(doc.raw_payload.units,3)}
const waitForLock=async()=>{for(let i=0;i<100;i++){if(d.json("select to_jsonb(exists(select 1 from pg_locks where locktype='advisory' and objid=70601601 and database=(select oid from pg_database where datname=current_database()) and granted and pid<>pg_backend_pid()))"))return;await new Promise(r=>setTimeout(r,10))}throw Error('ISOLATED_LOCK_NOT_ACQUIRED')}
try{
 d.sql(readFileSync('scripts/fixtures/p06a-realistic-seed.sql','utf8'))
 const keyCanary=d.json('select to_jsonb(decrypted_secret) from vault.decrypted_secrets limit 1')
 const stale=candidate('stale-original'),before=await put(stale),rpc=await register()
 // Activation itself cannot race a writer that began with suppression off.
 d.sql('update trackdash_erasure.suppression_config set enabled=false;')
 let activationWriter=d.sqlAsync(`begin;set role service_role;update market_candidates set updated_at=now() where id='${before.id}';select pg_sleep(.7);commit;`)
 await waitForLock();assert.notEqual(d.sql('update trackdash_erasure.suppression_config set enabled=true;',true).status,0);assert.equal((await activationWriter).status,0)
 d.sql('update trackdash_erasure.suppression_config set enabled=true;')
 // In-flight ingestion holds the shared lock before erasure; no tombstone or
 // partial scrub may commit when the exclusive lock cannot be acquired.
 let running=d.sqlAsync(`begin;set role service_role;update market_candidates set updated_at=now() where id='${before.id}';select pg_sleep(.7);commit;`)
 await waitForLock();let busy=await rpc('erase',{identifiers:[seller,alias,eias]});assert.ok(busy.error);assert.equal(d.json('select count(*) from trackdash_erasure.suppressed_identities'),0);assert.equal((await running).status,0)
 await erase(rpc);assertPrivateGone(await put(stale))
 // Same row, INSERT with a new listing identity, historical import, aliases,
 // case normalization and concurrent duplicate writers use the unchanged API.
 for(const identity of [seller.toUpperCase(),alias,eias])assertPrivateGone(await put(candidate('history-'+(++serial),identity)))
 assertPrivateGone(await put({...candidate('encoded-url'),raw_payload:{seller_url:'https://www.ebay.it/usr/%73ynthetic-deleted-seller',description:'This kit by '+seller+'!',amount:17.5,units:3}}))
 const duplicates=await Promise.all([put(candidate('duplicate')),put(candidate('duplicate'))]);duplicates.forEach(assertPrivateGone)
 const survivor=await put({...candidate('unrelated','unrelated-seller'),raw_payload:{amount:17.5,units:3,seller:'unrelated-seller'}});assert.equal(survivor.seller_fingerprint,'ebay:unrelated-seller')
 const batch=Array.from({length:64},(_,n)=>({...candidate('bulk-unrelated-'+n,'unrelated-'+n),raw_payload:{amount:17.5,units:3,seller:'unrelated-'+n}}))
 const batchStart=Date.now(),batchRequests=d.metrics.requests;await ok(client.from('market_candidates').upsert(batch,{onConflict:'source_id,source_record_key'}));assert.equal(d.metrics.requests-batchRequests,1)
 assert.equal(d.json("select count(*) from market_candidates where source_record_key like 'bulk-unrelated-%' and seller_fingerprint is not null"),64)
 console.log('PERF synthetic unaffected ingress after suppression:',JSON.stringify({rows:64,wallMs:Date.now()-batchStart,requests:1}))
 console.log('PASS ingress before/after erasure, historical/new IDs, aliases/case, duplicate concurrent writes, private JSON keys/URLs, unaffected seller and prices')
 // An erase owning the exclusive lock rejects rather than waits with a stale
 // snapshot. Retrying the exact old writer afterwards safely scrubs it.
 running=d.sqlAsync('begin;select pg_advisory_xact_lock(70601601);select pg_sleep(.7);commit;');await waitForLock()
 busy=await client.from('market_candidates').upsert(candidate('during-erasure'),{onConflict:'source_id,source_record_key'});assert.equal(busy.error.code,'PT409');assert.equal((await running).status,0);assertPrivateGone(await put(candidate('during-erasure')))
 const rr=d.sql(`begin isolation level repeatable read;set role service_role;update market_candidates set updated_at=now();commit;`,true);assert.notEqual(rr.status,0)
 console.log('PASS ingress during exclusive erasure fails closed; unchanged writer retry scrubs; repeatable-read snapshots rejected')
 // Delayed point/offer writes must not recover an evidence key once the
 // candidate no longer exposes a seller. Test the real existing repository.
 const row=await put(candidate('delayed-dependent'))
 const repoModule=await loadModule('lib/market/pipeline/market-r3-repository.ts'),repo=new repoModule.MarketR3Repository(client)
 const offer=await repo.upsertOfferState({candidateId:row.id,releaseId:release,sourceId:source,condition,channel:'marketplace',availability:'in_stock',sellerFingerprint:seller,itemPrice:17.5,currency:'EUR',itemPriceEUR:17.5,observedAt:new Date().toISOString()});assert.equal(offer.sellerFingerprint,null);assert.equal(offer.itemPriceEUR,17.5)
 let point=await ok(client.from('price_points').upsert({candidate_id:row.id,release_id:release,source_id:source,observation_type:'sold_confirmed',condition,price:17.5,currency:'EUR',shipping_basis:'excluded',valuation_price:17.5,normalized_price_eur:17.5,match_confidence:'exact',match_evidence:['item_number_exact'],evidence_group_key:'unrecognized-stale-group',valuation_eligible:true,sold_on:'2026-10-15',observed_at:new Date().toISOString(),evidence_grade:'verified',market_price_eur:17.5,market_price_basis:'raw_sale'},{onConflict:'candidate_id'}).select().single())
 assert.equal(point.valuation_eligible,false);assert.equal(point.evidence_group_key,null);assert.equal(point.price,17.5);assert.ok(point.quality_flags.includes('seller_unknown'))
 point=await ok(client.from('price_points').update({evidence_group_key:'again-from-an-old-writer',valuation_eligible:true}).eq('candidate_id',row.id).select().single());assert.equal(point.evidence_group_key,null);assert.equal(point.valuation_eligible,false)
 // A deleted identity discovered only in a point must also mark its candidate.
 const anonymous=await put({...candidate('point-only'),seller_fingerprint:null,raw_payload:{amount:17.5,units:3}})
 const {id:ignoreId,created_at:ignoreCreated,updated_at:ignoreUpdated,...pointTemplate}=point
 let indirect=await ok(client.from('price_points').upsert({...pointTemplate,candidate_id:anonymous.id,evidence_group_key:release+'|'+seller,valuation_eligible:true,evidence_grade:'verified'},{onConflict:'candidate_id'}).select().single());assert.equal(indirect.valuation_eligible,false)
 indirect=await ok(client.from('price_points').update({evidence_group_key:'opaque-delayed-regroup',valuation_eligible:true}).eq('candidate_id',anonymous.id).select().single());assert.equal(indirect.evidence_group_key,null);assert.equal(indirect.valuation_eligible,false)
 console.log('PASS real unchanged offer repository and delayed point INSERT/UPDATE/grouping retain prices, suppress identity and cannot re-enable erased quality')
 // Bulk import writes on aggregate/monthly source tables retain amounts,
 // independent of whether an adapter has been updated.
 const aggregate={source_id:source,release_id:release,item_number:'00001',attribution_status:'release_exact',grain:'full_history',period_start:'2026-01-01',period_end:'2026-10-15',condition,query_key:'historical',sales_count:3,average_item_price:17.5,currency:'EUR',market_average_eur:17.5,raw_payload:{seller,price:17.5}}
 let agg=await ok(client.from('market_aggregate_observations').upsert(aggregate,{onConflict:'source_id,query_key,period_start,period_end,item_number'}).select().single());assert.equal(agg.raw_payload.seller,null);assert.equal(agg.average_item_price,17.5)
 agg=await ok(client.from('market_aggregate_observations').update({raw_payload:{seller:alias,price:17.5}}).eq('id',agg.id).select().single());assert.equal(agg.raw_payload.seller,null)
 const monthly={source_id:source,release_id:release,month:'2026-10-01',condition,query_key:'historical',sales_count:3,average_price:17.5,currency:'EUR',market_average_eur:17.5,raw_payload:{seller,price:17.5}}
 let month=await ok(client.from('market_monthly_source_stats').upsert(monthly,{onConflict:'release_id,source_id,month,condition,query_key'}).select().single());assert.equal(month.raw_payload.seller,null);assert.equal(month.average_price,17.5)
 month=await ok(client.from('market_monthly_source_stats').update({raw_payload:{seller:alias,price:17.5}}).eq('id',month.id).select().single());assert.equal(month.raw_payload.seller,null)
 console.log('PASS historical aggregate/monthly INSERT and UPDATE scrub identities while amounts and counts survive')
 // Once recognized, an inactive source remains eBay even if its slug/policy
 // is removed. Tombstones do not depend on current adapter enablement.
 d.sql(`update price_sources set slug='renamed-historical-provider',is_active=false where id='${source}';delete from market_source_policies where source_id='${source}';`)
 assertPrivateGone(await put(candidate('disabled-history')))
 // Caller-supplied settings cannot bypass the private guard; no service access
 // to Vault, tokens, key bindings, suppression switches or destructive purge.
 for(const table of ['suppression_keys','suppressed_identities','suppressed_candidates','suppression_config','ebay_sources'])for(const operation of ['select * from','delete from'])assert.notEqual(d.sql(`set role service_role;${operation} trackdash_erasure.${table};`,true).status,0)
 assert.notEqual(d.sql('set role service_role;select * from vault.decrypted_secrets;',true).status,0)
 assert.notEqual(d.sql('set role service_role;select trackdash_erasure.suppression_keyring();',true).status,0)
 assert.notEqual(d.sql("set role service_role;set session_replication_role='replica';",true).status,0)
 for(const role of ['anon','authenticated'])assert.notEqual(d.sql(`set role ${role};select trackdash_erasure.remember(array['test']);`,true).status,0)
 assert.notEqual(d.sql('update trackdash_erasure.suppression_config set enabled=false;',true).status,0)
 const privateDump=d.json("select jsonb_build_object('identities',(select jsonb_agg(to_jsonb(t)) from trackdash_erasure.suppressed_identities t),'candidates',(select jsonb_agg(to_jsonb(t)) from trackdash_erasure.suppressed_candidates t))");for(const id of [seller,alias,eias,keyCanary])assert.ok(!JSON.stringify(privateDump).includes(id))
 // Adding a new key version must retain matching against older tombstones.
 const nextKey=randomBytes(32).toString('hex'),nextCheck=createHmac('sha256',Buffer.from(nextKey,'hex')).update('trackdash/ebay/suppression-key-check-v1').digest('hex')
 d.sql(`insert into vault.decrypted_secrets values('00000000-0000-4000-8000-000000000098','${nextKey}');insert into trackdash_erasure.suppression_keys(key_id,vault_secret_id,key_check) values('next','00000000-0000-4000-8000-000000000098',decode('${nextCheck}','hex'));`)
 assertPrivateGone(await put(candidate('after-keyring-extension')))
 assert.notEqual(d.sql("delete from trackdash_erasure.suppression_keys where key_id='synthetic';",true).status,0)
 await erase(await register());const count=d.json('select count(*) from trackdash_erasure.suppressed_identities');await erase(await register());assert.equal(d.json('select count(*) from trackdash_erasure.suppressed_identities'),count)
 d.sql("update vault.decrypted_secrets set decrypted_secret=repeat('2',64) where id='00000000-0000-4000-8000-000000000099';")
 const changedKey=await client.from('market_candidates').upsert(candidate('changed-key'),{onConflict:'source_id,source_record_key'});assert.equal(changedKey.error.code,'PT503');assert.equal(d.json("select count(*) from market_candidates where source_record_key='changed-key'"),0)
 d.sql("update vault.decrypted_secrets set decrypted_secret='invalid';")
 const missing=await client.from('market_candidates').upsert(candidate('missing-key'),{onConflict:'source_id,source_record_key'});assert.equal(missing.error.code,'PT503');assert.equal(d.json("select count(*) from market_candidates where source_record_key='missing-key'"),0)
 assert.ok(!JSON.stringify(missing.error).includes(seller));assert.ok(!JSON.stringify(missing.error).includes('invalid'))
 console.log('PASS historical source memory, deduplicated tombstones, private ACL/key access, missing-key and bypass attempts fail closed')
}finally{d.close()}
