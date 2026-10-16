// Synthetic lab only. No connection strings, remote hosts or arbitrary targets.
import {spawnSync} from 'node:child_process'
export function localSnapshot(d){
 const container=process.env.P06_TEST_CONTAINER||'trackdash-p06-isolated'
 if(!/^trackdash-p06-[a-z0-9-]+$/.test(container)||!/^p06r_[0-9a-f]{12}$/.test(d.db))throw Error('RESTORE_TARGET_REJECTED')
 const env={...process.env};for(const k of ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH'])delete env[k]
 const run=(args,input)=>{const r=spawnSync('docker',['--host=unix:///var/run/docker.sock',...args],{env,input,maxBuffer:32e6});if(r.status||r.error)throw Error('ISOLATED_SNAPSHOT_FAILED');return r.stdout}
 if(run(['inspect','--format','{{.HostConfig.NetworkMode}}',container]).toString().trim()!=='none')throw Error('RESTORE_TARGET_REJECTED')
 return {dump:()=>run(['exec',container,'pg_dump','-U','postgres','-Fc','--exclude-table-data=vault.decrypted_secrets',d.db]),
 restore:bytes=>run(['exec','-i',container,'pg_restore','-U','postgres','--clean','--if-exists','--no-owner','--exit-on-error','--single-transaction','-d',d.db],bytes)}
}
