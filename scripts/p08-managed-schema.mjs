// Catalog-only Production snapshot -> isolated synthetic DDL. No remote client.
import {readFileSync} from 'node:fs'
export const nativeSnapshot=JSON.parse(readFileSync(new URL('./fixtures/p08-managed-schema.json',import.meta.url),'utf8'))
export const nativeTables=['market_candidates','market_aggregate_observations','market_offer_states','price_points','market_monthly_source_stats']
const q=x=>'"'+x.replaceAll('"','""')+'"'
export function installNativeSchema(d){
 if(!/^p08r_[0-9a-f]{12}$/.test(d.db))throw Error('ISOLATED_NATIVE_SCHEMA_REQUIRED')
 const s=nativeSnapshot,sql=[]
 const roles=new Set(s.tables.flatMap(t=>[...(t.grants??[]),...(t.column_grants??[])].map(g=>g.role)).concat(s.functions.flatMap(f=>(f.grants??[]).map(g=>g.role))))
 for(const role of roles)if(!['PUBLIC','postgres','service_role','anon','authenticated','trackdash_app','authenticator'].includes(role))sql.push(`do $$begin create role ${q(role)} nologin;exception when duplicate_object then null;end$$;`)
 sql.push('grant usage on schema public,auth to service_role,anon,authenticated;')
 for(const t of s.tables){
  sql.push(`create table public.${q(t.name)} (${t.columns.map(c=>q(c.name)+' '+c.type+(c.generated?` generated always as (${c.default}) stored`:c.identity?' generated '+(c.identity==='a'?'always':'by default')+' as identity':c.default?' default '+c.default:'')+(c.notnull?' not null':'')).join(',')});`)
 }
 // All referenced tables first; keys/checks before FKs, including cyclic links.
 for(const foreign of [false,true])for(const t of s.tables)for(const c of t.constraints??[])if(c.kind!=='t'&&(c.kind==='f')===foreign)sql.push(`alter table public.${q(t.name)} add constraint ${q(c.name)} ${c.definition};`)
 for(const t of s.tables){
  for(const index of t.indexes??[])sql.push(index+';')
  sql.push(`revoke all on public.${q(t.name)} from public,anon,authenticated,service_role,trackdash_app;`)
  for(const g of t.grants??[])if(g.role!=='postgres')sql.push(`grant ${g.privilege} on public.${q(t.name)} to ${g.role==='PUBLIC'?'PUBLIC':q(g.role)}${g.grantable?' with grant option':''};`)
  for(const g of t.column_grants??[])if(g.role!=='postgres')sql.push(`grant ${g.privilege}(${q(g.name)}) on public.${q(t.name)} to ${q(g.role)};`)
  if(t.rls)sql.push(`alter table public.${q(t.name)} enable row level security;`)
  if(t.force_rls)sql.push(`alter table public.${q(t.name)} force row level security;`)
 }
 for(const t of s.tables)for(const p of t.policies??[])sql.push(`create policy ${q(p.name)} on public.${q(t.name)} as ${p.permissive?'permissive':'restrictive'} for ${{r:'select',a:'insert',w:'update',d:'delete','*':'all'}[p.cmd]} to ${p.roles.map(r=>r==='PUBLIC'?'PUBLIC':q(r)).join(',')}${p.using?' using ('+p.using+')':''}${p.check?' with check ('+p.check+')':''};`)
 for(const f of s.functions){if(f.owner!=='postgres')throw Error('UNREPRESENTED_FUNCTION_OWNER');sql.push(f.definition+';')}
 d.sql(sql.join('\n'))
 const signatures=d.json("select jsonb_object_agg(proname,oid::regprocedure::text) from pg_proc where pronamespace='public'::regnamespace")
 const grants=[]
 for(const f of s.functions){grants.push(`revoke all on function ${signatures[f.proname]} from public,anon,authenticated,service_role,trackdash_app;`);for(const g of f.grants??[])if(g.role!=='postgres')grants.push(`grant execute on function ${signatures[f.proname]} to ${g.role==='PUBLIC'?'PUBLIC':q(g.role)}${g.grantable?' with grant option':''};`)}
 for(const t of s.tables.filter(t=>nativeTables.includes(t.name)))for(const tr of t.triggers??[])grants.push(tr.definition+';')
 d.sql(grants.join('\n'))
}
