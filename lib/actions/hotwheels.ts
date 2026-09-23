import "server-only"

import type { Product, ProductRelease, ReleaseSource } from "@/lib/types"
import { listHotWheelsPilotProducts } from "@/lib/db/queries/hotwheels"
import { mapProductRow } from "@/lib/actions/mappers"

export type HotWheelsPilotIdentifier = {
  scheme: string
  value: string
  isPrimary: boolean
}

export type HotWheelsPilotDetails = {
  lineSlug: string
  lineName: string
  subseries?: string
  mixCode?: string
  collectorNumber?: string
  seriesPosition?: string
  chaseType?: string
  packagingVariant?: string
  metadata: Record<string, unknown>
}

export type HotWheelsPilotEntry = {
  product: Product
  release: ProductRelease
  primaryIdentifier?: HotWheelsPilotIdentifier
  identifiers: HotWheelsPilotIdentifier[]
  details: HotWheelsPilotDetails
  sources: ReleaseSource[]
}

export async function fetchHotWheelsPilotCatalog(): Promise<HotWheelsPilotEntry[]> {
  const rows = await listHotWheelsPilotProducts()

  return rows.flatMap((row) => {
    const product = mapProductRow(row)

    return row.releases.flatMap((releaseRow) => {
      const details = releaseRow.hotwheelsDetails
      if (!details) return []

      const release = product.releases.find((candidate) => candidate.id === releaseRow.id)
      if (!release) return []

      const identifiers = releaseRow.identifiers.map((identifier) => ({
        scheme: identifier.scheme,
        value: identifier.value,
        isPrimary: identifier.isPrimary,
      }))

      return [{
        product,
        release,
        primaryIdentifier: identifiers.find((identifier) => identifier.isPrimary) ?? identifiers[0],
        identifiers,
        details: {
          lineSlug: details.lineSlug,
          lineName: details.lineName,
          subseries: details.subseries ?? undefined,
          mixCode: details.mixCode ?? undefined,
          collectorNumber: details.collectorNumber ?? undefined,
          seriesPosition: details.seriesPosition ?? undefined,
          chaseType: details.chaseType ?? undefined,
          packagingVariant: details.packagingVariant ?? undefined,
          metadata: (details.metadata ?? {}) as Record<string, unknown>,
        },
        sources: release.sources,
      }]
    })
  })
}

export async function fetchHotWheelsPilotRelease(releaseId: string): Promise<HotWheelsPilotEntry | null> {
  const entries = await fetchHotWheelsPilotCatalog()
  return entries.find((entry) => entry.release.id === releaseId) ?? null
}
