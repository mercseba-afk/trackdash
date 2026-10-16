// Read-only remote metadata snapshot; all mutations below target a synthetic,
// network-isolated database. Exit 2 means a demonstrated release blocker.
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createClient} from '@supabase/supabase-js'
import {isolatedPostgrest} from './p06-postgrest-isolated.mjs'
const managed=JSON.parse(readFileSync('scripts/fixtures/p06a-managed-metadata.json','utf8'))
const d=await isolatedPostgrest(),release='00000000-0000-4000-8000-000000000009'
const normalize=x=>x.replaceAll(/\s+/g,' ').replaceAll('public.','')
const difference=(a,b)=>a.filter(x=>!b.some(y=>normalize(x)===normalize(y)))
try{
 for(const t of managed.tables){
  const actual=d.json(`select jsonb_build_object('columns',(select jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),'notnull',a.attnotnull)) from pg_attribute a where a.attrelid='public.${t.name}'::regclass and a.attnum>0 and not a.attisdropped),'indexes',(select jsonb_agg(indexdef) from pg_indexes where schemaname='public' and tablename='${t.name}'),'constraints',(select jsonb_agg(pg_get_constraintdef(oid)) from pg_constraint where conrelid='public.${t.name}'::regclass),'triggers',(select jsonb_agg(pg_get_triggerdef(oid)) from pg_trigger where tgrelid='public.${t.name}'::regclass and not tgisinternal));`)
  assert.deepEqual(t.columns.filter(c=>!actual.columns.some(v=>v.name===c.name&&v.type===c.type&&v.notnull===c.notnull)),[],t.name+' column/type/nullability drift')
  assert.equal(t.rls,true)
  assert.ok(t.acl.some(x=>x.startsWith('service_role=')&&x.split('=')[1].includes('r')),t.name+' requires service SELECT')
  if(!['price_sources','market_source_policies'].includes(t.name))assert.ok(t.acl.some(x=>x.startsWith('service_role=')&&x.split('=')[1].includes('w')),t.name+' requires service UPDATE')
  console.log(JSON.stringify({table:t.name,columnCompatibility:'PASS',missingFixtureIndexes:difference(t.indexes||[],actual.indexes||[]),differentManagedChecks:difference(t.constraints||[],actual.constraints||[]),missingFixtureTriggers:difference(t.triggers||[],actual.triggers||[])}))
 }
 // Retain the original scanner payload in memory, then commit erasure. The
 // normal service_role writer still accepts that stale payload afterwards.
 d.sql(readFileSync('scripts/fixtures/p06a-realistic-seed.sql','utf8'))
 const client=createClient('http://local.invalid',d.jwt('service_role'),{global:{fetch:d.fetchImpl},auth:{persistSession:false,autoRefreshToken:false}})
 const payload={source_id:'00000000-0000-4000-8000-000000000005',source_record_key:'synthetic-preflight',resolved_release_id:release,condition:'new_complete_unbuilt',seller_fingerprint:'ebay:synthetic-preflight-private',raw_payload:{seller:'synthetic-preflight-private'}}
 let response=await client.from('market_candidates').upsert(payload,{onConflict:'source_id,source_record_key'});assert.equal(response.error,null)
 const rpc=async(action,data)=>{const r=await client.rpc('trackdash_ebay_erasure',{p_action:action,p_key:'f'.repeat(64),p_digest:'e'.repeat(64),p_data:data}).retry(false);assert.equal(r.error,null);return r.data}
 await rpc('register',{sealed:{keyId:'synthetic'}})
 await rpc('erase',{identifiers:['synthetic-preflight-private']})
 assert.equal(d.json("select to_jsonb(seller_fingerprint is null) from market_candidates where source_record_key='synthetic-preflight'"),true)
 response=await client.from('market_candidates').upsert(payload,{onConflict:'source_id,source_record_key'});assert.equal(response.error,null)
 assert.equal(d.json("select to_jsonb(seller_fingerprint is not null) from market_candidates where source_record_key='synthetic-preflight'"),true)
 console.log('BLOCKED: stale ingestion upsert reintroduces a scrubbed seller despite canonical guard_enabled=true; completed path must not be enabled until ingress protection is implemented and tested')
 console.log('BLOCKED: current monitor mode shares application route, admin credential, flag, keyring and alert sink; external independent monitoring is not provisioned or certified')
 process.exitCode=2
}finally{d.close()}
