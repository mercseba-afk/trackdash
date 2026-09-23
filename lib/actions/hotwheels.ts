import "server-only"

import type { Product, ProductRelease, ReleaseSource } from "@/lib/types"
import { listHotWheelsPilotProducts } from "@/lib/db/queries/hotwheels"
import { mapProductRow } from "@/lib/actions/mappers"

export type HotWheelsCastingSource = {
  id: string
  sourceType: string
  sourceUrl?: string
  verifiedFields: string[]
  checkedAt?: string
  notes?: string
}

export type HotWheelsCastingDetails = {
  modelReference?: string
  designer?: string
  castingDebutYear?: number
  debutSeries?: string
  scale?: string
  verificationStatus: string
  metadata: Record<string, unknown>
  sources: HotWheelsCastingSource[]
}

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
  variationCode?: string
  countryOfManufacture?: string
  wheelType?: string
  exclusivity?: string
  masterSeries?: string
  theme?: string
  metadata: Record<string, unknown>
}

export type HotWheelsPilotSubvariant = {
  id: string
  code?: string
  name: string
  countryOfManufacture?: string
  wheelType?: string
  packagingVariant?: string
  baseVariant?: string
  interiorVariant?: string
  windowVariant?: string
  decoVariant?: string
  marketDistinct: boolean
  verificationStatus: string
}

export type HotWheelsPilotEntry = {
  product: Product
  casting?: HotWheelsCastingDetails
  release: ProductRelease
  primaryIdentifier?: HotWheelsPilotIdentifier
  identifiers: HotWheelsPilotIdentifier[]
  details: HotWheelsPilotDetails
  subvariants: HotWheelsPilotSubvariant[]
  sources: ReleaseSource[]
}

export async function fetchHotWheelsPilotCatalog(): Promise<HotWheelsPilotEntry[]> {
  const rows = await listHotWheelsPilotProducts()

  return rows.flatMap((row) => {
    const product = mapProductRow(row)
    const castingRow = row.hotwheelsCastingDetails
    const casting: HotWheelsCastingDetails | undefined = castingRow
      ? {
          modelReference: castingRow.modelReference ?? undefined,
          designer: castingRow.designer ?? undefined,
          castingDebutYear: castingRow.castingDebutYear ?? undefined,
          debutSeries: castingRow.debutSeries ?? undefined,
          scale: castingRow.scale ?? undefined,
          verificationStatus: castingRow.verificationStatus,
          metadata: (castingRow.metadata ?? {}) as Record<string, unknown>,
          sources: castingRow.sources.map((source) => ({
            id: source.id,
            sourceType: source.sourceType,
            sourceUrl: source.sourceUrl ?? undefined,
            verifiedFields: source.verifiedFields ?? [],
            checkedAt: source.checkedAt ?? undefined,
            notes: source.notes ?? undefined,
          })),
        }
      : undefined

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
        casting,
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
          variationCode: details.variationCode ?? undefined,
          countryOfManufacture: details.countryOfManufacture ?? undefined,
          wheelType: details.wheelType ?? undefined,
          exclusivity: details.exclusivity ?? undefined,
          masterSeries: details.masterSeries ?? undefined,
          theme: details.theme ?? undefined,
          metadata: (details.metadata ?? {}) as Record<string, unknown>,
        },
        subvariants: releaseRow.hotwheelsSubvariants.map((subvariant) => ({
          id: subvariant.id,
          code: subvariant.code ?? undefined,
          name: subvariant.name,
          countryOfManufacture: subvariant.countryOfManufacture ?? undefined,
          wheelType: subvariant.wheelType ?? undefined,
          packagingVariant: subvariant.packagingVariant ?? undefined,
          baseVariant: subvariant.baseVariant ?? undefined,
          interiorVariant: subvariant.interiorVariant ?? undefined,
          windowVariant: subvariant.windowVariant ?? undefined,
          decoVariant: subvariant.decoVariant ?? undefined,
          marketDistinct: subvariant.marketDistinct,
          verificationStatus: subvariant.verificationStatus,
        })),
        sources: release.sources,
      }]
    })
  })
}

export async function fetchHotWheelsPilotRelease(releaseId: string): Promise<HotWheelsPilotEntry | null> {
  const entries = await fetchHotWheelsPilotCatalog()
  return entries.find((entry) => entry.release.id === releaseId) ?? null
}
