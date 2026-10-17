// Dedicated Lambda entry point. Not a Next route and not deployed by Vercel.
import { createErasureClient } from "../../lib/ebay/erasure-client"
import { deadlineFetch, EbayRecoveryError } from "../../lib/ebay/account-deletion-recovery"
import { createErasureJournal, JournalError } from "../../lib/ebay/erasure-journal"
import { runJournalRecovery } from "../../lib/ebay/erasure-journal-worker"
import { validateInboxKeys } from "../../lib/ebay/erasure-inbox"
import { SNSClient } from "@aws-sdk/client-sns"
import { snsAlarmSender } from "./alarm"
export async function handler() {
  if(process.env.EBAY_ERASURE_RUNNER_ENABLED!=="true")throw Error("ERASURE_RUNNER_DISABLED")
  const deadline=Date.now()+45000,bounded=deadlineFetch(deadline)
  try {
    validateInboxKeys()
    const sendAlarm=snsAlarmSender(new SNSClient({region:process.env.EBAY_ERASURE_JOURNAL_REGION,maxAttempts:1}),process.env.EBAY_ERASURE_ALARM_TOPIC_ARN??"",deadline)
    const client=createErasureClient("WORKER",bounded)
    const result=await runJournalRecovery(client,createErasureJournal(),deadline,
      (operation,code)=>console.info(JSON.stringify({operation,code})),sendAlarm)
    if(!result.healthy || !result.completePage)throw Error("ERASURE_UNHEALTHY")
    return {healthy:true,processed:result.processed,imported:result.imported}
  }catch(error){
    const code=error instanceof EbayRecoveryError?error.sqlCode:error instanceof JournalError?error.code:"FAILED"
    console.error(JSON.stringify({operation:"erasure_tick",code}))
    // Never let Lambda log the original database/SDK error, event or payload.
    throw Error("ERASURE_TICK_FAILED")
  }
}
