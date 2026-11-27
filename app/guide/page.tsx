import { speedChampionsCollectingGuide } from "@/lib/lego/collecting-guide"
import { isRacingStudioEnabled } from "@/lib/racing-studio"
import type { Metadata } from "next"
import { cookies } from "next/headers"
import Link from "next/link"
import Image from "next/image"
import { PublicShell } from "@/components/public-shell"
import { GuideCta } from "@/components/guide-cta"
import { guides as miniGuides, type GuideLocale } from "@/lib/guides"
import { publicAbsoluteUrl, publicLanguageAlternates, localizePublicPath } from "@/lib/seo/catalog-paths"

async function guideLocale(): Promise<GuideLocale> {
  return (await cookies()).get("trackdash.locale")?.value === "en" ? "en" : "it"
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await guideLocale()
  const title = isRacingStudioEnabled() ? (locale === "it" ? "Guide Mini 4WD e LEGO Speed Champions | TrackDash" : "Mini 4WD and LEGO Speed Champions guides | TrackDash") : locale === "it" ? "Guide Mini 4WD: motori, release e collezionismo | TrackDash" : "Mini 4WD guides: motors, releases and collecting | TrackDash"
  const description = isRacingStudioEnabled() ? (locale === "it" ? "Guide pratiche per riconoscere release, set LEGO e condizioni della confezione." : "Practical guides to identifying releases, LEGO sets and box conditions.") : locale === "it" ? "Risposte pratiche alle domande sulle Mini 4WD Tamiya: scelta dei motori, riconoscimento delle release e consigli per la tua collezione." : "Practical answers to Tamiya Mini 4WD questions: choosing motors, identifying releases and building your collection."
  return { title, description, alternates: { canonical: publicAbsoluteUrl("/guide", locale), languages: publicLanguageAlternates("/guide") }, openGraph: { title, description, type: "website", url: publicAbsoluteUrl("/guide", locale) } }
}

export default async function GuidesPage() {
  const locale = await guideLocale()
  const it = locale === "it"
  const studio = isRacingStudioEnabled()
  const guides = studio ? [speedChampionsCollectingGuide, ...miniGuides] : miniGuides
  return <PublicShell websiteOnly>
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand">{it ? "La passione, un consiglio alla volta" : "Your hobby, one tip at a time"}</p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight text-navy sm:text-5xl">{studio ? (it ? "Guide TrackDash" : "TrackDash guides") : it ? "Guide Mini 4WD" : "Mini 4WD guides"}</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">{studio ? (it ? "Consigli per riconoscere le release Mini 4WD e i set LEGO, confrontare annunci e organizzare la collezione." : "Tips for identifying Mini 4WD releases and LEGO sets, comparing listings and organizing your collection.") : it ? "Quale motore scegliere? Come riconoscere una ristampa? Risposte pratiche per la pista e per la tua collezione." : "Which motor should you choose? How do you identify a reissue? Practical answers for the track and your collection."}</p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {guides.map(guide => <Link key={guide.slug} href={localizePublicPath(`/guide/${guide.slug}`, locale)} className="group overflow-hidden rounded-3xl border border-border bg-white transition-shadow hover:shadow-lg">
          <div className="relative h-64 bg-white p-5"><Image src={guide.image} alt={guide[locale].imageAlt} fill unoptimized sizes="(max-width: 767px) 100vw, 50vw" className="object-contain p-6" /></div>
          <div className="p-6"><p className="text-xs font-semibold uppercase tracking-wider text-brand">{guide[locale].category}</p><h2 className="mt-3 text-2xl font-bold leading-snug text-navy">{guide[locale].title}</h2><p className="mt-3 leading-7 text-muted-foreground">{guide[locale].description}</p><p className="mt-6 font-semibold text-brand">{it ? "Leggi la guida →" : "Read the guide →"}</p></div>
        </Link>)}
      </div>
      <GuideCta locale={locale} />
    </div>
  </PublicShell>
}
