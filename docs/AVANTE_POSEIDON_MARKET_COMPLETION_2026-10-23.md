# Avante Jr. and Poseidon-X — targeted market completion, 23 October 2026

Scope: user explicitly requested checking existing Releases and especially market evidence, preserving correct catalog work. No re-insertion, identity/UUID/image/front-end changes, family activation, merge, deployment, scanner implementation or second clock. Production /api/version remains780c9a4db49175a1e39b9f8a3fc4b9d6dba7cf77. Frankfurt project only.

## Executed
- Checked all13 Avante Jr. and2 Poseidon Releases against existing signals, offers, candidates, granular and aggregate SOLD, exact endpoints and queues.
- Enqueued all15 canonical recomputes through existing RPC; verified all15 computed_at23October and no remaining family jobs.
- One-off prioritized existing enabled eBay queue jobs18058,94584,95060,95474 and existing Gandolfi18014 endpoint. Recurring policy/cadence unchanged. Original49568 scanned successfully22October; not redundantly scanned today.
- Four sequential bounded reruns of existing workflow39585454899: jobs120314648075,120314900732,120315208502,120315430127, all application success/HTTP200. Aggregates attempted6+5+5+4=20,succeeded20,failed0; these are mixed scan/recompute operations, NOT20scans. No retries or repeated bulk clock created.
- DB-confirmed eBay last_success23Oct08:18:10UTC18058;08:18:42UTC94584;08:19:35UTC95060;08:20:15UTC95474. All last_errorNULL. Next eBay30Oct for3Avante targets,22Nov for94584.
- Gandolfi18014/2024 real worker last_success23Oct08:18:04UTC, price15EUR and in_stock confirmed by live page2available. Existing next scan4Dec under42day policy; TTL31days still enforced. This cadence can yield a deliberate stale gap; this data-only task did not rewrite policy.
- New worker95060 candidates:8 accepted,2 unknown/neutralized offer states, warnings retained.95474:6 freshly accepted candidates, high-ASK warnings retained, no invented completed sale.

## Signals after actual recompute
All Market Values remainNULL under existing publication policy. No manual number or trend written.
-18014/2024: marketplace anchor16.15EUR from12Oct existing observations still within15dayTTL; fresh retail anchor15.00EUR. One merchant alone does not pass MV requirement.
-18058: fresh marketplace anchor52.70EUR, one current marketplace offer.
-95060: fresh marketplace anchor44.38EUR; public representative asking price may differ because UI uses one vote/seller median, not canonical anchor. Do not quote44.38 as independently verified public median.
-95474: active_anchorNULL despite fresh accepted listings. Public quote derives separately from accepted exact offers; do not claim no ASK solely from canonical anchor.
-18507: recent22Oct offer162.93EUR retained in observed offers even though active_anchorNULL.
-95501/2019 and2021: older11/12Oct offers remain stored, exact generational attribution not revalidated by this task.
-Poseidon49568 and94584: still no eligible current offer/MV/SOLD. An empty result is not a scanner failure.

## New research persisted, without false publication
Created inactive manual Terra Mecha source, no readiness or scheduler claim. Shopify live product .js and page data:
-95474:49.90SGD,available=true,SKU95474-M4,page3left. Stored needs_review:UNSUPPORTED_CURRENCY (worker supportsEUR/USD/JPY/GBP).
-18014:29.90SGD,available=true but variant SKU92462-M4 conflicts with title. needs_review with SKU mismatch/sharedgeneration; resolvedReleaseNULL and possibleIDs all18014 generations.
-95501:29.90SGD,available=true,SKU95501-M4;2019vs2021unresolved. needs_review,possibleIDs both,resolvedReleaseNULL.
-Mercari original49568:53960JPY,one in stock; exact original packaging established22Oct. Near-unused/worn-box listing does not prove sealed/completeness eligibility. Stored needs_review,conditionunknown, no offer state/SOLD created.
No unsupported SGD-to-EUR conversion invented. Source record keys audit:95474:20261023,audit:18014:20261023,audit:95501:20261023,audit:poseidon49568:20261023 verified after insert.

Sources:
- https://www.modellismogandolfi.com/prodotto/avante-jr-telaio-type-2/
- https://terramechashop.com/products/avante-jr-30th-anniversary-special-kit-tamiya-95474-mini-4wd
- https://terramechashop.com/products/avante-junior-18014-tamiya-mini-4wd
- https://terramechashop.com/products/jr-avante-jr-black-special-95501-tamiya-mini-4wd
- https://jp.mercari.com/shops/product/Bma2YHJceEYaDdXkrCiGPP

## SOLD audit and rejected shortcuts
Existing granular event: original18014 Mandarake769492,29000JPY,5Nov2025,quantity1,valuation_eligiblefalse (condition/completeness/innerbags flags). Preserved. Existing aggregates comprise18506/1989Apr/May2026,95060May2026,95474Apr/May2026,95501/2021June2026, plus18058May2024 and93001March2024. Some provenance is only broad Yahoo completed-search pages, including a body search for95060; existing indicative counts are NOT newly verified exact transactions. No destructive cleanup or unjustified reclassification based only on search URL.
Fresh search did not establish additional exact dated completed sales. Yahoo search snapshots without year/per-item proof, eBay ended because unavailable, seller totals, secondhand/assembled lots do NOT become new SOLD. Subito18506 page410gone, not current69EUR offer. eBay vintage18506cached2025page not claimed newly live.
Other excluded observations: Poseidon Outlet11EUR/Baracca13.50EUR unavailable, RC Station wholesale soldout, ToysWorld50EUR outofstock/attribution unresolved; Suruga92210used4600JPY context only; Plaza18014outofstock; Briosi severalAvante stockout. Historical cheap prices never promoted to current value.

## Verification and limits
- Actual data reads and four real production worker calls; no simulation substituted.
- Public direct18058/95060 routes return200 but current family state remainscoming_soon and servescoming-soon page. Therefore refreshed market is stored and usable internally, not a newly activated public Avante family. User requested market completion; no family launch/notifications triggered.
- Shared18014/18506 historical queues remain disabled where unsafe; no blanket attribution orenrollment reset.
- No new release or photo. No real authenticated Dashboard/Collection/Wishlist flow tested.
- Work improves freshness and records useful research; it does not solve market scarcity, unsupported SGD ingestion, legacy SOLD provenance or missing source access. These remain explicit limitations.
