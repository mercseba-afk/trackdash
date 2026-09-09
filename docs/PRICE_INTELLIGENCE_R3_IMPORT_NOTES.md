# Price Intelligence R3 — eBay Product Research pilot import

Imported on 2026-09-09 from the user-provided eBay Seller Hub Product Research pilot dataset.

## Storage rules

- Source: `ebay_product_research` (`external_market`, manual ingestion).
- Condition: `New` mapped to `new_complete_unbuilt` only for the Product Research aggregate context described by the dataset; evidence grade remains `indicative` because full manufacturing-date/photo verification and accepted-offer separation were not available.
- Full-history and monthly aggregates overlap and must never be summed as independent evidence. R3's sold-selection logic prefers recent monthly aggregates from the same source when available, otherwise the broad aggregate.
- 18014, 95464 and 95508 reused item numbers are retained as `item_pool` with `release_id = NULL`; price never resolves Release identity.
- 18069, 94717 and 95087 are stored as `release_matched` according to the pilot's title/item/chassis attribution.
- Monthly Product Research intervals with zero sold units have no price observation and therefore are not inserted as price-bearing aggregate rows. Their month keys are retained in the corresponding full-history row's `raw_payload.zero_sale_months` so known-zero periods are not confused with fabricated price data.

## Imported counts

- 6 full-history aggregate rows.
- 41 price-bearing monthly aggregate rows: 5 for 95087 and 36 for the ambiguous 95508 item pool.
- 47 aggregate rows total.
- Zero-sale captured periods retained in metadata: 11 for 95087 and September 2026 for 95508.

The 251 listing/period observations in the source dataset were intentionally not bulk-promoted. They overlap the Product Research aggregates and require listing-level reconciliation before they can be used without double counting.
