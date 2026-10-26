import { notFound, redirect } from "next/navigation"
import { canAccessSpeedChampions } from "@/lib/server/speed-champions-gate"
export const dynamic = "force-dynamic"
export default async function Page() {
  if (!(await canAccessSpeedChampions())) notFound()
  redirect("/speed-champions/catalog")
}
