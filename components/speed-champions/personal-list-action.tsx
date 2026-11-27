"use client"

import { useState, useTransition } from "react"
import { Boxes, Check, Heart, LoaderCircle, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { updateLegoListAction } from "@/lib/actions/lego-personal-lists"
import { legoConditions, type LegoListItem, type LegoListKind } from "@/lib/lego/personal-list-types"

export function LegoListAction({ kind, setNumber, item }: {
  kind: LegoListKind
  setNumber: string
  item?: LegoListItem
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const isCollection = kind === "collection"
  const title = item ? "Modifica copie" : "Aggiungi alla collezione"

  function submit(operation: "save" | "remove", form = new FormData()) {
    if (pending) return
    form.set("operation", operation)
    startTransition(async () => {
      try {
        await updateLegoListAction(kind, setNumber, form)
        setOpen(false)
        if (operation === "remove") {
          toast.success(isCollection ? "Set rimosso dalla collezione" : "Set rimosso dalla wishlist")
        } else {
          toast.success(isCollection ? (item ? "Modifiche salvate" : "Set aggiunto alla collezione") : "Set aggiunto alla wishlist")
        }
      } catch {
        toast.error("Operazione non riuscita. Riprova.")
      }
    })
  }

  if (!isCollection) {
    return (
      <Button type="button" size="lg" variant="outline" disabled={pending} onClick={() => submit(item ? "remove" : "save")}>
        {pending ? <LoaderCircle className="animate-spin" /> : item ? <Trash2 /> : <Heart />}
        {pending ? "Attendi…" : item ? "Rimuovi dalla wishlist" : "Aggiungi alla wishlist"}
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!pending) setOpen(next) }}>
      <DialogTrigger render={<Button size="lg" variant={item ? "outline" : "default"} disabled={pending} />}>
        {item ? <Pencil /> : <Boxes />}
        {title}
      </DialogTrigger>
      <DialogContent showCloseButton={!pending}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(event) => {
          event.preventDefault()
          submit("save", new FormData(event.currentTarget))
        }} className="space-y-4">
          <fieldset disabled={pending} className="grid grid-cols-[1fr_5rem] gap-3">
            <label className="grid gap-1 font-medium">
              Condizione
              <select name="condition" defaultValue={item?.condition ?? "sealed"} className="h-10 rounded-md border bg-background px-2">
                {Object.entries(legoConditions).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </label>
            <label className="grid gap-1 font-medium">
              Copie
              <input name="quantity" type="number" min={1} max={99} required defaultValue={item?.quantity ?? 1} className="h-10 w-full rounded-md border bg-background px-2" />
            </label>
          </fieldset>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? <LoaderCircle className="animate-spin" /> : <Check />}
              {pending ? "Attendi…" : item ? "Salva modifiche" : "Aggiungi alla collezione"}
            </Button>
            {item && (
              <Button type="button" size="lg" variant="ghost" disabled={pending} onClick={() => submit("remove")}>
                <Trash2 /> Rimuovi
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
