import type { Product, ProductVariant, VariantType } from "@/lib/types"

// -----------------------------------------------------------------------------
// DEMO CATALOG
// A curated set of real, recognizable Tamiya Mini 4WD models. Item numbers and
// details reflect real releases as closely as possible for a prototype seed.
// This is NOT a complete database — the production catalog will be expanded
// before launch. Market values shown in the app are clearly labelled demo data.
// -----------------------------------------------------------------------------

const JAN_PREFIX = "4950344"

// deterministic pseudo-JAN so every product has a stable, realistic-looking code
function jan(seed: number): string {
  const body = String(seed).padStart(5, "0")
  const base = JAN_PREFIX + body // 12 digits
  let sum = 0
  for (let i = 0; i < 12; i++) {
    const d = Number(base[i])
    sum += i % 2 === 0 ? d : d * 3
  }
  const check = (10 - (sum % 10)) % 10
  return base + String(check)
}

interface Seed {
  item: string
  code: string
  name: string
  jp?: string
  series: Product["series"]
  chassis: Product["chassis"]
  year: number
  discontinued?: boolean
  reissue?: boolean
  limited?: Product["limitedEditionType"]
  rarity: Product["rarity"]
  msrpJPY: number
  desc: string
  variants?: Array<{
    type: VariantType
    name: string
    year?: number
    original?: boolean
    notes?: string
  }>
}

const SEEDS: Seed[] = [
  {
    item: "18626",
    code: "95655",
    name: "Aero Avante",
    jp: "エアロ アバンテ",
    series: "Racing Mini 4WD",
    chassis: "MA",
    year: 2012,
    rarity: "Common",
    msrpJPY: 1100,
    desc: "The flagship of the double-shaft MA chassis era. A low, wedge-shaped aero body that became the face of modern Mini 4WD racing.",
    variants: [
      { type: "Original", name: "Aero Avante", year: 2012, original: true },
      { type: "Clear Body", name: "Aero Avante Clear Body (Polycarbonate)", year: 2013, notes: "Lightweight polycarbonate special." },
      { type: "Special Color", name: "Aero Avante Black Special", year: 2014 },
    ],
  },
  {
    item: "18646",
    code: "95612",
    name: "Raikiri",
    jp: "雷牙",
    series: "Racing Mini 4WD",
    chassis: "AR",
    year: 2014,
    rarity: "Common",
    msrpJPY: 1100,
    desc: "Aggressive twin-blade styling on the rigid AR chassis. A staple of the modern competitive scene.",
    variants: [
      { type: "Original", name: "Raikiri", year: 2014, original: true },
      { type: "Special Color", name: "Raikiri Black Special", year: 2016 },
    ],
  },
  {
    item: "18647",
    code: "95482",
    name: "DCR-01",
    series: "Racing Mini 4WD",
    chassis: "MA",
    year: 2018,
    rarity: "Common",
    msrpJPY: 1100,
    desc: "Dual Ridge cowl developed with real aerodynamic testing. Successor lineage to the Avante family.",
  },
  {
    item: "18093",
    code: "95361",
    name: "Geo Glider",
    series: "Racing Mini 4WD",
    chassis: "FM-A",
    year: 2019,
    rarity: "Uncommon",
    msrpJPY: 1100,
    desc: "Front-motor FM-A chassis machine with a smooth gliding profile tuned for stability on technical sections.",
  },
  {
    item: "18095",
    code: "95474",
    name: "Shadow Shark",
    series: "Racing Mini 4WD",
    chassis: "VZ",
    year: 2020,
    rarity: "Uncommon",
    msrpJPY: 1100,
    desc: "Sharp predatory silhouette debuting on the lightweight, responsive VZ chassis.",
  },
  {
    item: "18641",
    code: "95271",
    name: "Festa Jaune",
    series: "Racing Mini 4WD",
    chassis: "AR",
    year: 2013,
    rarity: "Uncommon",
    msrpJPY: 1100,
    desc: "Bright competition body on the AR chassis, popular for its clean lines and rigidity.",
  },
  {
    item: "19434",
    code: "95084",
    name: "Neo-Tridagger ZMC",
    jp: "ネオトライダガー ZMC",
    series: "Super Mini 4WD",
    chassis: "Super II",
    year: 2004,
    reissue: true,
    rarity: "Rare",
    msrpJPY: 1000,
    desc: "The ZMC 'Zero Material Carbon' hero machine. A fan favourite reissued for the modern Super II chassis.",
    variants: [
      { type: "Original", name: "Neo-Tridagger ZMC", year: 2004, original: true },
      { type: "Premium Reissue", name: "Neo-Tridagger ZMC (Premium)", year: 2016 },
    ],
  },
  // ---- Fully Cowled / Let's & Go ----
  {
    item: "19401",
    code: "95001",
    name: "Magnum Saber",
    jp: "マグナムセイバー",
    series: "Fully Cowled",
    chassis: "Super 1",
    year: 1994,
    reissue: true,
    rarity: "Rare",
    msrpJPY: 1000,
    desc: "Go Seiba's first machine and the icon that launched the Fully Cowled boom of the 90s.",
    variants: [
      { type: "Original", name: "Magnum Saber", year: 1994, original: true },
      { type: "Premium Reissue", name: "Magnum Saber Premium", year: 2012 },
    ],
  },
  {
    item: "19402",
    code: "95002",
    name: "Sonic Saber",
    jp: "ソニックセイバー",
    series: "Fully Cowled",
    chassis: "Super 1",
    year: 1994,
    reissue: true,
    rarity: "Rare",
    msrpJPY: 1000,
    desc: "Retsu Seiba's counterpart to the Magnum. Sleek blue styling built for cornering.",
  },
  {
    item: "19404",
    code: "95004",
    name: "Victory Magnum",
    jp: "ビクトリーマグナム",
    series: "Fully Cowled",
    chassis: "Super 1",
    year: 1995,
    reissue: true,
    rarity: "Uncommon",
    msrpJPY: 1000,
    desc: "The Magnum's evolution with a more aggressive cowl. A defining silhouette of the series.",
  },
  {
    item: "19425",
    code: "95025",
    name: "Cyclone Magnum",
    jp: "サイクロンマグナム",
    series: "Fully Cowled",
    chassis: "Super TZ",
    year: 1996,
    reissue: true,
    rarity: "Uncommon",
    msrpJPY: 1000,
    desc: "Twin-intake cowl on the high-rigidity Super TZ chassis. One of the most beloved Magnum forms.",
    variants: [
      { type: "Original", name: "Cyclone Magnum", year: 1996, original: true },
      { type: "Premium Reissue", name: "Cyclone Magnum Premium", year: 2013 },
    ],
  },
  {
    item: "19426",
    code: "95026",
    name: "Beat Magnum",
    jp: "ビートマグナム",
    series: "Fully Cowled",
    chassis: "Super TZ",
    year: 1997,
    reissue: true,
    rarity: "Rare",
    msrpJPY: 1000,
    desc: "The final Magnum of the original manga arc. Iconic red-and-white split cowl.",
  },
  {
    item: "19424",
    code: "95024",
    name: "Hurricane Sonic",
    jp: "ハリケーンソニック",
    series: "Fully Cowled",
    chassis: "Super TZ",
    year: 1996,
    reissue: true,
    rarity: "Uncommon",
    msrpJPY: 1000,
    desc: "Sonic lineage's high-speed form with sweeping intakes on the Super TZ chassis.",
  },
  {
    item: "19430",
    code: "95030",
    name: "Buster Sonic",
    jp: "バスターソニック",
    series: "Fully Cowled",
    chassis: "Super TZ",
    year: 1997,
    reissue: true,
    rarity: "Rare",
    msrpJPY: 1000,
    desc: "The last Sonic of the arc, paired with the Beat Magnum in the series finale.",
  },
  // ---- Avante family ----
  {
    item: "18709",
    code: "95109",
    name: "Avante",
    jp: "アバンテ",
    series: "Avante",
    chassis: "Super II",
    year: 2011,
    reissue: true,
    rarity: "Uncommon",
    msrpJPY: 1000,
    desc: "The original wedge that started the Avante dynasty, reissued for the Super II chassis.",
    variants: [
      { type: "Original", name: "Avante Jr.", year: 1988, original: true },
      { type: "Premium Reissue", name: "Avante (Premium)", year: 2011 },
    ],
  },
  {
    item: "18710",
    code: "95110",
    name: "Avante Mk.II",
    jp: "アバンテ Mk.II",
    series: "Avante",
    chassis: "Zero",
    year: 1990,
    discontinued: true,
    rarity: "Very Rare",
    msrpJPY: 700,
    desc: "The Zero-chassis evolution of the Avante. A vintage grail for serious collectors.",
  },
  {
    item: "18716",
    code: "95116",
    name: "Super Avante",
    jp: "スーパーアバンテ",
    series: "Avante",
    chassis: "VZ",
    year: 2020,
    rarity: "Common",
    msrpJPY: 1100,
    desc: "A modern reinterpretation of the Avante line on the lightweight VZ chassis.",
  },
  {
    item: "18725",
    code: "95125",
    name: "Vanguard Sonic",
    jp: "バンガードソニック",
    series: "Let's & Go",
    chassis: "Super II",
    year: 2013,
    reissue: true,
    rarity: "Uncommon",
    msrpJPY: 1000,
    desc: "MAX GP hero machine reissued on Super II. Smooth, purposeful racing body.",
  },
  // ---- Dash! Yonkuro / Emperor line ----
  {
    item: "18712",
    code: "95112",
    name: "Dash-1 Emperor",
    jp: "ダッシュ1号・皇帝",
    series: "Dash! Yonkuro",
    chassis: "Super II",
    year: 2013,
    reissue: true,
    rarity: "Rare",
    msrpJPY: 1000,
    desc: "The legendary Emperor. Star machine of the Dash! Yonkuro manga and a cornerstone of any vintage-minded collection.",
    variants: [
      { type: "Original", name: "Dash-1 Emperor (Type 1)", year: 1988, original: true, notes: "Original Type 1 chassis release." },
      { type: "Premium Reissue", name: "Dash-1 Emperor Premium", year: 2013 },
      { type: "Special Color", name: "Dash-1 Emperor Premium Black Special", year: 2015 },
      { type: "Anniversary Edition", name: "Dash-1 Emperor 30th Anniversary", year: 2018 },
    ],
  },
  {
    item: "18713",
    code: "95113",
    name: "Great Emperor",
    jp: "グレート・エンペラー",
    series: "Dash! Yonkuro",
    chassis: "Super II",
    year: 2015,
    reissue: true,
    rarity: "Very Rare",
    msrpJPY: 1000,
    desc: "The upgraded Emperor with a more aggressive cowl. Highly sought after in original form.",
  },
  {
    item: "18714",
    code: "95114",
    name: "Proto Emperor ZX",
    jp: "プロトエンペラー ZX",
    series: "Dash! Yonkuro",
    chassis: "Super II",
    year: 2016,
    reissue: true,
    rarity: "Rare",
    msrpJPY: 1000,
    desc: "The prototype Emperor, a fan-favourite variant of the Emperor bloodline.",
    variants: [
      { type: "Original", name: "Proto Emperor ZX", year: 2016, original: true },
      { type: "Special Color", name: "Proto Emperor Premium Black Special", year: 2019 },
    ],
  },
  {
    item: "18702",
    code: "95102",
    name: "Dash-2 Burning Sun",
    jp: "ダッシュ2号・大鷲",
    series: "Dash! Yonkuro",
    chassis: "Type 1",
    year: 1989,
    discontinued: true,
    rarity: "Grail",
    msrpJPY: 600,
    desc: "Vintage Type 1 rival machine from the Dash! Yonkuro era. Extremely collectible in sealed condition.",
  },
  {
    item: "18703",
    code: "95103",
    name: "Dash-3 Shooting Star",
    jp: "ダッシュ3号・流星",
    series: "Dash! Yonkuro",
    chassis: "Type 3",
    year: 1989,
    discontinued: true,
    rarity: "Very Rare",
    msrpJPY: 600,
    desc: "The high-speed Shooting Star on the Type 3 chassis. A classic of the first Mini 4WD boom.",
  },
  {
    item: "18704",
    code: "95104",
    name: "Dash-4 Cannon Ball",
    jp: "ダッシュ4号・大砲",
    series: "Dash! Yonkuro",
    chassis: "Type 3",
    year: 1990,
    discontinued: true,
    rarity: "Very Rare",
    msrpJPY: 600,
    desc: "Heavy-hitting Cannon Ball, rounding out the Dash brothers lineup.",
  },
  // ---- Super Mini 4WD classics ----
  {
    item: "19412",
    code: "95212",
    name: "Astute",
    jp: "アスチュート",
    series: "Super Mini 4WD",
    chassis: "Super 1",
    year: 1992,
    reissue: true,
    rarity: "Uncommon",
    msrpJPY: 900,
    desc: "Sharp-nosed Super Mini 4WD icon, a competitive favourite of the early 90s.",
  },
  {
    item: "19413",
    code: "95213",
    name: "Manta Ray",
    jp: "マンタレイ",
    series: "Super Mini 4WD",
    chassis: "Super 1",
    year: 1991,
    reissue: true,
    rarity: "Uncommon",
    msrpJPY: 900,
    desc: "Wide, low manta-inspired body. One of the most recognisable Super Mini 4WD machines.",
  },
  {
    item: "19414",
    code: "95214",
    name: "Fire Dragon",
    jp: "ファイヤードラゴン",
    series: "Super Mini 4WD",
    chassis: "Super 1",
    year: 1992,
    reissue: true,
    rarity: "Uncommon",
    msrpJPY: 900,
    desc: "Dragon-themed Super Mini 4WD from the classic Dragon series.",
  },
  {
    item: "19415",
    code: "95215",
    name: "Dash-01 Horizon",
    series: "Super Mini 4WD",
    chassis: "Super II",
    year: 2017,
    reissue: true,
    rarity: "Rare",
    msrpJPY: 1000,
    desc: "Wing-heavy competition body reissued for the modern Super II chassis.",
  },
  {
    item: "19601",
    code: "95601",
    name: "Dyna-Hawk GX",
    jp: "ダイナホーク GX",
    series: "Let's & Go",
    chassis: "Super TZ",
    year: 1998,
    reissue: true,
    rarity: "Rare",
    msrpJPY: 1000,
    desc: "MAX GP machine with a distinctive hawk canopy. A late-90s standout.",
  },
  {
    item: "18615",
    code: "95415",
    name: "Mad Bull",
    jp: "マッドブル",
    series: "Racing Mini 4WD",
    chassis: "Super II",
    year: 2013,
    reissue: true,
    rarity: "Common",
    msrpJPY: 900,
    desc: "Bull-nosed off-road styling, a friendly entry point on the Super II chassis.",
  },
  {
    item: "18660",
    code: "95460",
    name: "Trigale",
    series: "Racing Mini 4WD",
    chassis: "AR",
    year: 2015,
    rarity: "Uncommon",
    msrpJPY: 1100,
    desc: "Angular AR-chassis competition machine with a purposeful stance.",
  },
  {
    item: "18091",
    code: "95491",
    name: "Sword Flash",
    series: "Racing Mini 4WD",
    chassis: "VZ",
    year: 2020,
    rarity: "Common",
    msrpJPY: 1100,
    desc: "Blade-like VZ chassis body tuned for light, nimble handling.",
  },
  {
    item: "18092",
    code: "95492",
    name: "Copperfang",
    series: "Racing Mini 4WD",
    chassis: "FM-A",
    year: 2019,
    rarity: "Uncommon",
    msrpJPY: 1100,
    desc: "Front-motor FM-A machine with a low, fang-shaped nose for downforce.",
  },
  {
    item: "95575",
    code: "95575",
    name: "Thunder Shot",
    jp: "サンダーショット",
    series: "Super Mini 4WD",
    chassis: "Type 3",
    year: 1988,
    discontinued: true,
    reissue: true,
    rarity: "Rare",
    msrpJPY: 700,
    desc: "First-boom classic with a bold canopy. Reissued periodically as a nostalgia piece.",
    variants: [
      { type: "Original", name: "Thunder Shot (Type 3)", year: 1988, original: true },
      { type: "Premium Reissue", name: "Thunder Shot Premium", year: 2015 },
    ],
  },
  {
    item: "18717",
    code: "95117",
    name: "Emperor (Premium Black Special)",
    series: "Dash! Yonkuro",
    chassis: "AR",
    year: 2017,
    reissue: true,
    limited: "Special Color",
    rarity: "Very Rare",
    msrpJPY: 1200,
    desc: "Blacked-out AR-chassis Emperor special. A limited run prized by Emperor collectors.",
  },
  {
    item: "18718",
    code: "95118",
    name: "Aero Avante Japan Cup 2013",
    series: "Racing Mini 4WD",
    chassis: "MA",
    year: 2013,
    limited: "Japan Cup",
    rarity: "Very Rare",
    msrpJPY: 1200,
    desc: "Japan Cup commemorative colourway of the Aero Avante. Event-limited and hard to find.",
  },
]

function buildVariants(productId: string, seed: Seed): ProductVariant[] {
  if (!seed.variants || seed.variants.length === 0) {
    return [
      {
        id: `${productId}-v1`,
        productId,
        variantType: seed.reissue ? "Reissue" : "Original",
        variantName: seed.name,
        releaseYear: seed.year,
        isOriginal: !seed.reissue,
      },
    ]
  }
  return seed.variants.map((v, i) => ({
    id: `${productId}-v${i + 1}`,
    productId,
    variantType: v.type,
    variantName: v.name,
    releaseYear: v.year ?? seed.year,
    isOriginal: Boolean(v.original),
    notes: v.notes,
  }))
}

export const PRODUCTS: Product[] = SEEDS.map((s, i) => {
  const id = `p-${s.item}`
  return {
    id,
    tamiyaItemNumber: s.item,
    tamiyaProductCode: s.code,
    name: s.name,
    japaneseName: s.jp,
    series: s.series,
    chassis: s.chassis,
    releaseYear: s.year,
    discontinued: Boolean(s.discontinued),
    isReissue: Boolean(s.reissue),
    isLimitedEdition: Boolean(s.limited),
    limitedEditionType: s.limited,
    barcodeJAN: jan(1000 + i),
    msrpJPY: s.msrpJPY,
    msrpEUR: Math.round((s.msrpJPY / 160) * 100) / 100,
    rarity: s.rarity,
    description: s.desc,
    images: [],
    variants: buildVariants(id, s),
  }
})

// The current MVP catalog size used for the gamified collection-progress metric.
// This is intentionally a soft target, NOT the definitive total database size.
export const CATALOG_TARGET = 500

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id)
}

export function findByCode(query: string): Product | undefined {
  const q = query.trim().toLowerCase()
  if (!q) return undefined
  return PRODUCTS.find(
    (p) =>
      p.tamiyaProductCode?.toLowerCase() === q ||
      p.tamiyaItemNumber.toLowerCase() === q ||
      p.barcodeJAN === q ||
      p.variants.some((v) => v.barcodeJAN === q),
  )
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  const scored = PRODUCTS.filter((p) => p.id !== product.id).map((p) => {
    let score = 0
    if (p.series === product.series) score += 3
    if (p.chassis === product.chassis) score += 2
    if (p.rarity === product.rarity) score += 1
    if (Math.abs(p.releaseYear - product.releaseYear) <= 3) score += 1
    return { p, score }
  })
  return scored
    .sort((a, b) => b.score - a.score || b.p.releaseYear - a.p.releaseYear)
    .slice(0, limit)
    .map((s) => s.p)
}

export const CHASSIS_OPTIONS = Array.from(new Set(PRODUCTS.map((p) => p.chassis)))
export const SERIES_OPTIONS = Array.from(new Set(PRODUCTS.map((p) => p.series)))
export const YEAR_OPTIONS = Array.from(new Set(PRODUCTS.map((p) => p.releaseYear))).sort(
  (a, b) => b - a,
)
