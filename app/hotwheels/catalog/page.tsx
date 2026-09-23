import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { HotWheelsCatalogScreen } from "@/components/hotwheels/hotwheels-catalog-screen"
import { HotWheelsPilotShell } from "@/components/hotwheels/hotwheels-pilot-shell"
import { fetchHotWheelsPilotCatalog } from "@/lib/actions/hotwheels"
import { canAccessVerticalRoute } from "@/lib/server/vertical-gates"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Hot Wheels Pilot Catalog | TrackDash",
  description: "Private TrackDash pilot catalog for exact Hot Wheels collector Releases.",
  robots: { index: false, follow: false },
}

export default async function HotWheelsCatalogPage() {
  if (!(await canAccessVerticalRoute("hotwheels"))) notFound()

  const entries = await fetchHotWheelsPilotCatalog()

  return (
    <HotWheelsPilotShell>
      <HotWheelsCatalogScreen entries={entries} />
    </HotWheelsPilotShell>
  )
}
