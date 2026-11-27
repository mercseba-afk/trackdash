import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { updateLegoListAction } from "@/lib/actions/lego-personal-lists"
import { speedChampionsPath, speedChampionsSets } from "@/lib/lego/catalog"
import { legoConditions, type LegoListItem, type LegoListKind } from "@/lib/lego/personal-list-types"
import { readLegoList } from "@/lib/server/lego-personal-lists"
import { canAccessSpeedChampions, getSpeedChampionsOwner } from "@/lib/server/speed-champions-gate"

export async function LegoListControls({ setNumber }: { setNumber: string }) {
  const owner = await getSpeedChampionsOwner()
  if (!owner) return null

  const items = await readLegoList(owner.id, { setNumber })

  return (
    <section className="mt-6 space-y-3 rounded-2xl border bg-card p-4">
      <LegoListForm kind="collection" setNumber={setNumber} item={items.find((item) => item.kind === "collection")} />
      <LegoListForm kind="wishlist" setNumber={setNumber} item={items.find((item) => item.kind === "wishlist")} />
    </section>
  )
}

function LegoListForm({ kind, setNumber, item }: { kind: LegoListKind; setNumber: string; item?: LegoListItem }) {
  const action = updateLegoListAction.bind(null, kind, setNumber)
  const isCollection = kind === "collection"

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      {isCollection && (
        <>
          <label className="grid gap-1 text-sm">
            Condizione
            <select name="condition" defaultValue={item?.condition ?? "sealed"} className="h-9 rounded-md border bg-background px-2">
              {Object.entries(legoConditions).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Copie
            <input name="quantity" type="number" min={1} max={99} required defaultValue={item?.quantity ?? 1} className="h-9 w-16 rounded-md border bg-background px-2" />
          </label>
        </>
      )}
      {(!item || isCollection) && (
        <Button type="submit" name="operation" value="save" size="sm">
          {item ? "Salva modifiche" : isCollection ? "Aggiungi alla collezione" : "Aggiungi alla wishlist"}
        </Button>
      )}
      {item && (
        <Button type="submit" name="operation" value="remove" size="sm" variant="outline" formNoValidate>
          {isCollection ? "Rimuovi dalla collezione" : "Rimuovi dalla wishlist"}
        </Button>
      )}
    </form>
  )
}

export async function LegoPersonalList({ kind }: { kind: LegoListKind }) {
  if (!(await canAccessSpeedChampions())) notFound()
  const owner = await getSpeedChampionsOwner()
  const items = owner ? await readLegoList(owner.id, { kind }) : []
  const sets = items.flatMap((item) => {
    const set = speedChampionsSets.find((entry) => entry.setNumber === item.setNumber)
    return set ? [{ item, set }] : []
  })
  const title = kind === "collection" ? "Collezione" : "Wishlist"
  return (
    <section className="space-y-5">
      <h1 className="text-3xl font-semibold">{title} LEGO Speed Champions</h1>
      <p className="text-sm text-muted-foreground">Set salvati: {sets.length}</p>
      {sets.length === 0 && <Link className="text-sm font-medium text-primary underline" href="/speed-champions/catalog">Esplora il catalogo LEGO</Link>}
      <ul className="grid gap-3">
        {sets.map(({ item, set }) => (
          <li key={set.setNumber} className="space-y-3 rounded-xl border bg-card p-4">
            <Link className="font-semibold hover:underline" href={speedChampionsPath(set.setNumber)}>
              {set.name} <span className="text-muted-foreground">#{set.setNumber}</span>
            </Link>
            <LegoListForm kind={kind} setNumber={set.setNumber} item={item} />
          </li>
        ))}
      </ul>
    </section>
  )
}
