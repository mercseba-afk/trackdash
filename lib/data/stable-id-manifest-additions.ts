import type { StableIdManifestEntry } from "./stable-id-manifest"

// Append-only stable IDs allocated after the original sealed manifest file.
// Kept separate so catalog-expansion migrations can seal newly allocated IDs
// without rewriting the historical manifest block. Never remove or reuse an ID.
export const STABLE_ID_MANIFEST_ADDITIONS: StableIdManifestEntry[] = [
  {
    id: "83e6ea7d-aa3d-5524-b640-73c407ee272a",
    kind: "release",
    label: "Proto Emperor ZX — Proto Emperor ZX (1992 Original)",
  },
]
