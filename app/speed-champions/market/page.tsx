import { LegoMarketPage, legoMarketMetadata } from "@/components/speed-champions/market-page"

export const dynamic = "force-dynamic"
export const metadata = legoMarketMetadata("it")

export default function Page() {
  return <LegoMarketPage locale="it" />
}
