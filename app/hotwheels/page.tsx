import { notFound, redirect } from "next/navigation"
import { canAccessVerticalRoute } from "@/lib/server/vertical-gates"

export const dynamic = "force-dynamic"

export default async function HotWheelsPage() {
  if (!(await canAccessVerticalRoute("hotwheels"))) notFound()
  redirect("/hotwheels/catalog")
}
