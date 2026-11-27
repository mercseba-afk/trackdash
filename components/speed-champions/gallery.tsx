"use client"
import type { PublicLocale } from "@/lib/seo/catalog-paths"
import { useState } from "react"
import { SetImage } from "./set-image"
import { setImagePath, speedChampionsSetName, type SpeedChampionsSet } from "@/lib/lego/catalog"

export function SetGallery({ set, locale = "it" }: { set: SpeedChampionsSet; locale?: PublicLocale }) {
  const copy = (it: string, en: string) => locale === "it" ? it : en
  const [view, setView] = useState<"box" | "model">("box")
  return (
    <section aria-label={copy("Immagini del set", "Set photos")} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="aspect-square">
        <SetImage
          eager
          src={setImagePath(set.setNumber, view)}
          alt={`${view === "box" ? copy("Scatola", "Box") : copy("Modello montato", "Built model")} LEGO ${set.setNumber} — ${speedChampionsSetName(set, locale)}`}
          sizes="(max-width: 768px) 90vw, 50vw"
        />
      </div>
      <div className="flex flex-wrap gap-2 border-t border-slate-100 p-4">
        {(["box", "model"] as const).map((item) => (
          <button
            type="button"
            key={item}
            aria-pressed={view === item}
            onClick={() => setView(item)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${view === item ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-700"}`}
          >
            {item === "box" ? copy("Confezione", "Box") : copy("Modello montato", "Built model")}
          </button>
        ))}
      </div>
      {view === "box" && set.boxImageKind === "box_with_model" && (
        <p className="px-4 pb-4 text-xs text-slate-500">{copy("Immagine ufficiale della confezione con il modello.", "Official photo of the box with the built model.")}</p>
      )}
    </section>
  )
}
