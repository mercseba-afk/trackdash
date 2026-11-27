import { notFound, redirect } from "next/navigation"
import { canBrowseSpeedChampions } from "@/lib/server/speed-champions-messaging-access"
export const dynamic = "force-dynamic"
export default async function Page() {
  if (!(await canBrowseSpeedChampions())) notFound()
  redirect("/speed-champions/catalog")
}
