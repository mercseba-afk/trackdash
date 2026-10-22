# Poseidon-X — original identity recovered, execution blocked

Audit: 22 ottobre 2026. Supersedes the 10 October assumption that both collector generations share ITEM 94584. Research and preparation are complete for the correction below; database correction/publication/initial original scan are NOT yet applied.

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

Status: PARTIAL — EXECUTION BLOCKED. Original identity/photo gap researched successfully, but actual DB application, initial scan and public activation remain pending access. No merge/deployment, no new scheduler, no notification sent, no old Supabase modification.
