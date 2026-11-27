import { RacingInfoPage, racingInfoMetadata } from "@/components/racing-studio/info-pages"

export const metadata = racingInfoMetadata("it", "find")

export default function Page() {
  return <RacingInfoPage locale="it" page="find" />
}
