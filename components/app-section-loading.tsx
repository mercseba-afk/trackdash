import { Spinner } from "@/components/ui/spinner"

export function AppSectionLoading() {
  return (
    <div role="status" aria-busy="true" className="grid min-h-64 place-items-center text-muted-foreground">
      <Spinner className="size-5" />
    </div>
  )
}
