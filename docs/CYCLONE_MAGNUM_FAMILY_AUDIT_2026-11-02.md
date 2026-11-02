# Cyclone Magnum family audit — 2026-11-02

## Published scope
Production Supabase Frankfurt: uhojhqxnzrolmnopwgpy. Product 53791485-2948-5176-8acb-2ec947eafc51 (legacy slug cyclone-magnum-19425 preserved; this is not an ITEM assertion).
Two existing release IDs preserved; six complete kits added. Eight releases have verified JANs, specific photographs, Italian/English descriptions and source records. Family launch_status changed from coming_soon to available only after eight successful initial eBay scans and eight current canonical signals. No manual market prices or user collection changes.

|ITEM|Edition|Year|JAN|
|---|---|---|---|
|19412|Standard / Super TZ|1996|4950344061426|
|19417|TRF / Super TZ|1997|4950344061471|
|19440|Premium / AR|2014|4950344064090|
|94486|Limited Special, blue plated|2003|4950344944866|
|94488|TRF Limited Special, purple plated|2003|4950344944880|
|94620|Special Kit + Hurricane Sonic bonus body|2007|4950344946204|
|95126|Memorial 25th Anniversary / Super TZ-X|2019|4950344951260|
|95676|Polycarbonate Body Special 30th Anniversary / AR|2024|4950344956760|

19412 represents the standard specification across unchanged later production, not a certified physical 1996 first-run box. Do not use its ordinary JAN/photo to authenticate original packaging. 94620 is one chassis plus a bonus Hurricane Sonic body, not a two-car lot. Its 2014 retailer restock is not a separate edition. Conflicting exact days for 2003 plated kits were left unspecified. 19417 retains year-level secondary historical evidence rather than an invented release day. 95126 release date 2019-11-02 and 95676 date 2024-10-12 follow Tamiya. Only 94620 has explicit discontinued evidence (HLJ); sold-out pages do not prove retirement.

Rarity: existing 19412 Rare preserved as legacy, not independently recertified here. Regular retail 19417/19440 Common. Five specials remain unassigned pending stronger distribution evidence; age, anniversary and asking price alone do not establish rarity.

## Identity and image sources
- Tamiya official pages: https://www.tamiya.com/japan/products/19412/index.html ; https://www.tamiya.com/japan/products/19417/index.html ; https://www.tamiya.com/japan/products/19440/index.html ; https://www.tamiya.com/japan/products/95126/index.html ; https://www.tamiya.com/japan/products/95676/index.html
- JAN corroboration 19412: https://www.suruga-ya.jp/kaitori/kaitori_detail/603060160 ; 19417: https://hs-tamtam.co.jp/product/detail/232976/ ; 19440: https://www.centralline.jp/products/4950344064090 ; 95126: https://www.plazajapan.com/4950344951260/ ; 95676: https://www.suruga-ya.jp/kaitori/kaitori_detail/603202430
- Plated kits: https://www.suruga-ya.jp/kaitori/kaitori_detail/603021767 and https://www.suruga-ya.jp/kaitori/kaitori_detail/603072652 ; https://www.hlj.com/cyclone-magnum-limited-special-tam94486 and https://www.hlj.com/cyclone-magnum-trf-limited-special-tam94488 (indexed content; direct HLJ access blocked).
- Bonus-body kit: https://www.hlj.com/cyclone-magnum-sp-kit-hurricane-sonic-body-tam94620 ; https://www.1999.co.jp/10266162
- Historical year context: https://w.atwiki.jp/mini4vipwiki/pages/185.html (secondary).
Six photographs are official exact-item Tamiya assets; 94486/94488 use exact labelled Suruga-ya box photographs. All eight inspected visually and Next image optimizer returned HTTP 200. No new image host or permission/licence claim introduced.

## Initial market checks
All eight eBay scans succeeded 2026-11-02, last completion 15:28:24 UTC (94620), no scan errors. First results had active offers for 19412, 19417, 19440, 95126 and 95676; none usable for 94486, 94488, 94620. Absence of evidence is not a zero valuation or proof of rarity. Initial accepted offers are seller asking prices, not concluded sales.
Candidate 5dd3d860-0eaf-4719-8053-a0383014aaa7 cited both Hurricane Sonic 19441 and Cyclone Magnum 19440 at USD45.71. Moved from accepted to needs_review, with needs_revalidation and review notes, and queued canonical recomputation. Exact single-kit price must be established before acceptance. Public asking-price projections filter accepted candidates; a canonical recomputation is queued for the normal worker.

Four bounded comment-only main workflow pushes started existing worker invocations. The queue sorts next_scan_at before priority; five older due jobs ran before the eight new family jobs. Existing daily cap 24 eBay attempts was preserved (expected final usage 22 including previous work); no schedule, budget, queue ordering or scheduler logic changes. No further trigger solely for a marginal variant. RCJaz remains disabled/parked for valuation; useful only as catalog context unless complete landed costs verified.

Retail checks: Caputo 19417 EUR12 is explicitly Esaurito, not ingested. iModellini 19417 also Non disponibile. Pieroni 95676 endpoint returned HTTP500, not enrolled. Modellismo.it availability request is not stock proof. Unsupported Vendilo retail page was research context only, no adapter added. RCJaz unavailable old USD prices were not used as current market evidence.

## Bounded deferred research
Not claiming exhaustive completion of every collaboration/prize release. Hold 92256–92259 (2013 amusement), 92365–92368 (2016 amusement), 92375 Graha Tamiya, 92398 CoroCoro blue metallic, XLARGE 2021, Vegalta Sendai 2023 until exact packaging/identifier evidence. Avoid prolonged research without usable catalog/market evidence.
Useful starting sources: https://www.dreamnews.jp/press/0000085858/items/7dab2a ; https://sanampinthong.com/product/tamiya-item92375-cyclone-magnum-graha-tamiya-1st-anniversary-special-super-tz/ ; https://xlarge.jp/news/xlarge/detail20480 ; https://www.kojima.net/corporation/ir/pdf/release20230815.pdf . Exclude body-only 95611, Quick Drive RC, Tomica diecast, unproved complete-kit prizes and unchanged restocks.

## Verification / deployment
Data-only publication, no app runtime deployment. npm run verify passed. Main-branch Production HTTP Smoke has an unrelated branch assumption: it waits for scheduler main SHA as production SHA, while production correctly runs recovery/frankfurt-migration. Do not deploy obsolete main to satisfy this check. Public HTTP pages and image checks provide separate publication QA; no authenticated user flow testing claimed.
SQL: proposals/cyclone-magnum-completion-20261102.sql ; proposals/cyclone-magnum-publication-20261102.sql ; proposals/cyclone-magnum-candidate-review-20261102.sql.
