import type { CollectionItem, User, WishlistItem } from "@/lib/types"
import { getProductById, primaryRelease } from "@/lib/data/products"

// The demo collector. Seeds an immediately-populated experience so the app is
// meaningful the moment it opens, without any sign-up required.
export const DEMO_USER: User = {
  id: "u-demo",
  email: "kenta@mini4wd.demo",
  username: "kenta_racer",
  country: "Germany",
  createdAt: "2024-03-12T10:00:00.000Z",
}

function releaseIdFor(productId: string, releaseId?: string): string {
  if (releaseId) return releaseId
  const product = getProductById(productId)
  return product ? primaryRelease(product).id : `${productId}-r1`
}

interface CollectionSeed {
  productId: string
  releaseId?: string
  condition: CollectionItem["condition"]
  date: string
  price: number
  currency: CollectionItem["acquisitionCurrency"]
  yearOverride?: number
  notes?: string
}

const COLLECTION_SEEDS: CollectionSeed[] = [
  { productId: "p-18626", releaseId: "p-18626-r1", condition: "Built", date: "2024-04-02", price: 11, currency: "EUR", notes: "First build. Runs on the local track." },
  { productId: "p-18626", releaseId: "p-18626-r3", condition: "Sealed", date: "2024-09-18", price: 24, currency: "EUR", notes: "Black Special — keeping this one sealed." },
  { productId: "p-19425", releaseId: "p-19425-r2", condition: "New / Opened", date: "2024-05-21", price: 18, currency: "EUR" },
  { productId: "p-19401", releaseId: "p-19401-r2", condition: "Sealed", date: "2024-06-30", price: 22, currency: "EUR", notes: "Premium reissue, mint." },
  // Two different releases of the SAME model (Dash-1 Emperor): a vintage 1990
  // original AND a 2026 sealed reissue — the core reissue-tracking showcase.
  { productId: "p-18025", releaseId: "p-18025-r1", condition: "Built", date: "2024-07-11", price: 120, currency: "EUR", notes: "The 1990 original. Pride of the shelf." },
  { productId: "p-18025", releaseId: "p-18025-r5", condition: "Sealed", date: "2026-02-01", price: 15, currency: "EUR", yearOverride: 2026, notes: "2026 sealed reissue — keeping it boxed." },
  { productId: "p-19434", releaseId: "p-19434-r2", condition: "New / Opened", date: "2024-08-05", price: 20, currency: "EUR" },
  { productId: "p-18646", releaseId: "p-18646-r1", condition: "Built", date: "2024-04-19", price: 12, currency: "EUR" },
  { productId: "p-18647", condition: "Sealed", date: "2025-01-08", price: 13, currency: "EUR" },
  { productId: "p-19412", releaseId: "p-19412-r1", condition: "Used", date: "2024-10-02", price: 45, currency: "EUR", notes: "Vintage original, some shelf wear." },
  { productId: "p-19413", releaseId: "p-19413-r2", condition: "New / Opened", date: "2024-11-14", price: 16, currency: "EUR" },
  { productId: "p-18716", condition: "Built", date: "2025-02-20", price: 12, currency: "EUR" },
  { productId: "p-18095", condition: "Sealed", date: "2025-03-03", price: 13, currency: "EUR" },
  { productId: "p-19426", releaseId: "p-19426-r2", condition: "New / Opened", date: "2024-12-24", price: 21, currency: "EUR", notes: "Christmas pickup." },
  { productId: "p-18615", releaseId: "p-18615-r2", condition: "Built", date: "2024-04-28", price: 9, currency: "EUR" },
  { productId: "p-18093", condition: "New / Opened", date: "2025-01-30", price: 13, currency: "EUR" },
  { productId: "p-18075", releaseId: "p-18075-r2", condition: "Sealed", date: "2025-02-11", price: 19, currency: "EUR", notes: "Thunder Shot Premium, sealed." },
  { productId: "p-18709", releaseId: "p-18709-r2", condition: "Used", date: "2024-06-06", price: 14, currency: "EUR" },
  { productId: "p-18725", releaseId: "p-18725-r2", condition: "Built", date: "2024-09-01", price: 15, currency: "EUR" },
]

export const DEMO_COLLECTION: CollectionItem[] = COLLECTION_SEEDS.map((s, i) => ({
  id: `c-${i + 1}`,
  userId: DEMO_USER.id,
  productId: s.productId,
  releaseId: releaseIdFor(s.productId, s.releaseId),
  condition: s.condition,
  acquisitionDate: s.date,
  acquisitionPrice: s.price,
  acquisitionCurrency: s.currency,
  releaseYearOverride: s.yearOverride,
  notes: s.notes,
  photos: [],
  createdAt: new Date(s.date).toISOString(),
}))

interface WishlistSeed {
  productId: string
  releaseId?: string
  priority: WishlistItem["priority"]
  target?: number
  notes?: string
}

const WISHLIST_SEEDS: WishlistSeed[] = [
  { productId: "p-18702", priority: "High", target: 90, notes: "Grail. Dash-2 sealed if I ever find one." },
  { productId: "p-18713", releaseId: "p-18713-r1", priority: "High", target: 160, notes: "Great Emperor original to complete the Emperor line." },
  { productId: "p-18710", priority: "Medium", target: 55, notes: "Mk.II vintage." },
  { productId: "p-19430", releaseId: "p-19430-r1", priority: "Medium", target: 30 },
  { productId: "p-18718", priority: "Low", target: 40, notes: "Japan Cup colourway — nice to have." },
  { productId: "p-19601", releaseId: "p-19601-r1", priority: "Medium", target: 60 },
  { productId: "p-18714", releaseId: "p-18714-r2", priority: "Low", target: 28 },
]

export const DEMO_WISHLIST: WishlistItem[] = WISHLIST_SEEDS.map((s, i) => ({
  id: `w-${i + 1}`,
  userId: DEMO_USER.id,
  productId: s.productId,
  releaseId: s.releaseId,
  priority: s.priority,
  targetPrice: s.target,
  currency: "EUR",
  notes: s.notes,
  createdAt: new Date(2025, 0, i + 1).toISOString(),
}))
