import { TAMIYA_IMAGES as TAMIYA_IMAGES_BASE } from "./tamiya-images.ts"
import { TAMIYA_IMAGES_BATCH2 } from "./tamiya-images-batch2.ts"

// Canonical aggregate consumed by the image validator and SQL generator.
// Keeping audit batches in small append-only data files makes future image
// passes reviewable while preserving one combined manifest at runtime.
export const TAMIYA_IMAGES = [
  ...TAMIYA_IMAGES_BASE,
  ...TAMIYA_IMAGES_BATCH2,
]
