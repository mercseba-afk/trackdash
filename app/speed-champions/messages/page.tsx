import { notFound } from "next/navigation"
import { MessagesScreenV2 } from "@/components/screens/messages-screen-v2"
import { getSpeedChampionsMessagingUser } from "@/lib/server/speed-champions-messaging-access"

export default async function SpeedChampionsMessagesPage() {
  if (!(await getSpeedChampionsMessagingUser())) notFound()
  return <MessagesScreenV2 lego />
}
