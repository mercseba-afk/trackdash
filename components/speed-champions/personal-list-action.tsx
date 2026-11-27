"use client"

import { useState, useTransition } from "react"
import { Boxes, Check, Heart, LoaderCircle, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { updateLegoListAction } from "@/lib/actions/lego-personal-lists"
import type { PublicLocale } from "@/lib/seo/catalog-paths"
import { localizedLegoListConditions } from "@/lib/lego/locale"
import type { LegoListItem, LegoListKind } from "@/lib/lego/personal-list-types"

export function LegoListAction({ kind, setNumber, item, compact = false, locale = "it" }: {
  kind: LegoListKind
  setNumber: string
  item?: LegoListItem
  compact?: boolean
  locale?: PublicLocale
}) {
  const copy = (it: string, en: string) => locale === "it" ? it : en
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const isCollection = kind === "collection"
  const title = item ? copy("Modifica copie", "Edit copies") : copy("Aggiungi alla collezione", "Add to collection")
  const wishlistLabel = item ? copy("Rimuovi dalla wishlist", "Remove from wishlist") : copy("Aggiungi alla wishlist", "Add to wishlist")

  function submit(operation: "save" | "remove", form = new FormData()) {
    if (pending) return
    form.set("operation", operation)
    startTransition(async () => {
      try {
        await updateLegoListAction(kind, setNumber, form)
        setOpen(false)
        if (operation === "remove") {
          toast.success(isCollection ? copy("Set rimosso dalla collezione", "Set removed from collection") : copy("Set rimosso dalla wishlist", "Set removed from wishlist"))
        } else {
          toast.success(isCollection ? (item ? copy("Modifiche salvate", "Changes saved") : copy("Set aggiunto alla collezione", "Set added to collection")) : copy("Set aggiunto alla wishlist", "Set added to wishlist"))
        }
      } catch {
        toast.error(copy("Operazione non riuscita. Riprova.", "Could not save your changes. Try again."))
      }
    })
  }

  if (!isCollection) {
    return (
      <Button
        type="button"
        size={compact ? "icon-lg" : "lg"}
        variant={compact ? "ghost" : "outline"}
        disabled={pending}
        aria-label={compact ? `${wishlistLabel} #${setNumber}` : undefined}
        title={compact ? wishlistLabel : undefined}
        onClick={() => submit(item ? "remove" : "save")}
      >
        {pending ? <LoaderCircle className="animate-spin" /> : item ? <Trash2 /> : <Heart />}
        {!compact && (pending ? copy("Attendi…", "Please wait…") : wishlistLabel)}
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!pending) setOpen(next) }}>
      <DialogTrigger render={
        <Button
          size={compact ? "icon-lg" : "lg"}
          variant={compact ? "ghost" : item ? "outline" : "default"}
          disabled={pending}
          aria-label={compact ? `${title} #${setNumber}` : undefined}
          title={compact ? title : undefined}
        />
      }>
        {item ? <Pencil /> : <Boxes />}
        {!compact && title}
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
              {copy("Condizione", "Condition")}
              <select name="condition" defaultValue={item?.condition ?? "sealed"} className="h-10 rounded-md border bg-background px-2">
                {Object.entries(localizedLegoListConditions(locale)).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </label>
            <label className="grid gap-1 font-medium">
              {copy("Copie", "Copies")}
              <input name="quantity" type="number" min={1} max={99} required defaultValue={item?.quantity ?? 1} className="h-10 w-full rounded-md border bg-background px-2" />
            </label>
          </fieldset>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? <LoaderCircle className="animate-spin" /> : <Check />}
              {pending ? copy("Attendi…", "Please wait…") : item ? copy("Salva modifiche", "Save changes") : copy("Aggiungi alla collezione", "Add to collection")}
            </Button>
            {item && (
              <Button type="button" size="lg" variant="ghost" disabled={pending} onClick={() => submit("remove")}>
                <Trash2 /> {copy("Rimuovi", "Remove")}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
