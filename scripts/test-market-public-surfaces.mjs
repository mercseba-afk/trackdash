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
if (!releaseScreen.includes("Valore stimato")) {
  errors.push("Release detail does not expose the public estimated market value")
}
if (!releaseScreen.includes("Prezzo osservato")) {
  errors.push("Release detail does not expose the observed market price separately from Market Value")
}
if (!releaseScreen.includes("costo effettivo")) {
  errors.push("Release detail does not explain the Europe-first delivered-cost basis")
}
if (!releaseScreen.includes("Mercato osservato") || !releaseScreen.includes("Riferimenti disponibili")) {
  errors.push("Release detail does not distinguish historical market context from missing data")
}
if (releaseScreen.includes("SOLD 0") || releaseScreen.includes("0 SOLD")) {
  errors.push("Release detail exposes a misleading zero-sales claim")
}
if (releaseScreen.includes("Disponibile da") || releaseScreen.includes("Available from")) {
  errors.push("Release detail still presents observed external prices with storefront-like availability wording")
}
if (releaseScreen.includes("Come leggere il mercato") || releaseScreen.includes("Fonti e verifica")) {
  errors.push("Release detail still exposes analytical methodology/source panels")
}

const collectionScreen = fs.readFileSync("components/screens/collection-screen.tsx", "utf8")
if (!collectionScreen.includes("Mercato osservato") || !collectionScreen.includes("Riferimenti storici disponibili")) {
  errors.push("Collection does not distinguish historical market context from missing data")
}

const publicMarket = fs.readFileSync("lib/market/public.ts", "utf8")
if (!publicMarket.includes("marketContextEvidenceCount") || !publicMarket.includes("listSafeMarketContextEvidence")) {
  errors.push("Public market service is not carrying safe historical context evidence through the trusted server boundary")
}
if (!publicMarket.includes("startingEffectiveCostEUR: startingEffectiveCostEUR")) {
  errors.push("Public market service is not exposing the canonical starting effective cost")
}
if (publicMarket.includes("startingItemPriceEUR: observedPriceEUR")) {
  errors.push("Public market service is re-deriving the canonical starting price from offer-state ordering")
}

for (const file of [
  "components/screens/release-detail-screen.tsx",
  "components/screens/collection-screen.tsx",
  "components/market-signal-inline.tsx",
]) {
  const source = fs.readFileSync(file, "utf8")
  const startingIndex = source.indexOf("startingEffectiveCostEUR")
  const activeIndex = source.indexOf("activeAnchorEUR", startingIndex)
  if (startingIndex < 0 || activeIndex < 0 || startingIndex > activeIndex) {
    errors.push(`${file}: canonical starting cost must be preferred before active anchor`)
  }
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
console.log("Collector UI exposes Estimated value or Observed price with Europe-first delivered-cost semantics and no misleading zero-sales claim.")
