import { NextRequest, NextResponse } from "next/server"

const MAX_FIELD_LENGTH = 8000

function safeText(value: unknown, maxLength = MAX_FIELD_LENGTH): string | undefined {
  if (typeof value !== "string") return undefined
  return value.slice(0, maxLength)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const report = {
      message: safeText(body?.message, 2000),
      stack: safeText(body?.stack),
      digest: safeText(body?.digest, 500),
      pathname: safeText(body?.pathname, 1000),
      userAgent: safeText(body?.userAgent, 1000),
      href: safeText(body?.href, 2000),
      occurredAt: safeText(body?.occurredAt, 100),
    }

    console.error("[trackdash-client-error]", JSON.stringify(report))
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
