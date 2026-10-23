# Aero Avante — publication and market audit, 23 October 2026

Status: **16 identified kits published and initial scans completed**. Family research remains open for collaborations; this is not a claim that every historical collaboration is cataloged. User authorized completing and publishing ready Aero Avante editions. New Frankfurt project `uhojhqxnzrolmnopwgpy` only.

## Applied result

- Existing product `c8132bd5-23ee-5f36-b3f6-a75ef0c27ea3` activated from coming_soon to available. Canonical original 18701 / 2012, existing product UUID and legacy stored slug preserved; public canonical /catalog/aero-avante.
- Six original Release UUIDs preserved; ten missing complete kits added, including two distinct configured Starter Packs. 16 distinct ITEMs, 16 verified identities, 16 exact/high-confidence photos, 16 IT/EN descriptions, seven sourced checksum-valid JANs. Unverified JAN/date/MSRP/rarity not invented. The existing five Uncommon rarity labels were preserved as legacy data, not newly verified rarity claims.
- DML proposals committed on recovery/frankfurt-migration: aero-avante-family-completion-20261023.sql; aero-avante-existing-descriptions-20261023.sql; aero-avante-publication-20261023.sql. Applied through already authorized authenticated dashboard after connector write requestState failures; independent connector SELECT confirms the result.
- Publication guard required all 16 initial eBay successes, no queue error, 16 canonical signals, descriptions and photos. No code merge or Production deployment requested. /api/version verified `780c9a4db49175a1e39b9f8a3fc4b9d6dba7cf77`.

## Per-kit execution and public projection

Every row below: public, initial eBay Active scan succeeded on 23 October, last_error NULL, canonical new_complete_unbuilt signal actually computed on that date. Exact image served HTTP200 through existing Production Next Image allowlist. ASK column is **EUR / independent seller count**, snapshot of public IT/EN family, not Market Value. Four NULLs are genuine absence of accepted current evidence from executable sources, not proof that no market exists.

| ITEM | Existing or added UUID | Public ASK EUR / sellers | Photo asset |
|---|---|---|---|
| 18701 | a2baec17-32b5-5ca7-996b-4cdc2da725ba | 23.51 / 16 | https://www.tamiya.com/japan_contents/img/usr/item/1/18701/18701_1.jpg |
| 18706 | b82d5729-9f76-5194-9fd4-93d49f3a8cca | 54.39 / 11 | https://www.tamiya.com/japan_contents/img/usr/item/1/18706/18706_1.jpg |
| 92396 | 776c2a2c-b5af-5204-a596-bf15a8224754 | — | https://www.tea-league.com/web/overdrive201806001.jpg |
| 92441 | e0feb82a-a76a-519e-ac91-7f4423cccdb7 | 65.88 / 1 | https://cdn.suruga-ya.jp/database/pics_webp/game/603162218.jpg.webp |
| 94944 | 9207b72d-796d-50a5-a69c-ec9b54e4ddb1 | 179.65 / 1 | https://www.tamiya.com/japan_contents/img/usr/item/9/94944/94944_1.jpg |
| 95024 | fe538d75-4d93-5ae3-b854-0e9a4ba63129 | 93.60 / 2 | https://cdn.suruga-ya.jp/database/pics_webp/game/603054048.jpg.webp |
| 95038 | 2577f71d-cfee-5dd6-a3b4-b72f1431059d | — | https://www.rcjaz.ca/images/tamiya/mini_4wd_series/mini_4wd_car_kit/ms_chassis/b_95038.jpg |
| 95058 | 006db4a7-48cb-54dd-8881-369329ddf11d | — | https://www.rcjaz.ca/images/tamiya/mini_4wd_series/mini_4wd_car_kit/ms_chassis/b_95058.jpg |
| 95062 | 107f030c-2b39-5659-8c00-ae11bd2a86d4 | 54.13 / 2 | https://www.tamiya.com/japan_contents/img/usr/item/9/95062/95062_1.jpg |
| 95083 | 03ffa178-60c9-53c4-a69e-4095040a8332 | 181.00 / 1 | https://cdn.suruga-ya.jp/database/pics_webp/game/603059715.jpg.webp |
| 95210 | a1b91082-8707-5f4c-a2ee-4f43d897d67b | — | https://www.tamiya.com/japan_contents/img/usr/item/9/95210/95210_1.jpg |
| 95267 | c4e3dc97-3c9d-5268-bc19-06095086f5e5 | 67.63 / 2 | https://www.tamiya.com/japan_contents/img/usr/item/9/95267/95267_1.jpg |
| 95268 | 9728c37c-503c-5359-bc45-cfc2f62a1e48 | 74.34 / 2 | https://www.tamiya.com/japan_contents/img/usr/item/9/95268/95268_1.jpg |
| 95269 | 4399ee13-81df-539c-9d46-783b789a1d82 | 81.58 / 3 | https://www.tamiya.com/japan_contents/img/usr/item/9/95269/95269_1.jpg |
| 95376 | 21b0cb0d-bb39-51ff-a5e6-df45c3245372 | 73.20 / 1 | https://www.tamiya.com/japan_contents/img/usr/item/9/95376/95376_1.jpg |
| 95655 | 70423a5b-d9df-5932-a909-268bed816300 | 54.39 / 7 | https://www.rcjaz.ca/images/tamiya/mini_4wd_series/mini_4wd_car_kit/ar_chassis/b_95655.jpg |

54 new_complete_unbuilt in-stock/low-stock offer-state records in the family at final SQL check; this is a record count, not 54 independent sellers. 12 Releases have an actual representative asking quote visible. All 16 MV and SOLD anchors remain NULL / sold_units=0; no numeric trend manufactured from initial offers. Single-seller high asks are labeled as one seller's request, not an appraisal. Kit-only values exclude shipping. Existing canonical policy and all UI labels left unchanged.

Gandolfi 95655: exact supported generic_product_page adapter, HTTP200, itemNumberSeen=true, structured price EUR16, in_stock; real worker stored offer and endpoint last_success 2026-10-23T11:38:56.958Z. Source page also showed two units available on live retrieval. https://www.modellismogandolfi.com/prodotto/aero-avante-asia-challenge-2024-special-telaio-ar-edizione-limitata/ . Its EUR16 retail quote is **not** the public median of seven independent sellers, which is EUR54.39. Next retail scan 20 Nov 2026 (28d). Don't replace the representative median with a selected shop quote by hand.

## Identity and image provenance

- Existing six: official Tamiya Japan pages https://www.tamiya.com/japan/products/ITEM/index.html for 18701,95062,95267,95268,95269,95376; official image for each exact ITEM inspected. Added 94944,95210,18706 official exact-item images likewise inspected and HTTP200 Next-rendered.
- 94944 Red Special 2013: official Tamiya USA https://www.tamiyausa.com/shop/132-rev/jr-aero-avante-red-special/ indexed manufacturer specification; discontinued. Raw browser/HTTP bot-block page is not a successful product-page read; no block bypassed.
- 95024 Clear Blue: **2014**, supported by contemporary distributor April 2014 PDF https://www.fantasyland.it/wordpress/wp-content/themes/fantasyland/documenti/tamiya/volantini/TA_2014-04.pdf . Later wiki says 2015; contemporary evidence takes precedence. Exact box image https://www.suruga-ya.jp/product/detail/603054048 .
- 95038 Clear Red: **not called Japan Cup** (early research hypothesis corrected); https://www.tqrcracing.com/shop/product_view.asp?p_id=9505 confirms exact kit. RCJaz exact product https://www.rcjaz.co.uk/display-and-tweak-tamiya-95038-132-aero-avante-clear-red-sp-special-model-kit-p-90067469.html confirms JAN4950344950386. Box illustration is mostly blue, but the photographed label explicitly says CLEAR RED BODY; do not substitute another edition based on illustration hue. Matched higher-resolution RCJaz exact-labelled box image inspected.
- 95058 Clear Pink: manufacturer https://www.tamiyausa.com/shop/132-rev/jr-aero-avante-2/; November2014 distributor PDF https://www.fantasyland.it/wordpress/wp-content/themes/fantasyland/documenti/tamiya/volantini/TA_2014-11-B.pdf; JAN4950344950584 exact RCJaz product. Exact pink assembled photo inspected; RCJaz image path contains ms_chassis but actual product chassis is AR, as verified independently.
- 95083 Clear Orange2015: manufacturer https://www.tamiyausa.com/shop/132-rev/jr-aero-avante-orange-special/; exact box https://www.suruga-ya.jp/product/detail/603059715; JAN4950344950836 supported by https://www.suruga-ya.jp/kaitori/kaitori_detail/603059715 . Buyback metadata used only for barcode, never as a selling price.
- 92396 OVER DRIVE2018: contemporary exact kit/box/specifications https://www.tea-league.com/mt/tea/archives/2018/06/_over_drive.html . JAN4500000190641 from https://www.kaitori-world.jp/products/detail/278035; placeholder1999 date rejected. Exact release day left unknown.
- 92441 ADVAN2023: official collaborator shop https://yokohamashop.com/item-detail/1297696 verifies ITEM, JAN4548515000154, smoke body/red AR/white wheels. Exact box https://www.suruga-ya.com/en/product/603162218 (image uses existing .jp CDN allowlist). JPY2500 current shop offer researched but not ingested through unsupported new adapter; not European MV evidence.
- 95655 Asia Challenge2024: official Italian distributor https://www.fantasyland.it/tamiya/mini-4wd/modelli-limited-edition-mini4wd/aero-avante-asia-challenge-2024-ar/; white body/blue AR and discontinued status. JAN4950344956555 exact RCJaz product. eBay listing with unrelated4950344186433 rejected as JAN source. EUR17.50 distributor list price not imported as current offer.
- 95210 Limited starter2015: https://hs-tamtam.co.jp/product/detail/112805/ confirms ITEM/JAN4950344952106/full kit; compare https://mediaworld.co.jp/products/50005589000 . Conflicting exact day left NULL. 18706 regular starter2017: official https://www.tamiya.com/japan/products/18706/index.html . Separate configured kits with tuning parts/tools, not an isolated accessory nor a duplicate of18701.

All16 image associations also have an image-URL provenance row dated23Oct. No image license invented. Retailer images matched to exact kit; no broad image-host permissions or code deployment added.

## Market audit / empty evidence / blocked sources

Real eBay Active scans for all16 completed between 11:27:20Z and11:45:21Z on23Oct. Initial enrollment alone was not counted as success. Existing main GitHub workflow run39585454899 rerun sequentially in bounded batches, last job120396239627 success. Logs reviewed show HTTP200/applicationStatus success and zero failures. Batch may include recompute and other normal retail work; do not call every operation a scan. Existing one-clock concurrency unchanged; no second scheduler, new monitoring or global queue reset. Only new Aero initial queue dates advanced once.

Current eBay refresh assigned by existing worker: 7d for eleven HOT rows;95655 10d;92396,95038,95058,95210 30d. Actual per-row next_scan_at stored in queue. Retail Gandolfi28d. Marketplace TTL15d / retail31d unchanged; representative asking projection retains its existing15d window. No promise of eternal price availability.

RCJaz policy is still adapter_status=planned/include_by_default=false, despite historical auto-enrollment helper. Its sourced endpoints are useful research but **not executable coverage**. New Aero RCJaz queues/compatibility targets explicitly parked, global policy untouched. Ordinary retailers with no exact endpoint also aren't counted as coverage. No new Amazon/Suruga/Yokohama adapter activated; no access restriction bypassed.

Empty-market second pass:95058 RCJaz USD49.90 Not Available; Chico Hobby sold out;95083 EliminatorRC out of stock;95024 RCStation/RZONE sold out;92441 ApexGlory sold out. Do not ingest these as current asks.95038 RCJaz appears available but source execution remains blocked/planned, not a completed scan.92396 eBay results278402978034 and397412702125 labeled Used, excluded from new-complete.95210 retail source sold out; no eligible eBay offer accepted. No fake prices added to fill four gaps.

SOLD search found cumulative marketplace counters (e.g.92441 listing167697948876 “2 sold”,95062 listing165554637581 “14 sold”, RZONE95024 “3 sold”) without dated actual transaction prices/windows. These do not demonstrate that today's asking price was paid; no SOLD row, count or trend inferred. Browse API scans active offers only; **automatic completed-sale feed remains unavailable**, as already documented in the runbook.

## Open collaboration research — NOT canonical rows or public Release claims

| Candidate | Evidence / missing work |
|---|---|
| Albirex Niigata2023 | Primary https://www.albirex.co.jp/news/64594/; July15 launch. Complete kit, special stickers; orange display body is painted. Exact scanner identifier and photo rendering path still need completion. |
| Kashima Antlers2023 | Primary https://www.antlers.co.jp/blogs/news/94622; July14 launch. Limited500; wrapper motor wording corrected. No fabricated ITEM/JAN. |
| Yokohama FC2023 | Primary https://yokohamafc.com/2023/07/22/0729goods/; July29 launch, special sleeve/stickers. Source photo uses new host not allowed by current build. |
| Yokohama F. Marinos2023 | Primary https://www.f-marinos.com/news/goods/6266; October28 launch. Exact photo/identifier/initial evidence still open. |
| Shiga Lakes | Secondary contemporary chronology https://www.tea-league.com/mt/tea/archives/2022/01/2022_7.html indicates November2022 collaboration; current marketplace snippets alone insufficient for canonical identity. |
| Gamba Osaka | Same contemporary2022 chronology mentions collaboration; primary exact-kit identity and photo still to be researched. |

Do not map ordinary18701 offers or barcode to a collaboration. Bodies15466/95081, RC1:10 58550/84377 and unchanged gift bundles excluded from complete standalone kit count. Future discoveries are possible; core publication is not an exhaustive-history certification.

## Live QA and limits

- Public IT+EN family show16 actual cards and12 asking quotes. Original18701 displays23.51EUR, Gold95267 67.63EUR, Asia95655 54.39EUR; detail/family consistent.
- IT original18701, ClearRed95038 and Asia95655 detail, plus EN Asia detail all HTTP200; correct self canonical and IT/EN hreflang. Photos visible in browser (Asia95655 screenshot), and all16 optimized exact asset requests HTTP200. Seven JANs unique in family; exact matching source/enrollment checked in DB.
- Sitemap HTTP200:34 Aero URLs =2 families +16 IT details +16 EN details. Research collaboration candidates not inserted/indexed.
- New kit rows do not replace or modify old collections, user accounts or original DB; original six UUIDs retained. No private account, authenticated Scanner, Collection/Wishlist interactions, PWA offline or notification delivery re-tested in this data-only task. Shared associations/projections checked at DB/public surface level only.
- Existing family-launch trigger kept; no manual/test messages or email. No code/schema/valuation/matching/TTL/scanner-frequency change, no merge or code deployment. No CPU/egress savings measurement claimed. Four public editions have missing eligible market evidence; six collaboration candidates remain research, plus legacy rarity/date/JAN gaps clearly distinct from verified identity.
