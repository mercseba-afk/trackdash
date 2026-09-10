import fs from "node:fs"

// Public R3 alignment regression gate. Keep this test deployment-visible so
// Vercel preview builds verify the same canonical market-source contract.
const publicSurfaces = [
  "components/screens/scanner-screen.tsx",
  "components/screens/release-detail-screen.tsx",
  "components/screens/product-detail-screen.tsx",
  "components/screens/collection-screen.tsx",
  "components/screens/dashboard-screen.tsx",
  "components/screens/wishlist-screen.tsx",
  "components/screens/market-screen.tsx",
  "lib/analytics.ts",
]

const forbidden = [
  "@/lib/data/market",
  "getReleaseEstimate",
  "getProductEstimate",
]

const requiredMarkers = new Map([
  ["components/screens/scanner-screen.tsx", "useMarketSignals"],
  ["components/screens/product-detail-screen.tsx", "useMarketSignals"],
  ["components/screens/collection-screen.tsx", "useMarketSignals"],
  ["components/screens/dashboard-screen.tsx", "useMarketSignals"],
  ["components/screens/wishlist-screen.tsx", "useMarketSignals"],
  ["components/screens/market-screen.tsx", "useMarketSignals"],
  ["lib/analytics.ts", "ReleaseMarketSignalMap"],
])

const errors = []

for (const file of publicSurfaces) {
  const source = fs.readFileSync(file, "utf8")

  for (const token of forbidden) {
    if (source.includes(token)) {
      errors.push(`${file}: forbidden legacy market token ${JSON.stringify(token)}`)
    }
  }

  const marker = requiredMarkers.get(file)
  if (marker && !source.includes(marker)) {
    errors.push(`${file}: missing canonical R3 marker ${JSON.stringify(marker)}`)
  }
}

const releasePage = fs.readFileSync("app/catalog/[id]/releases/[releaseId]/page.tsx", "utf8")
if (!releasePage.includes("getPublicMarketSignalForRelease")) {
  errors.push("Release page is not using the canonical public R3 market service")
}

if (errors.length > 0) {
  console.error("Public market surface regression check failed:\n")
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`Public R3 market surfaces: ${publicSurfaces.length}/${publicSurfaces.length} clean`)
console.log("Legacy demo pricing is not reachable from checked public market surfaces.")
