import { RacingInfoPage, racingInfoMetadata } from "@/components/racing-studio/info-pages"

export const metadata = racingInfoMetadata("it", "how-it-works")

export default function Page() {
  return <RacingInfoPage locale="it" page="how-it-works" />
}
