// Runs only inside the synthetic network-none container, via test-p09-pooler.
import assert from 'node:assert/strict'
import net from 'node:net'
import {performance} from 'node:perf_hooks'
import postgres from 'postgres'
import {drizzle} from 'drizzle-orm/postgres-js'
import {eq,getTableName,getTableColumns,is,sql} from 'drizzle-orm'
import {PgTable,PgArray,getTableConfig,pgTable,text,uuid,jsonb,numeric,timestamp,boolean,integer} from 'drizzle-orm/pg-core'
import * as schema from '../lib/db/schema/index.ts'
import {runtimePostgresOptions} from '../lib/db/connection-options.ts'
import {db as runtimeDb} from '../lib/db/index.ts'
import {withUserContext} from '../lib/db/rls.ts'
import {catalogListProjection} from '../lib/db/queries/catalog.ts'
import {mapProductRow} from '../lib/actions/mappers.ts'
import {fetchCatalogProductsForVertical} from '../lib/actions/catalog.ts'
import {COLLECTIBLE_VERTICALS} from '../lib/verticals.ts'
const url=new URL(process.env.DATABASE_URL)
assert.equal(url.hostname,'127.0.0.1');assert.match(url.pathname,/^\/p08r_[a-f0-9]{12}$/)
const admin=postgres({host:'127.0.0.1',user:'postgres',database:url.pathname.slice(1),prepare:false,max:1})
const q=x=>'"'+x.replaceAll('"','""')+'"'
let checks=0;const pass=s=>{checks++;console.log('PASS '+s)}
const clients=[]
try{
 // All declared array columns are supported. Adding another array type fails
 // this gate rather than silently changing decoding when type discovery is off.
 const arrayColumns=[]
 for(const [name,table]of Object.entries(schema))if(is(table,PgTable))for(const col of Object.values(getTableColumns(table)))if(is(col,PgArray)){assert(['text[]','uuid[]'].includes(col.getSQLType()),name+'.'+col.name);arrayColumns.push(name+'.'+col.name)}
 assert(arrayColumns.length>=8)
 const fixture=pgTable('p09_values',{id:integer('id').primaryKey(),strings:text('strings').array(),ids:uuid('ids').array(),payload:jsonb('payload'),amount:numeric('amount'),created:timestamp('created',{withTimezone:true}),enabled:boolean('enabled')})
 await admin.unsafe(`create table p09_values(id integer primary key,strings text[],ids uuid[],payload jsonb,amount numeric,created timestamptz,enabled boolean);grant select,insert,update on p09_values to trackdash_app;`)
 // Extra referenced tables: full ORM column types, synthetic rows; not a claim
 // of a complete managed Auth restore. The 16 native market tables come from
 // the read-only managed schema fixture, including RLS/ACL/triggers/P0.8 SQL.
 for(const table of [schema.productImages,schema.releaseImages,schema.releaseSources,schema.profiles,schema.collectionItems]){
  const config=getTableConfig(table)
  await admin.unsafe(`create table public.${q(config.name)} (${config.columns.map(c=>q(c.name)+' '+c.getSQLType()).join(',')});grant select on public.${q(config.name)} to trackdash_app;`)
 }
 await admin.unsafe(`insert into brands(id,slug,name) values('00000000-0000-4000-8000-000000000001','synthetic','Synthetic');
 insert into categories(id,slug,name) values('${COLLECTIBLE_VERTICALS.mini4wd.categoryId}','mini4wd','Synthetic');
 insert into products(id,category_id,brand_id,slug,name,original_release_year,rarity) select md5('product'||i)::uuid,'${COLLECTIBLE_VERTICALS.mini4wd.categoryId}','00000000-0000-4000-8000-000000000001','synthetic-'||i,'Synthetic '||i,2026,'common' from generate_series(1,50)i;
 insert into product_releases(id,product_id,item_number,release_type,edition_name,release_year,chassis) select md5('release'||i)::uuid,md5('product'||i)::uuid,'synthetic-'||i,'original','Synthetic',2026,'synthetic' from generate_series(1,50)i;
 insert into release_sources(id,release_id,verified_fields) select md5('source'||i)::uuid,md5('release'||i)::uuid,array['name','a,b','quote"','path\\value','NULL'] from generate_series(1,50)i;
 insert into profiles(id,username) values('00000000-0000-4000-8000-000000000003','synthetic-a'),('00000000-0000-4000-8000-000000000004','synthetic-b');
 insert into collection_items(id,user_id,quantity) values(md5('copy-a')::uuid,'00000000-0000-4000-8000-000000000003',4),(md5('copy-b')::uuid,'00000000-0000-4000-8000-000000000004',2);
 alter table collection_items enable row level security;grant select,update on collection_items to authenticated;
 create policy p09_owner on collection_items to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());`)
 // Match the observed ~406 pg_type initialization rows, without real app data.
 const count=await admin`select count(*)::int n from (select b.oid,b.typarray from pg_catalog.pg_type a left join pg_catalog.pg_type b on b.oid=a.typelem where a.typcategory='A' group by b.oid,b.typarray)t`
 for(let i=count[0].n;i<406;i++)await admin.unsafe(`create type p09_type_${i} as enum('synthetic')`)
 function measured(options){
  const metrics={bytes:0,dataRowBytes:0,dataRows:0,metadataQueries:0,queries:0,connections:0}
  const p=postgres(process.env.DATABASE_URL,{...options,max:3,socket:async()=>{
   metrics.connections++;const s=net.connect({host:'127.0.0.1',port:5432});await new Promise((r,j)=>{s.once('connect',r);s.once('error',j)})
   let buffer=Buffer.alloc(0)
   s.on('data',chunk=>{metrics.bytes+=chunk.length;buffer=Buffer.concat([buffer,chunk]);while(buffer.length>=5){const size=1+buffer.readUInt32BE(1);if(buffer.length<size)break;if(buffer[0]===68){metrics.dataRowBytes+=size;metrics.dataRows++}buffer=buffer.subarray(size)}})
   return s
  },debug:(_,query)=>{metrics.queries++;if(query.includes('pg_catalog.pg_type'))metrics.metadataQueries++}})
  clients.push(p);return {p,metrics,orm:drizzle(p,{schema})}
 }
 const baseline=measured({prepare:false}),fixed=measured(runtimePostgresOptions)
 const uuidValue='00000000-0000-4000-8000-000000000003'
 const strings=['plain','','a,b','a"b','a\\b','{braces}','NULL','null','é😀',null]
 for(let i=0;i<strings.length;i++)await admin`insert into p09_values values(${i},${admin.array([strings[i],strings[(i+1)%strings.length]],25)},${admin.array([uuidValue],2950)},${admin.json({nested:[{number:25,text:strings[i]}]})},25.30,'2026-10-18T12:00:00Z',true)`
 const left=await baseline.orm.select().from(fixture).orderBy(fixture.id),right=await fixed.orm.select().from(fixture).orderBy(fixture.id)
 assert.deepEqual(right,left)
 assert.equal(fixed.metrics.metadataQueries,0);assert.equal(baseline.metrics.metadataQueries,1)
 pass('all '+arrayColumns.length+' declared text[]/uuid[] columns covered; arrays, escapes, nulls, jsonb, numeric, timestamptz, boolean equal baseline')
 const naive=measured({prepare:false,fetch_types:false});assert.notDeepEqual(await naive.orm.select().from(fixture),left)
 pass('plain fetch_types:false reproduces array-escape regression; explicit codecs prevent it')
 const write={strings:['new\\path','quote"',null],ids:[uuidValue],payload:{nested:[null,'a\\b',25]},amount:'29.40'}
 const oldWritten=await baseline.orm.update(fixture).set(write).where(eq(fixture.id,0)).returning()
 const newWritten=await fixed.orm.update(fixture).set(write).where(eq(fixture.id,0)).returning()
 assert.deepEqual(newWritten,oldWritten)
 assert.deepEqual(await fixed.p`select strings,ids from p09_values where id=0`,await baseline.p`select strings,ids from p09_values where id=0`)
 pass('Drizzle array/json update+returning and direct-driver result decoding preserved')
 const catalog=orm=>orm.query.products.findMany({with:{brand:true,category:true,images:true,releases:{with:{images:true,sources:true}}},orderBy:(f,{asc})=>[asc(f.name)],limit:500})
 assert.deepEqual(await catalog(fixed.orm),await catalog(baseline.orm))
 const thinCatalog=orm=>orm.query.products.findMany({...catalogListProjection,orderBy:(f,{asc})=>[asc(f.name)],limit:500})
 assert.deepEqual((await thinCatalog(fixed.orm)).map(mapProductRow),(await catalog(baseline.orm)).map(mapProductRow))
 pass('catalog public Product/Release/image/source mapping unchanged by the narrower list; full data remains in the database')
 assert.equal(runtimeDb.$client.options.fetch_types,false);assert.equal(runtimeDb.$client.options.prepare,false)
 const readOwner=id=>withUserContext(id,tx=>tx.select().from(schema.collectionItems))
 const a='00000000-0000-4000-8000-000000000003',b='00000000-0000-4000-8000-000000000004'
 for(let i=0;i<10;i++)await Promise.all([readOwner(a).then(rows=>{assert.equal(rows.length,1);assert.equal(rows[0].userId,a)}),readOwner(b).then(rows=>{assert.equal(rows.length,1);assert.equal(rows[0].userId,b)})])
 assert.equal((await runtimeDb.select().from(schema.collectionItems)).length,0)
 await assert.rejects(withUserContext(a,async tx=>{await tx.update(schema.collectionItems).set({userId:b});throw Error('must not reach')}),error=>error.cause?.code==='42501')
 await assert.rejects(withUserContext(a,()=>{throw Error('synthetic rollback')}),/synthetic rollback/)
 assert.equal((await runtimeDb.select().from(schema.collectionItems)).length,0)
 pass('actual runtime factory and withUserContext preserve concurrent owner isolation, RLS denial, transaction rollback and no context leakage')
 const benchmark=async (options,readCatalog=catalog)=>{
  const totals={connections:0,queries:0,metadataQueries:0,dataRows:0,dataRowBytes:0,bytes:0};const cpu=process.cpuUsage(),start=performance.now()
  // Cold clients represent distinct short-lived serverless runtimes; same
  // bounded business read and catalog query for both, plus warm repeat reads.
  for(let i=0;i<30;i++){
   const m=measured(options);await m.orm.select().from(fixture).where(eq(fixture.id,0));await readCatalog(m.orm)
   for(let n=0;n<3;n++)await m.orm.select().from(fixture).where(eq(fixture.id,0))
   await m.p.end();for(const k of Object.keys(totals))totals[k]+=m.metrics[k]
  }
  const used=process.cpuUsage(cpu);return {...totals,wallMs:performance.now()-start,nodeCpuMs:(used.user+used.system)/1000}
 }
 const before=await benchmark({prepare:false}),typesOnly=await benchmark(runtimePostgresOptions),after=await benchmark(runtimePostgresOptions,thinCatalog)
 assert.equal(before.connections,after.connections);assert.equal(before.metadataQueries,30);assert.equal(after.metadataQueries,0)
 assert.equal(before.dataRows-after.dataRows,30*406);assert(after.bytes<before.bytes)
 pass('30 cold clients + 90 warm scalar reads + full catalog parity: zero metadata discovery, measured PostgreSQL response bytes reduced')
 // Physical reconnect must not reintroduce discovery or corrupt array parsing.
 await fixed.p.close();assert.deepEqual(await fixed.orm.select().from(fixture),await baseline.orm.select().from(fixture));assert.equal(fixed.metrics.metadataQueries,0)
 pass('physical reconnect preserves codecs and does not issue pg_type discovery')
 const originalPublic=await fetchCatalogProductsForVertical('mini4wd')
 assert.deepEqual(originalPublic,(await catalog(baseline.orm)).map(mapProductRow));assert.equal(originalPublic.length,50)
 const extra='00000000-0000-4000-8000-000000000099'
 await admin`insert into product_releases(id,product_id,item_number,release_type,edition_name,release_year,chassis) values(${extra},md5('product1')::uuid,'synthetic-extra','reissue','Synthetic new Release',2026,'synthetic')`
 const expanded=await fetchCatalogProductsForVertical('mini4wd')
 assert.equal(expanded.find(p=>p.name==='Synthetic 1').releases.length,2)
 await admin`update product_releases set catalog_visibility='research_only' where id=${extra}`
 assert.deepEqual(await fetchCatalogProductsForVertical('mini4wd'),originalPublic)
 await admin`update products set metadata='{"catalog_visibility":"archived"}'::jsonb where id=md5('product50')::uuid`
 await admin`update products set metadata='{"launch_status":"coming_soon"}'::jsonb where id=md5('product49')::uuid`
 const gated=await fetchCatalogProductsForVertical('mini4wd')
 assert.equal(gated.length,49);assert(!gated.some(p=>p.name==='Synthetic 50'))
 assert.deepEqual(gated.find(p=>p.name==='Synthetic 49').releases,[])
 pass('actual catalog fetch preserves next-read publication, all Releases and research-only/archived/coming-soon gates')

 const indexes=await admin`select count(*)::int n from pg_index i join pg_class c on c.oid=i.indexrelid where c.relname like 'p08_%' and i.indisvalid and i.indisready`
 assert.equal(indexes[0].n,5)
 console.log(JSON.stringify({checks,arrayColumns,fixtureTypeRows:406,coldClients:30,before,typesOnly,after,wireByteReductionPercent:100*(1-after.bytes/before.bytes),scope:'Real local PostgreSQL protocol response bytes, synthetic data, no TLS/pooler billing overhead. Not a Supabase bill or live monthly saving. No business rows omitted; mapped public catalog identical; list omits unused columns/brand join, without caching.'},null,2))
}finally{await Promise.allSettled([...clients.map(p=>p.end({timeout:1})),runtimeDb.$client.end({timeout:1}),admin.end({timeout:1})])}
