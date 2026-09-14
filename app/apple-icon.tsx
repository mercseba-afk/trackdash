import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #07111f 0%, #0b2f70 62%, #086cff 100%)",
        }}
      >
        <svg width="164" height="118" viewBox="0 0 250 160">
          <path d="M8 102 78 79 64 96 12 115Z" fill="#2f80ff" />
          <path d="M12 121 83 91 67 112 16 134Z" fill="#38bdf8" />
          <path d="M22 139 86 108 71 130 28 149Z" fill="#2f80ff" />
          <path d="M77 44h69l23 27-18 12-17-17H91L70 83 58 66Z" fill="#f8fafc" stroke="#f8fafc" strokeWidth="3" strokeLinejoin="round" />
          <path d="M64 28h78l17 22h-44L96 45H67Z" fill="#07111f" stroke="#f8fafc" strokeWidth="3" strokeLinejoin="round" />
          <path d="M93 29h15l20 21h-16Z" fill="#ff4d4f" />
          <path d="M108 29h15l20 21h-16Z" fill="#ffc933" />
          <path d="M78 75h76l42 30-9 23h-50l-19-25H91l-14 16H57l5-24Z" fill="#f8fafc" stroke="#f8fafc" strokeWidth="3" strokeLinejoin="round" />
          <path d="m113 79 27 5 24 17h-33Z" fill="#07111f" />
          <path d="m121 88 12 2 22 16h-12Z" fill="#ff4d4f" />
          <path d="m133 90 10 4 21 15h-12Z" fill="#ffc933" />
          <circle cx="88" cy="113" r="32" fill="#07111f" stroke="#f8fafc" strokeWidth="3" />
          <circle cx="88" cy="113" r="19" fill="#f8fafc" />
          <circle cx="88" cy="113" r="8" fill="#07111f" />
          <circle cx="165" cy="119" r="24" fill="#07111f" stroke="#f8fafc" strokeWidth="3" />
          <circle cx="165" cy="119" r="13" fill="#f8fafc" />
          <circle cx="165" cy="119" r="6" fill="#07111f" />
          <path d="M186 116h31l8 9-8 8h-37Z" fill="#f8fafc" stroke="#f8fafc" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="216" cy="125" r="8" fill="#07111f" stroke="#f8fafc" strokeWidth="3" />
        </svg>
      </div>
    ),
    { ...size },
  )
}
