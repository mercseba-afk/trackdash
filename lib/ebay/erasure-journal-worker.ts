import type { SupabaseClient } from "@supabase/supabase-js"
import { beforeDeadline, EbayRecoveryError, resumeEbayErasureJob } from "./account-deletion-recovery"
import { runErasureRecoveryTick, recoveryRpc, type ErasureAlarm } from "./erasure-worker"
import type { ErasureJournal, TokenReceipt } from "./erasure-journal"
type Report=(operation:string,code:string,elapsed:number)=>void
export async function runJournalRecovery(client:SupabaseClient,journal:ErasureJournal,deadline:number,report:Report,sendAlarm:(alarm:ErasureAlarm)=>Promise<void>) {
  const rpc=async(action:string,data:object={})=>{
    const {data:out,error}=await beforeDeadline(client.rpc("trackdash_ebay_journal",{p_action:action,p_data:data}).retry(false)
      .abortSignal(AbortSignal.timeout(Math.max(1,Math.min(8000,deadline-Date.now())))) as unknown as Promise<{data:any;error:any}>,deadline)
    if(error)throw new EbayRecoveryError("journal_"+action,/^(?:[A-Z0-9]{5}|PGRST[0-9]{3})$/.test(error.code??"")?error.code:"UNKNOWN")
    return out
  }
  let cursor=await rpc("cursor"),meta=await journal.meta(deadline)
  if(cursor.completed>meta.accepted)throw new EbayRecoveryError("journal_regressed","REGRESSED")
  if(cursor.completed<meta.completed&&!cursor.recovering){await rpc("recover_start");cursor=await rpc("cursor")}
  const pending=await journal.pending(deadline)
  const page=cursor.recovering&&!cursor.scan_done?await journal.scan(cursor.cursor,deadline):{receipts:[],cursor:null}
  const receipts=new Map<string,TokenReceipt>([...page.receipts,...pending].map(r=>[r.key,r]))
  let imported=0
  for(const r of receipts.values()){
    if(Date.now()>deadline-12000)throw new EbayRecoveryError("journal_register","DEADLINE")
    await rpc("register",{receipt:r,generation:cursor.recovering?cursor.recovery_generation:null});imported++
  }
  if(cursor.recovering&&!cursor.scan_done)await rpc("advance",{cursor:page.cursor})
  let processed=0,failed=0,healthy=false
  // Exhaustion remains unhealthy/alerted, but a recovered dependency must not
  // require another eBay delivery or a manual reset. At most one slow claim per
  // tick and one attempt per job per six hours; no immediate retry loop.
  const slow=await rpc("slow_take")
  if(slow){
    let code="PROGRESS"
    try{await resumeEbayErasureJob(client,slow,deadline,report);processed++}
    catch(error){code=error instanceof EbayRecoveryError?error.sqlCode:"UNKNOWN";report("slow_recovery",code,0);failed++}
    if(Date.now()<deadline-1000)await recoveryRpc(client,"settle",{key:slow.key,token:slow.token,code},deadline)
  }
  for(let n=0;n<8&&Date.now()<deadline-12000;n++){
    const result=await runErasureRecoveryTick(client,deadline,report,sendAlarm)
    processed+=result.processed;failed+=result.failed;healthy=result.healthy
    if(result.failed||!result.processed)break
  }
  const states=await rpc("known",{keys:[...receipts.keys()]})
  for(const state of states)if(state.state==='completed')await journal.complete(receipts.get(state.key)!,deadline)
  cursor=await rpc("cursor");meta=await journal.meta(deadline)
  // A GSI may be empty while accepted work is still missing. Only counters
  // and primary obligations can establish convergence. No TTL/purge here.
  if(cursor.recovering&&cursor.scan_done&&cursor.completed===meta.accepted&&meta.completed===meta.accepted&&!failed){await rpc("recover_finish");cursor=await rpc("cursor")}
  await rpc("tick")
  return {imported,processed,failed,completePage:!cursor.recovering,healthy:healthy&&!failed&&!cursor.recovering&&cursor.completed===meta.accepted&&meta.completed===meta.accepted}
}
