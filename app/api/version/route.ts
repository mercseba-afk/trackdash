import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export function GET() {
  const version = process.env.VERCEL_GIT_COMMIT_SHA || "development"

  return NextResponse.json(
    { version },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    },
  )
}
