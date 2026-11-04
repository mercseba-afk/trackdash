# Magnum Saber Premium 19431 — sold evidence audit, 2026-11-04

Release UUID 0fdbfd56-f257-5b84-b541-e08a7450cc34, Frankfurt uhojhqxnzrolmnopwgpy.
User authorized removal of unreliable public EUR4.76 sold reference.

Three price_points (9881f7e2-5c10-43aa-a59b-69894ba4b07d,60c5bcdc-f74b-4cb5-ab54-d9aa95f0d62a,17477ec4-3277-476a-8fdf-f5f9327214bb) retained but status=excluded,valuation_eligible=false,needs_revalidation=true. Linked candidates 1bee24c8-9342-4dc3-8553-d13a73ea0c9c,56270a6c-3982-49de-8d8d-e728edaed072,2f77d91c-307d-48fe-9764-e42efc6b7f47 moved to needs_review with revalidation and audit notes. Reason: only generic Yahoo closed-search URLs stored, no individual auction identity/year/condition preserved. Not excluded merely for a low price or Japanese location. Indexed Yahoo results still corroborate an 880-yen listing; original claim that low price must be wrong was too strong. Exact sale verification remains incomplete.

Canonical recomputation queued and executed by existing bounded workflow after comment-only push b6fec17f16316a1df90272735d13d4e67b6821d2. Verified 2026-11-04 10:58:15 UTC: sold_anchor_eur NULL,sold_units 0. Existing asking-price evidence preserved. No manual replacement valuation, no schema/runtime deploy, budget and cadence unchanged.

## Additional public evidence
- https://www.ebay.it/itm/286697534421 : exact19431,new,JAN4950344064007,Mestre Italy,EUR17.21 displayed,Esaurito3venduti; listing last revised9May2026. Confirms units sold, not actual per-transaction paid prices/dates.
- https://www.ebay.it/itm/137294848054 : indexed EUR20.40,2venduti,new exact19431; direct retrieval unavailable.
- https://www.ebay.co.uk/itm/395603957442 : exact19431,new,GBP20.95 displayed,6sold on retrieved version; UK source, historical price/date of each sale not visible.
- https://www.ebay.com/itm/326351997727 : exact19431,new,5sold; retrieved/indexed price conflict USD32.87/35.57 illustrates why current multi-quantity listing price must not be assigned to historical sales.
- https://www.ebay.it/itm/227510671644 : indexed1sold; direct retrieval unavailable.
- https://www.ebay.es/itm/178441023929 : ended because unavailable; not proof of a sale.

No new SOLD observations ingested from counters, sold-out retail, ended-unsold listings or current asking prices. Manual search confirms demand signals; automated eBay Browse scans supply active offers, not verified historical transaction prices. A familiar model can have thin verifiable SOLD coverage.

Public IT/EN QA checked after canonical recompute; outcome recorded in conversation.
