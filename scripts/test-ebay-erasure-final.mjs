import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {randomBytes} from 'node:crypto'
import {createClient} from '@supabase/supabase-js'
import {isolatedPostgrest} from './p06-postgrest-isolated.mjs'
import {loadModule} from './p06-load-module.mjs'
import {localSnapshot} from './p06-local-snapshot.mjs'
const d=await isolatedPostgrest(),release='00000000-0000-4000-8000-000000000009',source='00000000-0000-4000-8000-000000000005',condition='new_complete_unbuilt'
const client=createClient('http://local.invalid',d.jwt('service_role'),{global:{fetch:d.fetchImpl},auth:{persistSession:false,autoRefreshToken:false}})
process.env.EBAY_ERASURE_CURRENT_KEY='test';process.env.EBAY_ERASURE_KEYS=JSON.stringify({test:randomBytes(32).toString('hex')});process.env.EBAY_ERASURE_FENCING_ENABLED='true'
globalThis.__p06HttpClient=client
const m=await loadModule('lib/ebay/account-deletion-recovery.ts')
let stage='setup'
try{
 d.sql(readFileSync('scripts/fixtures/p06a-realistic-seed.sql','utf8'))
 d.sql('drop role if exists trackdash_erasure_monitor;drop role if exists trackdash_erasure_worker;drop role if exists trackdash_erasure_ingress;')
 d.sql(readFileSync('proposals/p06a-minimization-and-token-recovery.sql','utf8'))
 await d.reload()
 const original=['ebay:CaseSeller','ebay:CaseSeller','ebay:caseseller','ebay:OtherSeller']
 for(let n=0;n<4;n++)d.sql(`insert into market_candidates(id,source_id,source_record_key,external_listing_id,resolved_release_id,condition,seller_fingerprint,raw_payload,decision,match_confidence,match_evidence,original_source)
 values('00000000-0000-4000-8000-00000000001${n}','${source}','${123456789000+n}','${123456789000+n}','${release}','${condition}','${original[n]}','{"seller":{"username":"synthetic-private","email":"synthetic@example.invalid"},"itemLocationCountry":"it","shippingEstimateCountry":"IT","marketplace":"EBAY_IT"}','accepted','exact',array['item_number_exact'],'EBAY_IT');
 insert into market_offer_states(candidate_id,release_id,source_id,condition,channel,availability,seller_fingerprint,item_price,currency,item_price_eur,cost_basis,first_seen_at,last_checked_at,changed_at)
 values('00000000-0000-4000-8000-00000000001${n}','${release}','${source}','${condition}','marketplace','in_stock','${original[n]}',${[10,12,30,20][n]},'EUR',${[10,12,30,20][n]},'item_only',now(),now(),now());
 insert into price_points(candidate_id,release_id,source_id,observation_type,condition,price,currency,shipping_basis,valuation_price,normalized_price_eur,match_confidence,match_evidence,evidence_group_key,valuation_eligible,sold_on,observed_at,evidence_grade,market_price_eur,market_price_basis)
 values('00000000-0000-4000-8000-00000000001${n}','${release}','${source}','sold_confirmed','${condition}',12.5,'EUR','excluded',12.5,12.5,'exact',array['item_number_exact'],'eg:synthetic-${n}',true,current_date-1,now(),'verified',12.5,'raw_sale');`)
 const capturedAt=new Date().toISOString(),trend={percent:10,windowMonths:1,basis:'sold',updatedAt:capturedAt},trendReader=await loadModule('lib/market/collector-sold-trend-comparison.ts')
 d.sql(`insert into market_monthly_source_stats(release_id,source_id,month,condition,query_key,sales_count,average_price,currency,market_average_eur,raw_payload) values('${release}','${source}','2026-09-01','${condition}','synthetic-trend',2,11,'EUR',11,'{"seller":"CaseSeller","trend_evidence":{"trend_percent":10,"trend_window_months":1,"previous_window":{"average_eur":"10","sales_count":"2"},"recent_window":{"average_eur":11,"sales_count":2}}}');`)
 const readTrend=()=>trendReader.getCollectorSoldTrendComparison(d.json('select raw_payload from market_monthly_source_stats limit 1'),capturedAt,trend),trendBefore=readTrend();assert.ok(trendBefore)
 stage='price parity'
 const ask=await loadModule('lib/market/representative-asking.ts');const quote=()=>ask.representativeAskingMedian(d.json("select jsonb_agg(jsonb_build_object('listingKey',candidate_id::text,'sellerFingerprint',seller_fingerprint,'itemPriceEUR',item_price_eur,'origin','eu','deliveredToItaly',true,'checkedAt',last_checked_at,'acceptedExactKit',true)) from market_offer_states"));const publicBefore=quote();assert.equal(publicBefore.itemPriceEUR,20);assert.equal(publicBefore.sellerCount,3)
 const claim={releaseId:release,condition},before=await m.computeErasurePublication(client,claim)
 d.sql("update trackdash_erasure.minimization_config set key_id=(select key_id from trackdash_erasure.suppression_keys limit 1),enabled=true;")
 for(const t of ['market_candidates','market_offer_states','market_aggregate_observations','market_monthly_source_stats'])d.sql(`update ${t} set updated_at=updated_at;`)
 const opaque=d.json('select jsonb_agg(seller_fingerprint order by id) from market_candidates')
 for(let a=0;a<4;a++)for(let b=0;b<4;b++)assert.equal(original[a]===original[b],opaque[a]===opaque[b])
 assert.ok(opaque.every(v=>v.startsWith('ebay:p1:')&&!v.includes('Seller')))
 assert.equal(d.json("select count(*) from market_candidates where raw_payload::text like '%synthetic-private%' or raw_payload::text like '%@%'"),0)
 const after=await m.computeErasurePublication(client,claim)
 const canonical=w=>w.map(x=>({...x,row:Object.fromEntries(Object.entries(x.row).filter(([k])=>!['computed_at','updated_at','captured_at'].includes(k)))}))
 assert.deepEqual(canonical(after),canonical(before));assert.deepEqual(quote(),publicBefore);assert.deepEqual(readTrend(),trendBefore)
 console.log('PASS exact seller partitions (including case/prefix), real canonical MV/SOLD/ASK publication before/after minimization, personal payload removal, country metadata retained')
 stage='token erasure'
 d.sql("insert into market_candidates(source_id,source_record_key,seller_fingerprint,raw_payload) values('00000000-0000-4000-8000-000000000006','synthetic-retail','retailer:synthetic','{\"seller\":\"unchanged-retail\",\"price\":12.5}');");assert.equal(d.json("select raw_payload from market_candidates where source_record_key='synthetic-retail'").seller,'unchanged-retail')
 d.sql(`insert into market_candidates(source_id,source_record_key,seller_fingerprint) values('${source}','synthetic-composite','historical|CaseSeller|https://www.ebay.com/usr/CaseSeller');`)
 const {data:prepared,error}=await client.rpc('trackdash_ebay_prepare_tokens',{p_identifiers:['caseseller']}).retry(false);assert.equal(error,null)
 const box={key:'a'.repeat(64),digest:'b'.repeat(64)}
 const {error:reg}=await client.rpc('trackdash_ebay_erasure',{p_action:'register',p_key:box.key,p_digest:box.digest,p_data:{sealed:{kind:'tokens-v1',keyId:'test',...prepared}}}).retry(false);assert.equal(reg,null)
 // A failed mutation must leave both inbox and token index resumable.
 const stale=await client.rpc('trackdash_market_fence',{p_action:'snapshot',p_data:{releaseId:release,condition}})
 d.sql("create function public.lab_fail() returns trigger language plpgsql as $$begin raise exception 'SYNTHETIC_DB_FAILURE';end$$;")
 for(const table of ['market_candidates','market_offer_states','price_points','market_aggregate_observations','market_monthly_source_stats','trackdash_erasure.recomputes']){
  d.sql(`create trigger lab_failure before ${table.includes('.')?'insert':'update'} on ${table} for each statement execute function lab_fail();`)
  const fail=await client.rpc('trackdash_ebay_apply_tokens',{p_key:box.key,p_digest:box.digest}).retry(false);assert.ok(fail.error)
  assert.equal(d.json('select count(*) from trackdash_erasure.suppressed_identities'),0)
  assert.equal(d.json("select to_jsonb(state) from trackdash_erasure.notifications limit 1"),'received')
  assert.equal(d.json('select count(*) from trackdash_erasure.suppressed_candidates'),0)
  assert.equal(d.json('select count(*) from price_points where valuation_eligible'),4)
  d.sql(`drop trigger lab_failure on ${table};`)
 }
 d.sql("create function public.lab_slow() returns trigger language plpgsql as $$begin perform pg_sleep(0.1);return null;end$$;create trigger lab_failure before update on price_points for each statement execute function lab_slow();alter function public.trackdash_ebay_apply_tokens(text,text) set statement_timeout='30ms';")
 await d.reload();const timed=await client.rpc('trackdash_ebay_apply_tokens',{p_key:box.key,p_digest:box.digest}).retry(false);assert.equal(timed.error?.code,'57014')
 assert.equal(d.json('select count(*) from trackdash_erasure.suppressed_identities'),0)
 d.sql("drop trigger lab_failure on price_points;alter function public.trackdash_ebay_apply_tokens(text,text) set statement_timeout='10s';");await d.reload()
 const concurrent=await Promise.allSettled([m.resumeEbayErasureJob(client,box,Date.now()+45000,()=>{}),m.resumeEbayErasureJob(client,box,Date.now()+45000,()=>{})])
 assert.ok(concurrent.some(r=>r.status==='fulfilled'&&r.value===true))
 assert.equal(await m.resumeEbayErasureJob(client,box,Date.now()+45000,()=>{}),true)
 const rejected=await client.rpc('trackdash_market_fence',{p_action:'publish',p_data:{epoch:stale.data.epoch,releaseId:release,condition,writes:before}});assert.equal(rejected.error?.code,'PT409')
 const fresh=await client.rpc('trackdash_market_fence',{p_action:'snapshot',p_data:{releaseId:release,condition}}),writes=await m.computeErasurePublication(client,claim)
 assert.equal((await client.rpc('trackdash_market_fence',{p_action:'publish',p_data:{epoch:fresh.data.epoch,releaseId:release,condition,writes}})).error,null)
 assert.equal(d.json('select count(*) from market_candidates where seller_fingerprint is null'),4)
 assert.equal(d.json('select sum(price) from price_points'),50)
 assert.equal(d.json('select count(*) from market_candidates where seller_fingerprint is not null'),2)
 console.log('PASS token-only erasure removes both case aliases, rolls back at each phase/timeout, concurrent duplicates finish once, stale publication is fenced and fresh recomputation succeeds and keeps non-personal observations')
 stage='late writers'
 d.sql(`update market_candidates set seller_fingerprint='ebay:CaseSeller',raw_payload='{"seller":"CaseSeller"}' where source_record_key='123456789000';`)
 assert.equal(d.json("select jsonb_build_object('seller',seller_fingerprint) from market_candidates where source_record_key='123456789000'").seller,null)
 assert.notEqual(d.sql(`update market_candidates set seller_fingerprint='ebay:p1:fake:${'1'.repeat(64)}:${'2'.repeat(64)}:${'3'.repeat(64)}' where source_record_key='123456789003';`,true).status,0)
 const monitor=await client.rpc('trackdash_ebay_erasure_health').retry(false);assert.ok(monitor.error)
 assert.notEqual(d.sql('set role trackdash_erasure_monitor;select * from trackdash_erasure.notifications;',true).status,0)
 assert.equal(d.json('set role trackdash_erasure_monitor;select public.trackdash_ebay_erasure_health();').guard,true)
 console.log('PASS unchanged late scanner writes scrubbed, forged pseudonyms fail closed and independent monitor cannot read jobs or perform erasure')
}catch(e){console.error('FINAL_LAB_FAILED stage='+stage+' type='+e.constructor.name);process.exitCode=1}
finally{delete globalThis.__p06HttpClient;d.close()}
