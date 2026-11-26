import "server-only"

import { speedChampionsSets, type SpeedChampionsSet } from "@/lib/lego/catalog"
import { createAdminClient } from "@/lib/supabase/admin"

export async function readSpeedChampionsPreview(): Promise<readonly SpeedChampionsSet[]> {
  if (process.env.NODE_ENV !== "development" || process.env.TRACKDASH_SPEED_DB_PREVIEW !== "1") {
    return speedChampionsSets
  }

  const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    throw new Error("The Speed Champions database preview requires a local Supabase API")
  }

  const admin = createAdminClient()
  const ids = speedChampionsSets.map((set) => set.releaseId)
  const [details, releases] = await Promise.all([
    admin.from("lego_release_details")
      .select("release_id,set_number,piece_count,car_count,car_brand,subtheme,official_catalog_status,official_source_url,status_checked_at")
      .in("release_id", ids),
    admin.from("product_releases").select("id,product_id,edition_name,release_year")
      .in("id", ids).eq("catalog_visibility", "research_only")
      .eq("catalog_visibility_reason", "speed_champions_private_preview"),
  ])
  if (details.error || releases.error) throw new Error("Could not read the local Speed Champions catalog")
  const detailsById = new Map(details.data.map((row) => [row.release_id, row]))
  const releasesById = new Map(releases.data.map((row) => [row.id, row]))

  return speedChampionsSets.map((set) => {
    const row = detailsById.get(set.releaseId)
    const release = releasesById.get(set.releaseId)
    if (!row || !release || row.set_number !== set.setNumber || release.product_id !== set.productId ||
      !Number.isInteger(release.release_year) || !["available", "retiring_soon", "retired", "unknown"].includes(row.official_catalog_status)) {
      throw new Error(`The local Speed Champions seed is incomplete for set ${set.setNumber}`)
    }
    return {
      ...set,
      name: release.edition_name,
      year: release.release_year,
      carBrand: row.car_brand,
      carCount: row.car_count,
      pieces: row.piece_count,
      series: row.subtheme,
      status: row.official_catalog_status,
      statusCheckedAt: row.status_checked_at,
      sourceUrl: row.official_source_url,
    }
  })
}
