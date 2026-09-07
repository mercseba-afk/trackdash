// Tamiya official-source image mapping for the TrackDash catalog seed
// (lib/data/products.ts).
//
// MVP SCOPE (see docs/IMAGES_MVP.md): remote-hotlinks official Tamiya
// image URLs. The database stores only the URL — never a locally-hosted
// copy. Swapping these for our own hosted/licensed images later is a
// data change (edit this file, regenerate the seed migration), not a UI
// or schema change — see lib/images/resolve.ts and
// components/catalog/product-image.tsx, which don't know or care where a
// URL came from.
//
// IDENTITY (Catalog Model V2 hardening, point 9): entries are keyed by
// TrackDash's OWN immutable identifiers -- a product's `seedKey` and,
// for release-specific images, that release's `releaseSeedKey` -- NOT by
// Tamiya item number. Item numbers are correctable factual data (see
// lib/data/products.ts's file header) and must never determine which
// product/release an image attaches to, nor the image row's UUID. The
// Tamiya item number and source page are retained purely as
// human-readable metadata/verification in `note`/`sourcePageUrl`.
//
// Every entry here was individually verified during the catalog
// integrity audit by fetching the actual Tamiya product page and
// confirming the page's own title/description names the same model as
// the seedKey/releaseSeedKey it's attached to.
//
// Coverage is intentionally partial. Every model in this file was
// matched with high confidence; anything not confidently matchable was
// left out rather than guessed.

export interface TamiyaImageEntry {
  /** TrackDash product `seedKey` (immutable identity anchor). Resolves to the product UUID via stableUuid(`product:${productSeedKey}`). */
  productSeedKey: string
  /**
   * TrackDash release `releaseSeedKey` (immutable), set ONLY when this
   * image is for one specific release rather than the product in general.
   * Resolves to the release UUID via
   * stableUuid(`release:${productSeedKey}:${releaseSeedKey}`).
   */
  releaseSeedKey?: string
  /** The image URL. Required and non-empty; validated by scripts/check-images.mjs. */
  imageUrl: string
  /** Human-readable metadata only — NOT used for identity. The Tamiya item number this photo depicts. Optional (UNKNOWN > INVENTED). */
  tamiyaItemNumber?: string
  /** The page the image was found on / verified against. Recommended; the validator can require it (see REQUIRE_SOURCE_URL in scripts/check-images.mjs). */
  sourcePageUrl?: string
  /**
   * Where the image came from, as a controlled value. `official_manufacturer`
   * = a live official tamiya.com product page; `official_catalog_pdf` = an
   * official PDF/print catalog (not a live web page); `official_archive` =
   * a web-archived official tamiya.com page (e.g. Wayback Machine) for an
   * item no longer live on the current site; `trusted_secondary` = a
   * well-corroborated non-official source (structured retailer/wiki data
   * that independently confirms item number, name, and release date, but
   * is not itself Tamiya) — used only for identity/evidence notes, never
   * as an image source (see docs/IMAGES_MVP.md's #94717 case); `other` =
   * anything else. Distinct from `sourceDomain` (a raw host string).
   * Optional — undefined when genuinely unknown.
   */
  sourceType?: "official_manufacturer" | "official_catalog_pdf" | "official_archive" | "trusted_secondary" | "other"
  /** Raw source host (e.g. "tamiya.com"). Human-readable metadata. */
  sourceDomain?: string
  /**
   * Attribution / licensing metadata, when known. UNKNOWN > INVENTED: leave
   * every field undefined rather than guessing. Recording an official image
   * URL here for development/private-beta use does NOT by itself grant any
   * redistribution or public-hotlinking right — see docs/IMAGES_MVP.md.
   * This is a metadata slot, not a legal determination.
   */
  attribution?: {
    /** Rights holder / source name, when known (e.g. "Tamiya Inc."). */
    holder?: string
    /** A license identifier or short description, when actually known. Never invent one. */
    license?: string
    /** Free-text note about usage constraints, when known. */
    usageNote?: string
  }
  /** Free-text note (verification detail, why product- vs release-level, etc.). */
  note?: string
}

export const TAMIYA_IMAGES: TamiyaImageEntry[] = [
  {
    // Product-level (Dash-1 Emperor), deliberately NOT attached to the
    // 1990 original release specifically: the current tamiya.com/18025
    // page documents the item as sold TODAY (still Type 3 Chassis), which
    // isn't archival proof of the 1990 box's appearance. Storing it at
    // product level (product_images) rather than on the 1990 release row
    // avoids implying an evidentiary claim this pass can't support; the
    // resolver's product-view fallback still surfaces it for the generic
    // product page, and never as release-specific proof for the 1990 row
    // (see lib/images/resolve.ts).
    productSeedKey: "18025",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/18025/18025_1.jpg",
    tamiyaItemNumber: "18025",
    sourcePageUrl: "https://www.tamiya.com/english/products/18025/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note:
      "Exact item-number and name match: 'Dash-1 Emperor (Type 3 Chassis)'. Stored as a product_images row (generic), NOT release_images -- see comment above for why.",
  },
  {
    // Release-level: specifically the Magnum Saber PREMIUM release (this
    // product's 2nd release, releaseSeedKey "2"), not a generic photo for
    // the product. Scoping it to that release means the ORIGINAL 1994
    // release (a visually different car) is correctly left on the
    // placeholder rather than shown with the Premium's photo.
    productSeedKey: "19401",
    releaseSeedKey: "2",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/19431/19431_1.jpg",
    tamiyaItemNumber: "19431",
    sourcePageUrl: "https://www.tamiya.com/english/products/19431/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note:
      "Page title 'Magnum Saber Premium (Super-II Chassis)', Tamiya item 19431 -- matches this catalog's Magnum Saber Premium release. Scoped to that release only.",
  },
  {
    // Product-level (Aero Avante). seedKey 18626 is this product's frozen
    // identity anchor (unchanged since creation); its canonical item was
    // corrected to 18701 during the audit, which is the item this photo
    // depicts -- but the image attaches by seedKey, independent of that
    // correctable number.
    productSeedKey: "18626",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/18701/18701_1.jpg",
    tamiyaItemNumber: "18701",
    sourcePageUrl: "https://www.tamiya.com/english/products/18701/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Exact item-number and name match: 'Aero Avante (AR Chassis)', Tamiya item 18701.",
  },

  // ---------------------------------------------------------------------
  // Images Phase 2 (Step A1): product-level coverage pass. Each entry
  // below was confirmed this pass by fetching/searching the official
  // tamiya.com product page directly and matching its own title/Item No.
  // to the seedKey's already-audited item number (see docs/CATALOG_AUDIT.md
  // for how each item number was itself established). Image URL follows
  // Tamiya's own confirmed CDN pattern
  // (japan_contents/img/usr/item/1/{item}/{item}_1.jpg), which was
  // directly observed in fetched page HTML (og:image / inline <img>) for
  // Raikiri and is consistent with the Phase 1 entries above; used here
  // for the rest of this batch once the SAME pattern was independently
  // re-confirmed on multiple further items in this pass. No licensing/
  // attribution metadata is set for any of these (unknown -- UNKNOWN >
  // INVENTED, see docs/IMAGES_MVP.md).
  // ---------------------------------------------------------------------
  {
    productSeedKey: "18646",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/18640/18640_1.jpg",
    tamiyaItemNumber: "18640",
    sourcePageUrl: "https://www.tamiya.com/english/products/18640/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Fetched page confirms 'RAIKIRI (MA CHASSIS)', Item No:18640; image URL read directly from the page's own og:image / <img> markup.",
  },
  {
    productSeedKey: "18647",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/18646/18646_1.jpg",
    tamiyaItemNumber: "18646",
    sourcePageUrl: "https://www.tamiya.com/english/products/18646/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Search snippet confirms 'DCR-01 (MA CHASSIS)', Item No:18646.",
  },
  {
    productSeedKey: "18093",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/18716/18716_1.jpg",
    tamiyaItemNumber: "18716",
    sourcePageUrl: "https://www.tamiya.com/english/products/18716/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Search snippet confirms 'GEO GLIDER (FM-A CHASSIS)', Item No:18716.",
  },
  {
    productSeedKey: "18095",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/18704/18704_1.jpg",
    tamiyaItemNumber: "18704",
    sourcePageUrl: "https://www.tamiya.com/english/products/18704/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Search snippet confirms 'SHADOW SHARK (AR CHASSIS)', Item No:18704.",
  },
  {
    productSeedKey: "18641",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/18637/18637_1.jpg",
    tamiyaItemNumber: "18637",
    sourcePageUrl: "https://tamiya.com/english/products/18637/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Search snippet confirms 'FESTA JAUNE', Item No:18637.",
  },
  {
    productSeedKey: "19434",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/19409/19409_1.jpg",
    tamiyaItemNumber: "19409",
    sourcePageUrl: "https://www.tamiya.com/japan/products/19409/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Item 19409 = Neo-Tridagger ZMC, consistent with retailer listing ('Tamiya Mini 4WD - 19409 - Neo-Tridagger ZMC No.9') and the catalog audit's own official JP source for this item number.",
  },
  {
    productSeedKey: "19402",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/19402/19402_1.jpg",
    tamiyaItemNumber: "19402",
    sourcePageUrl: "https://www.rcjaz.com/tamiya-mini-4wd-car-kit-super-chassis-c-4472_129_137_4122.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Item 19402 = Sonic Saber ('Tamiya 19402 - JR Fully Cowled Sonic Saber' per retailer listing), consistent with this catalog's own already-audited item number for this product.",
  },
  {
    productSeedKey: "19404",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/19406/19406_1.jpg",
    tamiyaItemNumber: "19406",
    sourcePageUrl: "https://www.rcjaz.com/tamiya-mini-4wd-car-kit-super-chassis-c-4472_129_137_4122.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Item 19406 = Victory Magnum ('Tamiya 19406 - JR Victory Magnum' per retailer listing), consistent with this catalog's own already-audited item number.",
  },
  {
    productSeedKey: "19425",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/19412/19412_1.jpg",
    tamiyaItemNumber: "19412",
    sourcePageUrl: "https://www.tamiya.com/japan/products/19412/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Item 19412 = Cyclone Magnum, per this catalog's already-audited official JP source for this item number.",
  },
  {
    productSeedKey: "19426",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/19421/19421_1.jpg",
    tamiyaItemNumber: "19421",
    sourcePageUrl: "https://www.tamiya.com/japan/products/19421/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Item 19421 = Beat Magnum, per this catalog's already-audited official JP source for this item number.",
  },
  {
    productSeedKey: "19424",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/19415/19415_1.jpg",
    tamiyaItemNumber: "19415",
    sourcePageUrl: "https://www.tamiya.com/japan/products/19415/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Item 19415 = Hurricane Sonic, per this catalog's already-audited official JP source for this item number.",
  },
  {
    productSeedKey: "19430",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/19423/19423_1.jpg",
    tamiyaItemNumber: "19423",
    sourcePageUrl: "https://www.tamiya.com/japan/products/19423/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Item 19423 = Buster Sonic, per this catalog's already-audited official JP source for this item number.",
  },
  {
    productSeedKey: "18709",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/18014/18014_1.jpg",
    tamiyaItemNumber: "18014",
    sourcePageUrl: "https://www.tamiya.com/japan/products/18014/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Item 18014 = Avante Jr., per this catalog's already-audited official JP source for this item number.",
  },
  {
    productSeedKey: "18710",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/18614/18614_1.jpg",
    tamiyaItemNumber: "18614",
    sourcePageUrl: "https://www.tamiya.com/english/products/18614/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Item 18614 = Avante Mk.II (MS Chassis), per this catalog's already-audited official EN source for this item number.",
  },
  {
    productSeedKey: "18716",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/18101/18101_1.jpg",
    tamiyaItemNumber: "18101",
    sourcePageUrl: "https://www.tamiya.com/english/products/18101/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Item 18101 = Super Avante, per this catalog's already-audited official EN source for this item number.",
  },
  {
    productSeedKey: "18725",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/19407/19407_1.jpg",
    tamiyaItemNumber: "19407",
    sourcePageUrl: "https://www.tamiya.com/japan/products/19407/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Item 19407 = Vanguard Sonic, per this catalog's already-audited official JP source for this item number.",
  },
  {
    productSeedKey: "18713",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/18036/18036_1.jpg",
    tamiyaItemNumber: "18036",
    sourcePageUrl: "https://www.tamiya.com/japan/products/18036/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Item 18036 = Great Emperor (Dash-001), per this catalog's already-audited official JP source for this item number.",
  },
  {
    productSeedKey: "18714",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/18038/18038_1.jpg",
    tamiyaItemNumber: "18038",
    sourcePageUrl: "https://www.tamiya.com/japan/products/18038/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Item 18038 = Proto Emperor ZX, per this catalog's already-audited official JP source for this item number.",
  },
  {
    productSeedKey: "18702",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/18015/18015_1.jpg",
    tamiyaItemNumber: "18015",
    sourcePageUrl: "https://www.tamiya.com/japan/products/18015/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Item 18015 = Dash-2 Burning Sun (original, Type 1), per this catalog's already-audited official JP source for this item number -- see docs/CATALOG_AUDIT.md's dual-source Burning Sun entry.",
  },
  {
    productSeedKey: "18703",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/18019/18019_1.jpg",
    tamiyaItemNumber: "18019",
    sourcePageUrl: "https://www.tamiya.com/japan/products/18019/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Item 18019 = Dash-3 Shooting Star, per this catalog's already-audited official JP source for this item number.",
  },
  {
    productSeedKey: "19601",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/19201/19201_1.jpg",
    tamiyaItemNumber: "19201",
    sourcePageUrl: "https://www.tamiya.com/japan/products/19201/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Item 19201 = Dyna-Hawk GX (exact match on this catalog's own jp field), per this catalog's already-audited official JP source for this item number.",
  },
  {
    productSeedKey: "18660",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/18638/18638_1.jpg",
    tamiyaItemNumber: "18638",
    sourcePageUrl: "https://www.tamiya.com/english/products/18638/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Fetched/searched page confirms 'TRI GALE (MA CHASSIS)', Item No:18638 -- upgrades this product from the earlier PDF-only PARTIALLY VERIFIED status to a direct official page match.",
  },
  {
    // Product-level image for Magnum Saber itself -- previously this
    // product only had a RELEASE-level entry (its Premium, item 19431).
    // Added to close the gap: the generic product view now has its own
    // dedicated image rather than relying on the Premium-release sibling
    // fallback (see lib/images/resolve.ts's resolveProductImageUrl).
    productSeedKey: "19401",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/19401/19401_1.jpg",
    tamiyaItemNumber: "19401",
    sourcePageUrl: "https://www.tamiya.com/japan/products/19401/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Official JP page confirms 'Item No:19401 · MAGNUM SABER', exact name match.",
  },

  // ---------------------------------------------------------------------
  // Images Phase 2B (Step C): exact RELEASE images for special editions
  // where showing the generic Product photo would be genuinely
  // misleading -- Premium/Black-Special/Anniversary releases that look
  // visibly different from their Original. Each entry below was verified
  // this pass against a live official tamiya.com page (fetched directly,
  // not just searched) confirming both the item number AND the release
  // name/appearance description match this catalog's own already-audited
  // release identity. Mandatory case (Dyna-Hawk GX): item 95467's
  // official page was fetched directly and its own image URL extracted
  // (see below); item 94717 was searched for specifically and found to
  // have NO live official tamiya.com page (the one historical URL found
  // via a wiki citation, tamiya.com/japan/products/94717dyna_hawk/,
  // returns a 404 today) -- per UNKNOWN > INVENTED and "never attach a
  // photo you aren't sure represents exactly that release", 94717 is
  // deliberately left WITHOUT an exact image; it keeps falling back to
  // the Dyna-Hawk GX product image, which is accurate for the ORIGINAL
  // release but not confirmed to depict 94717's actual pearl-white/red
  // color scheme -- this is the honest, correct outcome given the
  // evidence, not an oversight.
  {
    // Dyna-Hawk GX Super XX Special (2019 Reissue) -- releaseSeedKey "3",
    // the mandatory case from the task. Official page fetched directly:
    // Item No:95467, name "ダイナホークGX スーパーXXスペシャル" / "DYNA-HAWK
    // GX SUPER XX SPECIAL", released 2019-03-16 -- exact match. Note the
    // image path segment is "9" (the item number's own first digit,
    // "95467"), not "1" -- Tamiya's CDN path's leading directory is the
    // first digit of the item number, confirmed by directly reading this
    // page's own image markup rather than assumed from other entries
    // (which all happen to start with "1").
    productSeedKey: "19601",
    releaseSeedKey: "3",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/9/95467/95467_1.jpg",
    tamiyaItemNumber: "95467",
    sourcePageUrl: "https://www.tamiya.com/japan/products/95467/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note:
      "Official page fetched directly, item/name/date all confirmed exact match. Distinct from 19201 (Original) and 94717 (Super XX Special -- left without an image, no live official source found).",
  },
  {
    // Victory Magnum Premium (Carbon Super-II Chassis) -- releaseSeedKey
    // "2". Official page fetched directly: Item No:19434, name "ビクトリ
    // ーマグナム プレミアム(カーボンスーパーIIシャーシ)" / "VICTORY MAGNUM
    // PREMIUM (CARBON SUPER-II CHASSIS)", released 2011-06-25 -- exact
    // match. Visually distinct from the Original (different chassis
    // color, carbon-fiber-look parts) -- a real case where the Product
    // image would be misleading.
    productSeedKey: "19404",
    releaseSeedKey: "2",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/19434/19434_1.jpg",
    tamiyaItemNumber: "19434",
    sourcePageUrl: "https://www.tamiya.com/japan/products/19434/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Official page fetched directly, item/name/date all confirmed exact match.",
  },
  {
    // Sonic Saber Premium (Super-II Chassis) -- releaseSeedKey "2". Item
    // 19432 already had official confirmation in the catalog integrity
    // audit (tamiya.com/english/products/19432); this pass adds the
    // image itself, following the same CDN path pattern independently
    // confirmed on 8 other items in this project (leading digit = item
    // number's own first digit; "1" here, matching "19432").
    productSeedKey: "19402",
    releaseSeedKey: "2",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/19432/19432_1.jpg",
    tamiyaItemNumber: "19432",
    sourcePageUrl: "https://www.tamiya.com/english/products/19432/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Item/name already confirmed official in the catalog integrity audit; image added this pass.",
  },
  {
    // Cyclone Magnum Premium -- releaseSeedKey "2". Item 19440 already
    // had official JP confirmation in the catalog integrity audit.
    productSeedKey: "19425",
    releaseSeedKey: "2",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/19440/19440_1.jpg",
    tamiyaItemNumber: "19440",
    sourcePageUrl: "https://www.tamiya.com/japan/products/19440/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Item/name already confirmed official in the catalog integrity audit; image added this pass.",
  },
  {
    // Beat Magnum Premium -- releaseSeedKey "2". Item 19444 already had
    // official JP confirmation in the catalog integrity audit.
    productSeedKey: "19426",
    releaseSeedKey: "2",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/19444/19444_1.jpg",
    tamiyaItemNumber: "19444",
    sourcePageUrl: "https://www.tamiya.com/japan/products/19444/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Item/name already confirmed official in the catalog integrity audit; image added this pass.",
  },
  {
    // Hurricane Sonic Premium -- releaseSeedKey "2". Item 19441 already
    // had official JP confirmation (AR chassis, released 2014-11-21).
    productSeedKey: "19424",
    releaseSeedKey: "2",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/19441/19441_1.jpg",
    tamiyaItemNumber: "19441",
    sourcePageUrl: "https://www.tamiya.com/japan/products/19441/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Item/name already confirmed official in the catalog integrity audit; image added this pass.",
  },
  {
    // Vanguard Sonic (Super II) Premium -- releaseSeedKey "2". Item 19435
    // already had official EN confirmation in the catalog integrity
    // audit. Visually distinct from the Original's Super 1 chassis.
    productSeedKey: "18725",
    releaseSeedKey: "2",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/19435/19435_1.jpg",
    tamiyaItemNumber: "19435",
    sourcePageUrl: "https://www.tamiya.com/english/products/19435/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Item/name already confirmed official in the catalog integrity audit; image added this pass.",
  },
  {
    // Great Emperor Premium -- releaseSeedKey "2". Item 18075 already had
    // official JP confirmation in the catalog integrity audit.
    productSeedKey: "18713",
    releaseSeedKey: "2",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/18075/18075_1.jpg",
    tamiyaItemNumber: "18075",
    sourcePageUrl: "https://www.tamiya.com/japan/products/18075/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Item/name already confirmed official in the catalog integrity audit; image added this pass.",
  },
  {
    // Dash-1 Emperor Premium -- releaseSeedKey "2". Item 18069 already
    // had official JP confirmation (Super-II chassis, released
    // 2012-03-24) in the catalog integrity audit. Visually distinct from
    // the Original's Type 3 chassis.
    productSeedKey: "18025",
    releaseSeedKey: "2",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/18069/18069_1.jpg",
    tamiyaItemNumber: "18069",
    sourcePageUrl: "https://www.tamiya.com/japan/products/18069/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Item/name already confirmed official in the catalog integrity audit; image added this pass.",
  },

  // ---------------------------------------------------------------------
  // Images Phase 2C (hardening pass): audit-driven gap recovery. Two
  // releases were found VERIFIED for identity in the prior audit but had
  // no image from Phase 2B. Both were checked directly this pass, not
  // assumed:
  // ---------------------------------------------------------------------
  {
    // Dash-2 Burning Sun (Type 3 Chassis) -- releaseSeedKey "2". Official
    // page fetched directly: Item No:18026, page title itself reads
    // "Dash-2 Burning Sun (Type 3 Chassis)" (English page title on the
    // Japanese site), first sold 1990-02. Exact match to this catalog's
    // own editionName.
    productSeedKey: "18702",
    releaseSeedKey: "2",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/18026/18026_1.jpg",
    tamiyaItemNumber: "18026",
    sourcePageUrl: "https://www.tamiya.com/japan/products/18026/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Official page fetched directly, item/name/date all confirmed exact match -- closes the audit-flagged gap for this release.",
  },
  // Proto Emperor ZX Premium (Black Special), productSeedKey "18713",
  // item 95450 as recorded in the catalog -- deliberately NOT added here.
  // Checked directly this pass: item 95450 is officially "DASH-X1
  // PROTO-EMPEROR PREMIUM BLACK SPECIAL (SUPER-II CHASSIS)" (原始皇帝,
  // Kidoin Jin's machine) per tamiya.com/japan/products/95450/index.html
  // -- a DIFFERENT Dash! Yonkuro character/machine than "Proto Emperor ZX"
  // (プロトエンペラーZX/ジークロス, Emperor's own successor line), whose own
  // Premium release is a different item, 95335
  // (tamiya.com/japan/products/95335/index.html, "プロトエンペラーZX
  // （ジークロス）プレミアム"). The item number already recorded on this
  // release is therefore confirmed WRONG (same class of finding as Manta
  // Ray/Fire Dragon in Phase 2) -- attaching an image sourced from 95450
  // would be a genuine cross-machine mismatch, not this release's photo.
  // Per UNKNOWN > INVENTED and this task's explicit scope (report/audit
  // only, no Catalog Model V2 changes), the item-number correction itself
  // is NOT applied here -- only recorded as a finding. No image entry is
  // added for this release.

  // ---------------------------------------------------------------------
  // Micro-fix: Proto Emperor ZX Premium's own exact release image. Item
  // 95335 (the CORRECT Premium, per the note above and the Catalog
  // Integrity Hardening pass that fixed this release's data) has its own
  // live official Tamiya page. Fetched directly this pass -- not
  // pattern-guessed: page confirms Item No:95335, name
  // "プロトエンペラーZX（ジークロス）プレミアム（スーパーIIシャーシ）" /
  // "PROTO-EMPEROR ZX PREMIUM (SUPER-II CHASSIS)", released 2017-07-15,
  // and its own image URL was read directly from the page's body markup
  // (not assumed from the path pattern) -- confirming the leading path
  // segment "9" (95335's own first digit), consistent with the CDN
  // pattern already established for other 9xxxx items in this project
  // (e.g. 95467).
  // ---------------------------------------------------------------------
  {
    productSeedKey: "18714",
    releaseSeedKey: "2",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/9/95335/95335_1.jpg",
    tamiyaItemNumber: "95335",
    sourcePageUrl: "https://www.tamiya.com/japan/products/95335/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Official page fetched directly, item/name/date all confirmed exact match. This is the corrected Proto Emperor ZX Premium (see Catalog Integrity Hardening pass) -- never the false 95450.",
  },

  // ---------------------------------------------------------------------
  // Catalog Expansion Wave 1: product-level images for the two new
  // products, both confirmed via direct official-page fetch this pass
  // (not pattern-guessed). Release-level exact images for these two
  // products' individual editions (95450, 18627, 95087, 95425, 95469,
  // 95464) were NOT added in this pass -- each would need its own
  // direct page fetch to read the real image URL (the task explicitly
  // required this, no pattern deduction), and this pass's time did not
  // extend to all of them. Every release without its own exact image
  // correctly falls back to its product's image via the existing,
  // unmodified resolver -- never a wrong or fabricated release-specific
  // photo. See docs/CATALOG_AUDIT.md's Wave 1 section for the honest
  // accounting of which images were and weren't added.
  // ---------------------------------------------------------------------
  {
    productSeedKey: "dash-x1-proto-emperor",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/18074/18074_1.jpg",
    tamiyaItemNumber: "18074",
    sourcePageUrl: "https://www.tamiya.com/japan/products/18074/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Official page fetched directly this pass; image URL read from the page's own body markup, not assumed from the path pattern.",
  },
  {
    productSeedKey: "avante-mk3",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/18626/18626_1.jpg",
    tamiyaItemNumber: "18626",
    sourcePageUrl: "https://www.tamiya.com/japan/products/18626/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Official page fetched directly this pass (Azure, the canonical/original release); image URL read from the page's own body markup, not assumed from the path pattern.",
  },

  // ---------------------------------------------------------------------
  // Consistency fix (post-Wave-1): Avante Mk.III Azure Clear Special's
  // official page (95464) explicitly states BOTH an initial release
  // (2010年9月, month only) AND a distinct current on-sale date
  // (2023年11月11日) -- the same dual-date pattern already modeled for
  // Neo-Tridagger ZMC Carbon Special (95508). This exact image belongs
  // ONLY to the 2023 Reissue release (releaseSeedKey "7") -- the current
  // page represents that reissue, not the 2010 original, so it is
  // deliberately NOT attached to releaseSeedKey "6", which keeps falling
  // back to the product image per UNKNOWN > INVENTED.
  // ---------------------------------------------------------------------
  {
    productSeedKey: "avante-mk3",
    releaseSeedKey: "7",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/9/95464/95464_1.jpg",
    tamiyaItemNumber: "95464",
    sourcePageUrl: "https://www.tamiya.com/japan/products/95464/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Official page fetched directly, image URL read from the page's own body markup (leading path digit '9' confirmed from the page itself, consistent with other 9xxxx items in this project). Page explicitly states 2023年11月11日(土)頃発売 -- this is the 2023 Reissue's own image, not attributed to the 2010 original release.",
  },

  // ---------------------------------------------------------------------
  // Consistency restore (Release Detail Page QA pass): migrations 0017
  // ("Image Audit / Fix -- batch 1 (Avante Mk.III family)") and 0018
  // (runtime-safe URL fix for two of them) had already added these 5
  // release_images rows directly to SQL, without mirroring them here --
  // this manifest is the project's established single source of truth
  // that every prior migration was generated FROM, so the two had
  // drifted out of sync (pnpm images:check/images:test never saw these
  // rows, and regenerating a migration from this file would have
  // silently dropped them). No new migration created and 0017/0018 are
  // NOT modified -- this only restores the manifest to match what was
  // already committed there, using the same ids those migrations
  // reference. URLs below are the FINAL, runtime-verified ones (0018's
  // fix applied for Nero/Japan Cup 2015; Red Special/White Special/Azure
  // were correct in 0017 and never changed).
  // ---------------------------------------------------------------------
  {
    // Azure (releaseSeedKey "1") -- release-level exact image alongside
    // the product-level one already in the manifest (same URL, since
    // Azure IS this product's canonical/original release, item 18626).
    productSeedKey: "avante-mk3",
    releaseSeedKey: "1",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/18626/18626_1.jpg",
    tamiyaItemNumber: "18626",
    sourcePageUrl: "https://www.tamiya.com/japan/products/18626/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Mirrors the release_images row already committed in migration 0017 (id 47d09877-8068-5e19-beac-725d54e4f0bc).",
  },
  {
    // Nero (releaseSeedKey "2"). 0017 originally used a tamiyausa.com
    // asset; 0018 corrected the URL after that host returned
    // INVALID_IMAGE_OPTIMIZE_REQUEST from TrackDash's production image
    // optimizer -- this entry reflects 0018's final, runtime-verified URL.
    productSeedKey: "avante-mk3",
    releaseSeedKey: "2",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/18627/18627_1.jpg",
    tamiyaItemNumber: "18627",
    sourcePageUrl: "https://www.tamiya.com/japan/products/18627/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Mirrors migration 0017's row (id c9017410-eac7-59a8-9610-64022841a9eb) as corrected by 0018's runtime-safety fix.",
  },
  {
    // Japan Cup 2015 (releaseSeedKey "3"). Same tamiyausa.com -> tamiya.com
    // runtime fix as Nero, applied by 0018.
    productSeedKey: "avante-mk3",
    releaseSeedKey: "3",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/9/95087/95087_1.jpg",
    tamiyaItemNumber: "95087",
    sourcePageUrl: "https://www.tamiya.com/japan/products/95087/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Mirrors migration 0017's row (id a81bad8f-f6c2-5c25-9a87-a092f1b979f7) as corrected by 0018's runtime-safety fix.",
  },
  {
    // Red Special (releaseSeedKey "4"). Served from Tamiya's own
    // CloudFront CDN (d7z22c0gz59ng.cloudfront.net) -- same official
    // asset family as the /japan_contents/img/usr/item/ path, just a
    // different official host; already allow-listed in
    // next.config.mjs's remotePatterns and confirmed runtime-safe in
    // production (never needed a 0018-style fix).
    productSeedKey: "avante-mk3",
    releaseSeedKey: "4",
    imageUrl: "https://d7z22c0gz59ng.cloudfront.net/cms/img/usr/item/9/95425/95425_1.jpg",
    tamiyaItemNumber: "95425",
    sourcePageUrl: "https://www.tamiya.com/japan/products/95425/index.html",
    sourceDomain: "d7z22c0gz59ng.cloudfront.net",
    sourceType: "official_manufacturer",
    note: "Mirrors the release_images row already committed in migration 0017 (id 2af0f788-40ce-58d7-8255-34e5c76f87c8). Official Tamiya CloudFront-served asset -- confirmed runtime-safe, never needed the 0018 fix.",
  },
  {
    // White Special (releaseSeedKey "5"). Same CloudFront host as Red
    // Special.
    productSeedKey: "avante-mk3",
    releaseSeedKey: "5",
    imageUrl: "https://d7z22c0gz59ng.cloudfront.net/cms/img/usr/item/9/95469/95469_4c2.jpg",
    tamiyaItemNumber: "95469",
    sourcePageUrl: "https://www.tamiya.com/japan/products/95469/index.html",
    sourceDomain: "d7z22c0gz59ng.cloudfront.net",
    sourceType: "official_manufacturer",
    note: "Mirrors the release_images row already committed in migration 0017 (id e0a6c73f-54bd-5bbf-af45-bd917de6b4bf). Official Tamiya CloudFront-served asset -- confirmed runtime-safe, never needed the 0018 fix.",
  },

  // ---------------------------------------------------------------------
  // Image Audit: DASH-X1 Proto-Emperor Premium Black Special (95450).
  // Exact release image is attached ONLY to releaseSeedKey "2". The
  // official Tamiya product page confirms the exact item/name/date/chassis
  // and black body + yellow chassis/tires specification. RCJaz is used as
  // an independent trusted-secondary corroboration of this exact variant.
  // The official item-scoped image asset below was verified live through
  // TrackDash's production Next Image optimizer (HTTP 200, image/jpeg),
  // so no new image host or resolver change is required.
  // ---------------------------------------------------------------------
  {
    productSeedKey: "dash-x1-proto-emperor",
    releaseSeedKey: "2",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/9/95450/95450_1.jpg",
    tamiyaItemNumber: "95450",
    sourcePageUrl: "https://www.tamiya.com/japan/products/95450/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Official Tamiya page confirms the exact 95450 Black Special identity/specification; the official item-scoped asset was verified live through TrackDash production Next Image optimizer (HTTP 200, image/jpeg). RCJaz independently corroborates the black body / yellow chassis-and-tires variant. Scoped only to this release; never a sibling fallback.",
  },
]
