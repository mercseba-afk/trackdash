import { notFound, redirect } from "next/navigation"
import { COLLECTIBLE_VERTICALS } from "@/lib/verticals"

export default function HotWheelsPage() {
  const vertical = COLLECTIBLE_VERTICALS.hotwheels

  if (!vertical.publicEnabled) notFound()

  redirect(`${vertical.basePath}/catalog`)
}
