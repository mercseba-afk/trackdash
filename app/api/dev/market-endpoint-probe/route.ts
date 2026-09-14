import { NextRequest, NextResponse } from "next/server"
import { parseExactRetailPage } from "@/lib/market/automation/exact-page-adapter"

export const dynamic = "force-dynamic"
export const maxDuration = 30

const PREVIEW_ENDPOINTS = {
  "18074": {
    editionName: "Dash-X1 Proto-Emperor Premium",
    releaseYear: 2013,
    source: "rcjaz_public",
    url: "https://www.rcjaz.com/tamiya-18074-jr-dashx1-proto-emperor-premium-super-ii-chassis-p-90059083.html",
  },
  "94717": {
    editionName: "Dyna-Hawk GX Super XX Special",
    releaseYear: 2010,
    source: "rcjaz_public",
    url: "https://www.rcjaz.co.uk/94717-tamiya-jr-dyna-hawk-gx-super-xx-sp-chassis-p-90016890.html",
  },
  "95525": {
    editionName: "Avante Mk.II Asia Challenge 2020 Special (Taiwan Final)",
    releaseYear: 2020,
    source: "rcjaz_public",
    url: "https://www.rcjaz.co.uk/tamiya-95525-avante-mk-ii-asia-challenge-2020-special-ms-chassis-finals-in-taiwan-p-18352.html",
  },
} as const

export async function GET(request: NextRequest) {
  if (process.env.VERCEL_ENV !== "preview") {
    return NextResponse.json({ error: "Not available outside preview" }, { status: 404 })
  }

  const itemNumber = request.nextUrl.searchParams.get("item") as keyof typeof PREVIEW_ENDPOINTS | null
  const endpoint = itemNumber ? PREVIEW_ENDPOINTS[itemNumber] : null
  if (!itemNumber || !endpoint) {
    return NextResponse.json({ error: "Use one of the fixed preview items: 18074, 94717, 95525" }, { status: 400 })
  }

  try {
    const response = await fetch(endpoint.url, {
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
      ? parseExactRetailPage(html, { itemNumber, pageUrl: endpoint.url })
      : null

    return NextResponse.json({
      source: endpoint.source,
      release: { itemNumber, editionName: endpoint.editionName, releaseYear: endpoint.releaseYear },
      endpoint: endpoint.url,
      http: { status: response.status, ok: response.ok, contentType },
      snapshot,
    })
  } catch (probeError) {
    const message = probeError instanceof Error ? probeError.message : String(probeError)
    return NextResponse.json({ source: endpoint.source, endpoint: endpoint.url, error: message }, { status: 502 })
  }
}
