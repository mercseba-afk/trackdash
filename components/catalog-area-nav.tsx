"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Heart, LibraryBig, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export function CatalogAreaNav() {
  const pathname = usePathname()
  const { locale } = useI18n()
  const { user } = useStore()
  const it = locale === "it"
  const marketActive = pathname === "/market" || pathname.startsWith("/market/")
  const wishlistHref = user ? "/wishlist" : "/login?next=%2Fwishlist"

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="inline-flex rounded-xl border border-[#d8e3f0] bg-white p-1 shadow-sm">
        <Link
          href="/catalog"
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors",
            !marketActive ? "bg-[#eef4ff] text-[#0f4bb4]" : "text-[#607089] hover:text-[#0f4bb4]",
          )}
        >
          <LibraryBig className="size-4" /> {it ? "Catalogo" : "Catalog"}
        </Link>
        <Link
          href="/market"
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors",
            marketActive ? "bg-[#eef4ff] text-[#0f4bb4]" : "text-[#607089] hover:text-[#0f4bb4]",
          )}
        >
          <TrendingUp className="size-4" /> Price Intelligence
        </Link>
      </div>

      <Button variant="outline" size="sm" render={<Link href={wishlistHref} />} className="border-[#d4deea] bg-white">
        <Heart /> Wishlist
      </Button>
    </div>
  )
}
