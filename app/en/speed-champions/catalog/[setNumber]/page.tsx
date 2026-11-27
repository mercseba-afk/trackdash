import { SpeedChampionsSetPage } from "@/components/speed-champions/set-page"
import { speedChampionsMetadata } from "@/lib/lego/seo"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ setNumber: string }> }

export async function generateMetadata({ params }: Props) {
  return speedChampionsMetadata("en", (await params).setNumber)
}

export default async function Page({ params }: Props) {
  return <SpeedChampionsSetPage locale="en" setNumber={(await params).setNumber} />
}
