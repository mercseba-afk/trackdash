import { TAMIYA_IMAGES as TAMIYA_IMAGES_BASE } from "./tamiya-images"
import { TAMIYA_IMAGES_BATCH2 } from "./tamiya-images-batch2"
import { TAMIYA_IMAGES_BATCH3 } from "./tamiya-images-batch3"
import { TAMIYA_IMAGES_BATCH4 } from "./tamiya-images-batch4"
import { TAMIYA_IMAGES_BATCH5 } from "./tamiya-images-batch5"
import { TAMIYA_IMAGES_BATCH6 } from "./tamiya-images-batch6"
import { TAMIYA_IMAGES_BATCH7 } from "./tamiya-images-batch7"
import { TAMIYA_IMAGES_BATCH8 } from "./tamiya-images-batch8"

// Canonical aggregate consumed by the image validator and SQL generator.
// Keeping audit batches in small append-only data files makes future image
// passes reviewable while preserving one combined manifest at runtime.
// The original Dash-1 Emperor Product mapping in the historical base manifest
// points at ITEM 18025. Batch 4 corrected the canonical lineage to ITEM 18012,
// so that one Product-level legacy mapping is explicitly superseded here while
// its release-specific 18025 mappings remain untouched.
const EFFECTIVE_BASE = TAMIYA_IMAGES_BASE.filter(
  (entry) => !(entry.productSeedKey === "18025" && entry.releaseSeedKey === undefined),
)

export const TAMIYA_IMAGES = [
  ...EFFECTIVE_BASE,
  ...TAMIYA_IMAGES_BATCH2,
  ...TAMIYA_IMAGES_BATCH3,
  ...TAMIYA_IMAGES_BATCH4,
  ...TAMIYA_IMAGES_BATCH5,
  ...TAMIYA_IMAGES_BATCH6,
  ...TAMIYA_IMAGES_BATCH7,
  ...TAMIYA_IMAGES_BATCH8,
]
