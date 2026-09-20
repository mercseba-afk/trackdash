import type { Metadata } from "next"
import { PublicShell } from "@/components/public-shell"
import { LegalScreen } from "@/components/screens/legal-screen"

export const metadata: Metadata = {
  title: "Privacy Policy — TrackDash",
  description: "Privacy Policy for TrackDash, including account, Google Sign-In, Collection, community and analytics data.",
}

export default function PrivacyPage() {
  return (
    <PublicShell>
      <LegalScreen kind="privacy" />
    </PublicShell>
  )
}
