import Link from "next/link"
import type { GuideLocale } from "@/lib/guides"
import { localizePublicPath } from "@/lib/seo/catalog-paths"

export function GuideCta({ locale }: { locale: GuideLocale }) {
  const it = locale === "it"
  return <aside className="mt-12 rounded-3xl bg-[#102b58] p-7 text-white sm:p-10">
    <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">{it ? "La tua passione, su TrackDash" : "Your passion, on TrackDash"}</p>
    <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">{it ? "Quali Mini 4WD hai nella tua collezione?" : "Which Mini 4WD models are in your collection?"}</h2>
    <p className="mt-4 max-w-2xl leading-7 text-blue-100">{it ? "Trova i tuoi modelli, scopri le diverse release e consulta i valori di mercato. Con un account gratuito puoi organizzare la tua collezione e incontrare altri appassionati." : "Find your models, explore their releases and check market values. Create a free account to organize your collection and connect with fellow collectors."}</p>
    <div className="mt-6 flex flex-wrap gap-3">
      <Link href={localizePublicPath("/catalog", locale)} className="rounded-xl bg-white px-5 py-3 font-semibold text-[#102b58] hover:bg-blue-50">{it ? "Scopri TrackDash →" : "Explore TrackDash →"}</Link>
      <Link href="/signup?next=%2Fcollection" className="rounded-xl border border-white/40 px-5 py-3 font-semibold text-white hover:bg-white/10">{it ? "Crea la tua collezione" : "Start your collection"}</Link>
    </div>
  </aside>
}
