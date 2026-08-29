import type { Chassis, Product, ProductRelease, Rarity, ReleaseType, Series } from "@/lib/types"

// -----------------------------------------------------------------------------
// DEMO CATALOG
// A curated set of real, recognizable Tamiya Mini 4WD models. Each MODEL carries
// its own historical original-release year plus one or more concrete RELEASES
// (original, reissues, special editions, chassis variants...). Item numbers and
// details reflect real releases as closely as possible for a prototype seed;
// this is NOT a complete database. Market values shown in the app are clearly
// labelled demo data.
// -----------------------------------------------------------------------------

const JAN_PREFIX = "4950344"

// deterministic pseudo-JAN so every release has a stable, realistic-looking code
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

const yenToEur = (jpy: number) => Math.round((jpy / 160) * 100) / 100

interface ReleaseSeed {
  type: ReleaseType
  name?: string // edition name; defaults to the model name
  year: number
  item?: string // ITEM number for this release; defaults to the model item
  chassis?: Chassis // defaults to the model chassis
  color?: string
  country?: string
  msrpJPY?: number // defaults to the model msrpJPY
  rarity?: Rarity // release-specific rarity; defaults to the model rarity
  discontinued?: boolean
  original?: boolean
  notes?: string
}

interface Seed {
  item: string
  code: string
  name: string
  jp?: string
  series: Series
  chassis: Chassis
  originalYear: number
  discontinued?: boolean
  rarity: Rarity
  msrpJPY: number
  desc: string
  releases?: ReleaseSeed[]
}

const SEEDS: Seed[] = [
  {
    item: "18626",
    code: "95655",
    name: "Aero Avante",
    jp: "エアロ アバンテ",
    series: "Racing Mini 4WD",
    chassis: "MA",
    originalYear: 2012,
    rarity: "Common",
    msrpJPY: 1100,
    desc: "The flagship of the double-shaft MA chassis era. A low, wedge-shaped aero body that became the face of modern Mini 4WD racing.",
    releases: [
      { type: "Original", year: 2012, original: true },
      { type: "Clear Body", name: "Aero Avante Clear Body (Polycarbonate)", year: 2013, rarity: "Uncommon", notes: "Lightweight polycarbonate special." },
      { type: "Color Special", name: "Aero Avante Black Special", year: 2014, color: "Black", rarity: "Uncommon" },
    ],
  },
  {
    item: "18646",
    code: "95612",
    name: "Raikiri",
    jp: "雷牙",
    series: "Racing Mini 4WD",
    chassis: "AR",
    originalYear: 2014,
    rarity: "Common",
    msrpJPY: 1100,
    desc: "Aggressive twin-blade styling on the rigid AR chassis. A staple of the modern competitive scene.",
    releases: [
      { type: "Original", year: 2014, original: true },
      { type: "Color Special", name: "Raikiri Black Special", year: 2016, color: "Black", rarity: "Uncommon" },
    ],
  },
  {
    item: "18647",
    code: "95482",
    name: "DCR-01",
    series: "Racing Mini 4WD",
    chassis: "MA",
    originalYear: 2018,
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
    originalYear: 2019,
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
    originalYear: 2020,
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
    originalYear: 2013,
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
    originalYear: 1998,
    rarity: "Rare",
    msrpJPY: 1000,
    desc: "The ZMC 'Zero Material Carbon' hero machine. A fan favourite reissued for the modern Super II chassis.",
    releases: [
      { type: "Original", name: "Neo-Tridagger ZMC", year: 1998, chassis: "Super TZ", rarity: "Very Rare", msrpJPY: 800, original: true },
      { type: "Premium", name: "Neo-Tridagger ZMC (Premium)", year: 2016, chassis: "Super II", rarity: "Uncommon" },
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
    originalYear: 1994,
    rarity: "Rare",
    msrpJPY: 1000,
    desc: "Go Seiba's first machine and the icon that launched the Fully Cowled boom of the 90s.",
    releases: [
      { type: "Original", year: 1994, rarity: "Very Rare", msrpJPY: 700, original: true },
      { type: "Premium", name: "Magnum Saber Premium", year: 2012, rarity: "Uncommon" },
    ],
  },
  {
    item: "19402",
    code: "95002",
    name: "Sonic Saber",
    jp: "ソニックセイバー",
    series: "Fully Cowled",
    chassis: "Super 1",
    originalYear: 1994,
    rarity: "Rare",
    msrpJPY: 1000,
    desc: "Retsu Seiba's counterpart to the Magnum. Sleek blue styling built for cornering.",
    releases: [
      { type: "Original", year: 1994, rarity: "Very Rare", msrpJPY: 700, original: true },
      { type: "Premium", name: "Sonic Saber Premium", year: 2013, rarity: "Uncommon" },
    ],
  },
  {
    item: "19404",
    code: "95004",
    name: "Victory Magnum",
    jp: "ビクトリーマグナム",
    series: "Fully Cowled",
    chassis: "Super 1",
    originalYear: 1995,
    rarity: "Uncommon",
    msrpJPY: 1000,
    desc: "The Magnum's evolution with a more aggressive cowl. A defining silhouette of the series.",
    releases: [
      { type: "Original", year: 1995, rarity: "Rare", msrpJPY: 700, original: true },
      { type: "Premium", name: "Victory Magnum Premium", year: 2014 },
    ],
  },
  {
    item: "19425",
    code: "95025",
    name: "Cyclone Magnum",
    jp: "サイクロンマグナム",
    series: "Fully Cowled",
    chassis: "Super TZ",
    originalYear: 1996,
    rarity: "Uncommon",
    msrpJPY: 1000,
    desc: "Twin-intake cowl on the high-rigidity Super TZ chassis. One of the most beloved Magnum forms.",
    releases: [
      { type: "Original", year: 1996, rarity: "Rare", msrpJPY: 800, original: true },
      { type: "Premium", name: "Cyclone Magnum Premium", year: 2013 },
    ],
  },
  {
    item: "19426",
    code: "95026",
    name: "Beat Magnum",
    jp: "ビートマグナム",
    series: "Fully Cowled",
    chassis: "Super TZ",
    originalYear: 1997,
    rarity: "Rare",
    msrpJPY: 1000,
    desc: "The final Magnum of the original manga arc. Iconic red-and-white split cowl.",
    releases: [
      { type: "Original", year: 1997, rarity: "Very Rare", msrpJPY: 800, original: true },
      { type: "Premium", name: "Beat Magnum Premium", year: 2013, rarity: "Uncommon" },
    ],
  },
  {
    item: "19424",
    code: "95024",
    name: "Hurricane Sonic",
    jp: "ハリケーンソニック",
    series: "Fully Cowled",
    chassis: "Super TZ",
    originalYear: 1996,
    rarity: "Uncommon",
    msrpJPY: 1000,
    desc: "Sonic lineage's high-speed form with sweeping intakes on the Super TZ chassis.",
    releases: [
      { type: "Original", year: 1996, rarity: "Rare", msrpJPY: 800, original: true },
      { type: "Premium", name: "Hurricane Sonic Premium", year: 2013 },
    ],
  },
  {
    item: "19430",
    code: "95030",
    name: "Buster Sonic",
    jp: "バスターソニック",
    series: "Fully Cowled",
    chassis: "Super TZ",
    originalYear: 1997,
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
    originalYear: 1988,
    rarity: "Uncommon",
    msrpJPY: 1000,
    desc: "The original wedge that started the Avante dynasty, reissued for the Super II chassis.",
    releases: [
      { type: "Original", name: "Avante Jr.", year: 1988, chassis: "Zero", rarity: "Very Rare", msrpJPY: 600, original: true, notes: "Original 'Avante Jr.' on the Zero chassis." },
      { type: "Premium", name: "Avante (Premium)", year: 2011, chassis: "Super II", rarity: "Uncommon" },
    ],
  },
  {
    item: "18710",
    code: "95110",
    name: "Avante Mk.II",
    jp: "アバンテ Mk.II",
    series: "Avante",
    chassis: "Zero",
    originalYear: 1990,
    discontinued: true,
    rarity: "Very Rare",
    msrpJPY: 700,
    desc: "The Zero-chassis evolution of the Avante. A vintage grail for serious collectors.",
    releases: [{ type: "Original", year: 1990, original: true, discontinued: true }],
  },
  {
    item: "18716",
    code: "95116",
    name: "Super Avante",
    jp: "スーパーアバンテ",
    series: "Avante",
    chassis: "VZ",
    originalYear: 2020,
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
    originalYear: 1996,
    rarity: "Uncommon",
    msrpJPY: 1000,
    desc: "MAX GP hero machine reissued on Super II. Smooth, purposeful racing body.",
    releases: [
      { type: "Original", year: 1996, chassis: "Super 1", rarity: "Rare", msrpJPY: 800, original: true },
      { type: "Reissue", name: "Vanguard Sonic (Super II)", year: 2013, chassis: "Super II" },
    ],
  },
  // ---- Dash! Yonkuro / Emperor line ----
  {
    // Showcase model: the SAME ITEM number (18025) exists as a 1990 original AND
    // a 2026 reissue. The original release year (1990) is stored on the MODEL and
    // must never be shown as the year of a 2026 kit.
    item: "18025",
    code: "95112",
    name: "Dash-1 Emperor",
    jp: "ダッシュ1号・皇帝",
    series: "Dash! Yonkuro",
    chassis: "Type 3",
    originalYear: 1990,
    rarity: "Rare",
    msrpJPY: 600,
    desc: "The legendary Emperor. Star machine of the Dash! Yonkuro manga and a cornerstone of any vintage-minded collection. First released in 1990 and reissued several times since.",
    releases: [
      { type: "Original", name: "Dash-1 Emperor (Type 3 Chassis)", year: 1990, item: "18025", chassis: "Type 3", rarity: "Very Rare", msrpJPY: 600, original: true, notes: "Original 1990 release on the Type 3 chassis." },
      { type: "Premium", name: "Dash-1 Emperor Premium", year: 2013, item: "18713", chassis: "Super II", rarity: "Uncommon", msrpJPY: 1000 },
      { type: "Color Special", name: "Dash-1 Emperor Premium (Black Special)", year: 2015, item: "95359", chassis: "Super II", color: "Black", rarity: "Rare", msrpJPY: 1100 },
      { type: "Anniversary Edition", name: "Dash-1 Emperor 30th Anniversary", year: 2018, item: "92403", chassis: "Super II", rarity: "Rare", msrpJPY: 1200 },
      { type: "Reissue", name: "Dash-1 Emperor (2026 Reissue)", year: 2026, item: "18025", chassis: "Super II", rarity: "Common", msrpJPY: 1100, notes: "Modern sealed reissue sharing the classic 18025 item number." },
    ],
  },
  {
    item: "18713",
    code: "95113",
    name: "Great Emperor",
    jp: "グレート・エンペラー",
    series: "Dash! Yonkuro",
    chassis: "Super II",
    originalYear: 1990,
    rarity: "Very Rare",
    msrpJPY: 700,
    desc: "The upgraded Emperor with a more aggressive cowl. Highly sought after in original form.",
    releases: [
      { type: "Original", year: 1990, chassis: "Type 3", rarity: "Grail", msrpJPY: 600, original: true, discontinued: true },
      { type: "Premium", name: "Great Emperor Premium", year: 2015, chassis: "Super II", rarity: "Rare", msrpJPY: 1000 },
    ],
  },
  {
    item: "18714",
    code: "95114",
    name: "Proto Emperor ZX",
    jp: "プロトエンペラー ZX",
    series: "Dash! Yonkuro",
    chassis: "Super II",
    originalYear: 2016,
    rarity: "Rare",
    msrpJPY: 1000,
    desc: "The prototype Emperor, a fan-favourite variant of the Emperor bloodline.",
    releases: [
      { type: "Original", year: 2016, original: true },
      { type: "Color Special", name: "Proto Emperor ZX Premium (Black Special)", year: 2019, color: "Black", rarity: "Very Rare", msrpJPY: 1200 },
    ],
  },
  {
    item: "18702",
    code: "95102",
    name: "Dash-2 Burning Sun",
    jp: "ダッシュ2号・大鷲",
    series: "Dash! Yonkuro",
    chassis: "Type 1",
    originalYear: 1989,
    discontinued: true,
    rarity: "Grail",
    msrpJPY: 600,
    desc: "Vintage Type 1 rival machine from the Dash! Yonkuro era. Extremely collectible in sealed condition.",
    releases: [{ type: "Original", year: 1989, original: true, discontinued: true }],
  },
  {
    item: "18703",
    code: "95103",
    name: "Dash-3 Shooting Star",
    jp: "ダッシュ3号・流星",
    series: "Dash! Yonkuro",
    chassis: "Type 3",
    originalYear: 1989,
    discontinued: true,
    rarity: "Very Rare",
    msrpJPY: 600,
    desc: "The high-speed Shooting Star on the Type 3 chassis. A classic of the first Mini 4WD boom.",
    releases: [{ type: "Original", year: 1989, original: true, discontinued: true }],
  },
  {
    item: "18704",
    code: "95104",
    name: "Dash-4 Cannon Ball",
    jp: "ダッシュ4号・大砲",
    series: "Dash! Yonkuro",
    chassis: "Type 3",
    originalYear: 1990,
    discontinued: true,
    rarity: "Very Rare",
    msrpJPY: 600,
    desc: "Heavy-hitting Cannon Ball, rounding out the Dash brothers lineup.",
    releases: [{ type: "Original", year: 1990, original: true, discontinued: true }],
  },
  // ---- Super Mini 4WD classics ----
  {
    item: "19412",
    code: "95212",
    name: "Astute",
    jp: "アスチュート",
    series: "Super Mini 4WD",
    chassis: "Super 1",
    originalYear: 1992,
    rarity: "Uncommon",
    msrpJPY: 900,
    desc: "Sharp-nosed Super Mini 4WD icon, a competitive favourite of the early 90s.",
    releases: [
      { type: "Original", year: 1992, rarity: "Rare", msrpJPY: 700, original: true },
      { type: "Reissue", name: "Astute (Reissue)", year: 2015 },
    ],
  },
  {
    item: "19413",
    code: "95213",
    name: "Manta Ray",
    jp: "マンタレイ",
    series: "Super Mini 4WD",
    chassis: "Super 1",
    originalYear: 1991,
    rarity: "Uncommon",
    msrpJPY: 900,
    desc: "Wide, low manta-inspired body. One of the most recognisable Super Mini 4WD machines.",
    releases: [
      { type: "Original", year: 1991, rarity: "Rare", msrpJPY: 700, original: true },
      { type: "Reissue", name: "Manta Ray (2015 Reissue)", year: 2015 },
    ],
  },
  {
    item: "19414",
    code: "95214",
    name: "Fire Dragon",
    jp: "ファイヤードラゴン",
    series: "Super Mini 4WD",
    chassis: "Super 1",
    originalYear: 1992,
    rarity: "Uncommon",
    msrpJPY: 900,
    desc: "Dragon-themed Super Mini 4WD from the classic Dragon series.",
    releases: [
      { type: "Original", year: 1992, rarity: "Rare", msrpJPY: 700, original: true },
      { type: "Premium", name: "Fire Dragon Premium", year: 2017 },
    ],
  },
  {
    item: "19415",
    code: "95215",
    name: "Dash-01 Horizon",
    series: "Super Mini 4WD",
    chassis: "Super II",
    originalYear: 2017,
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
    originalYear: 1998,
    rarity: "Rare",
    msrpJPY: 1000,
    desc: "MAX GP machine with a distinctive hawk canopy. A late-90s standout.",
    releases: [
      { type: "Original", year: 1998, rarity: "Very Rare", msrpJPY: 800, original: true },
      { type: "Premium", name: "Dyna-Hawk GX Premium", year: 2016, rarity: "Rare" },
    ],
  },
  {
    item: "18615",
    code: "95415",
    name: "Mad Bull",
    jp: "マッドブル",
    series: "Racing Mini 4WD",
    chassis: "Super II",
    originalYear: 1998,
    rarity: "Common",
    msrpJPY: 900,
    desc: "Bull-nosed off-road styling, a friendly entry point on the Super II chassis.",
    releases: [
      { type: "Original", year: 1998, rarity: "Uncommon", msrpJPY: 700, original: true },
      { type: "Reissue", name: "Mad Bull (2013 Reissue)", year: 2013 },
    ],
  },
  {
    item: "18660",
    code: "95460",
    name: "Trigale",
    series: "Racing Mini 4WD",
    chassis: "AR",
    originalYear: 2015,
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
    originalYear: 2020,
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
    originalYear: 2019,
    rarity: "Uncommon",
    msrpJPY: 1100,
    desc: "Front-motor FM-A machine with a low, fang-shaped nose for downforce.",
  },
  {
    item: "18075",
    code: "95575",
    name: "Thunder Shot",
    jp: "サンダーショット",
    series: "Super Mini 4WD",
    chassis: "Type 3",
    originalYear: 1988,
    rarity: "Rare",
    msrpJPY: 700,
    desc: "First-boom classic with a bold canopy. Reissued periodically as a nostalgia piece.",
    releases: [
      { type: "Original", name: "Thunder Shot (Type 3)", year: 1988, chassis: "Type 3", rarity: "Very Rare", msrpJPY: 600, original: true, discontinued: true },
      { type: "Premium", name: "Thunder Shot Premium", year: 2015, chassis: "Super II", rarity: "Uncommon", msrpJPY: 1000 },
    ],
  },
  {
    item: "18717",
    code: "95117",
    name: "Emperor (Premium Black Special)",
    series: "Dash! Yonkuro",
    chassis: "AR",
    originalYear: 2017,
    rarity: "Very Rare",
    msrpJPY: 1200,
    desc: "Blacked-out AR-chassis Emperor special. A limited run prized by Emperor collectors.",
    releases: [{ type: "Limited Edition", name: "Emperor (Premium Black Special)", year: 2017, color: "Black", original: true }],
  },
  {
    item: "18718",
    code: "95118",
    name: "Aero Avante Japan Cup 2013",
    series: "Racing Mini 4WD",
    chassis: "MA",
    originalYear: 2013,
    rarity: "Very Rare",
    msrpJPY: 1200,
    desc: "Japan Cup commemorative colourway of the Aero Avante. Event-limited and hard to find.",
    releases: [{ type: "Japan Cup Edition", name: "Aero Avante Japan Cup 2013", year: 2013, original: true }],
  },
]

function buildReleases(productId: string, seed: Seed, janBase: number): ProductRelease[] {
  const seeds: ReleaseSeed[] =
    seed.releases && seed.releases.length > 0
      ? seed.releases
      : [{ type: "Original", year: seed.originalYear, original: true, discontinued: seed.discontinued }]

  return seeds.map((r, i) => {
    const msrpJPY = r.msrpJPY ?? seed.msrpJPY
    return {
      id: `${productId}-r${i + 1}`,
      productId,
      itemNumber: r.item ?? seed.item,
      releaseType: r.type,
      editionName: r.name ?? seed.name,
      releaseYear: r.year,
      chassis: r.chassis ?? seed.chassis,
      barcodeJAN: jan(janBase * 10 + i),
      color: r.color,
      countryMarket: r.country ?? "Japan",
      msrpJPY,
      msrpEUR: yenToEur(msrpJPY),
      images: [],
      notes: r.notes,
      discontinued: Boolean(r.discontinued ?? seed.discontinued),
      isOriginal: Boolean(r.original),
      rarity: r.rarity,
    }
  })
}

export const PRODUCTS: Product[] = SEEDS.map((s, i) => {
  const id = `p-${s.item}`
  const releases = buildReleases(id, s, 1000 + i)
  const primary = releases.find((r) => r.isOriginal) ?? releases[0]
  return {
    id,
    category: "mini4wd",
    itemNumber: s.item,
    productCode: s.code,
    name: s.name,
    japaneseName: s.jp,
    series: s.series,
    chassis: s.chassis,
    originalReleaseYear: s.originalYear,
    rarity: s.rarity,
    description: s.desc,
    images: [],
    releases,
    hasMultipleReleases: releases.length > 1,
    msrpJPY: primary.msrpJPY ?? s.msrpJPY,
    msrpEUR: primary.msrpEUR ?? yenToEur(s.msrpJPY),
  }
})

// The current MVP catalog size used for the gamified collection-progress metric.
// This is intentionally a soft target, NOT the definitive total database size.
export const CATALOG_TARGET = 500

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id)
}

export function getReleaseById(releaseId: string): { product: Product; release: ProductRelease } | undefined {
  for (const product of PRODUCTS) {
    const release = product.releases.find((r) => r.id === releaseId)
    if (release) return { product, release }
  }
  return undefined
}

// Resolve the primary/original release used for headline (model-level) display.
export function primaryRelease(product: Product): ProductRelease {
  return product.releases.find((r) => r.isOriginal) ?? product.releases[0]
}

// Resolve a specific release for a collection/wishlist item, falling back to the
// model's primary release when the stored release can't be found.
export function resolveRelease(product: Product, releaseId?: string): ProductRelease {
  if (releaseId) {
    const found = product.releases.find((r) => r.id === releaseId)
    if (found) return found
  }
  return primaryRelease(product)
}

// Match a scanned/typed code to the most specific identity available. Returns
// the model plus the matched release when a release-level barcode/item hits.
export function findByCode(query: string): { product: Product; release?: ProductRelease } | undefined {
  const q = query.trim().toLowerCase()
  if (!q) return undefined
  for (const product of PRODUCTS) {
    const releaseHit = product.releases.find(
      (r) => r.itemNumber.toLowerCase() === q || r.barcodeJAN?.toLowerCase() === q,
    )
    if (releaseHit) return { product, release: releaseHit }
    if (
      product.productCode?.toLowerCase() === q ||
      product.itemNumber.toLowerCase() === q
    ) {
      return { product }
    }
  }
  return undefined
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  const scored = PRODUCTS.filter((p) => p.id !== product.id).map((p) => {
    let score = 0
    if (p.series === product.series) score += 3
    if (p.chassis === product.chassis) score += 2
    if (p.rarity === product.rarity) score += 1
    if (Math.abs(p.originalReleaseYear - product.originalReleaseYear) <= 3) score += 1
    return { p, score }
  })
  return scored
    .sort((a, b) => b.score - a.score || b.p.originalReleaseYear - a.p.originalReleaseYear)
    .slice(0, limit)
    .map((s) => s.p)
}

export const CHASSIS_OPTIONS = Array.from(new Set(PRODUCTS.map((p) => p.chassis)))
export const SERIES_OPTIONS = Array.from(new Set(PRODUCTS.map((p) => p.series)))
