import type { Metadata } from "next"
import { PwaDebugScreen } from "@/components/pwa-debug-screen"

export const metadata: Metadata = {
  title: "PWA diagnostics — TrackDash",
  robots: {
    index: false,
    follow: false,
  },
}

export default function PwaDebugPage() {
  return <PwaDebugScreen />
}
