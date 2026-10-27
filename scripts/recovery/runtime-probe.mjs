import postgres from 'postgres';
import {readFileSync} from 'node:fs';
import {runtimePostgresOptions} from './connection-options.ts';
let db;let typeCatalogQueries=0;let stage='connect';
try{
 db=postgres({...runtimePostgresOptions,host:process.env.PGHOST,port:5432,username:process.env.PGUSER,password:process.env.PGPASSWORD,database:'postgres',ssl:{rejectUnauthorized:true,ca:readFileSync(process.env.PGSSLROOTCERT,'utf8')},max:1,connect_timeout:15,onnotice:()=>{},debug:(_id,q)=>{if(/\bpg_type\b/.test(q))typeCatalogQueries++;}});
 const result=await db.begin('read only',async tx=>{
  stage='role';await tx.unsafe('SET LOCAL ROLE trackdash_app');stage='arrays';
  const text=['plain','comma,value','back\\slash','quote"value',''];
  const uuids=['00000000-0000-0000-0000-000000000001'];
  const [arrays]=await tx`select ${tx.array(text,1009)}::text[] as texts,${tx.array(uuids,2951)}::uuid[] as uuids`;
  if(JSON.stringify(arrays.texts)!==JSON.stringify(text)||JSON.stringify(arrays.uuids)!==JSON.stringify(uuids))throw new Error('ARRAY_ROUNDTRIP_FAILED');
  stage='restricted-counts';const [counts]=await tx`select (select count(*)::int from public.product_releases) releases,(select count(*)::int from public.profiles) unscoped_profiles`;
  return {arrayRoundtrip:true,...counts};
 });
 console.log(JSON.stringify({DriverProbe:'PASS',FetchTypes:runtimePostgresOptions.fetch_types,TypeCatalogQueries:typeCatalogQueries,RestrictedRole:'trackdash_app',...result,RealAuthTested:false,ScannerStarted:false}));
}catch(e){console.log(JSON.stringify({DriverProbe:'FAIL',Stage:stage,Code:/^[A-Z0-9_]+$/.test(e.code||'')?e.code:null,Details:e.message==='ARRAY_ROUNDTRIP_FAILED'?'ARRAY_ROUNDTRIP_FAILED':'Suppressed'}));process.exitCode=1;}
finally{await db?.end({timeout:5});}
