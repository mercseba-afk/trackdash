import type {
  Chassis,
  EditionType,
  Product,
  ProductRelease,
  ProductionStatus,
  Rarity,
  ReleaseSource,
  ReleaseType,
  Series,
  VerificationStatus,
} from "@/lib/types"
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

// FINAL FIXES PASS (see docs/CATALOG_AUDIT.md "Final Fixes" section):
// independent review found that `itemNumber: r.item ?? seed.item` could not
// distinguish "release has no override, inherit the product's item" from
// "release was audited and its item is intentionally unknown" — both were
// written as `item: undefined` in this file, and `??` treats `undefined`
// exactly like "not provided," so audited-unknown releases were silently
// inheriting the parent's item number in the generated output/SQL instead
// of staying NULL. Fixed with explicit three-way semantics on
// `ReleaseSeed.item`:
//   - omitted entirely (not present in the object literal) → inherit the
//     product's `item`
//   - `item: null` → intentionally unknown; do NOT inherit, resolve to NULL
//   - `item: "12345"` → this release's own explicit, verified value
// Resolution in `buildReleases()` uses an explicit `=== undefined` check
// (not `??`) so `null` survives all the way to the generated SQL.
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

/** Lightweight seed-level source, expanded into a full ReleaseSource (with id/releaseId) in buildReleases(). See file header + docs/CATALOG_MODEL_V2.md section 13. */
interface ReleaseSourceSeed {
  sourceType: ReleaseSource["sourceType"]
  sourceUrl?: string
  verifiedFields: string[]
  checkedAt?: string
  notes?: string
}

interface ReleaseSeed {
  /**
   * Immutable per-release identity anchor (Catalog Model V2 hardening,
   * docs/CATALOG_MODEL_V2.md). Combined with the product's seedKey to
   * derive this release's UUID: `stableUuid(release:${productSeedKey}:${releaseSeedKey})`.
   * When omitted, defaults to the release's 1-based array position AT THE
   * TIME THE DEFAULT IS FIRST APPLIED -- which is exactly the value the
   * pre-hardening code used implicitly, so every existing release UUID
   * stays byte-identical. Once assigned (explicitly or via the default),
   * NEVER change it: reordering a product's `releases` array must not
   * change any release's UUID. New releases added to the MIDDLE of an
   * array MUST carry an explicit releaseSeedKey (the next unused value
   * for that product), never rely on the positional default, or they'd
   * shift the ids of everything after them.
   */
  releaseSeedKey?: string
  type: ReleaseType
  name?: string // edition name; defaults to the model name
  year: number
  /** Precise ISO release date, when officially verified. Most releases only have a year -- leave unset rather than guess a date. */
  releaseDate?: string
  /**
   * ITEM number for this release. Three-way semantics (see file header):
   * omitted → inherit the product's `item`; `null` → intentionally unknown,
   * do NOT inherit; a string → this release's own explicit, verified value.
   * Resolved with an explicit `=== undefined` check, never `??`, so `null`
   * is preserved rather than falling through to the parent.
   */
  item?: string | null
  chassis?: Chassis // defaults to the model chassis
  color?: string
  country?: string
  /** App-level DEMO estimate only — see file header, point 2. Read by lib/data/market.ts, NEVER by the DB seed generator. Defaults to the model's estimatedMsrpJPY. */
  estimatedMsrpJPY?: number
  /** Real Tamiya-confirmed MSRP for this specific release, when known. This is the ONLY source for the factual `msrpJPY`/`msrpEUR` output fields that flow into the database. */
  verifiedMsrpJPY?: number
  /** Real Tamiya-confirmed barcode/JAN for this specific release. Undefined unless verified — never invented. */
  verifiedJAN?: string
  rarity?: Rarity // release-specific rarity; defaults to the model rarity
  discontinued?: boolean
  original?: boolean
  notes?: string
  /**
   * Catalog Model V2 (docs/CATALOG_MODEL_V2.md section 12): explicit
   * override for how confidently this release's data is backed by
   * evidence. When omitted, buildReleases() infers a reasonable default
   * from whether `item` resolved to a real value (see that function) --
   * but that default is only a heuristic and does NOT match every case
   * (e.g. a release can have a plausible-looking, never-actually-checked
   * item number carried over from the original mock seed, which needs an
   * explicit "unverified" here rather than the item-presence default).
   */
  verificationStatus?: VerificationStatus
  /** Catalog Model V2: whether Tamiya still officially sells this exact release. Defaults to 'discontinued' when `discontinued` is true, 'unknown' otherwise -- override only when independently confirmed. */
  productionStatus?: ProductionStatus
  statusCheckedAt?: string
  /** Evidence backing this release's factual data -- see docs/CATALOG_MODEL_V2.md section 13. Practical, non-exhaustive: populated where a clean single source URL was already documented during the catalog integrity audit; empty is valid and common. */
  sources?: ReleaseSourceSeed[]
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
  /** App-level DEMO estimate only — see file header, point 2. Read by lib/data/market.ts, NEVER by the DB seed generator. Not a verified historical Tamiya MSRP. */
  estimatedMsrpJPY: number
  /** Real Tamiya-confirmed MSRP for this model's primary release, when known. This is the ONLY source for the factual `msrpJPY`/`msrpEUR` output fields that flow into the database. */
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
      { type: "Clear Body", name: "Aero Avante Clear Body (Polycarbonate)", year: 2013, rarity: "Uncommon", notes: "Lightweight polycarbonate special.", verificationStatus: "partial" },
      { type: "Color Special", name: "Aero Avante Black Special", year: 2014, color: "Black", rarity: "Uncommon", verificationStatus: "partial" },
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
      { type: "Color Special", name: "Raikiri Black Special", year: 2016, color: "Black", rarity: "Uncommon", verificationStatus: "partial" },
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
      // UNVERIFIED: this release's own distinct item number was not
      // independently checked (Premium reissues of Fully Cowled cars
      // very often use a different item number than the original, per
      // the pattern seen throughout this catalog). Explicit `null` so
      // this resolves to NULL rather than silently inheriting the
      // parent's item — see file header.
      { type: "Premium", name: "Neo-Tridagger ZMC (Premium)", year: 2016, item: null, chassis: "Super II", rarity: "Uncommon" },
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
      // CORRECTED (final fixes pass, live-verified against tamiya.com,
      // see docs/CATALOG_AUDIT.md): official page
      // https://www.tamiya.com/japan/products/19441/index.html confirms
      // "ハリケーンソニック プレミアム（ARシャーシ）" (Hurricane Sonic
      // Premium, AR Chassis), Item No. 19441, released 2014-11-21.
      { type: "Premium", name: "Hurricane Sonic Premium", year: 2014, releaseDate: "2014-11-21", item: "19441", chassis: "AR" },
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
    // CORRECTED (catalog integrity pass, live-verified against
    // tamiya.com, see docs/CATALOG_AUDIT.md): official Japanese page
    // https://www.tamiya.com/japan/products/18014/index.html confirms
    // "アバンテJr." (Avante Jr.), Item No. 18014 directly. This
    // catalog's previous item 18709 does not match. Chassis "Type 2"
    // remains corroborated by multiple retailer sources (rcMart, RC
    // Station) rather than independently re-confirmed on this specific
    // page in this pass -- PARTIALLY VERIFIED for chassis only, item
    // number itself is fully confirmed official. Premium release (2011,
    // Super II) item not independently re-checked this pass.
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
      // UNVERIFIED: this release's own distinct item number was not
      // independently checked. Explicit `null` so this resolves to NULL
      // rather than silently inheriting the parent's item — see file
      // header.
      { type: "Premium", name: "Avante (Premium)", year: 2011, item: null, chassis: "Super II", rarity: "Uncommon" },
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
      // CONFIRMED WRONG, NOT CORRECTED: item 18713 is a real Tamiya
      // number but was confirmed (see this catalog's "Great Emperor"
      // entry) to belong to "Razorback" (Mini 4WD REV series), not any
      // Dash-1 Emperor variant. No confident replacement found for this
      // specific 2013 Premium release within this pass. Explicit `null`
      // (NOT omitted, NOT `undefined`) so this resolves to NULL rather
      // than silently inheriting the parent's item — see file header.
      // CORRECTED (final fixes pass, live-verified against tamiya.com):
      // official page https://www.tamiya.com/japan/products/18069/index.html
      // confirms "ダッシュ1号エンペラー プレミアム（スーパーIIシャーシ）"
      // (Dash-1 Emperor Premium, Super-II Chassis), Item No. 18069 --
      // found on a second attempt, after 18713 was confirmed to belong
      // to a different product entirely (see the product-level note and
      // this catalog's "Great Emperor" entry). Chassis matches exactly;
      // release date 2012-03-24 independently confirmed official.
      { type: "Premium", name: "Dash-1 Emperor Premium", year: 2012, releaseDate: "2012-03-24", item: "18069", chassis: "Super II", rarity: "Uncommon", estimatedMsrpJPY: 1000 },
      { type: "Color Special", name: "Dash-1 Emperor Premium (Black Special)", year: 2015, item: "95359", chassis: "Super II", color: "Black", rarity: "Rare", estimatedMsrpJPY: 1100, verificationStatus: "unverified" },
      { type: "Anniversary Edition", name: "Dash-1 Emperor 30th Anniversary", year: 2018, item: "92403", chassis: "Super II", rarity: "Rare", estimatedMsrpJPY: 1200, verificationStatus: "unverified" },
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
    // CORRECTED (catalog integrity pass, live-verified against
    // tamiya.com, see docs/CATALOG_AUDIT.md): official Japanese page
    // https://www.tamiya.com/japan/products/18036/index.html confirms
    // "ダッシュ001号・大帝（グレート・エンペラー）" (Dash-001 Great
    // Emperor), Item No. 18036. This catalog's previous item 18713 is a
    // real Tamiya item number but belongs to a completely different
    // product ("Razorback", Mini 4WD REV series, FM-A chassis --
    // confirmed via a major Japanese retailer listing). Chassis/year
    // carried over from the seed, not independently re-verified against
    // the official page's own detail text -- PARTIALLY VERIFIED for
    // those two fields.
    item: "18036",
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
      // CORRECTED: official page
      // https://www.tamiya.com/japan/products/18075/index.html confirms
      // "グレートエンペラー プレミアム（スーパーIIシャーシ）" (Great
      // Emperor Premium, Super-II Chassis), Item No. 18075 -- this is
      // the SAME item 18075 that this catalog's "Thunder Shot" entry
      // was previously (also wrongly) using; see that product's own
      // correction note.
      { type: "Premium", name: "Great Emperor Premium", year: 2015, item: "18075", chassis: "Super II", rarity: "Rare", estimatedMsrpJPY: 1000 },
    ],
  },
  {
    seedKey: "18714", // frozen identity anchor -- see file header. NEVER change this once assigned.
    // CORRECTED (catalog integrity pass, live-verified against
    // tamiya.com, see docs/CATALOG_AUDIT.md): official Japanese page
    // https://www.tamiya.com/japan/products/18038/index.html confirms
    // "原始皇帝(プロトエンペラーZX)" (PROTO-EMPEROR ZX), Item No.
    // 18038, released 2007-09-01. This catalog's previous item 18714
    // belongs to a different product ("Mach Frame", Mini 4WD REV
    // series). Chassis "Super II" carried over, not independently
    // re-verified against this specific page's own detail text --
    // PARTIALLY VERIFIED for chassis/year only, item number is fully
    // confirmed official.
    item: "18038",
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
      // CORRECTED: official page
      // https://www.tamiya.com/japan/products/95450/index.html confirms
      // "ダッシュX1・原始皇帝（プロトエンペラー）プレミアム ブラック
      // スペシャル（スーパーIIシャーシ）" -- an exact name match for
      // this release, Item No. 95450, Super-II chassis (confirmed by
      // the page's own title). Year 2019 carried over, not
      // independently re-confirmed on this page -- PARTIALLY VERIFIED
      // for year only.
      { type: "Color Special", name: "Proto Emperor ZX Premium (Black Special)", year: 2019, item: "95450", chassis: "Super II", color: "Black", rarity: "Very Rare", estimatedMsrpJPY: 1200 },
    ],
  },
  {
    seedKey: "18702", // frozen identity anchor -- see file header. NEVER change this once assigned.
    // CORRECTED (final fixes pass, see docs/CATALOG_AUDIT.md "Final
    // Fixes" section): independent review confirmed both official
    // Japanese pages found in the earlier pass describe TWO distinct,
    // genuinely official releases of the same body, not a contradiction
    // to resolve by picking one:
    //   - https://www.tamiya.com/japan/products/18015/index.html --
    //     Item No. 18015, "レーサーミニ四駆シリーズ No.15", Type 1
    //     chassis, first sold 1989-02, spike tires. The ORIGINAL.
    //   - https://www.tamiya.com/japan/products/18026/index.html --
    //     Item No. 18026, Type 3 chassis SPEC, first sold 1990-02, slick
    //     tires. A later reissue of the same body.
    // Both fields (name, series) agree between the two pages; chassis
    // and year differ because they're two distinct real releases, now
    // modeled as two separate release rows below rather than collapsed
    // into one. The 18026 row is a genuinely NEW release addition (new
    // stable id, seed array position 2 was never previously allocated
    // for this seedKey) -- the existing 18015 release keeps its
    // original id unchanged.
    // Also corrected: this catalog's own `jp` field previously read
    // "大鷲" ("Great Eagle"), which doesn't describe "Burning Sun" at
    // all and doesn't match either official page's own name
    // ("太陽（バーニング・サン）" / "Taiyo (Burning Sun)") -- updated to
    // the official name.
    item: "18015",
    code: "95102",
    name: "Dash-2 Burning Sun",
    jp: "ダッシュ2号・太陽（バーニング・サン）",
    series: "Dash! Yonkuro",
    chassis: "Type 1",
    originalYear: 1989,
    discontinued: true,
    rarity: "Grail",
    estimatedMsrpJPY: 600,
    desc: "Vintage Type 1 rival machine from the Dash! Yonkuro era. Extremely collectible in sealed condition.",
    releases: [
      { type: "Original", year: 1989, item: "18015", chassis: "Type 1", original: true, discontinued: true },
      // NEW release (see product-level note above): official page
      // https://www.tamiya.com/japan/products/18026/index.html, Item
      // No. 18026, Type 3 chassis, first sold 1990-02, slick tires
      // (replacing the Type 1 original's spike tires). No releaseDate
      // set: the source confirms year-month only, not an exact day --
      // inventing a day would be exactly the kind of unsupported
      // precision this audit exists to avoid.
      { type: "Reissue", name: "Dash-2 Burning Sun (Type 3 Chassis)", year: 1990, item: "18026", chassis: "Type 3", discontinued: true, rarity: "Very Rare", estimatedMsrpJPY: 600 },
    ],
  },
  {
    seedKey: "18703", // frozen identity anchor -- see file header. NEVER change this once assigned.
    // CORRECTED (catalog integrity pass, see docs/CATALOG_AUDIT.md):
    // official Japanese page
    // https://www.tamiya.com/japan/products/18019/index.html confirms
    // "ダッシュ3号・流星（シューティングスター）" (Dash-3
    // Shooting Star), Item No. 18019, first sold 1989-09. Chassis
    // "Type 3" and year 1989 already matched this catalog's existing
    // data -- only the item number was wrong (18703 is a real Tamiya
    // item number but belongs to a different product, "Aero Manta Ray",
    // per a lead found incidentally during this pass, not independently
    // confirmed).
    item: "18019",
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
      { type: "Original", year: 1991, rarity: "Rare", estimatedMsrpJPY: 700, original: true, verificationStatus: "unverified" },
      { type: "Reissue", name: "Manta Ray (2015 Reissue)", year: 2015, verificationStatus: "unverified" },
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
      { type: "Original", year: 1992, rarity: "Rare", estimatedMsrpJPY: 700, original: true, verificationStatus: "unverified" },
      { type: "Premium", name: "Fire Dragon Premium", year: 2017, verificationStatus: "unverified" },
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
    // CORRECTED (final fixes pass, live-verified against tamiya.com, see
    // docs/CATALOG_AUDIT.md): official Japanese page
    // https://www.tamiya.com/japan/products/19201/index.html confirms
    // "ダイナホーク GX" (exact match on this catalog's own jp field),
    // Item No. 19201, Super X chassis, "1/32 マイティミニ四駆シリーズ"
    // (Mighty Mini 4WD series). This catalog's previous item 19601 does
    // not match. Product-level chassis/series updated to this official
    // page's own values (Super X / Mighty) -- superseding an earlier,
    // narrower correction pass that only fixed the item number and left
    // these two fields flagged PARTIALLY VERIFIED against a mismatch;
    // that mismatch is now resolved by adopting the canonical 19201
    // identity outright, per independent review.
    item: "19201",
    code: "95601",
    name: "Dyna-Hawk GX",
    jp: "ダイナホーク GX",
    series: "Mighty",
    chassis: "Super X",
    originalYear: 1998,
    rarity: "Rare",
    estimatedMsrpJPY: 1000,
    desc: "MAX GP machine with a distinctive hawk canopy. A late-90s standout.",
    releases: [
      { type: "Original", year: 1998, item: "19201", chassis: "Super X", rarity: "Very Rare", estimatedMsrpJPY: 800, original: true },
      // PARTIALLY VERIFIED (item number itself, not just the date): item
      // 94717 ("Dyna-Hawk GX Super XX Special") is corroborated with
      // unusual strength and consistency across many independent
      // sources -- a structured wiki infobox, an Amazon Tamiya-brand
      // listing, and multiple retailers across several countries, all
      // agreeing on item 94717 and a 2010-03-13 release date -- but NO
      // official Tamiya source (live page, PDF catalog, or archive) was
      // found confirming this item number directly. Written here as a
      // real release given the strength/consistency of the
      // corroboration, per explicit instruction not to omit a
      // genuinely-supported release just because Tamiya's own site no
      // longer hosts a live page for a 2010, since-discontinued
      // limited-edition kit -- but this stays PARTIALLY VERIFIED, not
      // VERIFIED, until an official Tamiya source is actually found for
      // the item number itself, not only the surrounding facts.
      { type: "Color Special", name: "Dyna-Hawk GX Super XX Special", year: 2010, releaseDate: "2010-03-13", item: "94717", chassis: "Super XX", rarity: "Rare", verificationStatus: "partial" },
      // VERIFIED (replaces this slot's previous fake, unsupported "Dyna-
      // Hawk GX Premium — 2016 — item 19201," which never represented a
      // real Tamiya release): official page
      // https://www.tamiya.com/japan/products/95467/index.html confirms
      // "ダイナホークGX スーパーXXスペシャル" (Dyna-Hawk GX Super XX
      // Special, a re-release of item 94717 above), Item No. 95467,
      // Super XX chassis. Release date 2019-03-16 independently
      // confirmed official.
      { type: "Reissue", name: "Dyna-Hawk GX Super XX Special (2019 Reissue)", year: 2019, releaseDate: "2019-03-16", item: "95467", chassis: "Super XX", rarity: "Uncommon" },
    ],
  },
  {
    seedKey: "18615", // frozen identity anchor -- see file header. NEVER change this once assigned.
    // CONFIRMED WRONG, NOT CORRECTED (catalog integrity pass, see
    // docs/CATALOG_AUDIT.md): official Japanese page
    // https://www.tamiya.com/japan/products/18615/index.html confirms
    // item 18615 is actually "マンタレイMk.II" (Manta Ray Mk.II, PRO
    // series), not "Mad Bull". No confident replacement item number was
    // found for "Mad Bull" within this pass.
    item: undefined,
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
      // UNVERIFIED: this release's own item number was not independently
      // checked. Explicit `null` for clarity/consistency, even though
      // the parent product's own item is also undefined right now (see
      // file header for the intentional-unknown semantics).
      { type: "Reissue", name: "Mad Bull (2013 Reissue)", year: 2013, item: null },
    ],
  },
  {
    seedKey: "18660", // frozen identity anchor -- see file header. NEVER change this once assigned.
    // CORRECTED (catalog integrity pass, see docs/CATALOG_AUDIT.md):
    // item 18660 is confirmed (via an official Tamiya America new-item
    // announcement page, tamiya.com/english/newstopics, listing "Stier
    // (MA Chassis) (Item 18660)") to belong to a different product,
    // "Stier". "Tri Gale" ("JR Tri Gale") appears consistently across
    // multiple official Tamiya America MAP price list PDFs as item
    // 18638 -- PARTIALLY VERIFIED (official-adjacent PDF source, not a
    // direct tamiya.com product-page fetch in this pass).
    item: "18638",
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
    // Catalog Model V2: genuinely searched (by name, twice) with no result
    // found at all -- item 18091 is carried over from the original mock
    // seed, never confirmed OR disproven. Explicit "unverified" override
    // since the default (item present -> "verified") would be wrong here.
    releases: [{ type: "Original", year: 2020, original: true, verificationStatus: "unverified" }],
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
    // Catalog Model V2: same as Sword Flash above -- genuinely searched,
    // no result found, item 18092 carried over unconfirmed.
    releases: [{ type: "Original", year: 2019, original: true, verificationStatus: "unverified" }],
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
    releases: [{ type: "Limited Edition", name: "Emperor (Premium Black Special)", year: 2017, color: "Black", original: true, verificationStatus: "unverified" }],
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
    releases: [{ type: "Japan Cup Edition", name: "Aero Avante Japan Cup 2013", year: 2013, original: true, verificationStatus: "unverified" }],
  },
]

// Catalog Model V2 (docs/CATALOG_MODEL_V2.md section 5): coarse,
// deliberately small classification derived automatically from the
// existing (richer, free-text-ish) ReleaseType -- never annotated
// per-release by hand, so it can never drift from releaseType. Not
// attempting to encode every Tamiya marketing phrase; "other" is a
// legitimate, common bucket.
function inferEditionType(type: ReleaseType, isOriginal: boolean): EditionType {
  if (isOriginal) return "original"
  switch (type) {
    case "Premium":
      return "premium"
    case "Color Special":
    case "Clear Body":
      return "color_special"
    case "Limited Edition":
      return "limited"
    case "Anniversary Edition":
      return "anniversary"
    case "Japan Cup Edition":
      return "japan_cup"
    case "Reissue":
      return "reissue"
    case "Special Edition":
    case "Chassis Variant":
      return "special"
    default:
      return "other"
  }
}

// Catalog Model V2 (docs/CATALOG_MODEL_V2.md section 13): provenance for
// releases whose factual data was confirmed against an official Tamiya
// source during the catalog integrity audit. Keyed by
// `${productSeedKey}:${releaseSeedKey}` (hardening point 6) -- the same
// immutable addressing scheme as release id generation, NOT array
// position. For every current release the releaseSeedKey equals its
// original 1-based array position (the positional default), so these keys
// are unchanged; but a future reorder that assigns/keeps explicit
// releaseSeedKeys keeps these attached correctly. Deliberately NOT
// exhaustive -- populated only from URLs already documented in this file's
// own inline comments during that earlier audit (see docs/CATALOG_AUDIT.md),
// never from new research. A release with no entry here simply has an empty
// `sources` array; that's valid and common, not an error.
const KNOWN_SOURCES: Record<string, ReleaseSourceSeed[]> = {
  "18626:1": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/english/products/18701/index.html", verifiedFields: ["itemNumber", "chassis"], checkedAt: "2026-09-03" }],
  "19404:2": [
    { sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/english/products/19434/index.html", verifiedFields: ["itemNumber", "chassis", "releaseDate"], checkedAt: "2026-09-04" },
    { sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/japan/products/19434/index.html", verifiedFields: ["itemNumber", "chassis", "releaseDate"], checkedAt: "2026-09-04" },
  ],
  "19402:2": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/english/products/19432/index.html", verifiedFields: ["itemNumber", "chassis"], checkedAt: "2026-09-04" }],
  "18641:1": [
    { sourceType: "official_catalog_pdf", sourceUrl: "https://www.tamiyausa.com/media/files/map-price-list-jan-2019-969-c5cb.pdf", verifiedFields: ["itemNumber"], checkedAt: "2026-09-04", notes: "Official Tamiya America MAP price list PDF -- confirms this catalog's OLD (wrong) item was really 'Shooting Proud Star'." },
    { sourceType: "official_manufacturer", sourceUrl: "https://tamiya.com/english/products/18637/index.html", verifiedFields: ["itemNumber", "chassis"], checkedAt: "2026-09-04" },
  ],
  "19434:1": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/japan/products/19409/index.html", verifiedFields: ["itemNumber", "chassis"], checkedAt: "2026-09-04" }],
  "18725:1": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/japan/products/19407/index.html", verifiedFields: ["itemNumber"], checkedAt: "2026-09-04" }],
  "18725:2": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/english/products/19435/index.html", verifiedFields: ["itemNumber", "chassis"], checkedAt: "2026-09-04" }],
  "19425:1": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/japan/products/19412/index.html", verifiedFields: ["itemNumber"], checkedAt: "2026-09-04" }],
  "19425:2": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/japan/products/19440/index.html", verifiedFields: ["itemNumber", "chassis", "releaseDate"], checkedAt: "2026-09-04" }],
  "19426:1": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/japan/products/19421/index.html", verifiedFields: ["itemNumber"], checkedAt: "2026-09-04" }],
  "19426:2": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/japan/products/19444/index.html", verifiedFields: ["itemNumber", "chassis", "releaseDate"], checkedAt: "2026-09-04" }],
  "19424:1": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/japan/products/19415/index.html", verifiedFields: ["itemNumber"], checkedAt: "2026-09-04" }],
  "19424:2": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/japan/products/19441/index.html", verifiedFields: ["itemNumber", "chassis", "releaseDate"], checkedAt: "2026-09-04" }],
  "19430:1": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/japan/products/19423/index.html", verifiedFields: ["itemNumber"], checkedAt: "2026-09-04" }],
  "18709:1": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/japan/products/18014/index.html", verifiedFields: ["itemNumber"], checkedAt: "2026-09-04" }],
  "18710:1": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/english/products/18614/index.html", verifiedFields: ["itemNumber", "chassis", "releaseDate"], checkedAt: "2026-09-03" }],
  "18716:1": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/english/products/18101/index.html", verifiedFields: ["itemNumber"], checkedAt: "2026-09-03" }],
  "18713:1": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/japan/products/18036/index.html", verifiedFields: ["itemNumber"], checkedAt: "2026-09-04" }],
  "18713:2": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/japan/products/18075/index.html", verifiedFields: ["itemNumber", "chassis"], checkedAt: "2026-09-04" }],
  "18025:1": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/japan/products/18025/index.html", verifiedFields: ["itemNumber", "chassis", "releaseYear"], checkedAt: "2026-09-04" }],
  "18025:2": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/japan/products/18069/index.html", verifiedFields: ["itemNumber", "chassis", "releaseDate"], checkedAt: "2026-09-04" }],
  "18025:5": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/english/products/18025/index.html", verifiedFields: ["chassis"], checkedAt: "2026-06-24", notes: "Page explicitly dated 'current as of June 24, 2026'; confirms the 2026 reissue is still Type 3 chassis, not Super-II." }],
  "18714:1": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/japan/products/18038/index.html", verifiedFields: ["itemNumber", "releaseDate"], checkedAt: "2026-09-04" }],
  "18714:2": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/japan/products/95450/index.html", verifiedFields: ["itemNumber", "chassis"], checkedAt: "2026-09-04" }],
  "18702:1": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/japan/products/18015/index.html", verifiedFields: ["itemNumber", "chassis", "releaseYear"], checkedAt: "2026-09-04" }],
  "18702:2": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/japan/products/18026/index.html", verifiedFields: ["itemNumber", "chassis", "releaseYear"], checkedAt: "2026-09-04" }],
  "18703:1": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/japan/products/18019/index.html", verifiedFields: ["itemNumber", "chassis", "releaseYear"], checkedAt: "2026-09-04" }],
  "18660:1": [{ sourceType: "official_catalog_pdf", sourceUrl: "https://www.tamiyausa.com/media/files/map-price-list-jan-2019-969-c5cb.pdf", verifiedFields: ["itemNumber"], checkedAt: "2026-09-04", notes: "'Tri Gale' consistently listed as item 18638 across multiple official Tamiya America MAP price list PDFs." }],
  "19601:1": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/japan/products/19201/index.html", verifiedFields: ["itemNumber"], checkedAt: "2026-09-04" }],
  "19601:3": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/japan/products/95467/index.html", verifiedFields: ["itemNumber", "chassis", "releaseDate"], checkedAt: "2026-09-04" }],
  "18615:1": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/japan/products/18615/index.html", verifiedFields: ["itemNumber"], checkedAt: "2026-09-04", notes: "Confirms item 18615 is really Manta Ray Mk.II, not this product -- source for why the item was cleared to NULL." }],
  "18646:1": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/english/products/18640/index.html", verifiedFields: ["itemNumber", "chassis"], checkedAt: "2026-09-03" }],
  "18647:1": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/english/products/18646/index.html", verifiedFields: ["itemNumber"], checkedAt: "2026-09-03" }],
  "18093:1": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/english/products/18716/index.html", verifiedFields: ["itemNumber", "releaseYear"], checkedAt: "2026-09-03" }],
  "18095:1": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/english/products/18704/index.html", verifiedFields: ["itemNumber", "chassis"], checkedAt: "2026-09-03" }],
  "19401:2": [{ sourceType: "official_manufacturer", sourceUrl: "https://www.tamiya.com/english/products/19431/index.html", verifiedFields: ["itemNumber", "chassis"], checkedAt: "2026-09-03" }],
}

// Catalog Model V2 hardening (point 6): keyed by
// `${productSeedKey}:${releaseSeedKey}`, NOT array position -- so moving a
// release within its product's array can never detach it from its sources.
function lookupSources(productSeedKey: string, releaseSeedKey: string): ReleaseSourceSeed[] {
  return KNOWN_SOURCES[`${productSeedKey}:${releaseSeedKey}`] ?? []
}

function buildReleases(productId: string, seed: Seed): ProductRelease[] {
  const seeds: ReleaseSeed[] =
    seed.releases && seed.releases.length > 0
      ? seed.releases
      : [{ type: "Original", year: seed.originalYear, original: true, discontinued: seed.discontinued }]

  return seeds.map((r, i) => {
    // FACTUAL fields (flow into the database — see file header): verified
    // ONLY, never fall back to the demo estimate. undefined here means the
    // generated SQL writes NULL, exactly as it should for anything not
    // confidently verified against an official source.
    const verifiedMsrpJPY = r.verifiedMsrpJPY ?? seed.verifiedMsrpJPY ?? undefined
    const msrpJPY = verifiedMsrpJPY
    const msrpEUR = msrpJPY !== undefined ? yenToEur(msrpJPY) : undefined

    // DEMO-ONLY field (file header, point 2): read exclusively by
    // lib/data/market.ts's already-"demo"-labeled pricing engine. NEVER
    // read by scripts/generate-catalog-seed.mjs or any other DB-seeding
    // code — see that script's own INSERT column list, which deliberately
    // does not reference this field.
    const estimatedMsrpJPY = r.estimatedMsrpJPY ?? seed.estimatedMsrpJPY
    const estimatedMsrpEUR = yenToEur(estimatedMsrpJPY)

    // Explicit undefined check (NOT `??`) so `item: null` (intentionally
    // unknown, do not inherit) is preserved instead of silently falling
    // through to the parent's item — see file header for the three-way
    // semantics this depends on.
    const itemNumber = (r.item === undefined ? seed.item : r.item) ?? undefined
    // Catalog Model V2 hardening (point 6): the release UUID derives from
    // the product's seedKey + this release's OWN immutable releaseSeedKey,
    // NOT its array position. The default (String(i + 1)) reproduces the
    // exact pre-hardening positional value, so every existing UUID stays
    // byte-identical -- but once a release carries an explicit
    // releaseSeedKey, reordering the array can never change its id.
    const releaseSeedKey = r.releaseSeedKey ?? String(i + 1)
    const releaseId = stableUuid(`release:${seed.seedKey}:${releaseSeedKey}`)
    const isOriginal = Boolean(r.original)

    // Provenance for this release -- computed early because
    // verificationStatus (below) derives from it. Combines any inline
    // r.sources with the curated KNOWN_SOURCES lookup, both keyed by the
    // immutable productSeedKey + releaseSeedKey (hardening point 6).
    const sources: ReleaseSource[] = [...(r.sources ?? []), ...lookupSources(seed.seedKey, releaseSeedKey)].map((s, si) => ({
      id: stableUuid(`release-source:${seed.seedKey}:${releaseSeedKey}:${si + 1}`),
      releaseId,
      sourceType: s.sourceType,
      sourceUrl: s.sourceUrl,
      verifiedFields: s.verifiedFields,
      checkedAt: s.checkedAt,
      notes: s.notes,
    }))

    // Catalog Model V2 hardening (point 4): SAFE default is "unverified".
    // A plausible item number is NEVER verification. A release becomes
    // "verified" only via (a) an explicit r.verificationStatus, or (b)
    // carrying at least one OFFICIAL source (official_manufacturer /
    // official_catalog_pdf / official_archive) in the curated KNOWN_SOURCES
    // table that verifies a factual field the release actually HAS. The
    // KNOWN_SOURCES table is itself the explicit, hand-curated record of
    // what was officially confirmed during the catalog integrity audit --
    // so deriving "verified" from it is an explicit editorial signal, NOT
    // the banned "item present => verified" heuristic. Mad Bull's source,
    // for instance, documents why its item is NULL (it verifies a field
    // the release does NOT have), so Mad Bull correctly stays unverified.
    // Every "verified" release therefore provably has provenance, which the
    // invariant checker enforces as a HARD FAIL.
    const officialFieldsBacked = sources.some((s) => {
      const isOfficial = s.sourceType === "official_manufacturer" || s.sourceType === "official_catalog_pdf" || s.sourceType === "official_archive"
      if (!isOfficial) return false
      return s.verifiedFields.some((f) => {
        if (f === "itemNumber") return itemNumber !== undefined
        if (f === "chassis") return (r.chassis ?? seed.chassis) !== undefined
        if (f === "releaseYear") return r.year !== undefined
        if (f === "releaseDate") return r.releaseDate !== undefined
        return false
      })
    })
    const verificationStatus: VerificationStatus = r.verificationStatus ?? (officialFieldsBacked ? "verified" : "unverified")

    // Catalog Model V2 hardening (point 11): production_status is a
    // FACTUAL, official piece of information -- never auto-derived from the
    // legacy `discontinued` prototype boolean without evidence. Default is
    // "unknown"; active/announced/discontinued are set explicitly only
    // with a real status check. The legacy `discontinued` compatibility
    // boolean now DERIVES FROM production_status (see below), not the
    // reverse.
    const productionStatus: ProductionStatus = r.productionStatus ?? "unknown"
    // Compatibility field, now derived FROM production_status (point 11):
    // only true when we have positive factual evidence the release is
    // discontinued. A seed-level `discontinued: true` with no explicit
    // productionStatus no longer silently becomes a factual claim -- it
    // must go through productionStatus to take effect.
    const discontinuedCompat = productionStatus === "discontinued"

    return {
      // Stable key is the SEED's own frozen seedKey + release index — NOT
      // `item` (correctable factual data, see file header point 1) and
      // NOT the product UUID. Never derive this from `item` again.
      id: releaseId,
      productId,
      itemNumber,
      releaseType: r.type,
      editionType: inferEditionType(r.type, isOriginal),
      editionName: r.name ?? seed.name,
      // Catalog Model V2 hardening (point 2): release year can be
      // genuinely unknown for a future catalog item. Every current seed
      // provides one, so this is a capability change, not a data change.
      releaseYear: r.year,
      releaseDate: r.releaseDate,
      // Catalog Model V2 hardening (point 2): chassis can be genuinely
      // unknown too. Falls back to the product's chassis only when the
      // product HAS one; never invents a default (no more "MA").
      chassis: r.chassis ?? seed.chassis,
      // Never invented (file header, point 2) -- undefined unless a real
      // Tamiya-confirmed barcode was found.
      barcodeJAN: r.verifiedJAN,
      color: r.color,
      countryMarket: r.country ?? "Japan",
      msrpJPY,
      msrpEUR,
      estimatedMsrpJPY,
      estimatedMsrpEUR,
      images: [],
      notes: r.notes,
      discontinued: discontinuedCompat,
      isOriginal,
      rarity: r.rarity,
      verificationStatus,
      productionStatus,
      statusCheckedAt: r.statusCheckedAt,
      sources,
    }
  })
}

export const PRODUCTS: Product[] = SEEDS.map((s) => {
  const id = stableUuid(`product:${s.seedKey}`)
  const releases = buildReleases(id, s)
  const primary = releases.find((r) => r.isOriginal) ?? releases[0]
  // Catalog Model V2 (docs/CATALOG_MODEL_V2.md section 10): the release
  // considered authoritative for this model's identity. Every current
  // product's seed marks exactly one release `original: true`, so this
  // resolves for all 36 -- but the code makes no assumption that it always
  // will (a future product added without a confidently-identified original
  // simply gets `canonicalReleaseId: undefined`, never a forced/arbitrary
  // choice; see scripts/check-catalog-invariants.mjs, which enforces this).
  const canonicalRelease = releases.find((r) => r.isOriginal)
  return {
    id,
    category: "mini4wd",
    // COMPATIBILITY/CACHE fields (Catalog Model V2, docs/CATALOG_MODEL_V2.md
    // section 11 + hardening point 1): STRICTLY derived from the canonical
    // release. When there is no canonical release, these are undefined (→
    // NULL in the DB), NEVER filled from the seed's own top-level fields or
    // any invented default. UNKNOWN > INVENTED is a real property of the
    // model here, not just documentation: a product with no confidently-
    // identified original genuinely has no canonical item/chassis/year, and
    // the UI shows "—". Every current product has a canonical release, so
    // this changes no existing data -- it's a capability change.
    itemNumber: canonicalRelease?.itemNumber,
    seedKey: s.seedKey,
    productCode: s.code,
    name: s.name,
    japaneseName: s.jp,
    series: s.series,
    chassis: canonicalRelease?.chassis,
    originalReleaseYear: canonicalRelease?.releaseYear,
    rarity: s.rarity,
    description: s.desc,
    images: [],
    releases,
    canonicalReleaseId: canonicalRelease?.id,
    hasMultipleReleases: releases.length > 1,
    // FACTUAL, verified-only -- undefined unless a real Tamiya-confirmed
    // figure exists (own or inherited from the primary release). Never
    // falls back to the demo estimate.
    msrpJPY: primary.msrpJPY ?? s.verifiedMsrpJPY ?? undefined,
    msrpEUR: primary.msrpEUR ?? (s.verifiedMsrpJPY !== undefined ? yenToEur(s.verifiedMsrpJPY) : undefined),
    // DEMO estimate only -- read exclusively by lib/data/market.ts.
    estimatedMsrpJPY: primary.estimatedMsrpJPY ?? s.estimatedMsrpJPY,
    estimatedMsrpEUR: primary.estimatedMsrpEUR ?? yenToEur(s.estimatedMsrpJPY),
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
    if (p.chassis && product.chassis && p.chassis === product.chassis) score += 2
    if (p.rarity === product.rarity) score += 1
    // Catalog Model V2 hardening (point 2): year proximity only scores when
    // BOTH years are known; an unknown year simply doesn't contribute.
    if (p.originalReleaseYear !== undefined && product.originalReleaseYear !== undefined && Math.abs(p.originalReleaseYear - product.originalReleaseYear) <= 3) score += 1
    return { p, score }
  })
  return scored
    .sort((a, b) => b.score - a.score || (b.p.originalReleaseYear ?? -Infinity) - (a.p.originalReleaseYear ?? -Infinity))
    .slice(0, limit)
    .map((s) => s.p)
}

export const CHASSIS_OPTIONS = Array.from(new Set(PRODUCTS.map((p) => p.chassis)))
export const SERIES_OPTIONS = Array.from(new Set(PRODUCTS.map((p) => p.series)))
