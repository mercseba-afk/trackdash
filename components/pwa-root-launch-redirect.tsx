"use client"

import * as React from "react"

function isStandalonePwa() {
  if (typeof window === "undefined") return false
  return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true
}

export function PwaRootLaunchRedirect() {
  React.useEffect(() => {
    if (!isStandalonePwa()) return
    window.location.replace("/dashboard")
  }, [])

  return null
}
