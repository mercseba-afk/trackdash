"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Heart, LibraryBig, TrendingUp } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function CatalogAreaNav() {
  const pathname = usePathname()
  const { locale } = useI18n()
  const it = locale === "it"
  const marketActive = pathname === "/market" || pathname.startsWith("/market/")

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="inline-flex rounded-lg bg-muted p-1">
        <Link
          href="/catalog"
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
            !marketActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <LibraryBig className="size-4" />
          {it ? "Catalogo" : "Catalog"}
        </Link>
        <Link
          href="/market"
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
            marketActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <TrendingUp className="size-4" />
          {it ? "Valori" : "Values"}
        </Link>
      </div>

      <Button variant="outline" size="sm" render={<Link href="/wishlist" />}>
        <Heart /> {it ? "Wishlist" : "Wishlist"}
      </Button>
    </div>
  )
}
