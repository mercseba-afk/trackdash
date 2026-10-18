import {spawn,spawnSync} from 'node:child_process'
import {randomBytes,createHmac} from 'node:crypto'
import {readFileSync} from 'node:fs'
import {localDatabase} from './p08-local-postgres.mjs'
import {installNativeSchema} from './p08-managed-schema.mjs'
export async function isolatedPostgrest(){
 const startedAt=new Date().toISOString()
 const d=localDatabase('p08r'),pg=process.env.P08_TEST_CONTAINER||'trackdash-p06-isolated',rest='trackdash-p08-rest-'+randomBytes(5).toString('hex')
 const env={...process.env};for(const k of ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH'])delete env[k]
 const docker=(args,input,combine=false)=>{const r=spawnSync('docker',['--host=unix:///var/run/docker.sock',...args],{env,input,encoding:'utf8',maxBuffer:8e6});if(r.status)throw Error(r.stderr);return combine?r.stdout+r.stderr:r.stdout}
 let nodePath=null,bridge=null
 const close=()=>{try{bridge?.stdin.end();bridge?.kill();docker(['rm','--force',rest])}finally{if(nodePath)docker(['exec',pg,'rm','-f',nodePath]);d.close()}}
 try{
 d.sql(`do $$begin create role service_role nologin bypassrls;exception when duplicate_object then null;end$$;do $$begin create role anon;exception when duplicate_object then null;end$$;do $$begin create role authenticated;exception when duplicate_object then null;end$$;do $$begin create role trackdash_app;exception when duplicate_object then null;end$$;do $$begin create role authenticator login noinherit;exception when duplicate_object then null;end$$;grant service_role,anon,authenticated to authenticator;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as 'select null::uuid';`)

 installNativeSchema(d)
 d.sql(readFileSync('proposals/p08-ebay-erasure.sql','utf8'))
 const port=15000+randomBytes(2).readUInt16BE()%20000
 nodePath='/tmp/p08-node-'+d.db
 const jwtSecret=randomBytes(32).toString('hex')
 const jwt=(role,expired=false)=>{const head=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),body=Buffer.from(JSON.stringify({role,exp:Math.floor(Date.now()/1000)+(expired?-60:3600)})).toString('base64url');return head+'.'+body+'.'+createHmac('sha256',jwtSecret).update(head+'.'+body).digest('base64url')}
 docker(['cp',process.execPath,pg+':'+nodePath])
 docker(['run','--detach','--name',rest,'--network','container:'+pg,'--env','PGRST_DB_URI=postgres://authenticator@127.0.0.1:5432/'+d.db,'--env','PGRST_DB_SCHEMAS=public','--env','PGRST_DB_ANON_ROLE=anon','--env','PGRST_JWT_SECRET='+jwtSecret,'--env','PGRST_SERVER_HOST=127.0.0.1','--env','PGRST_SERVER_PORT='+port,'--env','PGRST_LOG_LEVEL=crit','postgrest/postgrest:v13.0.7@sha256:0a46780309a604cdc8b56c776c6e5e15788ce58174d709e40459ab5a2d44d228'])
 // One persistent transport, confined to the network-none PostgreSQL namespace.
 // No port publication or cloud credentials. Request bodies travel via stdin.
 const metrics={requests:0,requestBytes:0,responseBytes:0,records:0}
 const script=`const readline=require('node:readline');readline.createInterface({input:process.stdin}).on('line',async line=>{const r=JSON.parse(line);try{const response=await fetch('http://127.0.0.1:'+${port}+r.path,{...r.init,signal:AbortSignal.timeout(30000)});const body=await response.text();console.log(JSON.stringify({id:r.id,status:response.status,body,headers:Object.fromEntries(response.headers)}))}catch{console.log(JSON.stringify({id:r.id,error:true}))}})`
 bridge=spawn('docker',['--host=unix:///var/run/docker.sock','exec','-i',pg,nodePath,'-e',script],{env,stdio:['pipe','pipe','pipe']})
 bridge.stdout.setEncoding('utf8')
 let sequence=0,buffer='';const pending=new Map()
 bridge.stdout.on('data',chunk=>{buffer+=chunk;let end;while((end=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,end);buffer=buffer.slice(end+1);const r=JSON.parse(line);const p=pending.get(r.id);if(!p)continue;pending.delete(r.id);if(r.error){p.reject(Error('ISOLATED_HTTP_TRANSPORT'));continue}metrics.responseBytes+=Buffer.byteLength(r.body);if(process.env.P08_DEBUG&&r.status>=400){try{console.error('SQLSTATE',JSON.parse(r.body).code)}catch{}}try{const b=JSON.parse(r.body);metrics.records+=Array.isArray(b)?b.length:b&&typeof b==='object'?Object.values(b).reduce((n,v)=>n+(Array.isArray(v)?v.length:0),0):0}catch{}p.resolve(new Response(r.status===204?null:r.body,{status:r.status,headers:r.headers}))}})
 bridge.on('error',error=>{for(const p of pending.values())p.reject(error);pending.clear()})
 bridge.stderr.on('data',()=>{})
 const fetchImpl=(input,init={})=>new Promise((resolve,reject)=>{
  const url=new URL(String(input)),path=url.pathname.replace(/^\/rest\/v1/,'')+url.search
  const id=++sequence;metrics.requests++;metrics.requestBytes+=Buffer.byteLength(String(init.body??''))
  pending.set(id,{resolve,reject});const {signal,...plain}=init
  if(signal?.aborted){pending.delete(id);reject(new DOMException('Aborted','AbortError'));return}
  signal?.addEventListener('abort',()=>{pending.delete(id);reject(new DOMException('Aborted','AbortError'))},{once:true})
  bridge.stdin.write(JSON.stringify({id,path,init:{...plain,headers:Object.fromEntries(new Headers(init.headers))}})+'\n')
 })
 const stop=close
 for(let n=0;n<30;n++){try{const r=await fetchImpl('http://local.invalid/');if(r.status===200)break}catch{}if(n===29)throw Error('PostgREST not ready');await new Promise(r=>setTimeout(r,200))}
 return {...d,fetchImpl,jwt,metrics,serverCpuMs:()=>Number(docker(['exec',pg,'cat','/sys/fs/cgroup/cpu.stat']).match(/usage_usec (\d+)/)[1])/1000,close:stop,reload:()=>{d.sql("notify pgrst,'reload schema';");return new Promise(r=>setTimeout(r,300))},logs:()=>docker(['logs',rest],undefined,true),databaseLogs:()=>docker(['logs','--since',startedAt,pg],undefined,true)}
 }catch(e){close();throw e}
}
