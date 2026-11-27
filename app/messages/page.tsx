import { redirect } from "next/navigation"
import { AppPage } from "@/components/app-page"
import { MessagesScreenV2 } from "@/components/screens/messages-screen-v2"
import { getCurrentUser } from "@/lib/auth/current-user"
import { withUserContext } from "@/lib/db/rls"
import { conversationLink, isConversationId } from "@/lib/messaging-inbox"
import { and, eq, or } from "drizzle-orm"
import { categories, conversations, products } from "@/lib/db/schema"

export default async function MessagesPage({ searchParams }: {
  searchParams: Promise<{ conversation?: string | string[] }>
}) {
  const { conversation: id } = await searchParams
  // Existing bell, push and offer links all use this entry point.
  if (isConversationId(id)) {
    const user = await getCurrentUser()
    if (!user) redirect(`/login?next=${encodeURIComponent(conversationLink("mini4wd", id))}`)

    const universe = await withUserContext(user.id, async (tx) => {
      const [row] = await tx.select({ slug: categories.slug }).from(conversations)
        .innerJoin(products, eq(products.id, conversations.productId))
        .innerJoin(categories, eq(categories.id, products.categoryId))
        .where(and(eq(conversations.id, id), or(eq(conversations.ownerId, user.id), eq(conversations.requesterId, user.id))))
      if (!row) return null
      if (row.slug === "speed-champions") return "speedchampions"
      return row.slug === "hotwheels" ? "hotwheels" : "mini4wd"
    })

    if (!universe) redirect("/messages")
    if (universe !== "mini4wd") redirect(conversationLink(universe, id))
  }

  return <AppPage><MessagesScreenV2 /></AppPage>
}
