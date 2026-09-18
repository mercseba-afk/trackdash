import React from "react"
import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET(request: Request) {
  const source = new URL("/pwa/icon-v6-192.png", request.url).toString()

  return new ImageResponse(
    React.createElement(
      "div",
      {
        style: {
          width: "512px",
          height: "512px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
        },
      },
      React.createElement("img", {
        src: source,
        width: 430,
        height: 430,
        style: { width: "430px", height: "430px" },
      }),
    ),
    {
      width: 512,
      height: 512,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    },
  )
}
