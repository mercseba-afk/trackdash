import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "TrackDash",
    short_name: "TrackDash",
    description: "Mini 4WD collection, marketplace and Price Intelligence.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#f8fafc",
    orientation: "portrait-primary",
    prefer_related_applications: false,
    related_applications: [
      { platform: "webapp", url: "/manifest.webmanifest" },
    ],
    icons: [
      { src: "/pwa/icon-v5-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-v5.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-v5-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
