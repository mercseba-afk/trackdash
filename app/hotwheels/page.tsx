import { notFound, redirect } from "next/navigation"
import { isVerticalRouteEnabled } from "@/lib/server/vertical-gates"

export default function HotWheelsPage() {
  if (!isVerticalRouteEnabled("hotwheels")) notFound()
  redirect("/hotwheels/catalog")
}
