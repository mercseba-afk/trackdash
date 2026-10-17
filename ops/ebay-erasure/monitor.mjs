// Read-only monitor: independent of the Vercel worker, using a scoped DB role.
import {pathToFileURL} from 'node:url'
export function assessHealth(h){
 const fields=['pending','oldestPendingSeconds','exhausted','heartbeatSeconds','undelivered']
 if(!h||h.guard!==true||fields.some(k=>typeof h[k]!=='number'||!Number.isFinite(h[k])||h[k]<0))return false
 return !h.exhausted&&!h.undelivered&&h.oldestPendingSeconds<900&&h.heartbeatSeconds<900
}
export async function monitorOnce({env=process.env,fetchImpl=fetch}={}){
 try{
  const url=new URL(env.EBAY_ERASURE_MONITOR_DB_URL)
  if(url.protocol!=='https:'||!env.EBAY_ERASURE_MONITOR_JWT||!env.EBAY_ERASURE_MONITOR_API_KEY)throw Error()
  const response=await fetchImpl(new URL('/rest/v1/rpc/trackdash_ebay_erasure_health',url),{method:'POST',redirect:'error',signal:AbortSignal.timeout(12000),headers:{'Content-Type':'application/json',apikey:env.EBAY_ERASURE_MONITOR_API_KEY,Authorization:'Bearer '+env.EBAY_ERASURE_MONITOR_JWT},body:'{}'})
  const payload=await response.json()
  if(!response.ok)return {healthy:false,code:/^(?:[A-Z0-9]{5}|PGRST[0-9]{3})$/.test(payload?.code??'')?payload.code:'HTTP_FAILED'}
  const healthy=assessHealth(payload)
  return {healthy,code:healthy?'OK':'UNHEALTHY'}
 }catch{return {healthy:false,code:'MONITOR_UNAVAILABLE'}}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const result=await monitorOnce();console.log(JSON.stringify(result));if(!result.healthy)process.exitCode=1
}
