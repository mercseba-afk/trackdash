import "server-only"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { gunzipSync } from "node:zlib"
import type { ReleaseMarketSignalMap } from "@/lib/market/view-types"
import type { Product } from "@/lib/types"

type PreviewSnapshot = { products: Product[]; marketSignals: ReleaseMarketSignalMap }
let snapshot: PreviewSnapshot | undefined

// Fixed export of the public Mini 4WD catalog and public market projection.
export function getRacingPreviewSnapshot(): PreviewSnapshot {
  snapshot ??= JSON.parse(gunzipSync(readFileSync(join(process.cwd(), "lib/data/racing-preview-snapshot.json.gz"))).toString("utf8"))
  return snapshot!
}
