import {spawn,spawnSync} from 'node:child_process'
import {randomBytes} from 'node:crypto'
export function localDatabase(prefix){
 const container=process.env.P08_TEST_CONTAINER||'trackdash-p06-isolated'
 if(!/^trackdash-p0[68]-[a-z0-9-]+$/.test(container))throw Error('Isolated container name required')
 const env={...process.env};for(const k of ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH'])delete env[k]
 function docker(args,input,allowError=false){const r=spawnSync('docker',['--host=unix:///var/run/docker.sock',...args],{input,env,encoding:'utf8',maxBuffer:8e6});if(r.error)throw r.error;if(r.status&&!allowError)throw Error(r.stderr);return r}
 if(docker(['inspect','--format','{{.HostConfig.NetworkMode}}',container]).stdout.trim()!=='none')throw Error('Test container must have --network none')
 const db=prefix+'_'+randomBytes(6).toString('hex')
 const exec=(database,sql,allowError=false)=>docker(['exec','-i',container,'psql','-U','postgres','-X','-q','-A','-t','-v','ON_ERROR_STOP=1','-d',database],sql,allowError)
 exec('postgres',`create database ${db};`)
 const sqlAsync=q=>new Promise((resolve,reject)=>{const child=spawn('docker',['--host=unix:///var/run/docker.sock','exec','-i',container,'psql','-U','postgres','-X','-q','-A','-t','-v','ON_ERROR_STOP=1','-d',db],{env});let stdout='',stderr='';child.stdout.on('data',x=>stdout+=x);child.stderr.on('data',x=>stderr+=x);child.on('error',reject);child.on('close',status=>resolve({status,stdout,stderr}));child.stdin.end(q)})
 const snapshot=()=>{
  const file='/tmp/'+db+'.dump'
  docker(['exec',container,'pg_dump','-U','postgres','-Fc','-f',file,db])
  return {restoreTo:target=>{if(!/^p08r_[0-9a-f]{12}$/.test(target.db))throw Error('Isolated restore required');docker(['exec',container,'pg_restore','-U','postgres','--no-owner','--exit-on-error','-d',target.db,file])},close:()=>docker(['exec',container,'rm','-f',file])}
 }
 return {db,sqlAsync,snapshot,sql:(q,allowError=false)=>exec(db,q,allowError),close:()=>exec('postgres',`drop database ${db} with(force);`),json:q=>JSON.parse(exec(db,q).stdout.trim())}
}
