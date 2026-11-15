import { verifyTrackDashGithubAction } from "@/lib/auth/github-oidc"
import { createAdminClient } from "@/lib/supabase/admin"
import { deliverPilotPush, pushPilotConfig } from "@/lib/push-pilot-server"

export const dynamic = "force-dynamic"

type Delivery = {
  notification_id: string
  endpoint: string
  keys: { auth: string; p256dh: string }
  user_id: string
  href: string | null
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization") ?? ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : ""
  if (!token || !await verifyTrackDashGithubAction(token, "trackdash-push-pilot",
    "mercseba-afk/trackdash/.github/workflows/push-pilot.yml@refs/heads/main")) {
    return new Response(null, { status: 401 })
  }

  const config = pushPilotConfig()
  if (!config) return new Response(null, { status: 503 })
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc("trackdash_claim_catalog_pushes")
  if (error) return new Response(null, { status: 503 })

  const deliveries = (data ?? []) as Delivery[]
  const outcomes = await Promise.all(deliveries.map(async (delivery) => {
    const result = await deliverPilotPush(config, delivery, {
      id: delivery.notification_id,
      href: delivery.href ?? "/catalog",
      body: "Ci sono nuove release nel catalogo TrackDash.",
    })
    if (result === "expired") {
      await supabase.from("push_pilot_subscriptions").delete().eq("endpoint", delivery.endpoint).eq("user_id", delivery.user_id)
    } else if (result === "failed") {
      await supabase.from("push_pilot_deliveries").delete()
        .eq("notification_id", delivery.notification_id).eq("endpoint", delivery.endpoint)
    }
    return result
  }))
  return Response.json({ sent: outcomes.filter((outcome) => outcome === "sent").length })
}
