# Poseidon-X — original identity recovered and published

Audit: 22 ottobre 2026. Supersedes the 10 October assumption that both collector generations share ITEM 94584. Correction, exact photo, initial original scan and public activation have now been applied and verified; see the execution checkpoint below. Earlier preflight/blocker sections preserve the history.

## Execution completed — 22 October 2026

Dashboard access restored to existing TrackDash Production (Free, Frankfurt). Connector BEGIN/ROLLBACK validation succeeded; committed connector write returned Invalid or expired requestState, with an independent SELECT confirming no change. Authorized visible dashboard SQL Editor fallback applied the guarded transaction successfully. A subsequent publication attempt hit a Monaco text replacement syntax error and made no change; replacing the full editor content correctly then applying the narrowly guarded visibility update succeeded.

- Original UUID preserved: ITEM49568/JAN4950344495689, verified identifier/source provenance, exact original photo attached, PUBLIC.
- Reissue UUID/ITEM94584/JAN4950344945849/photo remain unchanged and PUBLIC.
- 2 kit Releases researched, 2 public, 0 research-only, 0 image gaps; product family_audit metadata updated, accessory/multi-kit distinctions retained.
- One bounded rerun of existing GitHub workflow39585454899, job120021522688: HTTP200/application success, attempted2/succeeded2/failed0 aggregate. Independently verified original eBay last_attempt2026-10-22T18:52:40.703983Z, last_success18:52:41.681192Z, next2026-11-21T18:52:41.765Z, no error.
- Original canonical v4 signal recomputed2026-10-22T18:52:40.834Z, MV/ASK NULL, sold_units0, accepted active offers0. Reissue retains its older10Oct signal and24Oct scheduled scan; do not describe it as newly scanned/recomputed.
- Public family renders 2 cards and original code49568. Original IT/EN detail renders correct identity/JAN/description and the exact photo (loaded, naturalWidth272). Existing2006 card/link remains.
- sitemap.xml HTTP200 includes family and BOTH Release routes in IT/EN. EN hard navigation has one correct canonical and IT/EN/x-default alternates. Client navigation momentarily exposed prior family metadata alongside Release metadata; hard-loaded EN document is correct; no broad SEO fix attempted during data work.
- Original routes: /catalog/poseidon-x/releases/49568-poseidon-x-black-special-1993-original and /en/catalog/poseidon-x/releases/49568-poseidon-x-black-special-1993-original.
- Verified identifier lookup records distinguish both JANs. Real signed-in scanner/Collection/Wishlist/PWA interactions were NOT retested: current TrackDash browser is anonymous. No claim of end-to-end private QA.
- No new code deployment, merge, scheduler, paid service or old database change. Product was already available; no family relaunch notification.

Residual market limitations: exact runnable retail endpoints absent; legacy enabled retailer compatibility rows have no successful scan and must not be called coverage. No authorized automated SOLD feed; research results remain historical/out-of-stock/wrong condition/unqualified rather than manufactured transactions. Trend unavailable without comparable evidence. Family identity/image/publication work is complete; market coverage and private flow QA remain documented limitations.

## Verified live before changes

- trackdash.it/api/version returned 780c9a4db49175a1e39b9f8a3fc4b9d6dba7cf77.
- Product e8a13fb8-4af2-5f5f-936e-8871d9567289 is available, public route /catalog/poseidon-x.
- Original UUID 936ac729-f26b-5a21-bec1-f2620b93c5c4 is still research_only, incorrectly ITEM94584, JAN NULL, zero Release images. Canonical signal v4 from 10 October: MV/SOLD/retail NULL, sold_units0. No Collection/Wishlist references to this original UUID in the aggregate preflight.
- Reissue UUID c37d4161-aa31-535b-b1de-9040730a4cdd is public, ITEM94584, JAN4950344945849, its existing exact 2006 image retained. Signal v4 from 10 October remains NULL, no SOLD. eBay last success 10 October, next scan 24 October; original eBay intentionally parked under the old ambiguous-identity assumption.
- Retail compatibility queue rows exist for both but do not demonstrate runnable exact endpoints or successful retailer scans. 112 eBay jobs were due in the global queue at this snapshot; do not reset the backlog or create a second scanner.

## Recovered original packaging identity

| Generation | Correct ITEM | Correct JAN | Existing UUID |
| --- | --- | --- | --- |
| Original 1993 | 49568 | 4950344495689 | 936ac729-f26b-5a21-bec1-f2620b93c5c4 |
| Reissue 2006 | 94584 | 4950344945849 | c37d4161-aa31-535b-b1de-9040730a4cdd |

Primary physical-box evidence: [specialist original-edition listing](https://jp.mercari.com/shops/product/Bma2YHJceEYaDdXkrCiGPP). Nine actual photographs inspected; title identifies original edition, description explicitly excludes reissue. Box end clearly prints 49568-600; rear panel prints 4950344495689. JAN checksum passes. Photos show the original Black Special box and unassembled kit contents.

Audited assets, same listing:
- Front, proposed exact Release image: https://assets.mercari-shops-static.com/-/large/plain/2JPVsdUFH8LYmEMPHadjyX.jpg@jpg
- ITEM panel: https://assets.mercari-shops-static.com/-/large/plain/2JPVsdUFGxAdFKB5GWKNwV.jpg@jpg
- Barcode/rear: https://assets.mercari-shops-static.com/-/large/plain/2JPVsdUHoMtC3r2Nhea9dP.jpg@jpg

Independent corroboration:
- https://www.kaitori-world.jp/products/detail/276438 explicitly lists ITEM49568/JAN4950344495689. This is a BUYBACK catalog: its JPY12680 quote is not a retail offer or sale; its placeholder 1999-12-31 date is not used.
- https://kaitori-gertoner.net/list_mini4wd_kaitorikakaku.html indexes Poseidon Black Special by JAN4950344495689, also buyback only.
- https://mini4dangun.cafe.coocan.jp/mini4/super/m4-super.htm is indexed with original49568 vs reissue94584. Full fetch403, therefore indexed text is corroboration only, not proof of current access or asset availability.
- https://www.tamiyaclub.com/forum/index.php?/topic/38584-49xxx-part-numbers-complete-list/&page=2&tab=comments lists 49568 original1993. Community corroboration, not a manufacturer source.
- Official publisher https://corocoro-news.jp/special/331656/ reproduces 1993 reporting of the complete Black Special kit/Autumn Cup. Supports the historic year and complete-kit distinction, not the barcode itself. Retain November1993; no exact day asserted.

The older 2006 TEA-League source does not establish the original ITEM; its itemNumber claim must be removed from the original release_sources row, preserving the source for historical price/specification comparison. UUID/seed/slug identity MUST NOT be regenerated from the corrected factual code.

## Image validation

The exact front image above qualifies HIGH-CONFIDENCE MATCHED based on physical ITEM/JAN panels from the same item. Existing next.config.mjs already allows this merchant image path. Correct remote URL uses literal @jpg; double-encoding a literal %40 in the upstream URL yielded404 and must not be stored as the asset URL.

Actual Production Next Image request using the literal-@ URL returned HTTP200 image/jpeg, 38839 bytes at width384 and 122243 bytes at width750. Existing 2006 image independently returned200. No new image host, application code, deployment or paid hosting is necessary for this data correction. No rights/license claim is invented.

## Fresh Empty Market Challenge

- Original-edition specialist listing is JPY53960 with one in stock, but item condition near-unused and worn outer box; use physical photos for identity/image, not automatically a sealed/new-complete valuation or SOLD.
- Mercari m84279024694 still claims1993 from a mold copyright stamp, with an AI-derived description disclaimer. It must not supply original identity/price merely from that title; physical49568 evidence is the useful discriminator.
- Toys World exact94584 page now explicitly states Esaurito at EUR50: historical-only and not current purchasable ASK. No date of sale inferred.
- Outlet Modellismo94584/JAN4950344945849 remains non disponibile at EUR11; HLJ2006 remains discontinued/out of stock. No stale retail price promoted to current value.
- Suruga2006 is second-hand context. Yahoo completed-search results include assembled/wrong-condition or generation-unresolved items; no new original or2006 canonical SOLD accepted.
- Mercari m36958986722 shows sold-out unassembled94584 at JPY5680, but worn/sun-faded condition and no exact paid-transaction date established; retain research context, do not manufacture a dated sealed-kit sale.
- No new MV, accepted offer, SOLD count or trend can be claimed from this audit. Automatic official eBay initial scan of the corrected original is still required after applying the identity correction; existing refresh of2006 should preserve its cadence.

## Prepared execution and real blocker

Versioned proposal: [poseidon-x-1993-identity-20261022.sql](../proposals/poseidon-x-1993-identity-20261022.sql), commit8c2774079d8427b7fbfe32fcabfeafa4e9b11b0d. It guards collisions, preserves original UUID, corrects ITEM/JAN/source provenance, attaches the exact front photo, enrolls the existing source pipeline and schedules one initial original scan ahead of the existing queue using the SAME clock. It does not publish the original or write price evidence. Existing user rows remain untouched.

Two attempts to validate the proposal inside BEGIN/ROLLBACK through the Supabase connector failed with Invalid or expired requestState. These are connector request errors, not reported SQL constraint failures or a known automatic-approval rejection. An intervening SELECT verified original ITEM94584/JANNULL/research_only/zero images unchanged. Do not claim SQL validation passed or the proposal was applied. Stop repeating the same failed write route.

Previously authorized browser fallback was inspected: Supabase dashboard redirects to sign-in, so user authentication is now the indispensable blocker. Do not obtain reset credentials, disclose keys, or weaken permissions. After access is restored: dry-run guarded SQL with rollback; apply; verify original/canonical Product fields and both identifiers; execute one bounded initial original scan through the existing workflow; confirm actual recompute and queue result; publish original only after gates; verify IT/EN image/card/scanner/SEO and unchanged2006, then update this checkpoint and Project State.

Existing code checks run: scanner46/46, image resolver16/16, SEO catalog paths pass. These validate existing code, not yet-applied data, real authenticated user flows, or a completed scan.

Historical pre-authentication status (superseded by the execution checkpoint above): PARTIAL — EXECUTION BLOCKED. Original identity/photo gap researched successfully, but actual DB application, initial scan and public activation remain pending access. No merge/deployment, no new scheduler, no notification sent, no old Supabase modification.


## Targeted new market search — 23 October 2026

User requested another attempt to find publishable current prices for both already-public generations. Researched using both search engines, exact ITEM/JAN, English/Italian/Japanese terms and primary listing pages; no code, valuation-rule, scanner-cadence or identity changes.

- 94584 eBay UK296472726043 (Manchester Model Shop): indexed shop/result and stale fetched detail suggested GBP115/New/BuyNow. Direct live browser page explicitly displays ENDED, Tue30Jun13:16,GBP115. Therefore NOT a current ASK; ENDED alone does not establish SOLD. Raw public HTTP returned404; browser provided the decisive visible ended state. URL https://www.ebay.co.uk/itm/296472726043 .
- 94584 Mercari Shops2JVbGMeDfEbVUXCRnH3aL3,JPY7370 plus shipping660–1320: search snippet said one in stock, but opened current primary page explicitly says soldout(売り切れ),condition9/unassembled,minorwear and categoryslightdamage. No paid-transaction date; not currentASK or datedSOLD. https://jp.mercari.com/shops/product/2JVbGMeDfEbVUXCRnH3aL3 .
- Mercari m84279024694,JPY14800shippingincluded: titleclaims1993,newunused,innerbagsunopened; sellerdescriptionrelieson1993moldstamp and commentdisclosesAI-derivedidentification. ExactITEM/JAN/packaginggenerationnotresolved. Publicbrowser429,rawHTTP403,imagefetch403; no bypass, no promotionorphoto-basedclaim. Cannot subtract unknown bundledshipping to invent kit-onlyquote. https://jp.mercari.com/item/m84279024694 .
- Original49568 Mercari Bma2YHJceEYaDdXkrCiGPP JPY53960 remains existing needs_review candidate84b65a25-5076-4a34-b0ff-26fe89f63129. Do not relabel near-unused/unknownsealed as newcomplete or claim newlivevalidation from rawHTTP403. Candidate retained unchanged.
- Suruga603007818 retailpage indexes used7300JPY/onepiece,not newsealed; original49568 alternatecatalogused27000JPYwithboxdefect. Contextonly. Buybackprices3700/12680/2960JPYarebuybacknotretailASK/SOLD.
- Outlet94584 EUR11 notavailable;BaraccaTAM94584 EUR13.50notavailable;RCStationwholesalesoldout;HLJ94584discontinued/outofstock;RCJazsearchresultnotavailableGBP10.89;RakutenJAN4950344945849nooffers. No stalecheapanchoradded.
- eBayproductePID1958427716 EUR50statesused/alreadymounted. Noteligiblefornewcompleteunbuiltvaluation.
- Yahoo completed-search snippets includeJPY2301/8600onMarch23/15 but insufficient exactgeneration,year/date/conditionper-itemproof. No newSOLDaccepted; no inferencefromunavailabilityorendingalone.

Independent FrankfurtSQL: eachof49568/1993and94584/2006has0acceptedcandidatesand0fresh15daynewcompletein-stockoffers. No newcanonicalprices,offerstate,pricepoint,trend ormarketvaluewritten. Researchoutcome:noadditionalpublishablepriceestablishedinthischeck; bothpubliccatalogentriesandimagesretained. Existingofficialworkerwasalreadyrun23Oct,so no redundant paidscan/bulkclockcreated.
