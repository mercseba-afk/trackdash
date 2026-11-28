import type { PublicLocale } from "@/lib/seo/catalog-paths"

export function SpeedChampionsDisclaimer({ locale }: { locale: PublicLocale }) {
  const it = locale === "it"

  return (
    <>
      {it
        ? "TrackDash è un progetto indipendente. LEGO® è un marchio di The LEGO Group, che non è affiliato a TrackDash e non lo autorizza né lo sponsorizza."
        : "TrackDash is an independent project. LEGO® is a trademark of The LEGO Group, which is not affiliated with TrackDash and does not authorize or sponsor it."}
      {" "}
      <a className="underline underline-offset-2" href="mailto:info@xebdesign.it?subject=TrackDash%20%E2%80%93%20Copyright">
        {it ? "Segnala un problema di copyright" : "Report a copyright concern"}
      </a>
    </>
  )
}
