import type { Chassis, Product, ProductRelease, Rarity, ReleaseType, Series } from "@/lib/types"
import { stableUuid } from "./stable-id"

// -----------------------------------------------------------------------------
// DEMO CATALOG
// A curated set of real, recognizable Tamiya Mini 4WD models. Each MODEL carries
// its own historical original-release year plus one or more concrete RELEASES
// (original, reissues, special editions, chassis variants...).
//
// Step 4B: every product/release id below is a stable UUID (see
// lib/data/stable-id.ts). The exact same ids are used in the matching
// database seed (supabase/migrations/0003_seed_initial_catalog.sql),
// generated from this same file — so a collection/wishlist item added
// against a product here refers to a real, matching row in the database.
//
// CATALOG INTEGRITY PASS (see docs/CATALOG_AUDIT.md for the full report):
// this catalog was originally seeded with item numbers described as
// "reflecting real releases as closely as possible" but NOT independently
// verified against Tamiya — several turned out to be wrong (e.g. item
// 18626 was labeled "Aero Avante" but is really a different Tamiya kit).
// Two consequences of that audit, both load-bearing for how this file is
// structured now:
//
// 1. IDENTITY IS NOW DECOUPLED FROM THE ITEM NUMBER. Every top-level Seed
//    has a `seedKey` — a frozen, permanent identity anchor captured at the
//    time this decoupling was introduced, used ONLY for stableUuid()
//    generation (both the product's own id and, combined with a release's
//    array position, each of its releases' ids). `item` (the Tamiya item
//    number) is a separate, ordinary, freely-correctable FACTUAL field —
//    fixing a wrong item number no longer changes any id, which means it
//    can never orphan an existing collection_items/wishlist_items row
//    that references the old id. NEVER derive an id from `item` again,
//    and NEVER change an existing entry's `seedKey` once assigned — doing
//    either would silently break every live reference to that row.
//
// 2. UNKNOWN IS BETTER THAN INVENTED. Two things this catalog used to
//    fabricate have been removed:
//    - Barcodes: there is no more deterministic pseudo-JAN generator.
//      `ReleaseSeed.verifiedJAN` is the only source of `barcodeJAN`, and
//      it's `undefined` unless a real Tamiya-confirmed barcode was found
//      — which, as of this pass, is true for every release in this file
//      (none were verified). A future scanner feature will depend on this
//      being trustworthy, not realistic-looking.
//    - MSRP: `estimatedMsrpJPY` (Seed/ReleaseSeed) is exactly what its
//      name says — an app-level estimate, not a verified historical
//      Tamiya retail price. It exists solely to seed lib/data/market.ts's
//      already-disclaimed demo pricing engine (see that file — every
//      market-value estimate it produces is labeled "demo" in the UI) and
//      is never displayed anywhere as factual official MSRP data. No
//      entry in this file currently has a verified real MSRP figure. If
//      that changes, add it as `verifiedMsrpJPY` (present on the type,
//      unused for now) rather than overwriting `estimatedMsrpJPY` — keep
//      the two conceptually separate even once real data exists.
// -----------------------------------------------------------------------------

// Single brand/category for the current MVP scope — exported so the seed
// migration and any future catalog-admin tooling reference the exact same
// ids without hand-copying UUID strings.
export const TAMIYA_BRAND_ID = stableUuid("brand:tamiya")
export const MINI4WD_CATEGORY_ID = stableUuid("category:mini4wd")

// Deliberately no more pseudo-JAN generator here (see file header, point
// 2). barcodeJAN now comes exclusively from ReleaseSeed.verifiedJAN.

// Derives an estimated EUR figure from an estimated JPY figure, for the
// demo pricing engine only (see file header, point 2) — never treat the
// result as a real historical conversion rate or a verified price.
const yenToEur = (jpy: number) => Math.round((jpy / 160) * 100) / 100

interface ReleaseSeed {
  type: ReleaseType
  name?: string // edition name; defaults to the model name
  year: number
  /** Precise ISO release date, when officially verified. Most releases only have a year -- leave unset rather than guess a date. */
  releaseDate?: string
  item?: string // ITEM number for this release; defaults to the model item
  chassis?: Chassis // defaults to the model chassis
  color?: string
  country?: string
  /** App-level estimate only — see file header, point 2. Defaults to the model's estimatedMsrpJPY. */
  estimatedMsrpJPY?: number
  /** Real Tamiya-confirmed MSRP for this specific release, when known. Unused until populated. */
  verifiedMsrpJPY?: number
  /** Real Tamiya-confirmed barcode/JAN for this specific release. Undefined unless verified — never invented. */
  verifiedJAN?: string
  rarity?: Rarity // release-specific rarity; defaults to the model rarity
  discontinued?: boolean
  original?: boolean
  notes?: string
}

interface Seed {
  /**
   * Frozen, permanent identity anchor — see file header, point 1. Set once
   * per entry and never changed afterwards, regardless of how many times
   * `item` below gets corrected.
   */
  seedKey: string
  /** Tamiya item number, when confidently verified. Undefined (never a placeholder string) when not. */
  item?: string
  code: string
  name: string
  jp?: string
  series: Series
  chassis: Chassis
  originalYear: number
  discontinued?: boolean
  rarity: Rarity
  /** App-level estimate only — see file header, point 2. Not a verified historical Tamiya MSRP. */
  estimatedMsrpJPY: number
  /** Real Tamiya-confirmed MSRP for this model's primary release, when known. Unused until populated. */
  verifiedMsrpJPY?: number
  desc: string
  releases?: ReleaseSeed[]
}

const SEEDS: Seed[] = [
  {
    seedKey: "18626", // frozen identity anchor -- see file header. NEVER change this once assigned.
    // CORRECTED (catalog integrity pass, see docs/CATALOG_AUDIT.md): this
    // entry originally used item "18626", which is actually a different
    // real Tamiya kit (Avante Mk.III Azure). Verified official identity
    // for "Aero Avante" via https://www.tamiya.com/english/products/18701/index.html:
    // item 18701, AR chassis (was previously "MA" here, also wrong).
    item: "18701",
    code: "95655",
    name: "Aero Avante",
    jp: "エアロ アバンテ",
    series: "Racing Mini 4WD",
    chassis: "AR",
    originalYear: 2012,
    rarity: "Common",
    estimatedMsrpJPY: 1100,
    desc: "The flagship of the AR chassis era, launched for Mini 4WD's 30th anniversary. A low, wedge-shaped aero body that became the face of modern Mini 4WD racing.",
    releases: [
      { type: "Original", year: 2012, original: true },
      { type: "Clear Body", name: "Aero Avante Clear Body (Polycarbonate)", year: 2013, rarity: "Uncommon", notes: "Lightweight polycarbonate special." },
      { type: "Color Special", name: "Aero Avante Black Special", year: 2014, color: "Black", rarity: "Uncommon" },
    ],
  },
  {
    seedKey: "18646", // frozen identity anchor -- see file header. NEVER change this once assigned.
    // CORRECTED (catalog integrity pass, see docs/CATALOG_AUDIT.md): was
    // item 18646 / AR chassis. Verified official identity for "Raikiri"
    // via https://www.tamiya.com/english/products/18640/index.html: item
    // 18640, MA chassis. 18646 is a real Tamiya item number but belongs
    // to "DCR-01" (see next entry).
    item: "18640",
    code: "95612",
    name: "Raikiri",
    jp: "雷牙",
    series: "Racing Mini 4WD",
    chassis: "MA",
    originalYear: 2014,
    rarity: "Common",
    estimatedMsrpJPY: 1100,
    desc: "Aggressive twin-blade styling on the rigid AR chassis. A staple of the modern competitive scene.",
    releases: [
      { type: "Original", year: 2014, original: true },
      { type: "Color Special", name: "Raikiri Black Special", year: 2016, color: "Black", rarity: "Uncommon" },
    ],
  },
  {
    seedKey: "18647", // frozen identity anchor -- see file header. NEVER change this once assigned.
    // CORRECTED (catalog integrity pass, see docs/CATALOG_AUDIT.md): was
    // item 18647. Verified official identity for "DCR-01" via
    // https://www.tamiya.com/english/products/18646/index.html: item
    // 18646, MA chassis (unchanged, already correct).
    item: "18646",
    code: "95482",
    name: "DCR-01",
    series: "Racing Mini 4WD",
    chassis: "MA",
    originalYear: 2018,
    rarity: "Common",
    estimatedMsrpJPY: 1100,
    desc: "Dual Ridge cowl developed with real aerodynamic testing. Successor lineage to the Avante family.",
  },
  {
    seedKey: "18093", // frozen identity anchor -- see file header. NEVER change this once assigned.
    // CORRECTED (catalog integrity pass, see docs/CATALOG_AUDIT.md): was
    // item 18093. Verified official identity for "Geo Glider" via
    // https://www.tamiya.com/english/products/18716/index.html: item
    // 18716, FM-A chassis (unchanged), 2018 (was 2019 here). NOTE: 18716
    // was also this catalog's (equally wrong) item number for "Super
    // Avante" below -- corrected there too, to avoid two products
    // claiming the same real Tamiya item number.
    item: "18716",
    code: "95361",
    name: "Geo Glider",
    series: "Racing Mini 4WD",
    chassis: "FM-A",
    originalYear: 2018,
    rarity: "Uncommon",
    estimatedMsrpJPY: 1100,
    desc: "Front-motor FM-A chassis machine with a smooth gliding profile tuned for stability on technical sections.",
  },
  {
    seedKey: "18095", // frozen identity anchor -- see file header. NEVER change this once assigned.
    // CORRECTED (catalog integrity pass, see docs/CATALOG_AUDIT.md): was
    // item 18095 / VZ chassis. Verified official identity for "Shadow
    // Shark" via https://www.tamiya.com/english/products/18704/index.html:
    // item 18704, AR chassis. NOTE: 18704 was also this catalog's
    // (equally wrong) item number for "Dash-4 Cannon Ball" below --
    // corrected there too, to avoid two products claiming the same real
    // Tamiya item number.
    item: "18704",
    code: "95474",
    name: "Shadow Shark",
    series: "Racing Mini 4WD",
    chassis: "AR",
    originalYear: 2020,
    rarity: "Uncommon",
    estimatedMsrpJPY: 1100,
    desc: "Sharp predatory silhouette debuting on the aerodynamic, responsive AR chassis.",
  },
  {
    seedKey: "18641", // frozen identity anchor -- see file header. NEVER change this once assigned.
    // CORRECTED (catalog integrity pass, live-verified against
    // tamiya.com, see docs/CATALOG_AUDIT.md): official page
    // https://tamiya.com/english/products/18637/index.html confirms
    // "FESTA JAUNE", Item No. 18637, "Mini 4WD PRO Series No.37", MA
    // chassis. This catalog's previous item 18641 belongs to a different
    // real Tamiya product ("Shooting Proud Star" -- confirmed via
    // multiple official Tamiya America MAP price list PDFs, e.g.
    // https://www.tamiyausa.com/media/files/map-price-list-jan-2019-969-c5cb.pdf).
    item: "18637",
    code: "95271",
    name: "Festa Jaune",
    series: "Racing Mini 4WD",
    chassis: "MA",
    originalYear: 2014,
    rarity: "Uncommon",
    estimatedMsrpJPY: 1100,
    desc: "Bright competition body on the MA chassis, popular for its clean lines and rigidity.",
  },
  {
    seedKey: "19434", // frozen identity anchor -- see file header. NEVER change this once assigned.
    // CORRECTED (catalog integrity pass, live-verified against
    // tamiya.com, see docs/CATALOG_AUDIT.md): official Japanese page
    // https://www.tamiya.com/japan/products/19409/index.html confirms
    // the base "ネオトライダガー ZMC" (Neo-Tridagger ZMC) is Item No.
    // 19409, Super 1 chassis. This catalog's previous item 19434 belongs
    // to a completely different real Tamiya product -- "Victory Magnum
    // Premium (Carbon Super-II Chassis)" -- confirmed via
    // https://www.tamiya.com/english/products/19434/index.html,
    // https://www.tamiya.com/japan/products/19434/index.html, and an
    // official Tamiya lineup PDF; that item is now correctly used for
    // this catalog's Victory Magnum Premium release instead (see that
    // product's entry). The Premium release below (2016, Super-II) was
    // NOT independently re-verified for its own specific item number in
    // this pass -- left inheriting the corrected product item rather
    // than guessed; flagged PARTIALLY VERIFIED in docs/CATALOG_AUDIT.md.
    item: "19409",
    code: "95084",
    name: "Neo-Tridagger ZMC",
    jp: "ネオトライダガー ZMC",
    series: "Super Mini 4WD",
    chassis: "Super 1",
    originalYear: 1998,
    rarity: "Rare",
    estimatedMsrpJPY: 1000,
    desc: "The ZMC 'Zero Material Carbon' hero machine. A fan favourite reissued for the modern Super II chassis.",
    releases: [
      { type: "Original", name: "Neo-Tridagger ZMC", year: 1998, chassis: "Super 1", rarity: "Very Rare", estimatedMsrpJPY: 800, original: true },
      { type: "Premium", name: "Neo-Tridagger ZMC (Premium)", year: 2016, chassis: "Super II", rarity: "Uncommon" },
    ],
  },
  // ---- Fully Cowled / Let's & Go ----
  {
    seedKey: "19401", // frozen identity anchor -- see file header. NEVER change this once assigned.
    item: "19401",
    code: "95001",
    name: "Magnum Saber",
    jp: "マグナムセイバー",
    series: "Fully Cowled",
    chassis: "Super 1",
    originalYear: 1994,
    rarity: "Rare",
    estimatedMsrpJPY: 1000,
    desc: "Go Seiba's first machine and the icon that launched the Fully Cowled boom of the 90s.",
    releases: [
      { type: "Original", year: 1994, rarity: "Very Rare", estimatedMsrpJPY: 700, original: true },
      // CORRECTED (catalog integrity pass, see docs/CATALOG_AUDIT.md): this
      // release previously had no item/chassis override, silently
      // inheriting the model's 19401/Super-1 -- wrong for the Premium,
      // which is a distinct real Tamiya release. Verified via
      // https://www.tamiya.com/english/products/19431/index.html: item
      // 19431, Super-II chassis.
      { type: "Premium", name: "Magnum Saber Premium", year: 2012, item: "19431", chassis: "Super II", rarity: "Uncommon" },
    ],
  },
  {
    seedKey: "19402", // frozen identity anchor -- see file header. NEVER change this once assigned.
    item: "19402",
    code: "95002",
    name: "Sonic Saber",
    jp: "ソニックセイバー",
    series: "Fully Cowled",
    chassis: "Super 1",
    originalYear: 1994,
    rarity: "Rare",
    estimatedMsrpJPY: 1000,
    desc: "Retsu Seiba's counterpart to the Magnum. Sleek blue styling built for cornering.",
    releases: [
      { type: "Original", year: 1994, rarity: "Very Rare", estimatedMsrpJPY: 700, original: true },
      // CORRECTED (catalog integrity pass, live-verified against
      // tamiya.com, see docs/CATALOG_AUDIT.md): official page
      // https://www.tamiya.com/english/products/19432/index.html
      // confirms "Sonic Saber Premium (Super-II Chassis)", Item No.
      // 19432. Was previously silently inheriting the product's item
      // 19402. Release year (2011) corroborated by multiple retailer
      // listings citing 2011-01-22, not independently confirmed on an
      // official page showing a release date directly -- flagged
      // PARTIALLY VERIFIED for the exact date in docs/CATALOG_AUDIT.md.
      { type: "Premium", name: "Sonic Saber Premium", year: 2011, item: "19432", chassis: "Super II", rarity: "Uncommon" },
    ],
  },
  {
    seedKey: "19404", // frozen identity anchor -- see file header. NEVER change this once assigned.
    // CORRECTED (catalog integrity pass, live-verified against
    // tamiya.com, see docs/CATALOG_AUDIT.md): official Japanese page
    // https://www.tamiya.com/japan/products/19406/index.html confirms
    // "ビクトリーマグナム" (Victory Magnum), Item No. 19406. This
    // catalog's previous item 19404 does not belong to Victory Magnum in
    // Tamiya's numbering (chassis/year not independently re-verified
    // against an official page in this pass -- carried over from the
    // seed, PARTIALLY VERIFIED for those two fields).
    item: "19406",
    code: "95004",
    name: "Victory Magnum",
    jp: "ビクトリーマグナム",
    series: "Fully Cowled",
    chassis: "Super 1",
    originalYear: 1995,
    rarity: "Uncommon",
    estimatedMsrpJPY: 1000,
    desc: "The Magnum's evolution with a more aggressive cowl. A defining silhouette of the series.",
    releases: [
      { type: "Original", year: 1995, rarity: "Rare", estimatedMsrpJPY: 700, original: true },
      // CORRECTED (catalog integrity pass, live-verified against
      // tamiya.com, see docs/CATALOG_AUDIT.md): official pages
      // https://www.tamiya.com/english/products/19434/index.html and
      // https://www.tamiya.com/japan/products/19434/index.html (and an
      // official Tamiya lineup PDF) confirm "Victory Magnum Premium
      // (Carbon Super-II Chassis)", Item No. 19434, released 2011-06-25.
      // Was previously silently inheriting the product's item 19404.
      { type: "Premium", name: "Victory Magnum Premium", year: 2011, releaseDate: "2011-06-25", item: "19434", chassis: "Super II" },
    ],
  },
  {
    seedKey: "19425", // frozen identity anchor -- see file header. NEVER change this once assigned.
    // CORRECTED (catalog integrity pass, live-verified against
    // tamiya.com, see docs/CATALOG_AUDIT.md): official Japanese page
    // https://www.tamiya.com/japan/products/19412/index.html confirms
    // "サイクロンマグナム" (Cyclone Magnum), Item No. 19412. This
    // catalog's previous item 19425 does not belong to Cyclone Magnum in
    // Tamiya's numbering (chassis/year carried over, not independently
    // re-verified -- PARTIALLY VERIFIED for those two fields).
    item: "19412",
    code: "95025",
    name: "Cyclone Magnum",
    jp: "サイクロンマグナム",
    series: "Fully Cowled",
    chassis: "Super TZ",
    originalYear: 1996,
    rarity: "Uncommon",
    estimatedMsrpJPY: 1000,
    desc: "Twin-intake cowl on the high-rigidity Super TZ chassis. One of the most beloved Magnum forms.",
    releases: [
      { type: "Original", year: 1996, rarity: "Rare", estimatedMsrpJPY: 800, original: true },
      // CORRECTED: official page
      // https://www.tamiya.com/japan/products/19440/index.html confirms
      // "サイクロンマグナム プレミアム (ARシャーシ)" (Cyclone Magnum
      // Premium, AR Chassis), Item No. 19440, released 2014-11-21.
      { type: "Premium", name: "Cyclone Magnum Premium", year: 2014, releaseDate: "2014-11-21", item: "19440", chassis: "AR" },
    ],
  },
  {
    seedKey: "19426", // frozen identity anchor -- see file header. NEVER change this once assigned.
    // CORRECTED (catalog integrity pass, live-verified against
    // tamiya.com, see docs/CATALOG_AUDIT.md): official Japanese page
    // https://www.tamiya.com/japan/products/19421/index.html confirms
    // "ビートマグナム" (Beat Magnum), Item No. 19421. This catalog's
    // previous item 19426 does not belong to Beat Magnum (chassis/year
    // carried over, not independently re-verified -- PARTIALLY VERIFIED
    // for those two fields).
    item: "19421",
    code: "95026",
    name: "Beat Magnum",
    jp: "ビートマグナム",
    series: "Fully Cowled",
    chassis: "Super TZ",
    originalYear: 1997,
    rarity: "Rare",
    estimatedMsrpJPY: 1000,
    desc: "The final Magnum of the original manga arc. Iconic red-and-white split cowl.",
    releases: [
      { type: "Original", year: 1997, rarity: "Very Rare", estimatedMsrpJPY: 800, original: true },
      // CORRECTED: official page
      // https://www.tamiya.com/japan/products/19444/index.html confirms
      // "ビートマグナム プレミアム (ARシャーシ)" (Beat-Magnum Premium,
      // AR Chassis), Item No. 19444, released 2015-03-21.
      { type: "Premium", name: "Beat Magnum Premium", year: 2015, releaseDate: "2015-03-21", item: "19444", chassis: "AR", rarity: "Uncommon" },
    ],
  },
  {
    seedKey: "19424", // frozen identity anchor -- see file header. NEVER change this once assigned.
    // CORRECTED (catalog integrity pass, live-verified against
    // tamiya.com, see docs/CATALOG_AUDIT.md): official Japanese page
    // https://www.tamiya.com/japan/products/19415/index.html confirms
    // "ハリケーンソニック" (Hurricane Sonic), Item No. 19415. This
    // catalog's previous item 19424 does not belong to Hurricane Sonic
    // (chassis/year carried over, not independently re-verified --
    // PARTIALLY VERIFIED for those two fields).
    item: "19415",
    code: "95024",
    name: "Hurricane Sonic",
    jp: "ハリケーンソニック",
    series: "Fully Cowled",
    chassis: "Super TZ",
    originalYear: 1996,
    rarity: "Uncommon",
    estimatedMsrpJPY: 1000,
    desc: "Sonic lineage's high-speed form with sweeping intakes on the Super TZ chassis.",
    releases: [
      { type: "Original", year: 1996, rarity: "Rare", estimatedMsrpJPY: 800, original: true },
      // PARTIALLY VERIFIED: item 19441 (AR chassis) corroborated by a
      // retailer listing ("TAMIYA 1/32 Fully Cowled Mini 4WD No.41
      // HURRICANE SONIC PREMIUM AR 19441"), not independently confirmed
      // via a direct tamiya.com fetch in this pass.
      { type: "Premium", name: "Hurricane Sonic Premium", year: 2013, item: "19441", chassis: "AR" },
    ],
  },
  {
    seedKey: "19430", // frozen identity anchor -- see file header. NEVER change this once assigned.
    // CORRECTED (catalog integrity pass, live-verified against
    // tamiya.com, see docs/CATALOG_AUDIT.md): official Japanese page
    // https://www.tamiya.com/japan/products/19423/index.html confirms
    // "バスターソニック" (Buster Sonic), Item No. 19423. This catalog's
    // previous item 19430 does not belong to Buster Sonic (chassis/year
    // carried over, not independently re-verified -- PARTIALLY VERIFIED
    // for those two fields). Note: a real "Buster-Sonic Premium (AR
    // Chassis)" exists at item 19445 (confirmed via
    // tamiya.com/japan/19445, released 2015-04-18) -- not added as a
    // release here since this catalog's existing single release for
    // this product was never split into Original/Premium; adding a new
    // release row is catalog expansion, out of scope for this
    // correction pass (see docs/CATALOG_AUDIT.md).
    item: "19423",
    code: "95030",
    name: "Buster Sonic",
    jp: "バスターソニック",
    series: "Fully Cowled",
    chassis: "Super TZ",
    originalYear: 1997,
    rarity: "Rare",
    estimatedMsrpJPY: 1000,
    desc: "The last Sonic of the arc, paired with the Beat Magnum in the series finale.",
  },
  // ---- Avante family ----
  {
    seedKey: "18709", // frozen identity anchor -- see file header. NEVER change this once assigned.
    // CORRECTED (catalog integrity pass, see docs/CATALOG_AUDIT.md):
    // multiple independent official-adjacent retailer sources (rcMart,
    // RC Station) consistently cite item 18014, Type 2 chassis for
    // "Avante Jr." -- this catalog's previous item 18709 does not match.
    // Not independently confirmed via a direct tamiya.com fetch in this
    // pass (only retailer corroboration achieved) -- flagged PARTIALLY
    // VERIFIED in docs/CATALOG_AUDIT.md despite the correction being
    // applied, given the strength/consistency of the corroborating
    // sources. Premium release (2011, Super II) item not independently
    // re-checked this pass.
    item: "18014",
    code: "95109",
    name: "Avante",
    jp: "アバンテ",
    series: "Avante",
    chassis: "Super II",
    originalYear: 1988,
    rarity: "Uncommon",
    estimatedMsrpJPY: 1000,
    desc: "The original wedge that started the Avante dynasty, reissued for the Super II chassis.",
    releases: [
      { type: "Original", name: "Avante Jr.", year: 1988, item: "18014", chassis: "Type 2", rarity: "Very Rare", estimatedMsrpJPY: 600, original: true, notes: "Original 'Avante Jr.' on the Type 2 chassis." },
      { type: "Premium", name: "Avante (Premium)", year: 2011, chassis: "Super II", rarity: "Uncommon" },
    ],
  },
  {
    seedKey: "18710", // frozen identity anchor -- see file header. NEVER change this once assigned.
    // CORRECTED (catalog integrity pass, see docs/CATALOG_AUDIT.md):
    // officially verified against Tamiya: item 18614, "Avante Mk.II",
    // Mini 4WD PRO Series No.14, MS chassis, released 2006-06-24. There
    // is no official vintage 1990/Zero-chassis "Avante Mk.II" -- that
    // entry (item 18710, "vintage grail", discontinued) appears to have
    // been a seed-data error, most likely confused with the real
    // "Avante Jr." (item 18014, Type 2 chassis, 1988), which is a
    // genuinely distinct historical product not currently represented in
    // this catalog at all. If Avante Jr. is wanted here later, it must
    // be added as its own separate product entry (its own seedKey/item
    // 18014), never as a release under this one.
    item: "18614",
    code: "95110",
    name: "Avante Mk.II",
    jp: "アバンテ Mk.II",
    series: "Avante",
    chassis: "MS",
    originalYear: 2006,
    rarity: "Uncommon", // not independently verified -- a reasonable non-extreme default now that this is confirmed to be a mainstream 2006 release, not a vintage grail. Corrects the previous "Very Rare" framing, which was based on the wrong (vintage) identity.
    estimatedMsrpJPY: 700,
    desc: "The MS-chassis Avante Mk.II, Mini 4WD PRO Series No.14 -- a modern take on the Avante line, not the vintage original.",
    releases: [{ type: "Original", year: 2006, releaseDate: "2006-06-24", chassis: "MS", original: true }],
  },
  {
    seedKey: "18716", // frozen identity anchor -- see file header. NEVER change this once assigned.
    // CORRECTED (catalog integrity pass, see docs/CATALOG_AUDIT.md): was
    // item 18716, which is a real Tamiya item number but belongs to "Geo
    // Glider" (corrected above) -- keeping both would have meant two
    // products claiming the same real item number. Verified official
    // identity for "Super Avante Jr." via
    // https://www.tamiya.com/english/products/18101/index.html: item
    // 18101, VZ chassis (unchanged).
    item: "18101",
    code: "95116",
    name: "Super Avante",
    jp: "スーパーアバンテ",
    series: "Avante",
    chassis: "VZ",
    originalYear: 2020,
    rarity: "Common",
    estimatedMsrpJPY: 1100,
    desc: "A modern reinterpretation of the Avante line on the lightweight VZ chassis.",
  },
  {
    seedKey: "18725", // frozen identity anchor -- see file header. NEVER change this once assigned.
    // CORRECTED (catalog integrity pass, live-verified against
    // tamiya.com, see docs/CATALOG_AUDIT.md): official Japanese page
    // https://www.tamiya.com/japan/products/19407/index.html confirms
    // "バンガードソニック" (Vanguard Sonic), Item No. 19407, "1/32
    // フルカウルミニ四駆シリーズ No.7". This catalog's previous item
    // 18725 does not belong to Vanguard Sonic in Tamiya's numbering.
    // Year 1995 corroborated by retailer/wiki sources only (the official
    // page itself doesn't list a release date) -- flagged PARTIALLY
    // VERIFIED for the exact year only, item number is fully confirmed.
    item: "19407",
    code: "95125",
    name: "Vanguard Sonic",
    jp: "バンガードソニック",
    series: "Let's & Go",
    chassis: "Super II",
    originalYear: 1995,
    rarity: "Uncommon",
    estimatedMsrpJPY: 1000,
    desc: "MAX GP hero machine reissued on Super II. Smooth, purposeful racing body.",
    releases: [
      { type: "Original", year: 1995, chassis: "Super 1", rarity: "Rare", estimatedMsrpJPY: 800, original: true },
      // CORRECTED (catalog integrity pass, live-verified against
      // tamiya.com, see docs/CATALOG_AUDIT.md): official page
      // https://www.tamiya.com/english/products/19435/index.html
      // confirms "Vanguard Sonic Premium (Carbon Super-II Chassis)",
      // Item No. 19435. Was previously silently inheriting the
      // product's item 18725, which does not belong to this product at
      // all (see product-level note below).
      { type: "Reissue", name: "Vanguard Sonic (Super II)", year: 2013, item: "19435", chassis: "Super II" },
    ],
  },
  // ---- Dash! Yonkuro / Emperor line ----
  {
    // Showcase model: the SAME ITEM number (18025) exists as a 1990 original AND
    // a 2026 reissue. The original release year (1990) is stored on the MODEL and
    // must never be shown as the year of a 2026 kit.
    seedKey: "18025", // frozen identity anchor -- see file header. NEVER change this once assigned.
    item: "18025",
    code: "95112",
    name: "Dash-1 Emperor",
    jp: "ダッシュ1号・皇帝",
    series: "Dash! Yonkuro",
    chassis: "Type 3",
    originalYear: 1990,
    rarity: "Rare",
    estimatedMsrpJPY: 600,
    desc: "The legendary Emperor. Star machine of the Dash! Yonkuro manga and a cornerstone of any vintage-minded collection. First released in 1990 and reissued several times since.",
    releases: [
      { type: "Original", name: "Dash-1 Emperor (Type 3 Chassis)", year: 1990, item: "18025", chassis: "Type 3", rarity: "Very Rare", estimatedMsrpJPY: 600, original: true, notes: "Original 1990 release on the Type 3 chassis." },
      { type: "Premium", name: "Dash-1 Emperor Premium", year: 2013, item: "18713", chassis: "Super II", rarity: "Uncommon", estimatedMsrpJPY: 1000 },
      { type: "Color Special", name: "Dash-1 Emperor Premium (Black Special)", year: 2015, item: "95359", chassis: "Super II", color: "Black", rarity: "Rare", estimatedMsrpJPY: 1100 },
      { type: "Anniversary Edition", name: "Dash-1 Emperor 30th Anniversary", year: 2018, item: "92403", chassis: "Super II", rarity: "Rare", estimatedMsrpJPY: 1200 },
      // CORRECTED (catalog integrity pass, see docs/CATALOG_AUDIT.md):
      // verified live at https://www.tamiya.com/english/products/18025/index.html
      // (page explicitly dated "current as of June 24, 2026") -- item
      // 18025 is still sold as "Dash-1 Emperor (Type 3 Chassis)", not
      // Super-II as this entry previously claimed. Do not assume the
      // photo on that current page depicts the original 1990 release's
      // packaging/appearance -- see lib/images/resolve.ts and
      // scripts/data/tamiya-images.ts for how that risk is handled for
      // images specifically.
      { type: "Reissue", name: "Dash-1 Emperor (2026 Reissue)", year: 2026, item: "18025", chassis: "Type 3", rarity: "Common", estimatedMsrpJPY: 1100, notes: "Modern sealed reissue sharing the classic 18025 item number and Type 3 chassis." },
    ],
  },
  {
    seedKey: "18713", // frozen identity anchor -- see file header. NEVER change this once assigned.
    item: "18713",
    code: "95113",
    name: "Great Emperor",
    jp: "グレート・エンペラー",
    series: "Dash! Yonkuro",
    chassis: "Super II",
    originalYear: 1990,
    rarity: "Very Rare",
    estimatedMsrpJPY: 700,
    desc: "The upgraded Emperor with a more aggressive cowl. Highly sought after in original form.",
    releases: [
      { type: "Original", year: 1990, chassis: "Type 3", rarity: "Grail", estimatedMsrpJPY: 600, original: true, discontinued: true },
      { type: "Premium", name: "Great Emperor Premium", year: 2015, chassis: "Super II", rarity: "Rare", estimatedMsrpJPY: 1000 },
    ],
  },
  {
    seedKey: "18714", // frozen identity anchor -- see file header. NEVER change this once assigned.
    item: "18714",
    code: "95114",
    name: "Proto Emperor ZX",
    jp: "プロトエンペラー ZX",
    series: "Dash! Yonkuro",
    chassis: "Super II",
    originalYear: 2016,
    rarity: "Rare",
    estimatedMsrpJPY: 1000,
    desc: "The prototype Emperor, a fan-favourite variant of the Emperor bloodline.",
    releases: [
      { type: "Original", year: 2016, original: true },
      { type: "Color Special", name: "Proto Emperor ZX Premium (Black Special)", year: 2019, color: "Black", rarity: "Very Rare", estimatedMsrpJPY: 1200 },
    ],
  },
  {
    seedKey: "18702", // frozen identity anchor -- see file header. NEVER change this once assigned.
    item: "18702",
    code: "95102",
    name: "Dash-2 Burning Sun",
    jp: "ダッシュ2号・大鷲",
    series: "Dash! Yonkuro",
    chassis: "Type 1",
    originalYear: 1989,
    discontinued: true,
    rarity: "Grail",
    estimatedMsrpJPY: 600,
    desc: "Vintage Type 1 rival machine from the Dash! Yonkuro era. Extremely collectible in sealed condition.",
    releases: [{ type: "Original", year: 1989, original: true, discontinued: true }],
  },
  {
    seedKey: "18703", // frozen identity anchor -- see file header. NEVER change this once assigned.
    item: "18703",
    code: "95103",
    name: "Dash-3 Shooting Star",
    jp: "ダッシュ3号・流星",
    series: "Dash! Yonkuro",
    chassis: "Type 3",
    originalYear: 1989,
    discontinued: true,
    rarity: "Very Rare",
    estimatedMsrpJPY: 600,
    desc: "The high-speed Shooting Star on the Type 3 chassis. A classic of the first Mini 4WD boom.",
    releases: [{ type: "Original", year: 1989, original: true, discontinued: true }],
  },
  {
    seedKey: "18704", // frozen identity anchor -- see file header. NEVER change this once assigned.
    // CONFIRMED WRONG, NOT CORRECTED (catalog integrity pass, see
    // docs/CATALOG_AUDIT.md): item 18704 is a real Tamiya item number but
    // belongs to "Shadow Shark" (corrected above) -- keeping both would
    // have meant two products claiming the same real item number. No
    // confident replacement was found for this vintage 1990 "Dash-4
    // Cannon Ball" within this pass -- left genuinely undefined rather
    // than guessed.
    item: undefined,
    code: "95104",
    name: "Dash-4 Cannon Ball",
    jp: "ダッシュ4号・大砲",
    series: "Dash! Yonkuro",
    chassis: "Type 3",
    originalYear: 1990,
    discontinued: true,
    rarity: "Very Rare",
    estimatedMsrpJPY: 600,
    desc: "Heavy-hitting Cannon Ball, rounding out the Dash brothers lineup.",
    releases: [{ type: "Original", year: 1990, original: true, discontinued: true }],
  },
  // ---- Super Mini 4WD classics ----
  {
    seedKey: "19412", // frozen identity anchor -- see file header. NEVER change this once assigned.
    // CONFIRMED WRONG, NOT CORRECTED (catalog integrity pass, see
    // docs/CATALOG_AUDIT.md): item 19412 is a real Tamiya item number,
    // but it belongs to "Cyclone Magnum" (corrected elsewhere in this
    // file, verified via https://www.tamiya.com/japan/products/19412/index.html)
    // -- this collision is exactly why this field is being cleared
    // rather than left as-is. No confident replacement item number was
    // found for a "Fully Cowled"-series Astute (the live items found
    // under this name -- 18705 "Flame Astute", 18033/18037/18048
    // "Astute Jr." variants -- describe different, later products, not
    // this catalog's claimed 1992 Fully Cowled original).
    item: undefined,
    code: "95212",
    name: "Astute",
    jp: "アスチュート",
    series: "Super Mini 4WD",
    chassis: "Super 1",
    originalYear: 1992,
    rarity: "Uncommon",
    estimatedMsrpJPY: 900,
    desc: "Sharp-nosed Super Mini 4WD icon, a competitive favourite of the early 90s.",
    releases: [
      { type: "Original", year: 1992, rarity: "Rare", estimatedMsrpJPY: 700, original: true },
      { type: "Reissue", name: "Astute (Reissue)", year: 2015 },
    ],
  },
  {
    seedKey: "19413", // frozen identity anchor -- see file header. NEVER change this once assigned.
    item: "19413",
    code: "95213",
    name: "Manta Ray",
    jp: "マンタレイ",
    series: "Super Mini 4WD",
    chassis: "Super 1",
    originalYear: 1991,
    rarity: "Uncommon",
    estimatedMsrpJPY: 900,
    desc: "Wide, low manta-inspired body. One of the most recognisable Super Mini 4WD machines.",
    releases: [
      { type: "Original", year: 1991, rarity: "Rare", estimatedMsrpJPY: 700, original: true },
      { type: "Reissue", name: "Manta Ray (2015 Reissue)", year: 2015 },
    ],
  },
  {
    seedKey: "19414", // frozen identity anchor -- see file header. NEVER change this once assigned.
    item: "19414",
    code: "95214",
    name: "Fire Dragon",
    jp: "ファイヤードラゴン",
    series: "Super Mini 4WD",
    chassis: "Super 1",
    originalYear: 1992,
    rarity: "Uncommon",
    estimatedMsrpJPY: 900,
    desc: "Dragon-themed Super Mini 4WD from the classic Dragon series.",
    releases: [
      { type: "Original", year: 1992, rarity: "Rare", estimatedMsrpJPY: 700, original: true },
      { type: "Premium", name: "Fire Dragon Premium", year: 2017 },
    ],
  },
  {
    seedKey: "19415", // frozen identity anchor -- see file header. NEVER change this once assigned.
    // CONFIRMED WRONG, NOT CORRECTED (catalog integrity pass, see
    // docs/CATALOG_AUDIT.md): item 19415 is a real Tamiya item number,
    // but it belongs to "Hurricane Sonic" (corrected elsewhere in this
    // file, verified via https://www.tamiya.com/japan/products/19415/index.html)
    // -- this collision is exactly why this field is being cleared
    // rather than left as-is. No confident replacement item number was
    // found for "Dash-01 Horizon" within this pass.
    item: undefined,
    code: "95215",
    name: "Dash-01 Horizon",
    series: "Super Mini 4WD",
    chassis: "Super II",
    originalYear: 2017,
    rarity: "Rare",
    estimatedMsrpJPY: 1000,
    desc: "Wing-heavy competition body reissued for the modern Super II chassis.",
  },
  {
    seedKey: "19601", // frozen identity anchor -- see file header. NEVER change this once assigned.
    item: "19601",
    code: "95601",
    name: "Dyna-Hawk GX",
    jp: "ダイナホーク GX",
    series: "Let's & Go",
    chassis: "Super TZ",
    originalYear: 1998,
    rarity: "Rare",
    estimatedMsrpJPY: 1000,
    desc: "MAX GP machine with a distinctive hawk canopy. A late-90s standout.",
    releases: [
      { type: "Original", year: 1998, rarity: "Very Rare", estimatedMsrpJPY: 800, original: true },
      { type: "Premium", name: "Dyna-Hawk GX Premium", year: 2016, rarity: "Rare" },
    ],
  },
  {
    seedKey: "18615", // frozen identity anchor -- see file header. NEVER change this once assigned.
    item: "18615",
    code: "95415",
    name: "Mad Bull",
    jp: "マッドブル",
    series: "Racing Mini 4WD",
    chassis: "Super II",
    originalYear: 1998,
    rarity: "Common",
    estimatedMsrpJPY: 900,
    desc: "Bull-nosed off-road styling, a friendly entry point on the Super II chassis.",
    releases: [
      { type: "Original", year: 1998, rarity: "Uncommon", estimatedMsrpJPY: 700, original: true },
      { type: "Reissue", name: "Mad Bull (2013 Reissue)", year: 2013 },
    ],
  },
  {
    seedKey: "18660", // frozen identity anchor -- see file header. NEVER change this once assigned.
    item: "18660",
    code: "95460",
    name: "Trigale",
    series: "Racing Mini 4WD",
    chassis: "AR",
    originalYear: 2015,
    rarity: "Uncommon",
    estimatedMsrpJPY: 1100,
    desc: "Angular AR-chassis competition machine with a purposeful stance.",
  },
  {
    seedKey: "18091", // frozen identity anchor -- see file header. NEVER change this once assigned.
    item: "18091",
    code: "95491",
    name: "Sword Flash",
    series: "Racing Mini 4WD",
    chassis: "VZ",
    originalYear: 2020,
    rarity: "Common",
    estimatedMsrpJPY: 1100,
    desc: "Blade-like VZ chassis body tuned for light, nimble handling.",
  },
  {
    seedKey: "18092", // frozen identity anchor -- see file header. NEVER change this once assigned.
    item: "18092",
    code: "95492",
    name: "Copperfang",
    series: "Racing Mini 4WD",
    chassis: "FM-A",
    originalYear: 2019,
    rarity: "Uncommon",
    estimatedMsrpJPY: 1100,
    desc: "Front-motor FM-A machine with a low, fang-shaped nose for downforce.",
  },
  {
    seedKey: "18075", // frozen identity anchor -- see file header. NEVER change this once assigned.
    // CONFIRMED WRONG, NOT YET CORRECTED (catalog integrity pass, see
    // docs/CATALOG_AUDIT.md): item "18075" is a real Tamiya item number,
    // but it belongs to a different product -- "Dash-001 Great Emperor
    // Premium (Super-II Chassis)", confirmed at
    // https://www.tamiya.com/english/products/18075/index.html. The
    // correct item number for THIS vintage 1988 Type-3-chassis "Thunder
    // Shot" could not be confidently verified: Tamiya's current site only
    // has live pages for later Thunder Shot lineage (e.g. "Thunder Shot
    // Mk.II", item 18620, a different 2007 MS-chassis product -- reusing
    // that number here would just replace one wrong item with another).
    // Left genuinely undefined rather than kept wrong or guessed -- see
    // file header, point 2 ("unknown is better than invented"). A
    // sentinel string like "UNVERIFIED" would itself be fabricated
    // catalog data, which is exactly what this is trying to avoid; the
    // audit status "UNVERIFIED" belongs in docs/CATALOG_AUDIT.md only,
    // never in this field. Needs dedicated follow-up research.
    item: undefined,
    code: "95575",
    name: "Thunder Shot",
    jp: "サンダーショット",
    series: "Super Mini 4WD",
    chassis: "Type 3",
    originalYear: 1988,
    rarity: "Rare",
    estimatedMsrpJPY: 700,
    desc: "First-boom classic with a bold canopy. Reissued periodically as a nostalgia piece.",
    releases: [
      { type: "Original", name: "Thunder Shot (Type 3)", year: 1988, chassis: "Type 3", rarity: "Very Rare", estimatedMsrpJPY: 600, original: true, discontinued: true },
      { type: "Premium", name: "Thunder Shot Premium", year: 2015, chassis: "Super II", rarity: "Uncommon", estimatedMsrpJPY: 1000 },
    ],
  },
  {
    seedKey: "18717", // frozen identity anchor -- see file header. NEVER change this once assigned.
    item: "18717",
    code: "95117",
    name: "Emperor (Premium Black Special)",
    series: "Dash! Yonkuro",
    chassis: "AR",
    originalYear: 2017,
    rarity: "Very Rare",
    estimatedMsrpJPY: 1200,
    desc: "Blacked-out AR-chassis Emperor special. A limited run prized by Emperor collectors.",
    releases: [{ type: "Limited Edition", name: "Emperor (Premium Black Special)", year: 2017, color: "Black", original: true }],
  },
  {
    seedKey: "18718", // frozen identity anchor -- see file header. NEVER change this once assigned.
    item: "18718",
    code: "95118",
    name: "Aero Avante Japan Cup 2013",
    series: "Racing Mini 4WD",
    chassis: "MA",
    originalYear: 2013,
    rarity: "Very Rare",
    estimatedMsrpJPY: 1200,
    desc: "Japan Cup commemorative colourway of the Aero Avante. Event-limited and hard to find.",
    releases: [{ type: "Japan Cup Edition", name: "Aero Avante Japan Cup 2013", year: 2013, original: true }],
  },
]

function buildReleases(productId: string, seed: Seed): ProductRelease[] {
  const seeds: ReleaseSeed[] =
    seed.releases && seed.releases.length > 0
      ? seed.releases
      : [{ type: "Original", year: seed.originalYear, original: true, discontinued: seed.discontinued }]

  return seeds.map((r, i) => {
    // App-level estimate only (file header, point 2) -- never a verified
    // historical price. Prefers a real verifiedMsrpJPY when one exists,
    // purely so a future audit pass populating that field takes effect
    // automatically without touching this function again.
    const estimatedMsrpJPY = r.estimatedMsrpJPY ?? seed.estimatedMsrpJPY
    const verifiedMsrpJPY = r.verifiedMsrpJPY ?? undefined
    const msrpJPY = verifiedMsrpJPY ?? estimatedMsrpJPY
    return {
      // Stable key is the SEED's own frozen seedKey + release index — NOT
      // `item` (correctable factual data, see file header point 1) and
      // NOT the product UUID. Never derive this from `item` again.
      id: stableUuid(`release:${seed.seedKey}:${i + 1}`),
      productId,
      itemNumber: r.item ?? seed.item,
      releaseType: r.type,
      editionName: r.name ?? seed.name,
      releaseYear: r.year,
      releaseDate: r.releaseDate,
      chassis: r.chassis ?? seed.chassis,
      // Never invented (file header, point 2) -- undefined unless a real
      // Tamiya-confirmed barcode was found.
      barcodeJAN: r.verifiedJAN,
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

export const PRODUCTS: Product[] = SEEDS.map((s) => {
  const id = stableUuid(`product:${s.seedKey}`)
  const releases = buildReleases(id, s)
  const primary = releases.find((r) => r.isOriginal) ?? releases[0]
  return {
    id,
    category: "mini4wd",
    itemNumber: s.item,
    seedKey: s.seedKey,
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
    msrpJPY: primary.msrpJPY ?? s.verifiedMsrpJPY ?? s.estimatedMsrpJPY,
    msrpEUR: primary.msrpEUR ?? yenToEur(s.verifiedMsrpJPY ?? s.estimatedMsrpJPY),
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
      (r) => r.itemNumber?.toLowerCase() === q || r.barcodeJAN?.toLowerCase() === q,
    )
    if (releaseHit) return { product, release: releaseHit }
    if (
      product.productCode?.toLowerCase() === q ||
      product.itemNumber?.toLowerCase() === q
    ) {
      return { product }
    }
  }
  return undefined
}

export function getRelatedProducts(product: Product, limit = 4, catalog: Product[] = PRODUCTS): Product[] {
  const scored = catalog.filter((p) => p.id !== product.id).map((p) => {
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
