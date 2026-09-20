"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

function normalizeRoute(pathname: string) {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null

  const segments = pathname.split("/").filter(Boolean)
  if (segments[0] === "catalog" && segments.length >= 4 && segments[2] === "releases") {
    return "/catalog/[product]/releases/[release]"
  }
  if (segments[0] === "catalog" && segments.length >= 2) return "/catalog/[product]"
  if (segments[0] === "collectors" && segments.length >= 2) return "/collectors/[collector]"
  if (segments[0] === "messages" && segments.length >= 2) return "/messages/[conversation]"

  return pathname || "/"
}

export function PageViewTracker() {
  const pathname = usePathname()

  React.useEffect(() => {
    const path = normalizeRoute(pathname)
    if (!path) return

    void fetch("/api/telemetry/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => {
      // Product analytics must never affect the app experience.
    })
  }, [pathname])

  return null
}
