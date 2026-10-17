import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {localDatabase} from './p06-local-postgres.mjs'
import {suppressionFixture,suppressionVault} from './p06-suppression-fixture.mjs'
const d=localDatabase('p06a'),q=v=>"'"+String(v).replaceAll("'","''")+"'"
const key='1'.repeat(64),digest='a'.repeat(64),other='2'.repeat(64)
const rpc=(action,data={},k=key)=>`select public.trackdash_ebay_erasure(${q(action)},${q(k)},${q(digest)},${q(JSON.stringify(action==='register'?{sealed:{keyId:'test'},...data}:data))}::jsonb);`
const asService=s=>'set role service_role;'+s
const run=(a,data={},k=key)=>d.json(asService(rpc(a,data,k)))
const release='00000000-0000-4000-8000-000000000009',condition='new_complete_unbuilt'
const seed=()=>{
 d.sql(`truncate trackdash_erasure.suppressed_candidates,trackdash_erasure.suppressed_identities,trackdash_erasure.notifications,trackdash_erasure.recomputes,trackdash_erasure.notification_work,public.market_candidates,public.market_offer_states,public.price_points,public.market_aggregate_observations,public.market_monthly_source_stats,public.price_sources,public.market_source_policies,public.product_releases,public.market_release_signals,public.market_release_monthly_signals,public.market_release_ask_snapshots cascade;
 insert into product_releases values('${release}');
 insert into price_sources values('00000000-0000-4000-8000-000000000001','ebay_active',true),('00000000-0000-4000-8000-000000000002','ebay_legacy',false),('00000000-0000-4000-8000-000000000003','retail',true);
 insert into market_source_policies values('00000000-0000-4000-8000-000000000001','ebay');
 insert into market_candidates values('00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000002','${release}','${condition}','ebay:synthetic-target',null,'{"seller":"synthetic-target","nested":[{"other":"synthetic-other"}]}',now());
 insert into market_candidates values('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000003','${release}','${condition}','ebay:synthetic-target',null,'{"seller":"synthetic-target"}',now());
 insert into market_offer_states values('00000000-0000-4000-8000-000000000020','00000000-0000-4000-8000-000000000002','${release}','${condition}','synthetic-target',now());
 insert into price_points values('00000000-0000-4000-8000-000000000030','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','${release}','${condition}',null,'{}',true,'verified',now());
 insert into market_aggregate_observations values('00000000-0000-4000-8000-000000000040','00000000-0000-4000-8000-000000000002','{"seller":"synthetic-target"}',now());
 insert into market_monthly_source_stats values('00000000-0000-4000-8000-000000000050','00000000-0000-4000-8000-000000000002','{"seller":"synthetic-target"}',now());`)
 run('register')
}
const erase=()=>run('erase',{identifiers:['synthetic-target']})
const publication=claim=>({...claim,writes:[{table:'market_release_signals',row:{release_id:release,condition,market_value_eur:12.5}},{table:'market_release_ask_snapshots',row:{release_id:release,condition,snapshot_date:'2026-10-16',typical_eur:10}}]})
const state=()=>d.json(`select jsonb_build_object('seller',(select seller_fingerprint from market_candidates where id='00000000-0000-4000-8000-000000000010'),'eligible',(select valuation_eligible from price_points),'job',(select state from trackdash_erasure.notifications where notification_key='${key}'));`)
try{
 d.sql(readFileSync('scripts/fixtures/p06a-schema.sql','utf8'));d.sql(readFileSync('proposals/p06a-ebay-erasure.sql','utf8'));d.sql(readFileSync('proposals/p06a-recovery-and-fence.sql','utf8'));suppressionVault(d);d.sql(readFileSync('proposals/p06a-ingress-suppression.sql','utf8'));suppressionFixture(d);d.sql('update trackdash_erasure.fence set guard_enabled=true;')
 seed();const out=erase();assert.equal(out.state,'erased');assert.equal(out.result.candidates,1);assert.equal(out.result.price_points,1);assert.equal(state().eligible,false)
 assert.equal(d.json(`select to_jsonb(seller_fingerprint) from market_candidates where id='00000000-0000-4000-8000-000000000011'`),'ebay:synthetic-target')
 assert.equal(run('erase',{identifiers:['synthetic-target']}).result.candidates,1)
 console.log('PASS inactive/legacy coverage, retail isolation, original counters retained on replay, atomic dependency handling')
 let claim=run('claim');assert.equal(claim.state,'claimed');assert.equal(run('claim').state,'erased')
 // A crash/recompute failure leaves durable work. Expire the lease only in this isolated fixture.
 d.sql('update trackdash_erasure.recomputes set locked_until=now()-interval \'1 second\';')
 let next=run('claim');assert.notEqual(next.token,claim.token)
 assert.notEqual(d.sql(asService(rpc('publish',publication(claim))),true).status,0)
 assert.equal(d.json('select count(*) from market_release_signals'),0)
 assert.equal(run('publish',publication(next)).state,'completed')
 assert.equal(run('register').state,'completed');assert.equal(run('claim').state,'completed')
 console.log('PASS failed recompute recovered after lease, stale publisher rejected, completion durable across duplicate deliveries')
 // Roll back at every mutation phase, including after all data updates before outbox commit.
 for(const table of ['market_candidates','market_offer_states','price_points','market_aggregate_observations','market_monthly_source_stats','trackdash_erasure.notification_work']){
  seed();const name=table.includes('.')?table:'public.'+table
  d.sql(`create function public.p06_failure() returns trigger language plpgsql as $$begin raise exception 'synthetic phase failure';end$$;create trigger p06_failure before insert or update on ${name} for each statement execute function public.p06_failure();`)
  const failure=d.sql(asService(rpc('erase',{identifiers:['synthetic-target']})),true)
  assert.notEqual(failure.status,0)
  assert.equal(d.json('select count(*) from trackdash_erasure.suppressed_identities'),0)
  assert.equal(d.json('select count(*) from trackdash_erasure.suppressed_candidates'),0)
  const phase={market_candidates:'candidates',market_offer_states:'offers',price_points:'price_points',market_aggregate_observations:'aggregates',market_monthly_source_stats:'monthly','trackdash_erasure.notification_work':'outbox'}[table]
  assert.ok(failure.stderr.includes('DETAIL:  '+phase),failure.stderr)
  assert.ok(!failure.stderr.includes('synthetic phase failure'))
  assert.deepEqual(state(),{seller:'ebay:synthetic-target',eligible:true,job:'received'})
  d.sql(`drop trigger p06_failure on ${name};drop function public.p06_failure();`)
  assert.equal(erase().state,'erased')
 }
 console.log('PASS rollback and retry after every data phase and outbox insertion failure')
 seed();d.sql(`create function public.p06_slow() returns trigger language plpgsql as $$begin perform pg_sleep(1);return new;end$$;create trigger p06_slow before update on market_candidates for each row execute function p06_slow();`)
 assert.notEqual(d.sql("set statement_timeout='40ms';"+asService(rpc('erase',{identifiers:['synthetic-target']})),true).status,0)
 assert.equal(state().seller,'ebay:synthetic-target');assert.equal(state().job,'received')
 d.sql('drop trigger p06_slow on market_candidates;drop function p06_slow();');erase()
 console.log('PASS statement timeout rolls back every partial change, registered notification remains recoverable')
 seed();const concurrent=await Promise.all([d.sqlAsync(asService(rpc('erase',{identifiers:['synthetic-target']}))),d.sqlAsync(asService(rpc('erase',{identifiers:['synthetic-target']})))]);assert.ok(concurrent.some(x=>x.status===0));assert.equal(state().eligible,false);erase()
 assert.equal(d.json('select count(*) from trackdash_erasure.notification_work'),1)
 console.log('PASS concurrent duplicates produce one durable work item')
 // A second notification invalidates a calculation begun against an earlier generation.
 seed();erase();claim=run('claim');run('register',{},other);run('erase',{identifiers:['synthetic-other']},other)
 assert.notEqual(d.sql(asService(rpc('publish',publication(claim))),true).status,0)
 next=run('claim',{},other);assert.equal(next.generation,2);run('publish',publication(next),other)
 assert.equal(run('status').state,'completed')
 console.log('PASS overlapping notifications fence old computation; newer generation satisfies both notifications')
 seed();erase();claim=run('claim');const invalid=publication(claim);invalid.writes.push({table:'profiles',row:{release_id:release,condition}})
 assert.notEqual(d.sql(asService(rpc('publish',invalid)),true).status,0);assert.equal(d.json('select count(*) from market_release_signals'),0)
 assert.notEqual(d.sql(asService(`select public.trackdash_ebay_erasure('register','${key}','${'b'.repeat(64)}','{}');`),true).status,0)
 for(const role of ['anon','authenticated']){
  assert.notEqual(d.sql(`set role ${role};select * from trackdash_erasure.notifications;`,true).status,0)
  assert.notEqual(d.sql(`set role ${role};${rpc('register')}`,true).status,0)
 }
 const cols=d.json("select json_agg(column_name order by ordinal_position) from information_schema.columns where table_schema='trackdash_erasure' and table_name='notifications'")
 assert.ok(!cols.some(x=>/raw_payload|username|user_id|eias|identifiers/.test(x)))
 console.log('PASS publication allowlist/atomicity, payload conflict, no public RPC/table access, no personal data in ledger')
}finally{d.close()}
