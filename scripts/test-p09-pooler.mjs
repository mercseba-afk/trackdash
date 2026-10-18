// Synthetic PostgreSQL wire benchmark. No remote connection or published port.
import {spawnSync} from 'node:child_process'
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs'
import {build} from 'esbuild'
import {localDatabase} from './p08-local-postgres.mjs'
import {installNativeSchema} from './p08-managed-schema.mjs'
const d=localDatabase('p08r'),container=process.env.P08_TEST_CONTAINER||'trackdash-p06-isolated'
const env={...process.env};for(const k of ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH'])delete env[k]
const docker=(args)=>{const r=spawnSync('docker',['--host=unix:///var/run/docker.sock',...args],{env,encoding:'utf8',maxBuffer:4e6});if(r.status)throw Error(r.stderr);return r.stdout}
const nodePath='/tmp/p09-node-'+d.db,scriptPath='/tmp/p09-fixture-'+d.db+'.mjs'
try{
 d.sql(`do $$begin create role authenticated;exception when duplicate_object then null;end$$;do $$begin create role anon;exception when duplicate_object then null;end$$;do $$begin create role service_role bypassrls;exception when duplicate_object then null;end$$;do $$begin create role trackdash_app;exception when duplicate_object then null;end$$;alter role trackdash_app login nobypassrls;grant authenticated,anon to trackdash_app;
 create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,trackdash_app;`)
 installNativeSchema(d)
 // Keep the exact additive P0.8 DDL installed throughout the Pooler test.
 d.sql(readFileSync('proposals/p08-ebay-erasure.sql','utf8'))
 const bundle=await build({entryPoints:['scripts/p09-pooler-fixture.mjs'],bundle:true,platform:'node',format:'esm',write:false,plugins:[{name:'server-only',setup(b){b.onResolve({filter:/^server-only$/},()=>({path:'empty',namespace:'local'}));b.onLoad({filter:/.*/,namespace:'local'},()=>({contents:''}))}}]})
 mkdirSync('work',{recursive:true});writeFileSync('work/p09-fixture-bundle.mjs',bundle.outputFiles[0].text)
 docker(['cp',process.execPath,container+':'+nodePath]);docker(['cp','work/p09-fixture-bundle.mjs',container+':'+scriptPath])
 const output=docker(['exec','--env','DATABASE_URL=postgres://trackdash_app@127.0.0.1:5432/'+d.db,container,nodePath,scriptPath])
 console.log(output);writeFileSync('work/p09-benchmark.json',output.slice(output.indexOf('{')))
}finally{docker(['exec',container,'rm','-f',nodePath,scriptPath]);d.close()}
