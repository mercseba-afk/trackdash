import { selectedRacingCatalog } from "@/components/racing-studio/section-nav"
import { RacingInfoPage, racingInfoMetadata } from "@/components/racing-studio/info-pages"

export const metadata = racingInfoMetadata("it", "find")

export default async function Page({ searchParams }: { searchParams: Promise<{ catalog?: string | string[] }> }) {
  const catalog = selectedRacingCatalog((await searchParams).catalog)
  return <RacingInfoPage locale="it" page="find" catalog={catalog} />
}
