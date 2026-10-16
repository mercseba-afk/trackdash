import type { SupabaseClient } from "@supabase/supabase-js"
import { beforeDeadline, computeErasurePublication, EbayRecoveryError, resumeEbayErasureJob } from "./account-deletion-recovery"

type Report = (operation: string, code: string, elapsed: number) => void
export interface ErasureAlarm { id: string; kind: "overdue" | "exhausted" | "heartbeat" }
export async function recoveryRpc(client: SupabaseClient, action: string, data: object, deadline: number) {
  const { data: result, error } = await beforeDeadline(client.rpc("trackdash_ebay_recovery", { p_action: action, p_data: data })
    .retry(false).abortSignal(AbortSignal.timeout(Math.max(1, Math.min(12_000, deadline - Date.now())))) as unknown as Promise<{data: any; error: any}>, deadline)
  if (error) throw new EbayRecoveryError("recovery_" + action, /^(?:[A-Z0-9]{5}|PGRST[0-9]{3})$/.test(error.code ?? "") ? error.code : "UNKNOWN")
  return result
}

// No timer, queue subscription or cron is installed by importing this module.
// A separately approved durable scheduler calls the worker and monitor routes.
export async function runErasureRecoveryTick(client: SupabaseClient, deadline: number, report: Report,
  sendAlarm: (alarm: ErasureAlarm) => Promise<void>, monitorOnly = false, compute = computeErasurePublication) {
  const rpc = (action: string, data: object = {}) => recoveryRpc(client, action, data, deadline)
  let snapshot = await rpc("poll", { monitorOnly })
  let processed = 0, failed = 0
  const deliver = async (alarm: any) => {
    if (!alarm) return
    try {
      await beforeDeadline(sendAlarm({ id: alarm.id, kind: alarm.kind }), deadline)
      await rpc("alarm_ack", { id: alarm.id, token: alarm.token })
    } catch { report("alarm_delivery", "FAILED", 0) }
  }
  await deliver(snapshot.alarm)
  const job = snapshot.job
  if (job) {
    try {
      await resumeEbayErasureJob(client, job, deadline, report, compute)
      await rpc("settle", { key: job.key, token: job.token, code: "PROGRESS" })
      processed++
    } catch (error) {
      const code = error instanceof EbayRecoveryError ? error.sqlCode : "UNKNOWN"
      report("recovery_job", code, 0)
      failed++
      if (Date.now() < deadline - 1000) await rpc("settle", { key: job.key, token: job.token, code })
    }
    snapshot = await rpc("poll", { monitorOnly: true })
    await deliver(snapshot.alarm)
  }
  const health = snapshot.alarm ? await rpc("health") : snapshot.health
  return { processed, failed, health, healthy: !failed && !health.exhausted && !health.overdue && !health.undelivered && !health.heartbeatStale }
}
