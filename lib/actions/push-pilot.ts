"use server"

import { sendNotification, WebPushError, type PushSubscription } from "web-push"
import { getCurrentUser } from "@/lib/auth/current-user"

async function pilotConfig() {
  const { TRACKDASH_PUSH_USER_ID, TRACKDASH_PUSH_PUBLIC_KEY, TRACKDASH_PUSH_PRIVATE_KEY } = process.env
  if (!TRACKDASH_PUSH_USER_ID || !TRACKDASH_PUSH_PUBLIC_KEY || !TRACKDASH_PUSH_PRIVATE_KEY) return null
  const user = await getCurrentUser()
  if (user?.id !== TRACKDASH_PUSH_USER_ID) return null
  return { publicKey: TRACKDASH_PUSH_PUBLIC_KEY, privateKey: TRACKDASH_PUSH_PRIVATE_KEY }
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

  try {
    await sendNotification(subscription, JSON.stringify({
      body: "Le notifiche push di prova sono attive su questo dispositivo.",
    }), {
      vapidDetails: { ...config, subject: "mailto:info@xebdesign.it" },
      TTL: 120,
      topic: "trackdash-pilot",
      timeout: 5000,
    })
    return "sent"
  } catch (error) {
    if (error instanceof WebPushError && [404, 410].includes(error.statusCode)) return "expired"
    return "failed"
  }
}
