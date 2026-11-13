"use server"

import type { PushSubscription } from "web-push"
import { getCurrentUser } from "@/lib/auth/current-user"
import { createAdminClient } from "@/lib/supabase/admin"
import { deliverPilotPush, pushPilotConfig } from "@/lib/push-pilot-server"

async function pilotConfig() {
  const config = pushPilotConfig()
  if (!config) return null
  const user = await getCurrentUser()
  return user?.id === config.userId ? config : null
}

export async function getPushPilotKey() {
  return (await pilotConfig())?.publicKey ?? null
}

function validSubscription(subscription: PushSubscription) {
  if (!subscription || typeof subscription.endpoint !== "string" || subscription.endpoint.length > 2048) return false
  try {
    const url = new URL(subscription.endpoint)
    const host = url.hostname
    const provider = host === "fcm.googleapis.com" || host === "updates.push.services.mozilla.com"
      || host === "web.push.apple.com" || host.endsWith(".push.apple.com")
      || host.endsWith(".notify.windows.com")
    return provider && url.protocol === "https:" && !url.port && !url.username && !url.password
      && /^[\w-]{87}$/.test(subscription.keys?.p256dh ?? "")
      && /^[\w-]{22}$/.test(subscription.keys?.auth ?? "")
  } catch {
    return false
  }
}

export async function sendPushPilot(subscription: PushSubscription) {
  const config = await pilotConfig()
  if (!config || !validSubscription(subscription)) return "unavailable"

  return deliverPilotPush(config, subscription, {
    body: "Le notifiche push di prova sono attive su questo dispositivo.",
  })
}

export async function registerPushPilot(subscription: PushSubscription) {
  const config = await pilotConfig()
  if (!config || !validSubscription(subscription)) return false
  const { error } = await createAdminClient().from("push_pilot_subscriptions").upsert({
    endpoint: subscription.endpoint,
    user_id: config.userId,
    keys: subscription.keys,
  }, { onConflict: "endpoint", ignoreDuplicates: true })
  return !error
}

export async function unregisterPushPilot(endpoint: string) {
  const config = await pilotConfig()
  if (!config) return false
  const { error } = await createAdminClient().from("push_pilot_subscriptions")
    .delete().eq("user_id", config.userId).eq("endpoint", endpoint)
  return !error
}
