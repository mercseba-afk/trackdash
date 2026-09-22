import { NextResponse } from "next/server"
import { parseRcjazRetailPage } from "@/lib/market/automation/exact-page-adapter"

export const dynamic = "force-dynamic"

const URL = "https://www.rcjaz.com/tamiya-95467-dynahawk-gx-super-xx-special-mini-4wd-kit-p-12156.html"

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview") {
    return new NextResponse("Not found", { status: 404 })
  }

  try {
    const response = await fetch(URL, {
      redirect: "follow",
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.8",
        "User-Agent": "TrackDashMarketBot/1.0 (+https://trackdash.it)",
      },
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    })

    const html = await response.text()
    const snapshot = parseRcjazRetailPage(html, {
      itemNumber: "95467",
      pageUrl: URL,
    })

    return NextResponse.json({
      httpStatus: response.status,
      contentType: response.headers.get("content-type"),
      bytes: html.length,
      snapshot,
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
