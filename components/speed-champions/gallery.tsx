import type { PublicLocale } from "@/lib/seo/catalog-paths"
import { SetImage } from "./set-image"
import { setImagePath, speedChampionsSetName, type SpeedChampionsSet } from "@/lib/lego/catalog"

export function SetGallery({ set, locale = "it" }: { set: SpeedChampionsSet; locale?: PublicLocale }) {
  const it = locale === "it"
  const boxLabel = it ? "Confezione" : "Packaging"

  return (
    <section aria-label={boxLabel} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="aspect-square">
        <SetImage
          eager
          src={setImagePath(set.setNumber, "box")}
          alt={`${boxLabel} LEGO ${set.setNumber} — ${speedChampionsSetName(set, locale)}`}
          sizes="(max-width: 768px) 90vw, 50vw"
        />
      </div>
    </section>
  )
}
