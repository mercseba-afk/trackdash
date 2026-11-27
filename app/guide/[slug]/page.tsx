import { speedChampionsCollectingGuide } from "@/lib/lego/collecting-guide"
import { isRacingStudioEnabled } from "@/lib/racing-studio"
import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { PublicShell } from "@/components/public-shell"
import { GuideCta } from "@/components/guide-cta"
import { guides as miniGuides } from "@/lib/guides"
import { cookies } from "next/headers"
import type { GuideLocale } from "@/lib/guides"

async function guideLocale(): Promise<GuideLocale> {
  return (await cookies()).get("trackdash.locale")?.value === "en" ? "en" : "it"
}
import { publicAbsoluteUrl, publicLanguageAlternates, localizePublicPath } from "@/lib/seo/catalog-paths"

function visibleGuides() {
  return isRacingStudioEnabled() ? [speedChampionsCollectingGuide, ...miniGuides] : miniGuides
}

type Props = { params: Promise<{ slug: string }> }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const guides = visibleGuides()
  const guide = guides.find(item => item.slug === slug)
  if (!guide) notFound()
  const locale = await guideLocale()
  const content = guide[locale]
  const url = publicAbsoluteUrl(`/guide/${slug}`, locale)
  return { title: `${content.title} | TrackDash`, description: content.description, alternates: { canonical: url, languages: publicLanguageAlternates(`/guide/${slug}`) }, openGraph: { title: content.title, description: content.description, url, type: "article", publishedTime: guide.published, modifiedTime: guide.published, images: [{ url: guide.image, alt: content.imageAlt }] }, twitter: { card: "summary_large_image", title: content.title, description: content.description, images: [guide.image] } }
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params
  const guides = visibleGuides()
  const guide = guides.find(item => item.slug === slug)
  if (!guide) notFound()
  const locale = await guideLocale()
  const it = locale === "it"
  const content = guide[locale]
  const lego = guide === speedChampionsCollectingGuide
  const schema = { "@context": "https://schema.org", "@graph": [
    { "@type": "Article", headline: content.title, description: content.description, image: guide.image, datePublished: guide.published, dateModified: guide.published, inLanguage: locale, mainEntityOfPage: publicAbsoluteUrl(`/guide/${slug}`, locale), author: { "@type": "Organization", name: "TrackDash", url: "https://trackdash.it" }, publisher: { "@type": "Organization", name: "TrackDash", url: "https://trackdash.it" } },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "TrackDash", item: publicAbsoluteUrl("/", locale) }, { "@type": "ListItem", position: 2, name: isRacingStudioEnabled() ? (it ? "Guide TrackDash" : "TrackDash guides") : it ? "Guide Mini 4WD" : "Mini 4WD guides", item: publicAbsoluteUrl("/guide", locale) }, { "@type": "ListItem", position: 3, name: content.title, item: publicAbsoluteUrl(`/guide/${slug}`, locale) }] },
  ] }
  return <PublicShell websiteOnly>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href={localizePublicPath("/guide", locale)} className="text-sm font-semibold text-brand">← {it ? "Tutte le guide" : "All guides"}</Link>
      <p className="mt-8 text-xs font-semibold uppercase tracking-widest text-brand">{content.category}</p>
      <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-navy sm:text-5xl">{content.title}</h1>
      <p className="mt-5 text-sm text-muted-foreground">{it ? "Redazione TrackDash" : "TrackDash editorial team"} · <time dateTime={guide.published}>{new Intl.DateTimeFormat(it ? "it-IT" : "en-GB", { dateStyle: "long", timeZone: "UTC" }).format(new Date(guide.published))}</time></p>
      <div className="mt-8 rounded-2xl border border-blue-100 bg-brand-muted p-6"><p className="text-xs font-semibold uppercase tracking-wider text-brand">{it ? "La risposta in breve" : "The quick answer"}</p><p className="mt-3 text-lg leading-8 text-navy">{content.answer}</p></div>
      <figure className="my-8"><div className="relative h-64 rounded-2xl bg-white sm:h-80"><Image src={guide.image} alt={content.imageAlt} fill unoptimized priority sizes="(max-width: 896px) 100vw, 896px" className="object-contain p-6" /></div><figcaption className="mt-3 text-xs leading-5 text-muted-foreground">{content.imageAlt}. {it ? `Immagine: ${lego ? "LEGO" : "Tamiya"}.` : `Image: ${lego ? "LEGO" : "Tamiya"}.`}</figcaption></figure>
      <nav aria-label={it ? "In questa guida" : "In this guide"} className="rounded-2xl border border-border p-6"><p className="font-semibold text-navy">{it ? "In questa guida" : "In this guide"}</p><ul className="mt-3 space-y-2">{content.sections.map((section, index) => <li key={section.title}><a className="text-brand underline-offset-4 hover:underline" href={`#domanda-${index + 1}`}>{section.title}</a></li>)}</ul></nav>
      {content.sections.map((section, index) => <section key={section.title} id={`domanda-${index + 1}`} className="mt-10 scroll-mt-28"><h2 className="text-2xl font-bold text-navy">{section.title}</h2>{section.paragraphs.map(paragraph => <p key={paragraph} className="mt-4 text-base leading-8 text-foreground/90 sm:text-lg">{paragraph}</p>)}</section>)}
      <div className="mt-8 rounded-xl bg-brand-muted p-5"><Link href={localizePublicPath(guide.relatedPath, locale)} className="font-semibold text-brand">{lego ? (it ? "Vedi il set" : "View the set") : it ? "Esplora le release di" : "Explore releases of"} {guide.relatedLabel} →</Link></div>
      <details className="mt-8 border-t border-border pt-5 text-sm"><summary className="cursor-pointer font-semibold text-navy">{it ? "Fonti e riferimenti" : "Sources and references"}</summary><ul className="mt-3 space-y-3">{guide.sourceLinks.map(source => <li key={source.url}><a className="text-brand underline underline-offset-4" href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a></li>)}</ul></details>
      <div className="mt-8"><p className="text-sm font-semibold text-muted-foreground">{it ? "Leggi anche" : "Read next"}</p>{guides.filter(item => item.slug !== slug).map(item => <Link key={item.slug} href={localizePublicPath(`/guide/${item.slug}`, locale)} className="mt-2 block font-semibold text-brand">{item[locale].title} →</Link>)}</div>
      <GuideCta locale={locale} />
    </article>
  </PublicShell>
}
