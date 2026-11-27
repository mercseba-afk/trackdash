import { RacingInfoPage, racingInfoMetadata } from "@/components/racing-studio/info-pages"

export const metadata = racingInfoMetadata("en", "find")

export default function Page() {
  return <RacingInfoPage locale="en" page="find" />
}
