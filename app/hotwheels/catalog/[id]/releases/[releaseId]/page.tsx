import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { HotWheelsPilotShell } from "@/components/hotwheels/hotwheels-pilot-shell"
import { HotWheelsReleaseDetailScreen } from "@/components/hotwheels/hotwheels-release-detail-screen"
import { fetchHotWheelsPilotRelease } from "@/lib/actions/hotwheels"
import { isVerticalRouteEnabled } from "@/lib/server/vertical-gates"

export const revalidate = 45

type PageParams = Promise<{ id: string; releaseId: string }>

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  if (!isVerticalRouteEnabled("hotwheels")) {
    return { title: "Not found | TrackDash", robots: { index: false, follow: false } }
  }

  const { releaseId } = await params
  const entry = await fetchHotWheelsPilotRelease(releaseId)
  if (!entry) return { title: "Release not found | TrackDash", robots: { index: false, follow: false } }

  return {
    title: `${entry.release.editionName} | Hot Wheels Pilot | TrackDash`,
    description: `TrackDash pilot identity page for ${entry.release.editionName}.`,
    robots: { index: false, follow: false },
  }
}

export default async function HotWheelsReleasePage({ params }: { params: PageParams }) {
  if (!isVerticalRouteEnabled("hotwheels")) notFound()

  const { id, releaseId } = await params
  const entry = await fetchHotWheelsPilotRelease(releaseId)
  if (!entry || entry.product.id !== id) notFound()

  return (
    <HotWheelsPilotShell>
      <HotWheelsReleaseDetailScreen entry={entry} />
    </HotWheelsPilotShell>
  )
}
