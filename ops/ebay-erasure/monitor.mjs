// Independent executable: no worker imports, claim/ACK, service_role or keys.
import {pathToFileURL} from 'node:url'
import {readFileSync} from 'node:fs'
export function assessHealth(h,journal){
 const fields=['pending','oldestPendingSeconds','exhausted','heartbeatSeconds','journalCycleSeconds','undelivered']
 if(!h||h.guard!==true||h.recovering!==false||fields.some(k=>typeof h[k]!=='number'||!Number.isFinite(h[k])||h[k]<0))return false
 if(!journal||!Number.isSafeInteger(journal.accepted)||!Number.isSafeInteger(journal.completed)||journal.completed<0||journal.accepted<journal.completed||!Number.isSafeInteger(h.journalCompleted)||h.journalCompleted<journal.completed||h.journalCompleted>journal.accepted)return false
 if(journal.accepted>journal.completed&&(!Number.isFinite(journal.oldestPendingMs)||Date.now()-journal.oldestPendingMs>=900000||journal.oldestPendingMs>Date.now()+60000))return false
 return !h.exhausted&&!h.undelivered&&h.oldestPendingSeconds<900&&h.heartbeatSeconds<900&&h.journalCycleSeconds<900
}
export async function monitorOnce({env=process.env,fetchImpl=fetch,journal}={}){
 try{
  const url=new URL(env.EBAY_ERASURE_MONITOR_DB_URL)
  if(url.protocol!=='https:'||!env.EBAY_ERASURE_MONITOR_JWT||!env.EBAY_ERASURE_MONITOR_API_KEY)throw Error()
  const response=await fetchImpl(new URL('/rest/v1/rpc/trackdash_ebay_erasure_health',url),{method:'POST',redirect:'error',signal:AbortSignal.timeout(12000),headers:{'Content-Type':'application/json',apikey:env.EBAY_ERASURE_MONITOR_API_KEY,Authorization:'Bearer '+env.EBAY_ERASURE_MONITOR_JWT},body:'{}'})
  const payload=await response.json()
  if(!response.ok)return {healthy:false,code:/^(?:[A-Z0-9]{5}|PGRST[0-9]{3})$/.test(payload?.code??'')?payload.code:'HTTP_FAILED'}
  return {healthy:assessHealth(payload,journal),code:assessHealth(payload,journal)?'OK':'UNHEALTHY'}
 }catch{return {healthy:false,code:'MONITOR_UNAVAILABLE'}}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 let journal;try{const m=JSON.parse(readFileSync(process.env.EBAY_ERASURE_MONITOR_STATS_PATH,'utf8')),o=JSON.parse(readFileSync(process.env.EBAY_ERASURE_MONITOR_OLDEST_PATH,'utf8'));journal={accepted:Number(m.Item?.accepted?.N??0),completed:Number(m.Item?.completed?.N??0),oldestPendingMs:Date.parse(o.Items?.[0]?.createdAt?.S)}}catch{}
 const result=await monitorOnce({journal});console.log(JSON.stringify(result));if(!result.healthy)process.exitCode=1
}
