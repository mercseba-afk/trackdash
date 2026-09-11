# Marketplace deal flow smoke coverage

Before merging this feature, the production Supabase migration was exercised inside an explicit transaction that was rolled back.

Validated state path:

`structured offer -> accepted offer -> seller reports final item price + separate shipping -> buyer confirms -> public listing closes`

Assertions included:

- accepted offer remains an agreement and not a sale;
- final item price and shipping remain separate fields;
- buyer confirmation moves the sale to `confirmed`;
- accepted offer moves to deal state `confirmed`;
- the public collection share is no longer `open_to_offers` after confirmed sale;
- the smoke transaction was rolled back, leaving zero marketplace offers and zero marketplace sales from the test.

This is in addition to the ordinary TrackDash build gates (typecheck, catalog/image/FX/market pipeline/R3/Market Method/public-surface tests).