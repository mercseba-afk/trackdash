import { ImageResponse } from "next/og"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const origin = new URL(request.url).origin
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fff", padding: "42px 44px 34px" }}>
      <img src={`${origin}/brand-car-v5`} width="410" height="235" style={{ objectFit: "contain", marginBottom: "18px" }} />
      <div style={{ display: "flex", alignItems: "baseline", fontFamily: "Arial Black, Arial, sans-serif", fontWeight: 900, fontStyle: "italic", fontSize: "118px", lineHeight: 1, letterSpacing: "-11px" }}>
        <span style={{ color: "#086cff" }}>T</span><span style={{ color: "#ff1e1e" }}>D</span>
      </div>
    </div>,
    { width: 512, height: 512, headers: { "Cache-Control": "public, max-age=31536000, immutable" } },
  )
}
