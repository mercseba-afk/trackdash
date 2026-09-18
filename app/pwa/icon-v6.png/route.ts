import React from "react"
import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET(request: Request) {
  const source = new URL("/pwa/icon-v6-192.png", request.url).toString()

  return new ImageResponse(
    React.createElement("img", {
      src: source,
      width: 512,
      height: 512,
      style: { width: "512px", height: "512px" },
    }),
    {
      width: 512,
      height: 512,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    },
  )
}
