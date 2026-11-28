import { isRacingStudioPreview } from "@/lib/racing-studio"
import { localizePublicPath, type PublicLocale } from "@/lib/seo/catalog-paths"
import { localizedLegoListConditions } from "@/lib/lego/locale"
import Link from "next/link"
import { notFound } from "next/navigation"
import { LegoListAction } from "@/components/speed-champions/personal-list-action"
import { SetImage } from "@/components/speed-champions/set-image"
import { setImagePath, speedChampionsPath, speedChampionsSetName, speedChampionsSets } from "@/lib/lego/catalog"
import { type LegoListKind } from "@/lib/lego/personal-list-types"
import { getCurrentUser } from "@/lib/auth/current-user"
import { readLegoList } from "@/lib/server/lego-personal-lists"

export async function LegoListControls({ setNumber, locale }: { setNumber: string; locale: PublicLocale }) {
  if (isRacingStudioPreview()) return null
  const copy = (it: string, en: string) => locale === "it" ? it : en
  const user = await getCurrentUser()
  if (!user) return null

  const items = await readLegoList(user.id, { setNumber })
  const collection = items.find((item) => item.kind === "collection")
  const wishlist = items.find((item) => item.kind === "wishlist")

  return (
    <section aria-label={copy("Collezione e wishlist LEGO", "LEGO collection and wishlist")} className="mt-6 divide-y divide-brand/15 rounded-2xl border border-brand/20 bg-brand-muted px-4 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div>
          <h2 className="font-semibold">{collection ? copy("Nella tua collezione", "In your collection") : copy("Ce l’hai?", "Own this set?")}</h2>
          {collection?.condition && (
            <p className="mt-1 text-sm text-muted-foreground">{collection.quantity} {collection.quantity === 1 ? copy("copia", "copy") : copy("copie", "copies")} · {localizedLegoListConditions(locale)[collection.condition]}</p>
          )}
        </div>
        <LegoListAction kind="collection" setNumber={setNumber} locale={locale} item={collection} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <h2 className="font-semibold">{wishlist ? copy("Nella tua wishlist", "On your wishlist") : copy("Lo desideri?", "Want this set?")}</h2>
        <LegoListAction kind="wishlist" setNumber={setNumber} locale={locale} item={wishlist} />
      </div>
    </section>
  )
}

export async function LegoPersonalList({ kind, locale = "it" }: { kind: LegoListKind; locale?: PublicLocale }) {
  const user = await getCurrentUser()
  if (!user) notFound()
  const items = await readLegoList(user.id, { kind })
  const sets = items.flatMap((item) => {
    const set = speedChampionsSets.find((entry) => entry.setNumber === item.setNumber)
    return set ? [{ item, set }] : []
  })
  const isCollection = kind === "collection"
  const title = isCollection ? (locale === "it" ? "Collezione" : "Collection") : "Wishlist"
  const copies = sets.reduce((count, { item }) => count + item.quantity, 0)

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title} LEGO Speed Champions</h1>
        <p className="text-sm text-muted-foreground">
          {locale === "it" ? `${sets.length} ${sets.length === 1 ? "set salvato" : "set salvati"}` : `${sets.length} saved ${sets.length === 1 ? "set" : "sets"}`}
          {isCollection && sets.length > 0 && ` · ${copies} ${locale === "it" ? (copies === 1 ? "copia" : "copie") : (copies === 1 ? "copy" : "copies")}`}
        </p>
      </header>
      {sets.length === 0 && <Link className="text-sm font-medium text-primary underline" href={localizePublicPath("/speed-champions/catalog", locale)}>{locale === "it" ? "Esplora il catalogo LEGO" : "Explore the LEGO catalog"}</Link>}
      {sets.length > 0 && (
        <ul className="grid gap-2.5 lg:grid-cols-2">
          {sets.map(({ item, set }) => (
            <li key={set.setNumber} className="flex min-w-0 items-center gap-2 rounded-xl border bg-card p-2 shadow-sm sm:gap-3">
              <Link
                href={speedChampionsPath(set.setNumber, locale)}
                aria-label={locale === "it" ? `Apri ${speedChampionsSetName(set, locale)}` : `Open ${speedChampionsSetName(set, locale)}`}
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
                <Link className="block break-words text-sm font-semibold leading-snug hover:text-brand hover:underline" href={speedChampionsPath(set.setNumber, locale)}>
                  {speedChampionsSetName(set, locale)}
                </Link>
                <p className="text-xs leading-snug text-muted-foreground">#{set.setNumber} · {set.year}</p>
                {item.condition && (
                  <p className="text-xs leading-snug text-muted-foreground">
                    {localizedLegoListConditions(locale)[item.condition]} · {item.quantity} {locale === "it" ? (item.quantity === 1 ? "copia" : "copie") : (item.quantity === 1 ? "copy" : "copies")}
                  </p>
                )}
              </div>
              <LegoListAction kind={kind} setNumber={set.setNumber} item={item} compact locale={locale} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
