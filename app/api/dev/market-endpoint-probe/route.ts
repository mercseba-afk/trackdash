import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { parseExactRetailPage } from "@/lib/market/automation/exact-page-adapter"

export const dynamic = "force-dynamic"
export const maxDuration = 30

export async function GET(request: NextRequest) {
  if (process.env.VERCEL_ENV !== "preview") {
    return NextResponse.json({ error: "Not available outside preview" }, { status: 404 })
  }

  const endpointId = request.nextUrl.searchParams.get("endpointId")
  if (!endpointId || !/^[0-9a-f-]{36}$/i.test(endpointId)) {
    return NextResponse.json({ error: "Valid endpointId required" }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: endpoint, error } = await supabase
    .from("market_scan_endpoints")
    .select("id,endpoint_url,exact_release_verified,enabled,release_id,price_sources!inner(slug),product_releases!inner(item_number,edition_name,release_year)")
    .eq("id", endpointId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!endpoint) return NextResponse.json({ error: "Endpoint not found" }, { status: 404 })

  const release = endpoint.product_releases as unknown as {
    item_number: string | null
    edition_name: string
    release_year: number | null
  }
  const source = endpoint.price_sources as unknown as { slug: string }
  if (!endpoint.enabled || !endpoint.exact_release_verified || !release.item_number) {
    return NextResponse.json({ error: "Endpoint is not exact-release executable" }, { status: 409 })
  }

  try {
    const response = await fetch(endpoint.endpoint_url, {
      redirect: "follow",
      cache: "no-store",
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "User-Agent": "TrackDashMarketBot/1.0 (+https://trackdash-dusky.vercel.app)",
      },
      signal: AbortSignal.timeout(12_000),
    })
    const contentType = response.headers.get("content-type") ?? ""
    const html = contentType.toLowerCase().includes("text/html") ? await response.text() : ""
    const snapshot = html
      ? parseExactRetailPage(html, { itemNumber: release.item_number, pageUrl: endpoint.endpoint_url })
      : null

    return NextResponse.json({
      source: source.slug,
      release: {
        itemNumber: release.item_number,
        editionName: release.edition_name,
        releaseYear: release.release_year,
      },
      endpoint: endpoint.endpoint_url,
      http: { status: response.status, ok: response.ok, contentType },
      snapshot,
    })
  } catch (probeError) {
    const message = probeError instanceof Error ? probeError.message : String(probeError)
    return NextResponse.json({ source: source.slug, endpoint: endpoint.endpoint_url, error: message }, { status: 502 })
  }
}
