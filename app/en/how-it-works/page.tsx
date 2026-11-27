import { RacingInfoPage, racingInfoMetadata } from "@/components/racing-studio/info-pages"

export const metadata = racingInfoMetadata("en", "how-it-works")

export default function Page() {
  return <RacingInfoPage locale="en" page="how-it-works" />
}
