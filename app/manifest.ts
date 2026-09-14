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
      { src: "/pwa/icon-v3.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/pwa/icon-v3.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  }
}
