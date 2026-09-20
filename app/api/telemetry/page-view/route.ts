import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  if (process.env.VERCEL_ENV !== "production") {
    return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } })
  }

  const origin = request.headers.get("origin")
  if (origin) {
    try {
      if (new URL(origin).host !== request.nextUrl.host) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  try {
    const body = (await request.json()) as { path?: unknown }
    if (typeof body.path !== "string" || !body.path.startsWith("/") || body.path.length > 180) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const admin = createAdminClient()
    const { error } = await admin.rpc("trackdash_record_page_view", {
      p_path: body.path,
      p_signed_in: Boolean(user),
    })

    if (error) console.error("Failed to record aggregate page view:", error.message)
  } catch (error) {
    console.error("Failed to record aggregate page view:", error)
  }

  return new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  })
}
