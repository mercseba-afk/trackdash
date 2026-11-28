"use server"

import { revalidatePath } from "next/cache"
import { sql } from "drizzle-orm"
import { getCurrentUser } from "@/lib/auth/current-user"
import { withUserContext } from "@/lib/db/rls"
import { speedChampionsPath, speedChampionsSets } from "@/lib/lego/catalog"
import { legoConditions, type LegoListKind } from "@/lib/lego/personal-list-types"

export async function updateLegoListAction(kind: LegoListKind, setNumber: string, form: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")
  if ((kind !== "collection" && kind !== "wishlist") || !speedChampionsSets.some((set) => set.setNumber === setNumber)) {
    throw new Error("Invalid LEGO list or set")
  }

  const operation = form.get("operation")
  const quantity = kind === "collection" ? Number(form.get("quantity")) : 1
  const condition = kind === "collection" ? form.get("condition") : null

  await withUserContext(user.id, async (tx) => {
    if (operation === "remove") {
      await tx.execute(sql`
        delete from public.lego_personal_list_items
        where user_id = ${user.id} and list_kind = ${kind} and set_number = ${setNumber}
      `)
      return
    }

    if (operation !== "save" || !Number.isInteger(quantity) || quantity < 1 || quantity > 99 ||
      (kind === "collection" && (typeof condition !== "string" || !Object.hasOwn(legoConditions, condition)))) {
      throw new Error("Invalid LEGO quantity or condition")
    }

    await tx.execute(sql`
      insert into public.lego_personal_list_items (user_id, list_kind, set_number, quantity, condition)
      values (${user.id}, ${kind}, ${setNumber}, ${quantity}, ${condition})
      on conflict (user_id, list_kind, set_number) do update
      set quantity = excluded.quantity, condition = excluded.condition
    `)
  })

  revalidatePath(`/speed-champions/${kind}`)
  revalidatePath(speedChampionsPath(setNumber))
  revalidatePath(speedChampionsPath(setNumber, "en"))
}
