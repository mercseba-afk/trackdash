import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createHash,randomBytes} from 'node:crypto'
import {createClient} from '@supabase/supabase-js'
import {isolatedPostgrest} from './p06-postgrest-isolated.mjs'
import {nativeSnapshot,nativeTables} from './p06-native-trigger-fixture.mjs'
import {loadModule} from './p06-load-module.mjs'
const started=Date.now(),d=await isolatedPostgrest({nativeFixture:true})
const uid=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0'),release=uid(9),unrelated=uid(19),shared=uid(29),source=uid(5),condition='new_complete_unbuilt'
const mk=role=>createClient('http://local.invalid',d.jwt(role),{global:{fetch:d.fetchImpl},auth:{persistSession:false,autoRefreshToken:false}})
const admin=mk('service_role'),logs=[],report=(...a)=>logs.push(a),codes=[],findings=[]
const ok=async p=>{const r=await p;if(r.error){codes.push(r.error.code);throw Error('NATIVE_RPC_REJECTED_'+r.error.code+' '+(r.error.message.match(/permission denied for (?:table|schema|function) [a-zA-Z0-9_]+/)?.[0]??''))}return r.data}
const canonical=w=>w.map(x=>({...x,row:Object.fromEntries(Object.entries(x.row).filter(([k])=>!['computed_at','updated_at','captured_at'].includes(k)))}))
let stage='schema'
try{
 // Assert exact captured DDL, all eight functions/triggers, ACL/RLS and checks.
 for(const t of nativeSnapshot.tables){
  const local=d.json(`select jsonb_build_object('columns',(select jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),'notnull',a.attnotnull,'default',pg_get_expr(x.adbin,x.adrelid)) order by a.attnum) from pg_attribute a left join pg_attrdef x on x.adrelid=a.attrelid and x.adnum=a.attnum where a.attrelid='public.${t.name}'::regclass and a.attnum>0 and not a.attisdropped),'checks',(select jsonb_agg(pg_get_constraintdef(oid) order by conname) from pg_constraint where conrelid='public.${t.name}'::regclass and contype<>'t'),'rls',(select relrowsecurity from pg_class where oid='public.${t.name}'::regclass));`)
  assert.deepEqual(local.columns,t.columns.map(({name,type,notnull,default:defaultValue})=>({name,type,notnull,default:defaultValue})),t.name+' columns/defaults')
  // Reparse CHECK text through PostgreSQL itself: its parser flattens nested
  // AND nodes on round-trip. Do not strip parentheses or alter semantics.
  const checks=(t.constraints??[]).filter(c=>c.kind==='c')
  const roundtrip=checks.length?d.json(`create temp table p06_canonical(like public.${t.name});${checks.map(c=>`alter table p06_canonical add constraint "${c.name}" ${c.definition};`).join('')}select jsonb_object_agg(conname,pg_get_constraintdef(oid)) from pg_constraint where conrelid='p06_canonical'::regclass;`):{}
  const expectedChecks=(t.constraints??[]).filter(c=>c.kind!=='t').map(c=>c.kind==='c'?roundtrip[c.name]:c.definition);const diff={missing:expectedChecks.filter(x=>!local.checks.includes(x)),extra:local.checks.filter(x=>!expectedChecks.includes(x))};assert.deepEqual(diff,{missing:[],extra:[]},t.name+' constraints '+JSON.stringify(diff))
  assert.equal(local.rls,t.rls,t.name+' RLS')
  const rights=d.json(`select jsonb_build_object('indexes',(select coalesce(jsonb_agg(indexdef),'[]') from pg_indexes i where schemaname='public' and tablename='${t.name}' and not exists(select 1 from pg_constraint k where k.conindid=(quote_ident(i.schemaname)||'.'||quote_ident(i.indexname))::regclass)),'grants',(select coalesce(jsonb_agg(jsonb_build_object('role',case when e.grantee=0 then 'PUBLIC' else pg_get_userbyid(e.grantee) end,'privilege',e.privilege_type,'grantable',e.is_grantable)),'[]') from pg_class c cross join lateral aclexplode(c.relacl)e where c.oid='public.${t.name}'::regclass));`)
  assert.deepEqual(rights.indexes.sort(),(t.indexes??[]).slice().sort(),t.name+' indexes')
  const normalized=rows=>rows.map(x=>JSON.stringify([x.role,x.privilege,x.grantable])).sort()
  assert.deepEqual(normalized(rights.grants),normalized(t.grants??[]),t.name+' table ACL')
  const security=d.json(`select jsonb_build_object('force',(select relforcerowsecurity from pg_class where oid='public.${t.name}'::regclass),'columnGrants',(select coalesce(jsonb_agg(jsonb_build_object('name',a.attname,'role',pg_get_userbyid(e.grantee),'privilege',e.privilege_type,'grantable',e.is_grantable)),'[]') from pg_attribute a cross join lateral aclexplode(a.attacl)e where a.attrelid='public.${t.name}'::regclass),'policies',(select coalesce(jsonb_agg(jsonb_build_object('name',p.polname,'permissive',p.polpermissive,'cmd',p.polcmd,'roles',(select jsonb_agg(case when r=0 then 'PUBLIC' else pg_get_userbyid(r) end) from unnest(p.polroles)r),'using',pg_get_expr(p.polqual,p.polrelid),'check',pg_get_expr(p.polwithcheck,p.polrelid))),'[]') from pg_policy p where p.polrelid='public.${t.name}'::regclass));`)
  assert.equal(security.force,t.force_rls,t.name+' force RLS')
  const columnRights=rows=>rows.map(x=>JSON.stringify([x.name,x.role,x.privilege])).sort()
  assert.deepEqual(columnRights(security.columnGrants),columnRights(t.column_grants??[]),t.name+' column ACL')
  const policies=rows=>rows.map(x=>JSON.stringify([x.name,x.permissive,x.cmd,x.roles.slice().sort(),x.using,x.check])).sort()
  assert.deepEqual(policies(security.policies),policies(t.policies??[]),t.name+' policies')


 }
 let triggerCount=0
 for(const t of nativeSnapshot.tables.filter(t=>nativeTables.includes(t.name)))for(const tr of t.triggers??[]){assert.equal(d.json(`select to_jsonb(pg_get_triggerdef(oid)) from pg_trigger where tgrelid='public.${t.name}'::regclass and tgname='${tr.name}'`),tr.definition);triggerCount++}
 assert.equal(triggerCount,8)
 for(const f of nativeSnapshot.functions)assert.equal(d.json(`select to_jsonb(pg_get_functiondef(oid)) from pg_proc where pronamespace='public'::regnamespace and proname='${f.proname}'`),f.definition)
 console.log('PASS frozen managed schema: 28 tables with full columns/defaults/checks/FKs/RLS, 14 exact function bodies and all eight native target triggers; catalog-seeding-only dependency triggers explicitly out of scope')
 stage='seed'
 d.sql(readFileSync('scripts/fixtures/p06a-realistic-seed.sql','utf8'))
 d.sql(`insert into product_releases(id,product_id,item_number,release_type,edition_name,release_year) values('${unrelated}','${uid(3)}','00002','standard','Synthetic unrelated',2026);
 insert into price_sources(id,slug,name,source_type,is_active) values('${uid(7)}','ebay_active_public','Synthetic active','marketplace',true),('${uid(8)}','rcjaz_public','Synthetic RCJAZ','retail',true),('${uid(17)}','trackdash_confirmed_sales','Synthetic internal','manual',true);
 insert into market_source_policies(source_id,source_family,scan_scope,independent_key,role,default_interval_hours,include_by_default,adapter_status) values
 ('${source}','ebay','sold_research','synthetic-sold','primary_marketplace',168,false,'ready'),
 ('${uid(7)}','ebay','active_marketplace','synthetic-active','primary_marketplace',168,true,'ready'),
 ('${uid(8)}','retail','retail','synthetic-retail','retail_reference',168,true,'ready'),
 ('${uid(17)}','trackdash','sold_research','synthetic-internal','internal_sales',168,true,'internal');`)
 d.sql('drop role if exists trackdash_erasure_monitor;drop role if exists trackdash_erasure_worker;drop role if exists trackdash_erasure_ingress;')
 d.sql(readFileSync('proposals/p06a-minimization-and-token-recovery.sql','utf8'));await d.reload()
 const worker=mk('trackdash_erasure_worker'),ingress=mk('trackdash_erasure_ingress'),monitor=mk('trackdash_erasure_monitor')
 Object.assign(process.env,{EBAY_ERASURE_KEYS:JSON.stringify({test:randomBytes(32).toString('hex')}),EBAY_ERASURE_CURRENT_KEY:'test',EBAY_ERASURE_WORKER_ENABLED:'true',EBAY_ERASURE_FENCING_ENABLED:'true'})
 const m=await loadModule('lib/ebay/account-deletion-recovery.ts'),recovery=await loadModule('lib/ebay/erasure-worker.ts'),acceptance=await loadModule('lib/ebay/erasure-acceptance.ts'),identity=await loadModule('lib/ebay/erasure-inbox.ts')
 const writesFor=(r,c=condition)=>m.computeErasurePublication(worker,{releaseId:r,condition:c})
 const publish=async(r,writes,c=condition)=>{const state=await ok(admin.rpc('trackdash_market_fence',{p_action:'snapshot',p_data:{releaseId:r,condition:c}}).retry(false));return ok(admin.rpc('trackdash_market_fence',{p_action:'publish',p_data:{epoch:state.epoch,releaseId:r,condition:c,writes:writes??await writesFor(r,c)}}).retry(false))}
 const tick=()=>recovery.runErasureRecoveryTick(worker,Date.now()+45000,report,async()=>{throw Error('SYNTHETIC_MONITOR_ONLY')})
 stage='signal INSERT and UPDATE'
 await publish(release)
 assert.equal(d.json(`select count(*) from market_scan_targets where release_id='${release}'`),2)
 assert.equal(d.json(`select scan_interval_hours from market_scan_targets where release_id='${release}' and source_id='${uid(7)}'`),1008)
 assert.equal(d.json(`select count(*) from market_scan_targets where source_id='${uid(17)}'`),0)
 // Updates of an existing signal must not enroll/reset queues again.
 d.sql(`update market_scan_queue set next_scan_at='2030-01-01',scan_interval_hours=777 where release_id='${release}' and source_id='${uid(7)}';`)
 await publish(release)
 assert.equal(d.json(`select scan_interval_hours from market_scan_queue where release_id='${release}' and source_id='${uid(7)}'`),777)
 d.sql(`insert into product_releases(id,product_id,item_number,release_type,edition_name,release_year) values('${shared}','${uid(3)}','00001','standard','Synthetic ambiguous',2025);`)
 await publish(shared)
 assert.equal(d.json(`select count(*) from market_scan_queue where source_id='${uid(7)}' and release_id in ('${release}','${shared}') and not enabled and next_scan_at>'2098-01-01'`),2)
 d.sql(`update product_releases set barcode_jan='4900000000001' where id='${release}';`)
 // A second CONDITION is a new signal INSERT, so the real trigger runs.
 await publish(shared,undefined,'built_complete')
 assert.equal(d.json(`select count(*) from market_scan_queue where release_id='${release}' and source_id='${uid(7)}' and enabled and scan_interval_hours=1008`),1)
 console.log('PASS signal INSERT -> real enrollment and uniqueness dependencies; UPDATE preserves existing cadence; ambiguous item parked, unique JAN restored; internal sources excluded')
 stage='RCJAZ and revalidation'
 const rcjaz=await admin.from('market_candidates').insert({id:uid(31),source_id:uid(8),source_record_key:'synthetic-rcjaz',resolved_release_id:unrelated,condition,decision:'accepted',match_confidence:'exact',match_evidence:['verified_endpoint_match'],listing_url:'https://www.rcjaz.com/tamiya-00002-p-1001.html'})
 if(rcjaz.error){
  assert.equal(rcjaz.error.code,'42501');assert.match(rcjaz.error.message,/permission denied for table market_scan_endpoints/)
  findings.push('RCJAZ_HTTP_SERVICE_ROLE_INSERT_DENIED')
  console.log('FAIL compatibility: native RCJAZ service_role HTTP INSERT lacks INSERT on market_scan_endpoints; no grant applied; continuing other tests using explicit owner-only seed')
  // This owner-only positive control does NOT close the HTTP permission failure.
  d.sql(`insert into market_candidates(id,source_id,source_record_key,resolved_release_id,condition,decision,match_confidence,match_evidence,listing_url) values('${uid(31)}','${uid(8)}','synthetic-rcjaz','${unrelated}','${condition}','accepted','exact',array['verified_endpoint_match'],'https://www.rcjaz.com/tamiya-00002-p-1001.html');`)
 }

 assert.equal(d.json(`select count(*) from market_scan_endpoints where release_id='${unrelated}'`),1)
 await ok(admin.from('market_candidates').insert({id:uid(32),source_id:source,source_record_key:'synthetic-ebay-negative',resolved_release_id:unrelated,condition,decision:'accepted',match_confidence:'exact',match_evidence:['item_number_exact'],listing_url:'https://www.ebay.it/itm/00002'}))
 assert.equal(d.json('select count(*) from market_scan_endpoints'),1)
 // Remove the ambiguity fixture after testing identities; no signal hard delete.
 d.sql(`update product_releases set item_number='00003' where id='${shared}';`)
 const point=(candidate,price)=>`insert into price_points(candidate_id,release_id,source_id,observation_type,condition,price,currency,shipping_basis,valuation_price,normalized_price_eur,match_confidence,match_evidence,evidence_group_key,valuation_eligible,sold_on,observed_at,evidence_grade,market_price_eur,market_price_basis) values('${candidate}','${release}','${source}','sold_confirmed','${condition}',${price},'EUR','excluded',${price},${price},'exact',array['item_number_exact'],'eg:synthetic-${price}',true,current_date-1,now(),'verified',${price},'raw_sale');`
 d.sql(`insert into market_candidates(id,source_id,source_record_key,resolved_release_id,condition,seller_fingerprint,decision,match_confidence,match_evidence) values('${uid(40)}','${source}','synthetic-target','${release}','${condition}','ebay:SyntheticDeleted','accepted','exact',array['item_number_exact']),('${uid(41)}','${source}','synthetic-survivor','${release}','${condition}','ebay:SyntheticSurvivor','accepted','exact',array['item_number_exact']);`+point(uid(40),9999)+point(uid(41),25))
 await ok(admin.from('market_candidates').update({resolved_release_id:unrelated}).eq('id',uid(41)))
 assert.equal(d.json(`select to_jsonb(needs_revalidation and not valuation_eligible) from price_points where candidate_id='${uid(41)}'`),true)
 d.sql(`update market_candidates set resolved_release_id='${release}',needs_revalidation=false where id='${uid(41)}';update price_points set needs_revalidation=false,valuation_eligible=true where candidate_id='${uid(41)}';`)
 const deniedDelete=await admin.from('price_points').delete().eq('candidate_id',uid(40));assert.ok(deniedDelete.error);assert.equal(d.json('select count(*) from price_points'),2);codes.push(deniedDelete.error.code)
 const guardedDelete=d.sql(`delete from price_points where candidate_id='${uid(40)}';`,true);assert.notEqual(guardedDelete.status,0);assert.match(guardedDelete.stderr,/price_points are append-preserved/);codes.push('P0001')
 assert.equal(d.json(`select count(*) from market_recompute_queue where release_id='${release}'`),1)
 d.sql(`insert into market_aggregate_observations(source_id,release_id,item_number,condition,attribution_status,grain,period_start,period_end,query_key,sales_count,average_item_price,currency,market_average_eur,raw_payload) values('${source}','${release}','00001','${condition}','release_exact','monthly',current_date-1,current_date,'synthetic-aggregate',2,25,'EUR',25,'{"seller":"SyntheticDeleted"}');
 update market_aggregate_observations set average_item_price=26,market_average_eur=26;`)
 assert.equal(d.json(`select count(*) from market_recompute_queue where release_id='${release}'`),1)
 d.sql(`begin;delete from market_recompute_queue where release_id='${release}';delete from market_aggregate_observations;do $$begin if not exists(select 1 from market_recompute_queue where release_id='${release}') then raise exception 'NATIVE_DELETE_DID_NOT_QUEUE';end if;end$$;rollback;`)
 console.log('PASS native RCJAZ/eBay negative control, candidate release revalidation, point/aggregate INSERT/UPDATE/DELETE queue coalescing and append-preserved point hard-delete guard')
 stage='marketplace sales'
 d.sql(`insert into auth.users(id) values('${uid(101)}'),('${uid(102)}');insert into profiles(id,username) values('${uid(101)}','synthetic-seller'),('${uid(102)}','synthetic-buyer');
 insert into conversations(id,product_id,release_id,owner_id,requester_id,owner_username,requester_username,request_message) values('${uid(103)}','${uid(3)}','${unrelated}','${uid(101)}','${uid(102)}','synthetic-seller','synthetic-buyer','synthetic request');
 insert into marketplace_offers(id,conversation_id,release_id,creator_id,condition,amount,currency) values('${uid(104)}','${uid(103)}','${unrelated}','${uid(101)}','Sealed',80,'EUR');
 insert into marketplace_sales(id,conversation_id,offer_id,release_id,seller_id,buyer_id,condition,item_price,currency,item_price_eur,sale_date) values('${uid(105)}','${uid(103)}','${uid(104)}','${unrelated}','${uid(101)}','${uid(102)}','Sealed',80,'EUR',80,current_date);`)
 assert.equal(d.json('select count(*) from notifications'),1)
 // Direct writes are not granted on the managed schema; do not manufacture a grant.
 const saleDenied=await admin.from('marketplace_sales').update({status:'confirmed'}).eq('id',uid(105));assert.equal(saleDenied.error?.code,'42501');
 d.sql(`update marketplace_sales set status='confirmed',confirmed_at=now(),buyer_responded_at=now() where id='${uid(105)}';update marketplace_sales set status='confirmed' where id='${uid(105)}';`)
 assert.equal(d.json('select count(*) from notifications'),2)
 assert.equal(d.json(`select count(*) from market_recompute_queue where release_id='${unrelated}'`),1)
 const notificationDigest=d.json('select to_jsonb(md5(jsonb_agg(to_jsonb(n) order by id)::text)) from notifications n')
 const unaffected=canonical(await writesFor(unrelated));assert.ok(unaffected.some(w=>w.row.sold_anchor_eur===80||Number(w.row.sold_anchor_eur)===80),'unrelated real sale must contribute EUR80 SOLD');await publish(unrelated)
 console.log('PASS owner-only marketplace_sales trigger probe (HTTP direct UPDATE correctly denied): pending buyer notification, confirmed seller notification, deduplication and single keyed recompute; canonical unrelated publication succeeds')
 stage='erasure and old writers'
 d.sql(`update trackdash_erasure.minimization_config set key_id='synthetic',enabled=true;update market_candidates set updated_at=updated_at;`)
 // Canonical control: remove only the soon-to-be inadmissible sold evidence.
 d.sql(`update price_points set valuation_eligible=false where candidate_id='${uid(40)}';`)
 const expected=canonical(await writesFor(release))
 d.sql(`update price_points set valuation_eligible=true where candidate_id='${uid(40)}';`)
 const stale=await ok(admin.rpc('trackdash_market_fence',{p_action:'snapshot',p_data:{releaseId:release,condition}}).retry(false)),staleWrites=await writesFor(release)
 await tick()
 const message={notificationId:'synthetic-native-erasure',identifiers:{username:'SyntheticDeleted'}}
 await Promise.all([acceptance.acceptEbayErasure(ingress,message,Date.now()+30000),acceptance.acceptEbayErasure(ingress,message,Date.now()+30000)])
 const id=identity.inboxIdentity(message)
 // Stop after erase by failing recomputation; no native trigger is disabled.
 await assert.rejects(m.resumeEbayErasureJob(worker,id,Date.now()+45000,report,async()=>{throw Error('SYNTHETIC_COMPUTE_INTERRUPTION')}))
 assert.equal(d.json("select to_jsonb(state) from trackdash_erasure.notifications"),'erased')
 assert.ok(d.json('select count(*) from trackdash_erasure.notification_work')>0)
 d.sql("update trackdash_erasure.recomputes set locked_until=now()-interval '1 second';")
 const resumed=await Promise.allSettled([m.resumeEbayErasureJob(worker,id,Date.now()+45000,report),m.resumeEbayErasureJob(worker,id,Date.now()+45000,report)])
 assert.ok(resumed.some(x=>x.status==='fulfilled'&&x.value===true))
 await m.resumeEbayErasureJob(worker,id,Date.now()+45000,report)
 const rejected=await admin.rpc('trackdash_market_fence',{p_action:'publish',p_data:{epoch:stale.epoch,releaseId:release,condition,writes:staleWrites}}).retry(false)
 assert.equal(rejected.error?.code,'PT409');codes.push(rejected.error.code)
 await ok(admin.from('market_candidates').upsert({source_id:source,source_record_key:'synthetic-target',resolved_release_id:release,condition,seller_fingerprint:'ebay:SyntheticDeleted',raw_payload:{seller:'SyntheticDeleted'}},{onConflict:'source_id,source_record_key'}))
 await ok(admin.from('price_points').update({valuation_eligible:true,evidence_grade:'verified',evidence_group_key:'unsafe-late-group'}).eq('candidate_id',uid(40)))
 assert.equal(d.json(`select to_jsonb(seller_fingerprint is null) from market_candidates where id='${uid(40)}'`),true)
 assert.equal(d.json(`select to_jsonb(not valuation_eligible and evidence_group_key is null) from price_points where candidate_id='${uid(40)}'`),true)
 assert.equal(d.json(`select price from price_points where candidate_id='${uid(40)}'`),9999)
 assert.equal(d.json('select average_item_price from market_aggregate_observations'),26)
 assert.equal(d.json("select to_jsonb(raw_payload ? 'seller') from market_aggregate_observations"),false)
 assert.deepEqual(canonical(await writesFor(release)),expected)
 await publish(release);await publish(unrelated)
 assert.deepEqual(canonical(await writesFor(unrelated)),unaffected)
 assert.equal(d.json('select to_jsonb(md5(jsonb_agg(to_jsonb(n) order by id)::text)) from notifications n'),notificationDigest)
 assert.equal(d.json('select count(*) from marketplace_sales'),1)
 assert.equal(d.json('select count(*) from trackdash_erasure.notifications'),1)
 assert.equal(d.json("select to_jsonb(state) from trackdash_erasure.notifications"),'completed')
 console.log('PASS full native-trigger erasure: duplicate inbox, historical HMAC source, stale publication fenced, late writer scrubbed; ineligible EUR9999 excluded from canonical MV/SOLD/ASK; unrelated Release/sale/notifications unchanged')
 stage='HTTP roles and privilege controls'
 assert.equal((await ok(monitor.rpc('trackdash_ebay_erasure_health').retry(false))).pending,0)
 assert.ok((await ingress.from('market_candidates').select('id').limit(1)).error)
 assert.ok((await monitor.from('marketplace_sales').select('id').limit(1)).error)
 for(const role of ['anon','authenticated']){const denied=await mk(role).from('market_candidates').select('id');assert.equal(denied.error?.code,'42501');}
 // Delete on synthetic marketplace sale remains a native queue event; erasure
 // itself never touched this independent internal-sale evidence.
 d.sql(`delete from market_recompute_queue where release_id='${unrelated}';delete from marketplace_sales;`)
 assert.equal(d.json('select count(*) from notifications'),2)
 assert.equal(d.json(`select count(*) from market_recompute_queue where release_id='${unrelated}'`),1)
 console.log('PASS real PostgREST role JWTs and RLS with native schema; internal-sale DELETE queues independently, without duplicate notifications or erasure side effects')
 if(findings.length){console.error('NATIVE_COMPATIBILITY_FAIL '+findings.join(','));process.exitCode=1}
 console.log('PERF isolated native fixture '+JSON.stringify({elapsedMs:Date.now()-started,httpRequests:d.metrics.requests,snapshotSha256:createHash('sha256').update(readFileSync('scripts/fixtures/p06a-native-trigger-schema.json')).digest('hex'),expectedErrorCodes:codes}))
}catch(e){console.error('NATIVE_TRIGGER_LAB_FAILED stage='+stage+' code='+e.constructor.name);process.exitCode=1}
finally{d.close()}
