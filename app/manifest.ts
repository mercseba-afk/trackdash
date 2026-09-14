import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TrackDash",
    short_name: "TrackDash",
    description: "Mini 4WD collection, marketplace and Price Intelligence.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#07111f",
    theme_color: "#07111f",
    orientation: "portrait-primary",
    icons: [
      { src: "/pwa/icon-192-v2.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-512-v2.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-maskable-512-v2.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
