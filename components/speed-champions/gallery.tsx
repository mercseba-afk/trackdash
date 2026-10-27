"use client"
import { useState } from "react"
import { SetImage } from "./set-image"
import { setImagePath, type SpeedChampionsSet } from "@/lib/lego/catalog"

export function SetGallery({ set }: { set: SpeedChampionsSet }) {
  const [view, setView] = useState<"box" | "model">("box")
  return (
    <section aria-label="Immagini del set" className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="aspect-square">
        <SetImage
          eager
          src={setImagePath(set.setNumber, view)}
          alt={`${view === "box" ? "Scatola" : "Modello montato"} LEGO ${set.setNumber} — ${set.name}`}
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
            {item === "box" ? "Confezione" : "Modello montato"}
          </button>
        ))}
      </div>
      {view === "box" && set.boxImageKind === "box_with_model" && (
        <p className="px-4 pb-4 text-xs text-slate-500">Immagine ufficiale della confezione con il modello.</p>
      )}
    </section>
  )
}
