# Speed Champions release plan

## Private integration

1. Use `speed-champions` as the explicit catalog category. Make catalog, scanner, collection, wishlist, saved views, offers, messages and market queries category-aware before importing the 19 pilot set identities. Audit shared queries for fallback to Mini 4WD and validate category ownership on writes. Keep shared accounts and sign-in.
2. Import the existing manifest with stable IDs and provenance into an isolated database. Use LEGO set numbers and verified EANs as separate identifiers. Keep individual cars from multi-car packs, parts, instructions and empty packaging outside the set catalog and valuation.
3. Reuse the existing market engine, with dedicated LEGO matching and initial scan targets. Start with a small sample, separate ASK and SOLD, and require enough verified completed sales for each condition before producing a Market Value. Keep both the LEGO rollout and its scan budget independent of the Mini 4WD queue.
4. Give Admin a compact Speed Champions panel. Show aggregate page views for 7 and 30 days, the most viewed set pages and recent scan coverage. Filter existing path-based traffic counters by vertical before aggregating and exclude private previews and admin visits. If adding outbound clicks, use the destination and set number and respect the existing analytics consent. Share the Admin layout, not the counters. Defer extra charts until there is enough traffic.

## Public release

Keep LEGO behind the owner gate until the new public site is ready. Launch the indexable LEGO catalog and set pages with the new home page, working links, canonical URLs and sitemap entries. Publish verified exact Amazon links for eligible sets. Show verified asking prices and available market data with their respective labels. Keep collection and wishlist private until both verticals have passed the relevant user flows.

Mini 4WD public paths and existing workflow should pass a comparison before and after the release. Confirm that collection, wishlist, market calculations and scan scheduling cannot pick up records from the wrong category.

## Generating the disposable database seed

Run `node scripts/generate-speed-champions-preview-seed.mjs` to generate SQL from the existing manifest. The script does not connect to a database. The SQL accepts only a disposable PostgreSQL database named `trackdash_speed_preview`, after the base migrations and the Speed Champions foundation have been applied. It imports the existing set and release IDs, official references and bundled image paths. The imported rows remain in preparation and do not enroll in market scans.

The catalog and detail pages can read those imported rows in local Next.js development with `TRACKDASH_SPEED_DB_PREVIEW=1` and a loopback Supabase API configured against the disposable database. The server checks the manifest IDs and the private release state. The flag is ignored on deployed builds, including the catalog-only Vercel preview, so the hosted preview continues to read the bundled manifest. These pages still use the existing market snapshot reader.

## First eBay asking-price preview

`node --experimental-strip-types scripts/preview-speed-champions-ebay-asking.mjs --fixture 76924 listings.json` exercises the matcher offline using an array of Browse adapter listings. `--live 76924` instead makes one read-only Browse search (up to 24 results) on eBay Italy for fixed-price new listings deliverable to Italy. The live mode uses the existing adapter's locally configured eBay environment and credentials; sandbox is the default. It reports counts, reasons and observed item-price range without printing credentials, seller identities or listing URLs.

The first pass accepts only matches with the exact set code, LEGO identity, an explicit sealed claim and a positive EUR asking price. Multi-set lots and unclear condition are flagged for review. An official two-car set is eligible as one complete kit. This command does not persist data or use a scheduler. It does not provide SOLD evidence, a Market Value, or separate scheduler quota enforcement. Those remain separate work before enrollment.
