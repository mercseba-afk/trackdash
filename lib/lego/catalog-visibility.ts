import { isRacingStudioPreview, racingStudioIsLive } from "@/lib/racing-studio"

export const speedChampionsCatalogIsPublic = racingStudioIsLive

export function speedChampionsCatalogIsVisible() {
  return speedChampionsCatalogIsPublic || isRacingStudioPreview()
}
