import { Archive, Clock3, CircleHelp, PackageCheck } from "lucide-react"
import type { LegoStatus } from "@/lib/lego/catalog"
import type { PublicLocale } from "@/lib/seo/catalog-paths"
import { localizedLegoStatusLabels, localizedLegoStatusDescriptions } from "@/lib/lego/locale"

const styles = {
  available: "bg-emerald-50 text-emerald-800",
  retiring_soon: "bg-amber-50 text-amber-800",
  retired: "bg-violet-50 text-violet-800",
  unknown: "bg-slate-50 text-slate-800",
} satisfies Record<LegoStatus, string>
const icons = { available: PackageCheck, retiring_soon: Clock3, retired: Archive, unknown: CircleHelp }

export function LegoStatusBadge({ status, locale = "it" }: { status: LegoStatus; locale?: PublicLocale }) {
  const Icon = icons[status]
  return <span title={localizedLegoStatusDescriptions(locale)[status]} className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${styles[status]}`}>
    <Icon className="size-3.5 shrink-0" aria-hidden="true" />{localizedLegoStatusLabels(locale)[status]}
  </span>
}

export function LegoStatusLegend({ locale }: { locale: PublicLocale }) {
  return <details className="rounded-2xl border border-slate-200 bg-white p-5 text-sm">
    <summary className="cursor-pointer font-semibold text-slate-800">{locale === "it" ? "Cosa significano i colori e gli stati?" : "What does each status mean?"}</summary>
    <div className="mt-5 grid gap-5 md:grid-cols-3">{(["available", "retiring_soon", "retired"] as const).map(status => <div key={status}>
      <LegoStatusBadge status={status} locale={locale} /><p className="mt-2 text-xs leading-5 text-slate-600">{localizedLegoStatusDescriptions(locale)[status]}</p>
    </div>)}</div>
    <p className="mt-5 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">{locale === "it" ? "Per stimare il valore di un set, considera vendite concluse comparabili, domanda e condizioni della confezione." : "Comparable sales, demand and box condition help you estimate a set’s value."}</p>
  </details>
}
