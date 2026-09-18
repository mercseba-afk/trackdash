import React from "react"
import { ImageResponse } from "next/og"
import { TRACKDASH_ICON_WEBP_BASE64 } from "@/lib/pwa-icon-source"

export const dynamic = "force-static"

type RouteContext = {
  params: Promise<{ variant: string }>
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { variant } = await params
  const is192 = variant === "192"
  const is512 = variant === "512"
  const isMaskable = variant === "maskable"

  if (!is192 && !is512 && !isMaskable) {
    return new Response("Not found", { status: 404 })
  }

  const size = is192 ? 192 : 512
  const imageSize = isMaskable ? 410 : size
  const src = `data:image/webp;base64,${TRACKDASH_ICON_WEBP_BASE64}`

  return new ImageResponse(
    React.createElement(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
        },
      },
      React.createElement("img", {
        src,
        width: imageSize,
        height: imageSize,
        style: { objectFit: "contain" },
      }),
    ),
    { width: size, height: size },
  )
}
