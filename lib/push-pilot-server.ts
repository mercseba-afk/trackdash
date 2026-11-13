import "server-only"
import { sendNotification, WebPushError, type PushSubscription } from "web-push"

export function pushPilotConfig() {
  const { TRACKDASH_PUSH_USER_ID: userId, TRACKDASH_PUSH_PUBLIC_KEY: publicKey, TRACKDASH_PUSH_PRIVATE_KEY: privateKey } = process.env
  return userId && publicKey && privateKey ? { userId, publicKey, privateKey } : null
}

export async function deliverPilotPush(
  config: NonNullable<ReturnType<typeof pushPilotConfig>>,
  subscription: PushSubscription,
  payload: { body: string; href?: string; id?: string },
) {
  try {
    await sendNotification(subscription, JSON.stringify(payload), {
      vapidDetails: { publicKey: config.publicKey, privateKey: config.privateKey, subject: "mailto:info@xebdesign.it" },
      TTL: 300,
      topic: payload.id?.replaceAll("-", "") ?? "trackdash-pilot",
      timeout: 5000,
    })
    return "sent"
  } catch (error) {
    if (error instanceof WebPushError && [404, 410].includes(error.statusCode)) return "expired"
    return "failed"
  }
}
