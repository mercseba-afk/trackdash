import c1 from "./chunks/1"
import c2 from "./chunks/2"
import c3 from "./chunks/3"
import c4 from "./chunks/4"
import c5 from "./chunks/5"
import c6a from "./chunks/6a"
import c6b from "./chunks/6b"
import c7 from "./chunks/7"
import c8a from "./chunks/8a"
import c8b from "./chunks/8b"

const IMAGE_BASE64 = [c1, c2, c3, c4, c5, c6a, c6b, c7, c8a, c8b].join("")

export const dynamic = "force-static"

export async function GET() {
  const bytes = Buffer.from(IMAGE_BASE64, "base64")

  if (bytes.length !== 47696 || bytes.subarray(0, 4).toString("ascii") !== "RIFF" || bytes.subarray(8, 12).toString("ascii") !== "WEBP") {
    return new Response("TrackDash brand asset validation failed", { status: 500 })
  }

  return new Response(bytes, {
    headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(bytes.length),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
