import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function AmazonPurchaseButton({
  href, itemNumber, it, className,
}: {
  href: string
  itemNumber?: string | null
  it: boolean
  className?: string
}) {
  return (
    <a
      href={href}
      data-amazon-item={itemNumber}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className={cn("inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#ffd814] px-3 text-[#181818] transition-colors hover:bg-[#f7ca00] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f4bb4]", className)}
    >
      <span className="flex flex-col items-center gap-0.5">
        <span className="whitespace-nowrap text-xs font-semibold leading-none">{it ? "Acquista su Amazon" : "Buy on Amazon"}</span>
        <span className="text-[10px] font-normal leading-none">{it ? "Link affiliato" : "Affiliate link"}</span>
      </span>
      <ArrowUpRight aria-hidden="true" className="size-3.5 shrink-0" />
    </a>
  )
}
