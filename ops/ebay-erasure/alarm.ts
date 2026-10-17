import { PublishCommand, type SNSClient } from "@aws-sdk/client-sns"
import type { ErasureAlarm } from "../../lib/ebay/erasure-worker"

export function snsAlarmSender(client: Pick<SNSClient,"send">, topic: string, deadline: number) {
  if (!/^arn:aws:sns:[a-z]{2}-[a-z]+-\d:[0-9]{12}:[a-zA-Z0-9_-]+$/.test(topic)) throw Error("ALARM_NOT_CONFIGURED")
  return async (alarm: ErasureAlarm) => {
    if (!/^[0-9a-f-]{36}$/.test(alarm.id) || !["overdue","exhausted","heartbeat"].includes(alarm.kind) || Date.now()>=deadline) throw Error("ALARM_INVALID")
    // Only the opaque alert-row UUID and fixed kind leave the database.
    const result=await client.send(new PublishCommand({TopicArn:topic,Subject:"TrackDash eBay erasure requires attention",Message:JSON.stringify({id:alarm.id,kind:alarm.kind})}),{abortSignal:AbortSignal.timeout(Math.max(1,Math.min(8000,deadline-Date.now())))})
    if (!result.MessageId) throw Error("ALARM_DELIVERY_FAILED")
  }
}
