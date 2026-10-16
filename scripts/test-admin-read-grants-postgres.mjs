import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {build} from 'esbuild'
import {localDatabase} from './p06-local-postgres.mjs'
const proposal=readFileSync('proposals/p06b-admin-read-grants.sql','utf8')
assert.equal(proposal.replace(/--[^\n]*/g,'').trim(), 'GRANT SELECT (id, slug) ON public.categories TO service_role;\nGRANT SELECT (id, name, metadata, category_id) ON public.products TO service_role;')
const db=localDatabase('p06b'), quote=x=>"'"+String(x).replaceAll("'","''")+"'", id=x=>'"'+x.replaceAll('"','""')+'"'
const client={from(table){let columns='*',where=[],single=false;const query={select(c){columns=c;return query},eq(c,v){where.push(`${id(c)}=${quote(v)}`);return query},in(c,vs){where.push(`${id(c)} in (${vs.map(quote).join(',')})`);return query},not(c,op,v){assert.equal(op,'is');assert.equal(v,null);where.push(`${id(c)} is not null`);return query},maybeSingle(){single=true;return query},then(resolve,reject){try{const result=db.sql(`set role service_role;select coalesce(json_agg(x),'[]') from (select ${columns.split(',').map(id).join(',')} from public.${id(table)} ${where.length?'where '+where.join(' and '):''}) x;`,true);return Promise.resolve(result.status?{data:null,error:{message:result.stderr}}:{data:single?JSON.parse(result.stdout)[0]??null:JSON.parse(result.stdout),error:null}).then(resolve,reject)}catch(e){return Promise.reject(e).then(resolve,reject)}}};return query}}
globalThis.__p06Admin=client
try{
 db.sql(`do $$ begin create role service_role bypassrls; exception when duplicate_object then null; end $$;
 do $$ begin create role anon; exception when duplicate_object then null; end $$;
 do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
 create table categories(id text,slug text,name text);create table products(id text,name text,metadata jsonb,category_id text,private_notes text);
 alter table categories enable row level security;alter table products enable row level security;
 grant select on categories,products to anon,authenticated;
 create policy p06_public_categories on categories for select to anon,authenticated using(true);
 create policy p06_public_products on products for select to anon,authenticated using(true);
 create table product_releases(id text,product_id text,item_number text,edition_name text,catalog_visibility text,verification_status text);
 create table market_release_signals(release_id text,condition text,market_value_eur numeric,sold_anchor_eur numeric,sold_units integer);
 create table market_aggregate_observations(release_id text,source_id text,attribution_status text,grain text,period_start date,period_end date,sales_count int,seller_count int,market_average_eur numeric,evidence_grade text,condition text);
 create table market_recompute_queue(release_id text,condition text);
 grant usage on schema public to service_role;
 grant select on product_releases,market_release_signals,market_aggregate_observations,market_recompute_queue to service_role;
 insert into categories values('category','mini4wd','private');insert into products values('product','Synthetic family','{"launch_status":"available"}','category','private');
 insert into product_releases values('release','product','12345','Synthetic edition','public','verified');
 insert into market_release_signals values('release','new_complete_unbuilt',null,15,1);`)
 const result=await build({entryPoints:['lib/market/automation/sold-recovery-report.ts'],bundle:true,platform:'node',format:'esm',write:false,plugins:[{name:'isolated-admin',setup(b){b.onResolve({filter:/^server-only$/},()=>({path:'empty',namespace:'stub'}));b.onResolve({filter:/^@\/lib\/supabase\/admin$/},()=>({path:'admin',namespace:'stub'}));b.onLoad({filter:/.*/,namespace:'stub'},a=>({contents:a.path==='admin'?'export const createAdminClient=()=>globalThis.__p06Admin':'export {}'}))}}]})
 const {getMini4wdSoldRecoveryReport:report}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'))
 await assert.rejects(report,/load Mini4WD category:.*permission denied/s)
 const unchanged=()=>db.json("select jsonb_build_object('rls',(select jsonb_agg(jsonb_build_array(relname,relrowsecurity,relforcerowsecurity,relacl::text) order by relname) from pg_class where oid in ('categories'::regclass,'products'::regclass)),'policies',(select jsonb_agg(to_jsonb(p) order by policyname) from pg_policies p where tablename in ('categories','products')))")
 const before=unchanged()
 db.sql(proposal.split(';')[0]+';')
 await assert.rejects(report,/load Mini4WD products:.*permission denied/s)
 db.sql(proposal)
 const out=await report();assert.equal(out.publicReleases,1);assert.equal(out.oneSale,1);assert.equal(out.soldWithoutValue,1);assert.equal(out.rows[0].soldEUR,15)
 console.log('PASS real Mini4wdSoldRecovery report: before grants fails categories, partial grant fails products, exact grants succeed')
 for(const sql of ['select name from categories','select private_notes from products','select * from categories','select * from products','insert into categories(id) values(\'x\')','update products set name=\'x\'','delete from products'])assert.notEqual(db.sql('set role service_role;'+sql,true).status,0,sql)
 assert.equal(db.json("select json_agg(relrowsecurity) from pg_class where oid in ('categories'::regclass,'products'::regclass)" ).every(Boolean),true)
 const grants=db.json("select json_agg(column_name order by column_name) from information_schema.column_privileges where grantee='service_role' and table_name in ('categories','products') and privilege_type='SELECT'")
 assert.deepEqual(grants,['category_id','id','id','metadata','name','slug'])
 assert.deepEqual(unchanged(),before)
 console.log('PASS only required six column grants; all other columns, SELECT *, writes denied; RLS remains enabled')
}finally{delete globalThis.__p06Admin;db.close()}
