import type { CollectionItem, User, WishlistItem } from "@/lib/types"

// The demo collector. Seeds an immediately-populated experience so the app is
// meaningful the moment it opens, without any sign-up required.
export const DEMO_USER: User = {
  id: "u-demo",
  email: "kenta@mini4wd.demo",
  username: "kenta_racer",
  country: "Germany",
  createdAt: "2024-03-12T10:00:00.000Z",
}

interface CollectionSeed {
  productId: string
  variantId?: string
  condition: CollectionItem["condition"]
  date: string
  price: number
  currency: CollectionItem["acquisitionCurrency"]
  notes?: string
}

const COLLECTION_SEEDS: CollectionSeed[] = [
  { productId: "p-18626", variantId: "p-18626-v1", condition: "Built", date: "2024-04-02", price: 11, currency: "EUR", notes: "First build. Runs on the local track." },
  { productId: "p-18626", variantId: "p-18626-v3", condition: "Sealed", date: "2024-09-18", price: 24, currency: "EUR", notes: "Black Special — keeping this one sealed." },
  { productId: "p-19425", variantId: "p-19425-v2", condition: "New / Opened", date: "2024-05-21", price: 18, currency: "EUR" },
  { productId: "p-19401", variantId: "p-19401-v2", condition: "Sealed", date: "2024-06-30", price: 22, currency: "EUR", notes: "Premium reissue, mint." },
  { productId: "p-18712", variantId: "p-18712-v2", condition: "Built", date: "2024-07-11", price: 26, currency: "EUR", notes: "The Emperor. Pride of the shelf." },
  { productId: "p-19434", variantId: "p-19434-v2", condition: "New / Opened", date: "2024-08-05", price: 20, currency: "EUR" },
  { productId: "p-18646", condition: "Built", date: "2024-04-19", price: 12, currency: "EUR" },
  { productId: "p-18647", condition: "Sealed", date: "2025-01-08", price: 13, currency: "EUR" },
  { productId: "p-19412", condition: "Used", date: "2024-10-02", price: 15, currency: "EUR", notes: "Vintage feel, some shelf wear." },
  { productId: "p-19413", condition: "New / Opened", date: "2024-11-14", price: 16, currency: "EUR" },
  { productId: "p-18716", condition: "Built", date: "2025-02-20", price: 12, currency: "EUR" },
  { productId: "p-18095", condition: "Sealed", date: "2025-03-03", price: 13, currency: "EUR" },
  { productId: "p-19426", condition: "New / Opened", date: "2024-12-24", price: 21, currency: "EUR", notes: "Christmas pickup." },
  { productId: "p-18615", condition: "Built", date: "2024-04-28", price: 9, currency: "EUR" },
  { productId: "p-18093", condition: "New / Opened", date: "2025-01-30", price: 13, currency: "EUR" },
  { productId: "p-95575", variantId: "p-95575-v2", condition: "Sealed", date: "2025-02-11", price: 19, currency: "EUR", notes: "Thunder Shot Premium, sealed." },
  { productId: "p-18709", variantId: "p-18709-v2", condition: "Used", date: "2024-06-06", price: 14, currency: "EUR" },
  { productId: "p-18725", condition: "Built", date: "2024-09-01", price: 15, currency: "EUR" },
]

export const DEMO_COLLECTION: CollectionItem[] = COLLECTION_SEEDS.map((s, i) => ({
  id: `c-${i + 1}`,
  userId: DEMO_USER.id,
  productId: s.productId,
  variantId: s.variantId,
  condition: s.condition,
  acquisitionDate: s.date,
  acquisitionPrice: s.price,
  acquisitionCurrency: s.currency,
  notes: s.notes,
  photos: [],
  createdAt: new Date(s.date).toISOString(),
}))

interface WishlistSeed {
  productId: string
  variantId?: string
  priority: WishlistItem["priority"]
  target?: number
  notes?: string
}

const WISHLIST_SEEDS: WishlistSeed[] = [
  { productId: "p-18702", priority: "High", target: 90, notes: "Grail. Dash-2 sealed if I ever find one." },
  { productId: "p-18713", priority: "High", target: 60, notes: "Great Emperor to complete the Emperor line." },
  { productId: "p-18710", priority: "Medium", target: 55, notes: "Mk.II vintage." },
  { productId: "p-19430", variantId: "p-19430-v1", priority: "Medium", target: 30 },
  { productId: "p-18718", priority: "Low", target: 40, notes: "Japan Cup colourway — nice to have." },
  { productId: "p-19601", priority: "Medium", target: 32 },
  { productId: "p-18714", variantId: "p-18714-v2", priority: "Low", target: 28 },
]

export const DEMO_WISHLIST: WishlistItem[] = WISHLIST_SEEDS.map((s, i) => ({
  id: `w-${i + 1}`,
  userId: DEMO_USER.id,
  productId: s.productId,
  variantId: s.variantId,
  priority: s.priority,
  targetPrice: s.target,
  currency: "EUR",
  notes: s.notes,
  createdAt: new Date(2025, 0, i + 1).toISOString(),
}))
