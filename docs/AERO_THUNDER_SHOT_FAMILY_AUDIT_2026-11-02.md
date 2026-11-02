# Aero Thunder Shot — family launch audit, 2 November 2026

## Applied result

Frankfurt only (`uhojhqxnzrolmnopwgpy`). Family `07cc02e9-2626-5a60-92fb-2c2ed2402d7f` activated from coming_soon to available after the publication assertions passed. Five existing release UUIDs preserved, one new configured complete kit added. Six public kits, six exact/high-confidence photos inspected, six checksum-valid sourced JANs, six bilingual descriptions. No user collection/wishlist rows modified. No code deploy, image-host expansion, valuation-policy, TTL, cron-frequency or daily-budget change.

| ITEM | Edition | Year | UUID | JAN | Initial eBay success UTC | Next scan |
|---|---|---|---|---|---|---|
|18702|Standard AR|2012|035abf4d-65da-5b0c-855d-9e611798c4e4|4950344064496|10:24:13|9 Nov|
|94967|Japan Cup|2013|8c08137b-cfc6-5c1d-8d1b-a151d53afc01|4950344949670|10:22:44|2 Dec|
|94990|Silver Metallic|2013|d0e6d2fc-3566-5004-a479-52f89253863b|4950344963201|10:24:03|2 Dec|
|95273|Asia Challenge|2016|e96a1769-9b91-55b8-84c4-697799d0b441|4950344952731|10:22:55|9 Nov|
|95286|Black Special|2017|324310d8-9c3d-5fa9-9d75-1202b43cfce7|4950344952861|10:22:59|9 Nov|
|92461|Advanced Pack TKC|2025|b95ec446-ae17-56c6-b856-0dfe863735d9|4950344924615|10:22:52|9 Nov|

## Identity / exact image evidence

- Standard: manufacturer https://www.tamiya.com/japan/products/18702/index.html confirms 23 Nov 2012, REV No.2 and AR. JAN https://www.1999.co.jp/10199845 and https://hs-tamtam.co.jp/product/detail/291699/ . Existing exact official 18702_1.jpg inspected and preserved.
- Japan Cup: https://www.tqrcracing.com/shop/product_view.asp?p_id=6363 and https://www.1999.co.jp/10227940 confirm exact complete kit, event colors and JAN. Existing official 94967_1.jpg inspected/preserved. Legacy exact date and production status retained, not independently recertified here.
- Silver: https://www.1999.co.jp/10243310 confirms December2013 and JAN4950344963201; corroborated in exact Chico product JSON https://chicohobby.com/products/94990-aero-thunder-shot-silver-metallic-special-version-ar-chassis.js . Existing Shopee photograph clearly shows the Metallic Special-labelled box and silver-plated body/wheels; visually matched against specialist catalogue image and retained. Exact old listing page provenance was not recovered; image-URL provenance plus independent identity corroboration recorded. No generic standard-kit substitution.
- Asia: https://tamiya.hk/product/tamiya-95273-1-32-aero-thunder-shot-ar-asia-challenge-2016/ confirms event, red body/white AR configuration. Existing high-resolution box photograph explicitly reads ASIA CHALLENGE2016, finals Hong Kong; retained. Its original exact Shopee page was not recovered. JAN sourced from https://chicohobby.com/products/95273-aero-thunder-shot-asia-challenge-year-2016-limited-edition-version-ar-chassis.js (SKU95273, barcode4950344952731, available=false). The stale note claiming Product fallback was corrected. Official Japan direct asset404; no access block bypass.
- Black: https://www.tamiya.com/japan/products/95286/index.html confirms smoke/red kit; JAN https://www.plazajapan.com/4950344952861/ and https://www.hlj.com/aero-thunder-shot-black-sp-ar-chassis-tam95286 . Existing exact official 95286_1.jpg inspected/preserved. Existing2017 date retained; secondary source also reports earlier Asian2016 distribution. Not split into another physical Release without discriminating evidence.
- TKC: manufacturer Korea listing https://tamiya.co.kr/shop/list.php?ca_id=&mini_car=mini_car&new_product=&page=12&ser=y&sort=it_update_time&sortodr=desc identifies92461. Exact Hongta product https://hongta.co.kr/product/92461-%EC%97%90%EC%96%B4%EB%A1%9C-%EC%8D%AC%EB%8D%94%EC%83%B7-%EC%96%B4%EB%93%9C%EB%B0%B4%EC%8A%A4%EB%93%9C-%ED%8C%A9-tkc-%EC%97%90%EB%94%94%EC%85%98ar%EC%84%80%EC%8B%9C/2897/ has reviews dated Nov2025, corroborating existence that year; exact release day unknown. JAN/ITEM https://www.crazycathobby.it/en/tamiya-mini4wd/5068-mini-4wd-advanced-pack-aero-thunder-shot-tkc-edition-tamiya-92461-4950344924615.html . Exact photograph https://i0.wp.com/m4dtang.com/wp-content/uploads/2025/11/92461.jpg from https://m4dtang.com/product/92461-aero-thunder-shot-advanced-pack-tkc-ar/ inspected: yellow AR, black/yellow TKC graphics and included tuning components; distinct configured full kit, not a loose upgrade accessory. Uncommon assigned on documented restricted Korean distribution, not age/price.

All original rarity labels retained as legacy editorial assessments: Common18702, Rare94967/94990/95273, Uncommon95286. This does not certify the legacy Rare labels against the newer90-day repeated-observation requirement. New TKC production status remains unknown; sold-out retailer pages do not prove cessation.

## Market execution / actual results

Six actual eBay Active scans all succeeded on2Nov. Six canonical new_complete_unbuilt signals computed. Two bounded invocations of the EXISTING GitHub workflow: runs41428279664/job125220136437 and41428479140/job125220795438, both success. Only audit comment changed on main to invoke its existing protected push smoke path; logic, hourly schedule, OIDC restrictions, concurrency, max4 claims/invocation and24/day SQL cap unchanged. Main commits40c884e4ecb0a969be92ed10a73758ca3914ca78 and a8368a1f39707da437186c997ce36e6d56e3ecfc. Main was NOT merged into production. Today's total after initial scans9/24.

36 accepted current offer-state records: standard18, TKC16 (including1Gandolfi), Asia1, Black1. These are offer records, not36 independent sellers. Public deduplication gives standard17 sellers / EUR30.50; TKC15 / EUR63.40; Asia1 / EUR546.59; Black1 / EUR41.48. Public asking values exclude shipping and are not MV or transactions. Asia's very high single-seller request is faithfully labelled one seller; it provides no evidence that the kit sells for that amount. No manual price substitution or artificial SOLD/trend.

Gandolfi exact TKC endpoint https://www.modellismogandolfi.com/prodotto/aero-thunder-shot-advanced-pack-tkc-edition-telaio-ar-edizione-limitata/ independently fetchedHTTP200 and parsed with existing generic_product_page: exact ITEM92461, structured EUR55, in_stock, no warnings. Actual retail worker persisted it10:24:04UTC with no error. Endpoint enrolled28days (672h), existing source ready/include_by_default=false preserved. Shipping not invented. RetailEUR55 is an individual request, not the public EUR63.40 aggregate.

All six MV NULL and sold_units0; automatic completed-sale feed still unavailable. SOLD research found no dated attributable completed transaction at an actual paid price. Active listing dates, sold counters and sold-out pages not converted to SOLD.

Empty-market second pass for94967/94990: TQ RC Racing94967 out of stock, Chico94990 available=false, HobbySearch94990 sold out, RCJaz listing catalogue both Not Available. No usable accepted active offer for either on initial eBay pass; unrelated ITEM result rejected. Archived asking amounts excluded. RCJaz exact-page HTTP403 remains a source limit, not proof of absence; no adapter enabled or base import value published.

## Open genealogy research (not canonical/public claims)

- Fresh Green2022 / Shinryoku Special is confirmed by manufacturer https://www.tamiya.com/japan/newstopics/2022/02/22pmf_mini4_freshgreen/index.html :18March2022, special stickers, restricted to two Plamodel Factory shops. Suruga603154190 lists baseITEM18702 and JAN4950344064496, shared with standard. Do not blindly map ordinary18702 evidence to this edition or invent a distinct JAN. Not inserted until complete physical-package discrimination and shared-identity scanner behavior are addressed. Initial accepted standard titles were checked; none mentions Fresh Green/Shinryoku. This is an explicit coverage gap, not an exhaustive-family claim.
- Red Metallic event version mentioned in2018 Tamiyaclub discussion. Exact SKU, complete-kit vs body status and primary documentation unresolved. No speculative row.
- Ordinary later standard-kit production, country-of-manufacture labels and restocks are not additional collectible releases without documented physical specification differences. Thunder Shot Jr./MkII are separate families; accessories excluded.

## Verification

- Full repository npm run verify passed, exit0, exact existing source tree; no runtime code changes.
- IT/EN family routes HTTP200, correct self canonicals, six exact release links; six optimized Next Image requests HTTP200 with image/jpeg, no new host needed.
- All12 IT/EN release-detail routes HTTP200 with correct self-canonical and both hreflang alternates; sitemapHTTP200 contains14family/detail URLs (2families+12details). Standard/TKC/Asia/Black prices visible after normal shared-cache revalidation; initial pre-refresh render correctly replaced by current public snapshot.
- Source production remains7c54fa84aa7d76985385753860d9c9ba94504c00. This task changes catalog data only. Existing family-available notification trigger ran once with dedupe (no manual email/chat/test notification).
- Authenticated camera scan, collection/wishlist mutations and installed PWA/offline interactions NOT executed. Database JAN uniqueness/exact release associations and shared public projections verified; do not claim private E2E.

SQL: proposals/aero-thunder-shot-completion-20261102.sql plus follow-up proposals/aero-thunder-shot-followup-20261102.sql. The baseline guard intentionally rejects repeating a completed launch.
