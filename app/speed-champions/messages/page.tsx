import { notFound } from "next/navigation"
import { MessagesScreenV2 } from "@/components/screens/messages-screen-v2"
import { canAccessSpeedChampions } from "@/lib/server/speed-champions-gate"

export default async function SpeedChampionsMessagesPage() {
  if (!(await canAccessSpeedChampions())) notFound()
  return <MessagesScreenV2 lego />
}
