import { TAMIYA_IMAGES as TAMIYA_IMAGES_BASE } from "./tamiya-images"
import { TAMIYA_IMAGES_BATCH2 } from "./tamiya-images-batch2"
import { TAMIYA_IMAGES_BATCH3 } from "./tamiya-images-batch3"
import { TAMIYA_IMAGES_BATCH4 } from "./tamiya-images-batch4"
import { TAMIYA_IMAGES_BATCH5 } from "./tamiya-images-batch5"
import { TAMIYA_IMAGES_BATCH6 } from "./tamiya-images-batch6"

// Canonical aggregate consumed by the image validator and SQL generator.
// Keeping audit batches in small append-only data files makes future image
// passes reviewable while preserving one combined manifest at runtime.
export const TAMIYA_IMAGES = [
  ...TAMIYA_IMAGES_BASE,
  ...TAMIYA_IMAGES_BATCH2,
  ...TAMIYA_IMAGES_BATCH3,
  ...TAMIYA_IMAGES_BATCH4,
  ...TAMIYA_IMAGES_BATCH5,
  ...TAMIYA_IMAGES_BATCH6,
]
