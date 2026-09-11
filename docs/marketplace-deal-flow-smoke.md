# Marketplace deal flow smoke coverage

Before merging this feature, the production Supabase migrations were exercised inside explicit transactions that were rolled back.

Validated state path:

`structured offer -> accepted offer -> seller reports final item price + separate shipping -> buyer confirms -> TrackDash confirmed sale -> collection ownership transfer`

Assertions included:

- accepted offer remains an agreement and not a sale;
- final item price and shipping remain separate fields;
- buyer confirmation moves the sale to `confirmed`;
- accepted offer moves to deal state `confirmed`;
- the seller's public `open_to_offers` share is removed and the conversation safely keeps its history with a null share reference;
- exactly one physical copy leaves the seller's active collection (or decrements a multi-copy row by one);
- the buyer receives a new collection row with quantity `1`, the confirmed condition, sale date and item price, and acquisition source `TrackDash`;
- an immutable `collection_item_transfers` row preserves the seller-side collection snapshot and photo URLs for future ownership/provenance history;
- the smoke transaction was rolled back, so no test offer, sale, transfer or buyer collection item persisted.

The transfer smoke completed successfully against the migrated production schema on 2026-09-11.

This is in addition to the ordinary TrackDash build gates (typecheck, catalog/image/FX/market pipeline/R3/Market Method/public-surface tests) and the dedicated TrackDash sale-evidence regression gate in `pnpm verify`.
