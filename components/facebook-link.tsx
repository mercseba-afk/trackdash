"use client"

import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const FACEBOOK_URL = "https://www.facebook.com/share/1Et2RkMmp3/"

export function FacebookLink({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { locale } = useI18n()
  const label = locale === "it" ? "Seguici su Facebook (nuova scheda)" : "Follow us on Facebook (new tab)"

  return (
    <a
      href={FACEBOOK_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex min-h-10 shrink-0 items-center justify-center gap-2.5 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        compact ? "size-10 text-[#1877F2] hover:bg-[#1877F2]/10" : "w-fit border border-[#1877F2]/15 bg-[#1877F2]/5 px-3.5 py-2 text-[#1662c4] hover:bg-[#1877F2]/10",
        className,
      )}
    >
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#1877F2] text-white" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      </span>
      {compact ? null : <span>Facebook</span>}
    </a>
  )
}

export function SocialFollow({ className }: { className?: string }) {
  const { locale } = useI18n()
  return (
    <div className={cn("flex flex-col items-start gap-2.5", className)}>
      <p className="text-xs font-medium text-muted-foreground">{locale === "it" ? "Seguici sui social" : "Follow us on social media"}</p>
      <FacebookLink />
    </div>
  )
}
