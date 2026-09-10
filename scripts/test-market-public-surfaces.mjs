import fs from "node:fs"
import path from "node:path"

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

function sourceFiles(root) {
  const result = []
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name)
    if (entry.isDirectory()) result.push(...sourceFiles(full))
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) result.push(full)
  }
  return result
}

if (fs.existsSync("lib/data/market.ts")) {
  errors.push("Legacy demo price engine lib/data/market.ts still exists")
}

for (const file of sourceFiles("app").concat(sourceFiles("components"), sourceFiles("lib"))) {
  const source = fs.readFileSync(file, "utf8")
  if (source.includes("@/lib/data/market")) {
    errors.push(`${file}: imports the deleted legacy market engine`)
  }
}

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

const releaseScreen = fs.readFileSync("components/screens/release-detail-screen.tsx", "utf8")
if (!releaseScreen.includes("Valore attuale stimato")) {
  errors.push("Release detail does not expose the collector-facing estimated current value")
}
if (releaseScreen.includes("Come leggere il mercato") || releaseScreen.includes("Fonti e verifica")) {
  errors.push("Release detail still exposes analytical methodology/source panels")
}

const marketBits = fs.readFileSync("components/market-bits.tsx", "utf8")
if (!marketBits.includes("trendWindowMonths") || !marketBits.includes("TrendIndicator")) {
  errors.push("Collector market UI is missing the value/trend indicator")
}
if (marketBits.includes("confidenceScore}/100") || marketBits.includes("regimeLabel(signal")) {
  errors.push("Collector market UI still exposes internal confidence/regime analytics")
}

if (errors.length > 0) {
  console.error("Public market surface regression check failed:\n")
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`Public R3 market surfaces: ${publicSurfaces.length}/${publicSurfaces.length} clean`)
console.log("Legacy demo price engine removed; collector UI exposes value, trend and rarity without internal analytics.")
