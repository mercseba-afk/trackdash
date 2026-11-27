import Link from "next/link"
import { notFound } from "next/navigation"
import { LegoListAction } from "@/components/speed-champions/personal-list-action"
import { SetImage } from "@/components/speed-champions/set-image"
import { setImagePath, speedChampionsPath, speedChampionsSets } from "@/lib/lego/catalog"
import { legoConditions, type LegoListKind } from "@/lib/lego/personal-list-types"
import { readLegoList } from "@/lib/server/lego-personal-lists"
import { canAccessSpeedChampions, getSpeedChampionsOwner } from "@/lib/server/speed-champions-gate"

export async function LegoListControls({ setNumber }: { setNumber: string }) {
  const owner = await getSpeedChampionsOwner()
  if (!owner) return null

  const items = await readLegoList(owner.id, { setNumber })
  const collection = items.find((item) => item.kind === "collection")
  const wishlist = items.find((item) => item.kind === "wishlist")

  return (
    <section aria-label="Collezione e wishlist LEGO" className="mt-6 divide-y divide-brand/15 rounded-2xl border border-brand/20 bg-brand-muted px-4 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div>
          <h2 className="font-semibold">{collection ? "Nella tua collezione" : "Ce l’hai?"}</h2>
          {collection?.condition && (
            <p className="mt-1 text-sm text-muted-foreground">{collection.quantity} {collection.quantity === 1 ? "copia" : "copie"} · {legoConditions[collection.condition]}</p>
          )}
        </div>
        <LegoListAction kind="collection" setNumber={setNumber} item={collection} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <h2 className="font-semibold">{wishlist ? "Nella tua wishlist" : "Lo desideri?"}</h2>
        <LegoListAction kind="wishlist" setNumber={setNumber} item={wishlist} />
      </div>
    </section>
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
  const isCollection = kind === "collection"
  const title = isCollection ? "Collezione" : "Wishlist"
  const copies = sets.reduce((count, { item }) => count + item.quantity, 0)

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title} LEGO Speed Champions</h1>
        <p className="text-sm text-muted-foreground">
          {sets.length} {sets.length === 1 ? "set salvato" : "set salvati"}
          {isCollection && sets.length > 0 && ` · ${copies} ${copies === 1 ? "copia" : "copie"}`}
        </p>
      </header>
      {sets.length === 0 && <Link className="text-sm font-medium text-primary underline" href="/speed-champions/catalog">Esplora il catalogo LEGO</Link>}
      {sets.length > 0 && (
        <ul className="grid gap-2.5 lg:grid-cols-2">
          {sets.map(({ item, set }) => (
            <li key={set.setNumber} className="flex min-w-0 items-center gap-2 rounded-xl border bg-card p-2 shadow-sm sm:gap-3">
              <Link
                href={speedChampionsPath(set.setNumber)}
                aria-label={`Apri ${set.name}`}
                className="block h-14 w-16 shrink-0 overflow-hidden rounded-lg border focus-visible:outline-2 focus-visible:outline-brand sm:h-16 sm:w-20"
              >
                <SetImage
                  src={setImagePath(set.setNumber, "box")}
                  alt=""
                  thumbnail
                  sizes="(min-width: 640px) 80px, 64px"
                />
              </Link>
              <div className="min-w-0 flex-1 space-y-0.5 py-0.5">
                <Link className="block break-words text-sm font-semibold leading-snug hover:text-brand hover:underline" href={speedChampionsPath(set.setNumber)}>
                  {set.name}
                </Link>
                <p className="text-xs leading-snug text-muted-foreground">#{set.setNumber} · {set.year}</p>
                {item.condition && (
                  <p className="text-xs leading-snug text-muted-foreground">
                    {legoConditions[item.condition]} · {item.quantity} {item.quantity === 1 ? "copia" : "copie"}
                  </p>
                )}
              </div>
              <LegoListAction kind={kind} setNumber={set.setNumber} item={item} compact />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
