import { Archive, Clock3, CircleHelp, PackageCheck } from "lucide-react"
import { legoStatusLabels, legoStatusDescriptions, type LegoStatus } from "@/lib/lego/catalog"

const styles = {
  available: "text-emerald-800",
  retiring_soon: "text-amber-800",
  retired: "text-violet-800",
  unknown: "text-slate-800",
} satisfies Record<LegoStatus, string>
const icons = { available: PackageCheck, retiring_soon: Clock3, retired: Archive, unknown: CircleHelp }

export function LegoStatusBadge({ status }: { status: LegoStatus }) {
  const Icon = icons[status]
  return <span title={legoStatusDescriptions[status]} className={`inline-flex items-center gap-1.5 text-xs font-medium ${styles[status]}`}>
    <Icon className="size-3.5 shrink-0" aria-hidden="true" />{legoStatusLabels[status]}
  </span>
}

export function LegoStatusLegend() {
  return <details className="rounded-2xl border border-slate-200 bg-white p-5 text-sm">
    <summary className="cursor-pointer font-semibold text-slate-800">Cosa significano i colori e gli stati?</summary>
    <div className="mt-5 grid gap-5 md:grid-cols-3">{(["available", "retiring_soon", "retired"] as const).map(status => <div key={status}>
      <LegoStatusBadge status={status} /><p className="mt-2 text-xs leading-5 text-slate-600">{legoStatusDescriptions[status]}</p>
    </div>)}</div>
    <p className="mt-5 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">Il ritiro non certifica rarità o valore. Per capire quanto vale un set servono vendite concluse comparabili, domanda e condizioni della confezione.</p>
  </details>
}
