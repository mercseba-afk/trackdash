import fs from "node:fs"
import path from "node:path"

const publicSurfaces = [
  "components/screens/scanner-screen.tsx",
  "components/screens/release-detail-screen.tsx",
  "components/screens/collection-item-detail-screen.tsx",
  "components/release-market-overview.tsx",
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
for (const file of sourceFiles("app").concat(sourceFiles("components"), sourceFiles("lib"))) {
  const source = fs.readFileSync(file, "utf8")
  for (const ambiguousAskCopy of [
    "Prezzo osservato",
    "Observed price",
    "Trend prezzo osservato",
    "Observed price trend",
    "Richiesta venditore osservata",
    "Observed seller ask",
    "Richiesta più bassa osservata",
    "Lowest observed ask",
    "Richiesta osservata",
    "Observed ask",
    "Trend richieste osservate",
    "Observed ask trend",
  ]) {
    if (source.includes(ambiguousAskCopy)) {
      errors.push(`${file}: still exposes ambiguous seller-ask wording ${JSON.stringify(ambiguousAskCopy)}`)
    }
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
const collectionItemScreen = fs.readFileSync("components/screens/collection-item-detail-screen.tsx", "utf8")
const marketOverview = fs.readFileSync("components/release-market-overview.tsx", "utf8")

if (!releaseScreen.includes("ReleaseMarketOverview")) {
  errors.push("Release detail is not using the shared collector-facing market overview")
}
if (!collectionItemScreen.includes("ReleaseMarketOverview")) {
  errors.push("Collection item detail is not using the same shared market overview as the Release")
}

const marketInline = fs.readFileSync("components/market-signal-inline.tsx", "utf8")
const productDetailScreen = fs.readFileSync("components/screens/product-detail-screen.tsx", "utf8")
if (!marketInline.includes("showBothReferences") || !marketInline.includes("Vendite concluse") || !marketInline.includes("Annunci attivi")) {
  errors.push("Compact market UI does not support distinct SOLD + ASK references for Release previews")
}
if (!productDetailScreen.includes("showBothReferences")) {
  errors.push("Release family rows are not enabling the dual SOLD + ASK preview")
}
if ((productDetailScreen.match(/showBothReferences/g) ?? []).length !== 1) {
  errors.push("Dual SOLD + ASK preview must stay scoped to Release family rows instead of leaking into other compact surfaces")
}
if (!marketOverview.includes("Valore stimato")) {
  errors.push("Shared market overview does not expose the public estimated market value")
}
if (!marketOverview.includes("observedMarketPrice") || !marketOverview.includes("soldAnchorEUR")) {
  errors.push("Shared market overview does not expose ASK and completed-sale references separately")
}
if (!marketOverview.includes("Trend mercato") || !marketOverview.includes("observedMarketAskTrendLabel")) {
  errors.push("Shared market overview does not distinguish Market Value trend from seller-ask trend")
}
const marketPresentation = fs.readFileSync("lib/market/presentation.ts", "utf8")
for (const requiredSellerAskCopy of [
  "Prezzo richiesto più basso",
  "Lowest asking price",
  "Trend prezzi richiesti",
  "Asking price trend",
  "annuncio attivo osservato",
  "active listings observed",
  "Prezzo da vendite concluse",
  "Price from completed sales",
  "vendita conclusa osservata",
  "completed sales observed",
]) {
  if (!marketPresentation.includes(requiredSellerAskCopy)) {
    errors.push(`Shared market presentation is missing seller-ask wording ${JSON.stringify(requiredSellerAskCopy)}`)
  }
}
if (!marketPresentation.includes("askTrendWindowDays >= 7") || !marketPresentation.includes("currentOfferCount >= 3")) {
  errors.push("Observed-price trend is not guarded against thin or too-short ASK windows")
}
if (!marketPresentation.includes("signal?.soldAnchorEUR") || !marketPresentation.includes('return "sold"')) {
  errors.push("Shared market presentation does not expose SOLD anchor as a display-only fallback")
}
const analyticsSource = fs.readFileSync("lib/analytics.ts", "utf8")
if (analyticsSource.includes("observedMarketDisplayPrice")) {
  errors.push("Display-only SOLD fallback leaked into portfolio or wishlist valuation logic")
}
if (!marketOverview.includes("currentOfferCount") || !marketOverview.includes("soldUnits")) {
  errors.push("Shared market overview does not expose separate active-listing/completed-sale evidence")
}
for (const verboseReleaseToken of [
  "Riferimento ricavato",
  "Reference derived from",
  "Le vendite osservate sono concentrate",
  "Observed sales are concentrated",
  "Ultimo aggiornamento",
  "Last update",
  "Trend in raccolta",
  "Trend gathering",
]) {
  if (marketOverview.includes(verboseReleaseToken)) {
    errors.push(`Shared Release market overview still exposes verbose detail ${JSON.stringify(verboseReleaseToken)}`)
  }
}
if (marketOverview.includes("SOLD 0") || marketOverview.includes("0 SOLD")) {
  errors.push("Shared market overview exposes a misleading zero-sales claim")
}
if (marketOverview.includes("Disponibile da") || marketOverview.includes("Available from")) {
  errors.push("Shared market overview still presents external prices with storefront-like availability wording")
}
if (releaseScreen.includes("ExternalAvailabilityCard") || releaseScreen.includes("PriceIntelligenceCard")) {
  errors.push("Release detail still duplicates the market into multiple technical cards")
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

const startingIndex = marketPresentation.indexOf("startingEffectiveCostEUR")
const activeIndex = marketPresentation.indexOf("activeAnchorEUR", startingIndex)
if (startingIndex < 0 || activeIndex < 0 || startingIndex > activeIndex) {
  errors.push("Shared market presentation must use canonical starting effective cost before active anchor")
}

for (const file of [
  "components/release-market-overview.tsx",
  "components/screens/collection-screen.tsx",
  "components/market-signal-inline.tsx",
  "lib/analytics.ts",
]) {
  const source = fs.readFileSync(file, "utf8")
  if (!source.includes("@/lib/market/presentation")) {
    errors.push(`${file}: market presentation rules are not centralized`)
  }
}

const marketBits = fs.readFileSync("components/market-bits.tsx", "utf8")
const productDetail = fs.readFileSync("components/screens/product-detail-screen.tsx", "utf8")
for (const legacyToken of ["MarketSignalCard", "MarketDataEmptyCard", "product.marketOriginal", "product.howValue"]) {
  if (productDetail.includes(legacyToken)) {
    errors.push(`Product family detail still contains legacy family-market token ${JSON.stringify(legacyToken)}`)
  }
}

const scannerPage = fs.readFileSync("app/scanner/page.tsx", "utf8")
const scannerScreen = fs.readFileSync("components/screens/scanner-screen.tsx", "utf8")
if (!scannerPage.includes("fetchCatalogProducts") || !scannerPage.includes("products={catalogProducts}")) {
  errors.push("Scanner page is not fed from the canonical catalog")
}
if (!scannerScreen.includes("productById.get(byCode.product.id)") || scannerScreen.includes("PRODUCTS.find")) {
  errors.push("Scanner result display can drift back to the local catalog instead of hydrating canonical product/release data")
}

const collectionItemPage = fs.readFileSync("app/collection/[id]/page.tsx", "utf8")
if (!collectionItemPage.includes("fetchCatalogProductById") || !collectionItemPage.includes("catalogProduct={catalogProduct}")) {
  errors.push("Collection item page is not loading the canonical catalog product")
}
if (!collectionItemScreen.includes("catalogProduct") || !collectionItemScreen.includes("enrichCollection([item], marketSignals, [catalogProduct])")) {
  errors.push("Collection item detail can drift back to the local catalog instead of the canonical DB product")
}

const dashboardPage = fs.readFileSync("app/dashboard/page.tsx", "utf8")
const dashboardScreen = fs.readFileSync("components/screens/dashboard-screen.tsx", "utf8")
const dashboardMarket = fs.readFileSync("components/dashboard-market-overview.tsx", "utf8")
if (!dashboardPage.includes("fetchCatalogProducts") || !dashboardScreen.includes("catalogProducts")) {
  errors.push("Dashboard is not fed from the canonical catalog")
}
if (dashboardMarket.includes("@/lib/data/corrected-products") || dashboardMarket.includes("PRODUCTS.flatMap")) {
  errors.push("Dashboard market overview still uses the local catalog copy")
}

const marketPage = fs.readFileSync("app/market/page.tsx", "utf8")
const marketScreen = fs.readFileSync("components/screens/market-screen.tsx", "utf8")
if (!marketPage.includes("fetchCatalogProducts") || !marketScreen.includes("products.flatMap")) {
  errors.push("Market page is not fed from the canonical catalog")
}
if (marketScreen.includes("@/lib/data/corrected-products") || marketScreen.includes("PRODUCTS.flatMap")) {
  errors.push("Market screen still uses the local catalog copy")
}

const wishlistPage = fs.readFileSync("app/wishlist/page.tsx", "utf8")
const wishlistScreen = fs.readFileSync("components/screens/wishlist-screen.tsx", "utf8")
if (!wishlistPage.includes("fetchCatalogProductsByIds") || !wishlistScreen.includes("enrichWishlist(wishlist, marketSignals, catalogProducts)")) {
  errors.push("Wishlist is not resolved against the canonical catalog")
}
const storeSource = fs.readFileSync("lib/store.tsx", "utf8")
if (storeSource.includes("getProductById") || storeSource.includes("primaryRelease")) {
  errors.push("Client store still resolves wishlist transfers through the local catalog")
}
if (!wishlistScreen.includes("releaseId: canonicalRelease.id")) {
  errors.push("Wishlist transfer does not pass the canonical Release id into Collection")
}
if (!marketScreen.includes("observedMarketPrice(row.signal)") || marketScreen.includes("row.signal.startingItemPriceEUR")) {
  errors.push("Market screen is not using the shared canonical observed-price presentation")
}
if (!marketScreen.includes("collectorMarketTrend(row.signal)") || !dashboardMarket.includes("collectorMarketTrend(row.signal)")) {
  errors.push("Market and dashboard trend surfaces are not aligned to the shared trend guard rails")
}
for (const storefrontToken of ["In vendita da", "Listed from", "Disponibile da", "Available from"]) {
  if (marketBits.includes(storefrontToken) || productDetail.includes(storefrontToken) || collectionScreen.includes(storefrontToken) || wishlistScreen.includes(storefrontToken)) {
    errors.push(`Collector surfaces still expose storefront wording ${JSON.stringify(storefrontToken)}`)
  }
}

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
console.log("Collector UI clearly separates active asking prices from completed-sale references.")
