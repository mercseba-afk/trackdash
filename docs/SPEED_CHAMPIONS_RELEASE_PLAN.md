# Speed Champions release plan

## Private integration

1. Use `speed-champions` as the explicit catalog category. Make catalog, scanner, collection, wishlist, saved views, offers, messages and market queries category-aware before importing the 19 pilot set identities. Audit shared queries for fallback to Mini 4WD and validate category ownership on writes. Keep shared accounts and sign-in.
2. Import the existing manifest with stable IDs and provenance into an isolated database. Use LEGO set numbers and verified EANs as separate identifiers. Keep individual cars from multi-car packs, parts, instructions and empty packaging outside the set catalog and valuation.
3. Reuse the existing market engine, with dedicated LEGO matching and initial scan targets. Start with a small sample, separate ASK and SOLD, and require enough verified completed sales for each condition before producing a Market Value. Keep both the LEGO rollout and its scan budget independent of the Mini 4WD queue.
4. Give Admin a compact Speed Champions panel. Show aggregate page views for 7 and 30 days, the most viewed set pages and recent scan coverage. Filter existing path-based traffic counters by vertical before aggregating and exclude private previews and admin visits. If adding outbound clicks, use the destination and set number and respect the existing analytics consent. Share the Admin layout, not the counters. Defer extra charts until there is enough traffic.

## Public release

Keep LEGO behind the owner gate until the new public site is ready. Launch the indexable LEGO catalog and set pages with the new home page, working links, canonical URLs and sitemap entries. Publish verified exact Amazon links for eligible sets. Show verified asking prices and available market data with their respective labels. Keep collection and wishlist private until both verticals have passed the relevant user flows.

Mini 4WD public paths and existing workflow should pass a comparison before and after the release. Confirm that collection, wishlist, market calculations and scan scheduling cannot pick up records from the wrong category.
