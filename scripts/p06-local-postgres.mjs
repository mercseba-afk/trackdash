import {spawnSync} from 'node:child_process'
import {randomBytes} from 'node:crypto'
export function localDatabase(prefix){
 const container=process.env.P06_TEST_CONTAINER||'trackdash-p06-isolated'
 if(!/^trackdash-p06-[a-z0-9-]+$/.test(container))throw Error('Isolated container name required')
 const env={...process.env};for(const k of ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH'])delete env[k]
 function docker(args,input,allowError=false){const r=spawnSync('docker',['--host=unix:///var/run/docker.sock',...args],{input,env,encoding:'utf8',maxBuffer:8e6});if(r.error)throw r.error;if(r.status&&!allowError)throw Error(r.stderr);return r}
 if(docker(['inspect','--format','{{.HostConfig.NetworkMode}}',container]).stdout.trim()!=='none')throw Error('Test container must have --network none')
 const db=prefix+'_'+randomBytes(6).toString('hex')
 const exec=(database,sql,allowError=false)=>docker(['exec','-i',container,'psql','-U','postgres','-X','-q','-A','-t','-v','ON_ERROR_STOP=1','-d',database],sql,allowError)
 exec('postgres',`create database ${db};`)
 return {db,sql:(q,allowError=false)=>exec(db,q,allowError),close:()=>exec('postgres',`drop database ${db} with(force);`),json:q=>JSON.parse(exec(db,q).stdout.trim())}
}
