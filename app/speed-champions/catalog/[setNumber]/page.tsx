import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { SetGallery } from "@/components/speed-champions/gallery"
import { speedChampionsSets, legoStatusLabels } from "@/lib/lego/catalog"
import { canAccessSpeedChampions } from "@/lib/server/speed-champions-gate"
export const dynamic = "force-dynamic"

export default async function Page({ params }: { params: Promise<{ setNumber: string }> }) {
  if (!(await canAccessSpeedChampions())) notFound()
  const { setNumber } = await params
  const set = speedChampionsSets.find((entry) => entry.setNumber === setNumber)
  if (!set) notFound()
  const facts = [
    ["Codice set", set.setNumber],
    ["Anno di uscita", set.year],
    ["Pezzi", set.pieces],
    ["Marchio auto", set.carBrand],
    ["Auto nella confezione", set.carCount],
    ["Serie", set.series],
  ]
  return (
    <div className="space-y-6">
      <Link
        href="/speed-champions/catalog"
        className="inline-flex items-center gap-2 text-sm font-medium text-blue-700"
      >
        <ArrowLeft className="size-4" />
        Torna al catalogo
      </Link>
      <div className="grid items-start gap-8 md:grid-cols-2">
        <SetGallery set={set} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">
            LEGO Speed Champions · {set.setNumber}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{set.name}</h1>
          <span className="mt-4 inline-block rounded-full bg-white px-3 py-1.5 text-sm font-medium">
            {legoStatusLabels[set.status]}
          </span>
          <dl className="mt-7 grid grid-cols-2 gap-x-5 gap-y-5 rounded-2xl border border-slate-200 bg-white p-5">
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="mt-1 font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
          {set.carCount === 2 && (
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Questo codice identifica una confezione con due auto. La singola auto separata non equivale al set
              completo.
            </p>
          )}
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold">Valore di mercato</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Non ancora disponibile per questo set. Una valutazione attendibile deve distinguere confezioni sigillate,
              set completi aperti e set incompleti.
            </p>
          </section>
          <p className="mt-5 text-sm leading-6 text-slate-500">
            Questa anteprima permette di esplorare il catalogo. Collezione personale, wishlist e scambi LEGO saranno
            collegati nel passaggio successivo.
          </p>
        </div>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold">Fonti e verifica</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Identità, numero di pezzi, immagini e stato del prodotto verificati sulla scheda LEGO il{" "}
          {set.statusCheckedAt.split("-").reverse().join("/")}. Lo stato descrive il catalogo ufficiale, non la
          disponibilità del mercato secondario. La data esatta di ritiro non è stata verificata.
        </p>
        <div className="mt-4 flex flex-wrap gap-5 text-sm font-medium text-blue-700">
          <a href={set.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
            Scheda ufficiale LEGO
            <ExternalLink className="size-3" />
          </a>
          <a
            href={set.yearSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1"
          >
            Anno nel catalogo BrickLink
            <ExternalLink className="size-3" />
          </a>
        </div>
      </section>
    </div>
  )
}
