export const messagingInboxes = {
  mini4wd: "/messages",
  speedchampions: "/speed-champions/messages",
  hotwheels: "/hotwheels/messages",
} as const

export type MessagingUniverse = keyof typeof messagingInboxes

export function conversationLink(universe: MessagingUniverse, id: string) {
  return `${messagingInboxes[universe]}?conversation=${encodeURIComponent(id)}`
}

export function isConversationId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)
}
