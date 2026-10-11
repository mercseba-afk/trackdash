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
const releaseScreen = fs.readFileSync("components/screens/release-detail-screen.tsx", "utf8")
if (releasePage.includes("getPublicMarketSignalForRelease")) {
  errors.push("Release page is loading a separate market snapshot instead of the shared provider")
}
if (!releaseScreen.includes("useReleaseMarketSignal(release.id)")) {
  errors.push("Release detail is not using the same shared market signal map as the rest of the app")
}

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
if (!marketInline.includes("showBothReferences") || !marketInline.includes("Vendite concluse") || !marketInline.includes("Prezzo richiesto")) {
  errors.push("Compact market UI does not support distinct SOLD + ASK references for Release previews")
}
if (!marketInline.includes("hasValue && !(showBothReferences && (hasSold || hasAsk))")) {
  errors.push("Release previews must prefer SOLD and ASK rather than duplicated estimates")
}
if (!marketInline.includes("const askPrice = observedMarketReferencePrice(signal)") ||
    !marketInline.includes("const hasSold = soldPrice != null && soldPrice > 0")) {
  errors.push("Release previews must show verified SOLD independently of fresh TTL-valid ASK")
}
if (marketInline.includes("?? signal.retailAnchorEUR") ||
    marketInline.includes("?? signal.activeAnchorEUR")) {
  errors.push("Release preview may not mislabel a stale stored retail/ASK anchor as a current asking price")
}
if (!productDetailScreen.includes("showBothReferences")) {
  errors.push("Release family rows are not enabling the dual SOLD + ASK preview")
}
if ((productDetailScreen.match(/showBothReferences/g) ?? []).length !== 1) {
  errors.push("Dual SOLD + ASK preview must stay scoped to Release family rows instead of leaking into other compact surfaces")
}

if (!productDetailScreen.includes("compactPreview />")) {
  errors.push("Release family rows are not using the global compact preview standard")
}
if (productDetailScreen.includes("compactPilot") || productDetailScreen.includes("d3b4ad34-05ac-592e-ad93-fab4cfde0a5a")) {
  errors.push("Compact Release preview is still scoped to a single family instead of being global")
}
if (!marketOverview.includes("Valore stimato")) {
  errors.push("Shared market overview lost its rare estimated-value-only fallback")
}
if (!marketOverview.includes("observedMarketReferencePrice") || !marketOverview.includes("soldAnchorEUR")) {
  errors.push("Shared market overview does not expose ASK and completed-sale references separately")
}
if (!marketOverview.includes(") : hasValue ? (")) {
  errors.push("Release detail must not show a duplicate Market Value beside SOLD or current ASK")
}
if (!marketOverview.includes("Prezzo richiesto osservato") || !marketOverview.includes("Vendite concluse")) {
  errors.push("Release detail must keep the two primary collector-facing price labels")
}
if (marketOverview.includes("TrendIndicator") || marketOverview.includes("askTrendPercent")) {
  errors.push("Release price card must not show distracting numeric trend values beside SOLD and ASK")
}
// Regression of the live Dyna 95467 incident: expired observed ASK must
// not disappear, but it must never masquerade as a purchasable current offer.
const publicProjection = fs.readFileSync("lib/market/public.ts", "utf8")
if (!publicProjection.includes("historicalAskItemEUR: histItem") ||
    !publicProjection.includes("historicalAskObservedAt: historicalOffer") ||
    !publicProjection.includes("nowMs - checkedMs <= 180 * DAY_MS") ||
    !publicProjection.includes("observedOffer ? null : [...observedOffers]")) {
  errors.push("Dated historical ASK must survive active offer TTL separately, with a strict 180-day evidence horizon")
}
if (!marketOverview.includes("Prezzi del solo kit · spedizione esclusa.") ||
    !marketOverview.includes("Disponibilità da verificare") ||
    !marketOverview.includes("historicalAskShippingEUR") ||
    marketOverview.includes("bg-amber-50") ||
    marketOverview.includes("bg-emerald-50")) {
  errors.push("Release overview must be one neutral two-row kit-only display, with historic offer date and separate shipping")
}
const datedCollectionAnalytics = fs.readFileSync("lib/analytics.ts", "utf8")
if (!datedCollectionAnalytics.includes("observedMarketReferencePrice(marketSignal)") ||
    !datedCollectionAnalytics.includes("marketValue ?? observedPrice")) {
  errors.push("Indicative sealed Collection must include dated kit-only ASK reference where MV is absent")
}
if (!analyticsSource.includes("observedMarketKnownPurchaseCost(marketSignal)")) {
  errors.push("Wishlist purchase target must keep using fresh, verified item+shipping cost")
}
const priceBasis = fs.readFileSync("lib/market/presentation.ts", "utf8")
if (!priceBasis.includes("return signal?.startingItemPriceEUR ?? null") ||
    !priceBasis.includes("startingCostBasis !== \"delivered\"") ||
    !priceBasis.includes("observedMarketKnownPurchaseCost")) {
  errors.push("Public market must compare kit-only headline prices and keep known shipping separate")
}
const wishlistAnalytics = fs.readFileSync("lib/analytics.ts", "utf8")
if (!wishlistAnalytics.includes("observedMarketKnownPurchaseCost(marketSignal)") ||
    !wishlistAnalytics.includes("askingItemPrice")) {
  errors.push("Wishlist target must fail closed for unknown delivery quote while keeping kit-only ASK visible")
}
const wishlist = fs.readFileSync("components/screens/wishlist-screen.tsx", "utf8")
if (!wishlist.includes("Spedizione da verificare") ||
    !wishlist.includes("Kit + spedizione indicata")) {
  errors.push("Wishlist must distinguish asking price of kit from known item+shipping quote")
}
const marketPresentation = fs.readFileSync("lib/market/presentation.ts", "utf8")
for (const requiredSellerAskCopy of [
  "Prezzo richiesto · solo kit",
  "Asking price · kit only",
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
if (!analyticsSource.includes('return condition === "Sealed"')) {
  errors.push("Collection copy valuation is not restricted to Sealed copies")
}
if (analyticsSource.includes('condition === "New / Opened"')) {
  errors.push("New / Opened copies are still being valued with the new/unbuilt Release benchmark")
}
const publicHome = fs.readFileSync("components/screens/public-home-screen.tsx", "utf8")
if (!publicHome.includes("collectorMarketTrend(signal)") || !publicHome.includes("trend != null && trend < 0")) {
  errors.push("Homepage editorial market examples are not excluding negative canonical collector trends")
}
if (!publicHome.includes("release.images?.length") || !publicHome.includes("signal.valueEUR == null || signal.valueEUR <= 0")) {
  errors.push("Homepage editorial market examples are not restricted to complete Releases with exact images and publishable Market Value")
}
if (!publicHome.includes("hasMeaningfulActivity") || !publicHome.includes("signal.soldUnits") || !publicHome.includes("signal.currentOfferCount")) {
  errors.push("Homepage editorial market examples are not requiring meaningful market activity")
}
if (!analyticsSource.includes("observedMarketPrice(marketSignal)")) {
  errors.push("Collection analytics duplicates ASK price-selection logic instead of using the shared presentation helper")
}
if (analyticsSource.includes("observedMarketDisplayPrice")) {
  errors.push("Display-only SOLD fallback leaked into portfolio or wishlist valuation logic")
}
if (!marketOverview.includes("observedMarketReferenceIsHistorical") || !marketOverview.includes("soldUnits")) {
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
if (!collectionScreen.includes("summary.marketReferenceValue") || !collectionScreen.includes("summary.marketReferenceCount")) {
  errors.push("Collection headline total must clearly distinguish Market Value from dated observed kit-only ASK references")
}
if (!analyticsSource.includes("marketValue ?? observedPrice")) {
  errors.push("Collection market reference no longer prefers canonical Market Value before dated observed kit-only ASK")
}
if (!analyticsSource.includes("marketValue != null") || !analyticsSource.includes("personalGainEUR")) {
  errors.push("Personal Collection performance is no longer restricted to canonical Market Value")
}
if (!collectionScreen.includes("Valore della copia non stimato")) {
  errors.push("Collection does not explain that non-sealed physical copies are not automatically valued")
}
if (!collectionScreen.includes("Mercato osservato · sigillato") || !collectionScreen.includes("Riferimenti storici disponibili")) {
  errors.push("Collection does not distinguish historical market context from missing data")
}

const publicMarket = fs.readFileSync("lib/market/public.ts", "utf8")
if (publicMarket.includes("unstable_cache") || publicMarket.includes("listCachedPublicMarketBundle")) {
  errors.push("Public market map can drift behind exact Release data because it still has an independent snapshot cache")
}
if (!publicMarket.includes("marketContextEvidenceCount") || !publicMarket.includes("listSafeMarketContextEvidence")) {
  errors.push("Public market service is not carrying safe historical context evidence through the trusted server boundary")
}
// A fresh offer can still be Japan-only or a legacy row. Never bypass the
// Europe-first canonical source selection to fabricate a public "from" price.
if (!publicMarket.includes("if (!startingCandidateId) return null") ||
    !publicMarket.includes("fresh.find((row) => row.candidateId === startingCandidateId) ?? null") ||
    publicMarket.includes("return fresh.sort((a, b) =>")) {
  errors.push("Public ASK may not fallback to an arbitrary fresh (possibly extra-EU) offer")
}
if (
  !publicMarket.includes("const startingItemPriceEUR = numberOrNull(observedOffer?.itemPriceEUR)") ||
  !publicMarket.includes("const startingEffectiveCostEUR = numberOrNull(observedOffer?.effectiveCostEUR)")
) {
  errors.push("Public market service is not deriving current starting prices from a TTL-valid observed offer")
}
if (
  !publicMarket.includes("const retailAnchorEUR = freshRetailOffers.length > 0 ? rawRetailAnchorEUR : null") ||
  !publicMarket.includes("const activeAnchorEUR = freshMarketplaceOffers.length > 0 ? rawActiveAnchorEUR : null")
) {
  errors.push("Public market service can expose a current-offer anchor after its supporting channel has no fresh offers")
}

if (!marketPresentation.includes("return signal?.startingItemPriceEUR ?? null") ||
    !marketPresentation.includes("observedMarketKnownPurchaseCost") ||
    !marketPresentation.includes('startingCostBasis !== "delivered"')) {
  errors.push("Shared presentation must use kit-only ASK and separate any known item+shipping quote")
}
if (
  marketPresentation.includes("?? signal?.activeAnchorEUR") ||
  marketPresentation.includes("?? signal?.retailAnchorEUR")
) {
  errors.push("Shared market presentation still falls back to potentially expired materialized current-offer anchors")
}

const marketQueries = fs.readFileSync("lib/db/queries/market.ts", "utf8")
if (
  !marketQueries.includes("MARKETPLACE_OFFER_MAX_AGE_HOURS") ||
  !marketQueries.includes("RETAIL_OFFER_MAX_AGE_HOURS") ||
  !marketQueries.includes("marketOfferStates.lastCheckedAt")
) {
  errors.push("Catalog starting-price query is not enforcing canonical current-offer TTLs")
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
if (!dashboardMarket.includes("isEditoriallyPositive")) {
  errors.push("Dashboard market highlights are not excluding negative trends from curated examples")
}
if (!dashboardScreen.includes("entry.observedPrice") || !dashboardScreen.includes("observedMarketDisplayLabel(entry.marketSignal, it)")) {
  errors.push("Dashboard recent additions are not using the condition-aware Collection market reference")
}
if (!dashboardScreen.includes("observedMarketDisplayKind(entry.marketSignal)") || !collectionScreen.includes("observedMarketDisplayKind(signal)")) {
  errors.push("ASK/SOLD approximation semantics are not shared across Dashboard and Collection")
}
if (dashboardMarket.includes("askTrendWindowDays")) {
  errors.push("Dashboard collector trend can be mislabeled with an ASK trend day window")
}
if (!dashboardMarket.includes("observedMarketDisplayPrice(row.signal)") || !dashboardMarket.includes("observedMarketDisplayLabel(row.signal, it)") || !dashboardMarket.includes("observedMarketDisplayKind(row.signal)")) {
  errors.push("Dashboard market highlights are not using the shared ASK/SOLD display fallback")
}
if (!dashboardMarket.includes("const gainers") || !dashboardMarket.includes("collectorMarketTrend(row.signal) ?? 0) > 0")) {
  errors.push("Dashboard growth highlight is not restricted to positive collector trends")
}
if (dashboardMarket.includes("Valore di mercato stimato") || dashboardMarket.includes("Movers")) {
  errors.push("Dashboard market highlights still expose legacy or technical copy")
}
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
// Collection preview: the collectible market movement matters more than
// tiny personal profit deltas. Copy paid amount stays discreet and the
// underlying canonical market trend is never recomputed here.
const compactCollection = collectionScreen.split("function CollectionMarketValue(")[1]?.split("function EditDialog(")[0] ?? ""
if (!compactCollection.includes("soldTrendComparison") ||
    !compactCollection.includes("previousAverageEUR") ||
    !compactCollection.includes("recentAverageEUR") ||
    !compactCollection.includes("<TrendIndicator value={trendPercent}")) {
  errors.push("Collection trend must disclose the exact compared SOLD averages, never an unexplained percent")
}
if (compactCollection.includes("personalGainEUR") ||
    compactCollection.includes("observedDirection") ||
    compactCollection.includes("hasReliableObservedPriceTrend")) {
  errors.push("Collection card still shows distracting purchase profit or ASK trend")
}
if (collectionScreen.includes('it ? "Pagato" : "Paid"') ||
    compactCollection.includes("acquisitionPrice") ||
    compactCollection.includes("personalGainEUR")) {
  errors.push("Collection cards must not invite confusion between a personal purchase and historical SOLD performance")
}
const publicMarketProjection = fs.readFileSync("lib/market/public.ts", "utf8")
if (!publicMarketProjection.includes("publishedSoldTrendComparison(") ||
    !publicMarketProjection.includes("listCollectorTrendAuditRows(") ||
    !publicMarketProjection.includes("soldTrendComparison,")) {
  errors.push("Public market projection must expose only provenance-validated SOLD comparison windows")
}

// Notification bell: unread only, and reading the matching conversation
// acknowledges offer alerts even when Messages is opened directly.
const notificationsAction = fs.readFileSync("lib/actions/notifications.ts", "utf8")
const center = fs.readFileSync("components/notification-center.tsx", "utf8")
const messagingAction = fs.readFileSync("lib/actions/messaging.ts", "utf8")
const unreadFetch = notificationsAction.split("export async function getNotificationsAction")[1]?.split("export async function getUnreadNotificationCountAction")[0] ?? ""
if (!unreadFetch.includes('.eq("user_id", user.id)') ||
    !unreadFetch.includes('.is("read_at", null)')) {
  errors.push("Notification bell is still loading already read alerts or other users' notifications")
}
if (center.includes("CatalogExpansionRow") ||
    center.includes("getCatalogExpansionNoticeAction") ||
    !center.includes("setRows((current) => current.filter((row) => row.id !== notification.id))") ||
    !center.includes('window.addEventListener("trackdash:messaging-read", onFocus)')) {
  errors.push("Notification bell must dismiss read alerts, avoid permanent pinned notices and sync conversation reads")
}
if (!messagingAction.includes("update public.notifications") ||
    !messagingAction.includes("and read_at is null") ||
    !messagingAction.includes("where user_id =") ||
    !messagingAction.includes("href =")) {
  errors.push("Opening the conversation directly must acknowledge matching collector notifications")
}

const storeSource = fs.readFileSync("lib/store.tsx", "utf8")
if (storeSource.includes("getProductById") || storeSource.includes("primaryRelease")) {
  errors.push("Client store still resolves wishlist transfers through the local catalog")
}
if (!wishlistScreen.includes("releaseId: canonicalRelease.id")) {
  errors.push("Wishlist transfer does not pass the canonical Release id into Collection")
}
if (!marketScreen.includes("observedMarketDisplayPrice(row.signal)") || !marketScreen.includes("observedMarketDisplayLabel(row.signal, it)") || marketScreen.includes("row.signal.startingItemPriceEUR")) {
  errors.push("Market screen is not using the shared canonical display-price presentation")
}
if (!marketScreen.includes("observedMarketDisplayKind(row.signal)")) {
  errors.push("Market screen does not share ASK/SOLD approximation semantics")
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
