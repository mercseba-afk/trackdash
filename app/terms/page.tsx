import type { Metadata } from "next"
import { PublicShell } from "@/components/public-shell"
import { LegalScreen } from "@/components/screens/legal-screen"

export const metadata: Metadata = {
  title: "Terms of Use — TrackDash",
  description: "Terms of Use for TrackDash, including Collection, market estimates and collector-to-collector features.",
}

export default function TermsPage() {
  return (
    <PublicShell>
      <LegalScreen kind="terms" />
    </PublicShell>
  )
}
