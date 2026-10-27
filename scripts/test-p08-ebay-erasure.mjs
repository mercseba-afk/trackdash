// Isolated PostgreSQL 17 + PostgREST 13; synthetic identities only.
import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {createHash,createSign,generateKeyPairSync} from 'node:crypto'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {performance} from 'node:perf_hooks'
import {build} from 'esbuild'
import {createClient} from '@supabase/supabase-js'
import {isolatedPostgrest} from './p08-postgrest-isolated.mjs'
import {localDatabase} from './p08-local-postgres.mjs'
import {installNativeSchema} from './p08-managed-schema.mjs'
import {eraseEbayUserData,containsEbayIdentifier,redactEbayIdentifiers,parseEbayDeletionNotification,verifyEbayNotificationSignature} from '../lib/ebay/account-deletion.ts'
const base='d8690f7adb349c74bea38b1c115039ebf57a888d'
const oldSource=execFileSync('git',['show',base+':lib/ebay/account-deletion.ts'],{encoding:'utf8'})
mkdirSync('work',{recursive:true});writeFileSync('work/p08-baseline.ts',oldSource)
const baseline=await import('../work/p08-baseline.ts')
const quote=x=>"'"+String(x).replaceAll("'","''")+"'"
const id=x=>createHash('md5').update(x).digest('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/,'$1-$2-$3-$4-$5')
const release=id('release'),active=id('active'),legacy=id('legacy'),retail=id('retail')
const condition='new_complete_unbuilt'
const d=await isolatedPostgrest()
const clientFor=role=>createClient('http://isolated.invalid',d.jwt(role),{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:d.fetchImpl}})
const client=clientFor('service_role')
const rpc=async(name,args)=>{const r=await client.rpc(name,args);if(r.error)throw Error(name+':'+r.error.code);return r.data}
const erasureTables=['market_candidates','market_offer_states','price_points','market_aggregate_observations','market_monthly_source_stats']
let checks=0
const passed=label=>{checks++;console.log('PASS '+label)}
const candidate=(key,seller,payload,source=legacy)=>d.sql(`insert into public.market_candidates(id,source_id,source_record_key,resolved_release_id,condition,seller_fingerprint,evidence_group_key,raw_payload) values(${quote(id(key))},${quote(source)},${quote(key)},${quote(release)},${quote(condition)},${quote(seller)},${quote(release+'|'+seller)},${quote(JSON.stringify(payload))}::jsonb);`)
const json=q=>d.json('select coalesce(jsonb_agg(x),\'[]\') from ('+q+') x;')
const state=()=>Object.fromEntries(erasureTables.map(t=>[t,json(`select to_jsonb(t)-'updated_at' as row from public.${t} t order by id`)]))
try{
 d.sql(`insert into public.brands(id,slug,name) values('${id('brand')}','synthetic','Synthetic');
 insert into public.categories(id,slug,name) values('${id('category')}','mini4wd','Synthetic');
 insert into public.products(id,category_id,brand_id,slug,name,original_release_year,rarity) values('${id('product')}','${id('category')}','${id('brand')}','synthetic','Synthetic',2026,'common');
 insert into public.product_releases(id,product_id,item_number,release_type,edition_name,release_year,chassis) values('${release}','${id('product')}','99999','original','Synthetic',2026,'synthetic');
 insert into public.product_releases(id,product_id,item_number,release_type,edition_name,release_year,chassis) select md5('release-'||i)::uuid,'${id('product')}',(99900+i)::text,'original','Synthetic '||i,2026,'synthetic' from generate_series(1,49)i;
 insert into public.price_sources(id,slug,name,source_type,is_active) values
 ('${active}','ebay_synthetic_active','Synthetic active','marketplace',true),('${legacy}','ebay_synthetic_inactive','Synthetic historic','marketplace',false),('${retail}','retail_synthetic','Synthetic retail','retail',true);
 insert into public.market_source_policies(source_id,source_family,scan_scope,independent_key,role,default_interval_hours) values('${active}','ebay','active_marketplace','synthetic','primary_marketplace',24);
 grant select(id,raw_payload),update(raw_payload) on public.market_candidates to trackdash_app;`)
 // Read-only Production aggregates calibrated this fixture: 1117 / 432 / 11 / 65 / 0.
 d.sql(`insert into public.market_candidates(id,source_id,source_record_key,resolved_release_id,condition,seller_fingerprint,evidence_group_key,raw_payload)
 select md5('c'||i)::uuid,'${active}','c'||i,case when i%50=0 then '${release}'::uuid else md5('release-'||(i%50))::uuid end,'${condition}','seller-'||i,'${release}|'||'seller-'||i,
 jsonb_build_object('seller','seller-'||i,'listing','synthetic-'||i,'title',repeat('x',42)) from generate_series(1,1117) i;
 insert into public.market_offer_states(candidate_id,release_id,source_id,condition,channel,availability,seller_fingerprint,item_price,currency,item_price_eur,cost_basis,first_seen_at,last_checked_at,changed_at)
 select id,resolved_release_id,'${active}','${condition}','marketplace','in_stock',seller_fingerprint,20,'EUR',20,'item_only',now(),now(),now() from public.market_candidates order by id limit 432;
 insert into public.price_points(candidate_id,release_id,source_id,condition,observation_type,price,currency,shipping_basis,valuation_price,normalized_price_eur,market_price_eur,market_price_basis,match_confidence,match_evidence,evidence_group_key,valuation_eligible,is_complete,is_lot,inner_bags_sealed,evidence_grade,sold_on,observed_at)
 select id,resolved_release_id,'${active}','${condition}','marketplace_sold',20,'EUR','excluded',20,20,20,'shipping_adjusted','exact',array['item_number_exact'],evidence_group_key,true,true,false,'yes','verified',current_date,now() from public.market_candidates order by id limit 11;
 insert into public.market_aggregate_observations(source_id,release_id,item_number,attribution_status,grain,period_start,period_end,condition,query_key,sales_count,average_item_price,currency,market_average_eur,raw_payload)
 select '${active}','${release}','99999','release_exact','monthly','2026-09-01','2026-09-30','${condition}','aggregate-'||i,3,20,'EUR',20,jsonb_build_object('records',jsonb_build_array(jsonb_build_object('seller','seller-'||i,'context',repeat('x',330)))) from generate_series(1,65)i;
 analyze public.market_candidates;analyze public.market_offer_states;analyze public.price_points;analyze public.market_aggregate_observations;analyze public.market_monthly_source_stats;`)
 const before=state();const noMatch={username:'synthetic-no-match',userId:'synthetic-user-id',eiasToken:'synthetic-token'}
 const m0={...d.metrics};const none=await eraseEbayUserData(client,noMatch)
 assert.equal(Object.values(none).slice(0,5).reduce((a,b)=>a+b,0),0);assert.equal(none.affectedReleaseConditions.length,0)
 assert.equal(d.metrics.requests-m0.requests,1);assert.deepEqual(state(),before)
 passed('no-match: one real HTTP RPC, no writes or recomputes')

 // DB indexes actually chosen, without disabling sequential scans.
 const explain=d.sql(`explain(analyze,buffers,format json) select id from public.market_candidates where private.p08_ebay_erasure_row_terms(raw_payload,seller_fingerprint,evidence_group_key) && array[encode(sha256(convert_to('synthetic-no-match','UTF8')),'hex'),'!fallback!'];`).stdout
 assert.match(explain,/p08_market_candidates_erasure_terms/)
 const indexBytes=d.json(`select sum(pg_relation_size(indexrelid)) from pg_index join pg_class c on c.oid=indexrelid where c.relname like 'p08_%';`)
 passed('real PostgreSQL planner uses GIN index; no forced planner settings')

 // Full signature verification included in BOTH measurements, warm key cache.
 process.env.EBAY_ENV='production';process.env.EBAY_CLIENT_ID='synthetic';process.env.EBAY_CLIENT_SECRET='synthetic'
 const {privateKey,publicKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'})
 const raw=JSON.stringify({metadata:{topic:'MARKETPLACE_ACCOUNT_DELETION'},notification:{notificationId:'synthetic-benchmark',data:noMatch}})
 const signer=createSign('ssl3-sha1');signer.update(raw);signer.end()
 const header=Buffer.from(JSON.stringify({kid:'p08-synthetic',signature:signer.sign(privateKey,'base64')})).toString('base64')
 const keyFetch=async url=>new Response(JSON.stringify(String(url).includes('oauth2')?{access_token:'synthetic'}:{key:publicKey.export({format:'pem',type:'spki'})}))
 await verifyEbayNotificationSignature(raw,header,keyFetch)
 const notifications=Array.from({length:3000},(_,i)=>{
  const identifiers={username:'synthetic-no-match-'+i,userId:'synthetic-user-id-'+i,eiasToken:'synthetic-token-'+i}
  const body=JSON.stringify({metadata:{topic:'MARKETPLACE_ACCOUNT_DELETION'},notification:{notificationId:'synthetic-'+i,data:identifiers}})
  const s=createSign('ssl3-sha1');s.update(body);s.end()
  return {body,header:Buffer.from(JSON.stringify({kid:'p08-synthetic',signature:s.sign(privateKey,'base64')})).toString('base64')}
 })
 const sample=async(fn,n,concurrency)=>{
  const serverCpu=d.serverCpuMs(),metrics={...d.metrics},wall=performance.now(),cpu=process.cpuUsage(),durations=[];let next=0
  await Promise.all(Array.from({length:concurrency},async()=>{while(next<n){const msg=notifications[next++],t=performance.now();assert(await verifyEbayNotificationSignature(msg.body,msg.header,keyFetch));const parsed=parseEbayDeletionNotification(JSON.parse(msg.body));await fn(client,parsed.identifiers);durations.push(performance.now()-t)}}))
  const used=process.cpuUsage(cpu);durations.sort((a,b)=>a-b)
  return {notifications:n,concurrency,isolatedPostgresAndBridgeCpuMs:d.serverCpuMs()-serverCpu,wallMs:performance.now()-wall,nodeCpuMs:(used.user+used.system)/1000,queries:d.metrics.requests-metrics.requests,recordsReturned:d.metrics.records-metrics.records,responseBytes:d.metrics.responseBytes-metrics.responseBytes,p50Ms:durations[Math.floor(n*.5)],p95Ms:durations[Math.floor(n*.95)]}
 }
 for(let i=0;i<10;i++){await baseline.eraseEbayUserData(client,noMatch);await eraseEbayUserData(client,noMatch)}
 const oldMetrics=await sample(baseline.eraseEbayUserData,120,1)
 const newMetrics=await sample(eraseEbayUserData,120,1)
 const load=await sample(eraseEbayUserData,3000,32)
 assert.equal(load.queries,3000);assert.equal(load.recordsReturned,0)
 const report={base,checks,indexBytes,baseline:oldMetrics,optimized:newMetrics,burst:load,localNodeCpuReductionPercent:100*(1-newMetrics.nodeCpuMs/oldMetrics.nodeCpuMs),note:'Synthetic PostgreSQL/PostgREST + Node CPU, warm signature key. Not Vercel Active CPU. Burst replays a 3000/day workload; not a 24h soak. SQL still probes five indexes and source metadata.'}
 passed('3000 verified no-match notifications at concurrency 32: no failures, no writes, no arbitrary traffic throttle')

 // Search is a conservative superset of the exact existing matcher, across all
 // identifier formats, nested arrays and JSON objects. Unicode never excluded.
 const values=['Seller_Name','ebay:SELLER_NAME','a|seller_name|b','seller_name|b','a|seller_name','unrelated','Seller_Name kit','K','İ','Σ','x|a|b|y','a|b',Array(22).fill('safe').join('|'),'x'.repeat(5000)]
 for(let i=0;i<values.length;i++)candidate('format-'+i,'unrelated-'+i,{nested:[{seller:values[i]}]})
 for(const username of ['seller_name','k','i','σ','a|b','synthetic-no-match']){
  const plan=await rpc('trackdash_plan_ebay_erasure',{p_identifiers:[username.toLocaleLowerCase('en-US')]})
  const included=new Set(plan.market_candidates.map(r=>r.id))
  for(let i=0;i<values.length;i++)if(containsEbayIdentifier(values[i],{username}))assert(included.has(id('format-'+i)))
 }
 passed('indexed lookup has no false negatives for boundaries, pipes, Unicode, long strings and historical inactive sources')
 const deep=Array.from({length:80}).reduce(value=>({nested:value}),{seller:'deep-seller',price:20})
 candidate('deep','unrelated',deep)
 const wide=Object.fromEntries(Array.from({length:600},(_,i)=>['field'+i,'synthetic-value-'+i]));wide.seller='wide-seller'
 candidate('wide','unrelated',wide)
 assert.equal((await eraseEbayUserData(client,{username:'deep-seller'})).candidatesUpdated,1)
 assert.equal((await eraseEbayUserData(client,{username:'wide-seller'})).candidatesUpdated,1)
 passed('deep and wide JSON safely fall back instead of exceeding index complexity or omitting identities')

 candidate('matched','Seller_Name',{seller:'Seller_Name',nested:['synthetic-user-id',{seller:'synthetic-token'}],price:25})
 candidate('retail-excluded','Seller_Name',{seller:'Seller_Name'},retail)
 d.sql(`insert into public.price_points(candidate_id,release_id,source_id,condition,observation_type,price,currency,shipping_basis,valuation_price,normalized_price_eur,market_price_eur,market_price_basis,match_confidence,match_evidence,evidence_group_key,valuation_eligible,is_complete,is_lot,inner_bags_sealed,evidence_grade,sold_on,observed_at)
 values('${id('matched')}','${release}','${legacy}','${condition}','marketplace_sold',25,'EUR','excluded',25,25,25,'shipping_adjusted','exact',array['item_number_exact'],'unrelated-group',true,true,false,'yes','verified',current_date,now());
 insert into public.market_monthly_source_stats(release_id,source_id,month,condition,query_key,sales_count,average_price,currency,raw_payload)
 values('${release}','${legacy}','2026-09-01','${condition}','historic',2,25,'EUR','{"historical":{"seller":"Seller_Name"},"price":25}');`)
 // Bundle unchanged canonical market code; substitute only the admin-client
 // factory, ensuring every real query stays in the isolated synthetic database.
 globalThis.__p08SyntheticClient=client
 const bundle=await build({stdin:{contents:'export {recomputeReleaseMarketSignal} from "./lib/market/pipeline/market-r3-service";export {MarketR3Repository} from "./lib/market/pipeline/market-r3-repository";',resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',packages:'external',write:false,plugins:[{name:'isolated-client',setup(b){
  b.onResolve({filter:/^(server-only|@\/lib\/supabase\/admin)$/},args=>({path:args.path,namespace:'isolated'}))
  b.onLoad({filter:/.*/,namespace:'isolated'},args=>({contents:args.path==='server-only'?'':'export function createAdminClient(){return globalThis.__p08SyntheticClient}',loader:'js'}))
 }}]})
 mkdirSync('work',{recursive:true});writeFileSync('work/p08-market-engine.mjs',bundle.outputFiles[0].text)
 const engine=await import('../work/p08-market-engine.mjs')
 const compute=()=>engine.recomputeReleaseMarketSignal(release,condition,new Date('2026-10-17T12:00:00Z'),new engine.MarketR3Repository(client))
 const priceShape=s=>Object.fromEntries(['marketValueEUR','soldAnchorEUR','soldUnits','activeAnchorEUR','activeLowEUR','activeHighEUR','currentOfferCount','soldSourceCount','soldSellerCount','soldEvidenceCount','marketRegime'].map(k=>[k,s[k]]))
 // Compare complete stored results to main's original algorithm on identical DB
 // evidence, rolling the baseline writes back by restoring saved row JSON.
 const saved=state();const target={username:'Seller_Name',userId:'synthetic-user-id',eiasToken:'synthetic-token'}
 const old=await baseline.eraseEbayUserData(client,target);const expected=state();const oldPrices=priceShape(await compute())
 for(const [table,rows]of Object.entries(saved)){
  const fields=table==='market_candidates'?['seller_fingerprint','evidence_group_key','raw_payload']:table==='market_offer_states'?['seller_fingerprint']:table==='price_points'?['evidence_group_key','valuation_eligible','evidence_grade','quality_flags']:['raw_payload']
  d.sql(`update public.${table} t set ${fields.map(k=>`${k}=r.${k}`).join(',')} from jsonb_populate_recordset(null::public.${table},${quote(JSON.stringify(rows.map(x=>x.row)))}::jsonb) r where t.id=r.id;`)
 }
 const actual=await eraseEbayUserData(client,target)
 assert.deepEqual(state(),expected);assert.equal(actual.pricePointsUpdated,old.pricePointsUpdated);assert.deepEqual(priceShape(await compute()),oldPrices)
 assert.equal(d.json(`select count(*) from public.market_recompute_queue where release_id='${release}'`),1)
 assert.equal(json(`select valuation_eligible from public.price_points where candidate_id='${id('matched')}'`)[0].valuation_eligible,false)
 assert.equal(d.json(`select raw_payload->>'price' from public.market_monthly_source_stats where query_key='historic'`),25)
 passed('atomic erasure equals main on all five tables; linked historical points handled and all non-personal price fields retained; durable canonical recompute queued')
 // Regression: main reads offers AFTER writing candidates. P0.8's first plan
 // preloads them; a newly committed offer must be revisited before success.
 writeFileSync('work/p08-pre-review.ts',execFileSync('git',['show','6b8af2be07ea00ddd04eb34addc7119d3fa2df5d:lib/ebay/account-deletion.ts'],{encoding:'utf8'}))
 const preReview=await import('../work/p08-pre-review.ts')
 async function offerRace(fn,label,isMain){
  const username='synthetic-late-offer-'+label,key='late-offer-'+label
  candidate(key,username,{seller:username})
  let injected=false
  const insert=()=>{injected=true;d.sql(`insert into public.market_offer_states(candidate_id,release_id,source_id,condition,channel,availability,seller_fingerprint,item_price,currency,item_price_eur,cost_basis,first_seen_at,last_checked_at,changed_at) values('${id(key)}','${release}','${legacy}','${condition}','marketplace','in_stock',${quote(username)},20,'EUR',20,'item_only',now(),now(),now());`)}
  const racingClient=createClient('http://isolated.invalid',d.jwt('service_role'),{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(input,init)=>{
   const path=new URL(String(input)).pathname
   if(!isMain&&!injected&&path.endsWith('/trackdash_apply_ebay_erasure'))insert()
   const response=await d.fetchImpl(input,init)
   if(isMain&&!injected&&path.endsWith('/market_candidates')&&init.method==='PATCH')insert()
   return response
  }}})
  await fn(racingClient,{username})
  assert(injected)
  return json(`select seller_fingerprint from public.market_offer_states where candidate_id='${id(key)}'`)[0].seller_fingerprint
 }
 assert.equal(await offerRace(baseline.eraseEbayUserData,'main',true),null)
 assert.notEqual(await offerRace(preReview.eraseEbayUserData,'pre-review',false),null)
 assert.equal(await offerRace(eraseEbayUserData,'fixed',false),null)
 passed('newly inserted offer missed by pre-review P0.8 is now erased, as on main')
 // The same preload window applies to historic JSON. Recheck must cover all
 // tables, not only offers; repeated writers must receive a bounded failure.
 for(const repeated of [false,true]){
  const key='late-json-'+repeated,username='synthetic-'+key;candidate(key,username,{seller:username})
  let applies=0
  const racing=createClient('http://isolated.invalid',d.jwt('service_role'),{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(input,init)=>{
   const path=new URL(String(input)).pathname
   if(path.endsWith('/trackdash_apply_ebay_erasure')&&(repeated||applies===0)){
    d.sql(`insert into public.market_monthly_source_stats(release_id,source_id,month,condition,query_key,sales_count,average_price,currency,raw_payload) values('${release}','${legacy}','2026-07-01','${condition}',${quote(key+'-'+applies)},1,20,'EUR',${quote(JSON.stringify({seller:username,price:20}))}::jsonb);`)
    applies++
   }
   return d.fetchImpl(input,init)
  }}})
  if(repeated){await assert.rejects(eraseEbayUserData(racing,{username}),/concurrent_writes/);assert.equal(applies,3)}
  else await eraseEbayUserData(racing,{username})
  await eraseEbayUserData(client,{username})
  assert.equal(d.json(`select count(*) from public.market_monthly_source_stats where query_key like ${quote(key+'-%')} and raw_payload->>'seller' is not null`),0)
 }
 passed('late historical JSON is rechecked; sustained writes fail within three passes and a fresh retry completes')
 // STABLE held the first SQL snapshot across all five reads. Main instead
 // observes a fresh snapshot per later table; prove the difference with a
 // local-only barrier after candidate lookup (never present in proposal SQL).
 const planDefinition=d.sql("select pg_get_functiondef('public.trackdash_plan_ebay_erasure(text[])'::regprocedure)").stdout.trim()
 const paused=planDefinition.replace("answer := answer || jsonb_build_object('market_candidates',rows);", "answer := answer || jsonb_build_object('market_candidates',rows); if p_identifiers[1] like 'synthetic-mid-plan-%' and not exists(select 1 from public.market_offer_states where candidate_id=md5(p_identifiers[1])::uuid) then perform pg_sleep(1); end if;")
 assert.notEqual(paused,planDefinition)
 for(const volatility of ['stable','volatile']){
  const username='synthetic-mid-plan-'+volatility;candidate(username,'unrelated',{seller:'unrelated'})
  d.sql(paused+`;alter function public.trackdash_plan_ebay_erasure(text[]) ${volatility};`)
  const erasing=eraseEbayUserData(client,{username});await new Promise(r=>setTimeout(r,10))
  let waiting=false
  for(let i=0;i<60;i++){if(d.json("select count(*) from pg_stat_activity where datname=current_database() and wait_event='PgSleep'")>0){waiting=true;break}await new Promise(r=>setTimeout(r,10))}
  assert(waiting)
  d.sql(`insert into public.market_offer_states(candidate_id,release_id,source_id,condition,channel,availability,seller_fingerprint,item_price,currency,item_price_eur,cost_basis,first_seen_at,last_checked_at,changed_at) values('${id(username)}','${release}','${legacy}','${condition}','marketplace','in_stock',${quote(username)},20,'EUR',20,'item_only',now(),now(),now());`)
  await erasing
  const seller=json(`select seller_fingerprint from public.market_offer_states where candidate_id='${id(username)}'`)[0].seller_fingerprint
  assert.equal(seller,volatility==='stable'?username:null)
 }
 d.sql(planDefinition)
 passed('STABLE snapshot regression reproduced; fresh per-table reads retain main visibility for later tables')

 // Both main and P0.8 lack a persistent ingress tombstone: a writer AFTER
 // erasure can reintroduce an identity. This is a preexisting gap, not closed.
 for(const [label,fn] of [['main',baseline.eraseEbayUserData],['p08',eraseEbayUserData]]){
  const key='after-commit-'+label,username='synthetic-after-commit-'+label;candidate(key,username,{seller:username})
  await fn(client,{username});assert.equal(json(`select seller_fingerprint from public.market_candidates where id='${id(key)}'`)[0].seller_fingerprint,null)
  d.sql(`update public.market_candidates set seller_fingerprint=${quote(username)},raw_payload=jsonb_build_object('seller',${quote(username)}) where id='${id(key)}';`)
  assert.equal(json(`select seller_fingerprint from public.market_candidates where id='${id(key)}'`)[0].seller_fingerprint,username)
 }
 passed('BASE and P0.8 both reproduce post-commit reintroduction: unresolved preexisting risk')

 // A finite provider retry budget cannot recover a request never committed.
 // No real eBay calls: identical synthetic DB errors before the first mutation.
 const unavailable=createClient('http://isolated.invalid',d.jwt('service_role'),{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async()=>new Response(JSON.stringify({code:'08006',message:'synthetic unavailable'}),{status:500})}})
 for(const [label,fn] of [['main',baseline.eraseEbayUserData],['p08',eraseEbayUserData]]){
  const key='exhausted-'+label,username='synthetic-exhausted-'+label;candidate(key,username,{seller:username})
  for(let attempt=0;attempt<3;attempt++)await assert.rejects(fn(unavailable,{username}),/EBAY_USER_ERASURE_FAILED/)
  assert.equal(json(`select seller_fingerprint from public.market_candidates where id='${id(key)}'`)[0].seller_fingerprint,username)
 }
 passed('BASE and P0.8 both retain data after exhausted pre-commit retries; no durable receipt claimed')

 // Real logical backup/restore, synthetic data only. A pre-erasure snapshot
 // resurrects identities for both implementations, with or without P0.8 indexes.
 candidate('restore-main','synthetic-restore-main',{seller:'synthetic-restore-main'})
 candidate('restore-p08','synthetic-restore-p08',{seller:'synthetic-restore-p08'})
 const backup=d.snapshot(),restored=localDatabase('p08r')
 try{
  await baseline.eraseEbayUserData(client,{username:'synthetic-restore-main'})
  await eraseEbayUserData(client,{username:'synthetic-restore-p08'})
  backup.restoreTo(restored)
  for(const label of ['main','p08'])assert.equal(restored.json(`select to_jsonb(seller_fingerprint) from public.market_candidates where id='${id('restore-'+label)}'`),'synthetic-restore-'+label)
 }finally{restored.close();backup.close()}
 passed('real pg_dump/pg_restore reproduces the same preexisting identity resurrection for BASE/P0.8')



 // Failure after earlier table updates must roll every mutation AND queue back.
 candidate('failure','failure-seller',{seller:'failure-seller'})
 d.sql(`insert into public.market_monthly_source_stats(release_id,source_id,month,condition,query_key,sales_count,average_price,currency,raw_payload) values('${release}','${legacy}','2026-08-01','${condition}','failure',2,25,'EUR','{"seller":"failure-seller"}');
 create function public.p08_test_failure() returns trigger language plpgsql as $$begin raise exception 'synthetic failure';end$$;
 create trigger p08_test_failure before update on public.market_monthly_source_stats for each row execute function public.p08_test_failure();`)
 const preFailure=state();await assert.rejects(eraseEbayUserData(client,{username:'failure-seller'}),/apply_erasure/);assert.deepEqual(state(),preFailure)
 d.sql('drop trigger p08_test_failure on public.market_monthly_source_stats;drop function public.p08_test_failure();')
 await eraseEbayUserData(client,{username:'failure-seller'})
 passed('mid-transaction DB failure rolls back earlier phases; fresh retry completes')

 // Force a failure AFTER each of the five table phases, including the last.
 const phaseCandidate=json(`select candidate_id from public.price_points where source_id='${active}' order by id limit 1`)[0].candidate_id
 d.sql(`update public.market_candidates set seller_fingerprint='phase-seller',evidence_group_key='group|phase-seller',raw_payload='{"seller":"phase-seller"}' where id='${phaseCandidate}';
 update public.market_offer_states set seller_fingerprint='phase-seller' where candidate_id='${phaseCandidate}';
 update public.price_points set evidence_group_key='group|phase-seller' where candidate_id='${phaseCandidate}';
 update public.market_aggregate_observations set raw_payload='{"nested":[{"seller":"phase-seller"}]}' where query_key='aggregate-1';
 update public.market_monthly_source_stats set raw_payload='{"seller":"phase-seller"}' where query_key='failure';
 create function public.p08_test_failure() returns trigger language plpgsql as $$begin raise exception 'synthetic failure';end$$;`)
 for(const table of erasureTables){
  d.sql(`create trigger p08_test_failure after update on public.${table} for each row execute function public.p08_test_failure();`)
  const saved=state(),queued=json('select * from public.market_recompute_queue order by release_id,condition')
  await assert.rejects(eraseEbayUserData(client,{username:'phase-seller'}),/apply_erasure/)
  assert.deepEqual(state(),saved);assert.deepEqual(json('select * from public.market_recompute_queue order by release_id,condition'),queued)
  d.sql(`drop trigger p08_test_failure on public.${table};`)
 }
 d.sql('drop function public.p08_test_failure();')
 const phases=await eraseEbayUserData(client,{username:'phase-seller'})
 for(const field of ['candidatesUpdated','offersUpdated','pricePointsUpdated','aggregatePayloadsUpdated','monthlyPayloadsUpdated'])assert(phases[field]>0)
 passed('interruptions AFTER every table phase roll back all evidence and recompute jobs; retry completes all five')

 candidate('lost-response','lost-response-seller',{seller:'lost-response-seller',price:25})
 d.sql(`delete from public.market_recompute_queue;`)
 const lostClient={rpc:(name,args)=>({abortSignal:async signal=>{
   const result=await client.rpc(name,args).abortSignal(signal)
   return name==='trackdash_apply_ebay_erasure'&&!result.error?{data:null,error:{message:'synthetic-lost-response'}}:result
 }})}
 await assert.rejects(eraseEbayUserData(lostClient,{username:'lost-response-seller'}),/apply_erasure/)
 assert.equal(json(`select seller_fingerprint from public.market_candidates where id='${id('lost-response')}'`)[0].seller_fingerprint,null)
 assert.equal(d.json(`select count(*) from public.market_recompute_queue where release_id='${release}'`),1)
 const retryLost=await eraseEbayUserData(client,{username:'lost-response-seller'});assert.equal(retryLost.candidatesUpdated,0)
 const pending=await rpc('trackdash_claim_market_recompute_jobs',{p_limit:1,p_lock_minutes:1});assert.equal(pending.length,1)
 await rpc('trackdash_finish_market_recompute_job',{p_release_id:release,p_condition:condition,p_claimed_dirty_at:pending[0].claimed_dirty_at,p_success:false,p_error:'synthetic-recompute-failure'})
 assert.equal(d.json(`select count(*) from public.market_recompute_queue where release_id='${release}'`),1)
 passed('commit with lost HTTP response is safely retried; failed recalculation remains persistently queued')
 // Isolated time advance for the existing 30-minute retry delay; no live cron.
 d.sql(`update public.market_recompute_queue set available_at=now() where release_id='${release}';`)
 const recovered=await rpc('trackdash_claim_market_recompute_jobs',{p_limit:1,p_lock_minutes:1})
 await compute()
 await rpc('trackdash_finish_market_recompute_job',{p_release_id:release,p_condition:condition,p_claimed_dirty_at:recovered[0].claimed_dirty_at,p_success:true,p_error:null})
 assert.equal(d.json(`select count(*) from public.market_recompute_queue where release_id='${release}'`),0)
 // Finishing an older claim must not erase an enqueue from a newer erasure.
 await rpc('trackdash_enqueue_market_recompute',{p_release_id:release,p_condition:condition})
 const older=await rpc('trackdash_claim_market_recompute_jobs',{p_limit:1,p_lock_minutes:1})
 candidate('dirty-again','dirty-seller',{seller:'dirty-seller'})
 await eraseEbayUserData(client,{username:'dirty-seller'})
 await rpc('trackdash_finish_market_recompute_job',{p_release_id:release,p_condition:condition,p_claimed_dirty_at:older[0].claimed_dirty_at,p_success:true,p_error:null})
 assert.equal(d.json(`select count(*) from public.market_recompute_queue where release_id='${release}'`),1)
 passed('real canonical MV/SOLD/ASK service recovers failed job; old concurrent claim cannot remove a newer erasure recompute')
 // Counterexample to pre-review inline ACK: a still-running older worker can
 // overwrite the inline result after ACK has deleted the only repair job.
 const newer=json(`select dirty_at from public.market_recompute_queue where release_id='${release}'`)[0].dirty_at
 await rpc('trackdash_finish_market_recompute_job',{p_release_id:release,p_condition:condition,p_claimed_dirty_at:newer,p_success:true,p_error:null})
 await rpc('trackdash_finish_market_recompute_job',{p_release_id:release,p_condition:condition,p_claimed_dirty_at:older[0].claimed_dirty_at,p_success:true,p_error:null})
 assert.equal(d.json(`select count(*) from public.market_recompute_queue where release_id='${release}'`),0)
 await rpc('trackdash_enqueue_market_recompute',{p_release_id:release,p_condition:condition})
 const oldPublisher=await rpc('trackdash_claim_market_recompute_jobs',{p_limit:1,p_lock_minutes:1})
 candidate('repair-kept','synthetic-repair-kept',{seller:'synthetic-repair-kept'})
 await eraseEbayUserData(client,{username:'synthetic-repair-kept'});await compute()
 // Fixed webhook deliberately never finishes this job; native worker owns it.
 await rpc('trackdash_finish_market_recompute_job',{p_release_id:release,p_condition:condition,p_claimed_dirty_at:oldPublisher[0].claimed_dirty_at,p_success:true,p_error:null})
 assert.equal(d.json(`select count(*) from public.market_recompute_queue where release_id='${release}'`),1)
 passed('pre-review inline ACK lost repair against older publisher; fixed route retains the replacement dirty job')


 // A point inserted between plan and apply must not escape the erasure when its
 // parent loses the only personal reference. The apply guard rejects the plan.
 candidate('late-point','late-point-seller',{seller:'late-point-seller'})
 const parent=(await rpc('trackdash_plan_ebay_erasure',{p_identifiers:['late-point-seller']})).market_candidates.find(x=>x.id===id('late-point'))
 d.sql(`insert into public.price_points(candidate_id,release_id,source_id,condition,observation_type,price,currency,shipping_basis,valuation_price,normalized_price_eur,market_price_eur,market_price_basis,match_confidence,match_evidence,evidence_group_key,valuation_eligible,sold_on,observed_at)
 values('${parent.id}','${release}','${legacy}','${condition}','marketplace_sold',25,'EUR','excluded',25,25,25,'shipping_adjusted','exact',array['item_number_exact'],'nonpersonal-group',true,current_date,now());`)
 const late=await client.rpc('trackdash_apply_ebay_erasure',{p_changes:[{table:'market_candidates',id:parent.id,version:parent.version,patch:{seller_fingerprint:null,evidence_group_key:null,raw_payload:{seller:null}}}]})
 assert.equal(late.error.code,'PT409')
 await eraseEbayUserData(client,{username:'late-point-seller'})
 assert.equal(json(`select valuation_eligible from public.price_points where candidate_id='${parent.id}'`)[0].valuation_eligible,false)
 passed('child point committed after planning forces a fresh plan and is treated on retry')

 candidate('locked','locked-seller',{seller:'locked-seller'})
 const holding=d.sqlAsync(`begin;select id from public.market_candidates where id='${id('locked')}' for update;select pg_sleep(3);commit;`)
 for(let i=0;i<40;i++){if(d.json(`select count(*) from pg_stat_activity where datname=current_database() and wait_event='PgSleep'`)>0)break;await new Promise(r=>setTimeout(r,25))}
 const lockStart=performance.now();await assert.rejects(eraseEbayUserData(client,{username:'locked-seller'}),/apply_erasure/)
 assert(performance.now()-lockStart<2900);await holding
 await eraseEbayUserData(client,{username:'locked-seller'})
 passed('real lock deadline fails safely in about 2 seconds; retry after lock release completes')

 candidate('racing','racing-seller',{seller:'racing-seller',price:20})
 const plan=await rpc('trackdash_plan_ebay_erasure',{p_identifiers:['racing-seller']})
 const row=plan.market_candidates.find(r=>r.id===id('racing'))
 const change={table:'market_candidates',id:row.id,version:row.version,patch:{seller_fingerprint:null,evidence_group_key:null,raw_payload:{seller:null,price:20}}}
 d.sql(`update public.market_candidates set raw_payload='{"seller":"racing-seller","price":21}' where id='${row.id}';`)
 const stale=await client.rpc('trackdash_apply_ebay_erasure',{p_changes:[change]});assert.equal(stale.error.code,'PT409')
 assert.equal(d.json(`select raw_payload->>'price' from public.market_candidates where id='${row.id}'`),21)
 await eraseEbayUserData(client,{username:'racing-seller'})
 assert.equal(d.json(`select raw_payload->>'price' from public.market_candidates where id='${row.id}'`),21)
 passed('concurrent market writer rejected stale plan without losing a newer price; fresh retry redacts newest payload')

 candidate('duplicate','duplicate-seller',{seller:'duplicate-seller'})
 const duplicates=await Promise.allSettled(Array.from({length:32},()=>eraseEbayUserData(client,{username:'duplicate-seller'})))
 for(const r of duplicates)if(r.status==='rejected'){assert.match(r.reason.message,/apply_erasure/);await eraseEbayUserData(client,{username:'duplicate-seller'})}
 await eraseEbayUserData(client,{username:'duplicate-seller'})
 assert.equal(json(`select seller_fingerprint from public.market_candidates where id='${id('duplicate')}'`)[0].seller_fingerprint,null)
 passed('32 concurrent duplicates remain idempotent; any version conflict is retriable')

 for(const role of ['anon','authenticated'])for(const name of ['trackdash_plan_ebay_erasure','trackdash_apply_ebay_erasure']){
  const r=await clientFor(role).rpc(name,name.includes('plan')?{p_identifiers:['test']}:{p_changes:[]});assert(r.error)
 }
 const forbidden=await client.rpc('trackdash_apply_ebay_erasure',{p_changes:[{...change,patch:{price:999}}]});assert(forbidden.error)
 passed('RPCs unavailable to browser roles; non-erasure columns cannot be patched')


 // Both existing canonical writer roles must maintain the new expression index.
 d.sql(`begin;set local role trackdash_app;update public.market_candidates set raw_payload=jsonb_build_object('seller','synthetic-writer','price',20) where id='${id('deep')}';rollback;`)
 const logs=d.logs()+d.databaseLogs()
 for(const sensitive of ['late-point-seller','locked-seller','lost-response-seller','phase-seller'])assert(!logs.includes(sensitive),'synthetic personal canary leaked to infrastructure logs')
 passed('index maintenance works with a narrowly granted writer role; failure/lock/conflict logs contain no synthetic identity canaries')

 // Exact proposed migration on a second empty managed-metadata clone: abort
 // after two concurrent builds, verify gates, then resume remaining phases.
 const trial=localDatabase('p08r')
 try{
  trial.sql("create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as 'select null::uuid';")
  installNativeSchema(trial)
  const protectedCatalog=db=>db.json(`select jsonb_build_object('acl',(select jsonb_agg(jsonb_build_array(c.relname,c.relacl::text,c.relrowsecurity,c.relforcerowsecurity) order by c.relname) from pg_class c where c.relnamespace='public'::regnamespace and c.relkind='r'), 'triggers',(select jsonb_agg(pg_get_triggerdef(t.oid) order by t.tgname) from pg_trigger t where not t.tgisinternal and t.tgrelid in(select oid from pg_class where relnamespace='public'::regnamespace)), 'policies',(select jsonb_agg(jsonb_build_array(tablename,policyname,roles,qual,with_check) order by tablename,policyname) from pg_policies where schemaname='public'))`)
  const original=protectedCatalog(trial),migration=readFileSync('proposals/p08-ebay-erasure.sql','utf8'),cut=migration.indexOf('create index concurrently p08_price_points')
  const failed=trial.sql(migration.slice(0,cut)+'select 1/0;',true);assert.notEqual(failed.status,0)
  assert.equal(trial.json("select count(*) from pg_indexes where indexname like 'p08_%'"),2)
  assert.equal(trial.json("select to_jsonb(to_regprocedure('public.trackdash_plan_ebay_erasure(text[])') is null)"),true)
  assert.deepEqual(protectedCatalog(trial),original)
  trial.sql(migration.slice(cut))
  assert.equal(trial.json("select count(*) from pg_index i join pg_class c on c.oid=i.indexrelid where c.relname like 'p08_%' and i.indisvalid and i.indisready"),5)
  assert.deepEqual(protectedCatalog(trial),original)
  for(const role of ['anon','authenticated'])assert.equal(trial.json(`select to_jsonb(has_function_privilege('${role}','public.trackdash_apply_ebay_erasure(jsonb)','execute'))`),false)
  assert.equal(trial.json("select to_jsonb(has_function_privilege('service_role','public.trackdash_apply_ebay_erasure(jsonb)','execute'))"),true)
 }finally{trial.close()}
 // Application-only rollback leaves the additive DDL and all repair jobs.
 const redactionsBeforeRollback=state(),queueBeforeRollback=json('select * from public.market_recompute_queue order by release_id,condition')
 await baseline.eraseEbayUserData(client,{username:'synthetic-rollback-no-match'})
 assert.deepEqual(state(),redactionsBeforeRollback)
 assert.deepEqual(json('select * from public.market_recompute_queue order by release_id,condition'),queueBeforeRollback)
 assert.equal(d.json("select count(*) from pg_index i join pg_class c on c.oid=i.indexrelid where c.relname like 'p08_%' and i.indisvalid"),5)
 passed('managed-schema migration interruption/resume and application rollback preserve native ACL/RLS/triggers, all five indexes, redactions and queue')
 report.checks=checks;mkdirSync('work',{recursive:true});writeFileSync('work/p08-benchmark.json',JSON.stringify(report,null,2)+'\n');writeFileSync('work/p08-explain.json',explain);console.log(JSON.stringify(report,null,2))
}finally{delete globalThis.__p08SyntheticClient;d.close()}
